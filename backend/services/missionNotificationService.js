// services/missionNotificationService.js
// Envoi de push FCM "mission assignée" depuis le backend Node (Admin SDK).
//
// Remplace la Cloud Function `notifyDriverOnMissionCreated` (qui exige le plan Blaze).
// Déclenché par un endpoint HTTP appelé après l'écriture Firestore d'une mission
// (web manager) — modèle request-driven, compatible avec le déploiement serverless.
//
// Source de vérité du token : l'app mobile écrit `drivers/{firebaseUid}` avec les
// champs `fcmToken` (string) et `fcmTokens` (array). `mission.assignedTo` est le
// firebaseUid. On lit donc `drivers/{assignedTo}`, avec un fallback par requête
// sur le champ `firebaseUid` si le doc n'est pas indexé par l'uid.

import firebaseAdmin from '../firebaseAdmin.js';

const admin = firebaseAdmin;

// Tolérance aux deux conventions de statut (français legacy + anglais canonique).
function normalizeStatus(status) {
  switch (status) {
    case 'pending':
    case 'en_attente':
    case 'assignée':
      return 'pending';
    case 'in_progress':
    case 'en_cours':
      return 'in_progress';
    case 'completed':
    case 'terminée':
      return 'completed';
    case 'cancelled':
    case 'annulée':
      return 'cancelled';
    default:
      return status || 'pending';
  }
}

function buildMissionPayload(mission, missionId) {
  const title = mission.title || mission.purpose || 'Nouvelle mission';
  const location = mission.location || mission.destination || '';
  const body = location
    ? `Destination: ${location}`
    : mission.description || 'Une mission vient de vous être assignée.';

  return {
    notification: { title, body },
    data: {
      type: 'mission_assigned',
      missionId,
      status: mission.status || 'pending',
      title,
      location,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'mission_assignments',
        sound: 'default',
        priority: 'high',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: { aps: { sound: 'default' } },
    },
  };
}

// Récupère le doc driver porteur des tokens à partir de l'uid assigné.
// 1. Tentative directe drivers/{assignedTo} (convention mobile).
// 2. Fallback : requête sur le champ firebaseUid.
async function getDriverDoc(db, driverUid) {
  const direct = await db.collection('drivers').doc(driverUid).get();
  if (direct.exists) return direct;

  const query = await db
    .collection('drivers')
    .where('firebaseUid', '==', driverUid)
    .limit(1)
    .get();
  if (!query.empty) return query.docs[0];

  return null;
}

function collectTokens(driverData) {
  const tokens = new Set();

  if (typeof driverData.fcmToken === 'string' && driverData.fcmToken.trim()) {
    tokens.add(driverData.fcmToken.trim());
  }

  if (Array.isArray(driverData.fcmTokens)) {
    for (const token of driverData.fcmTokens) {
      if (typeof token === 'string' && token.trim()) {
        tokens.add(token.trim());
      }
    }
  }

  return Array.from(tokens);
}

async function removeInvalidTokens(db, driverDocId, tokens, response) {
  const invalidTokens = [];

  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error && result.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length === 0) return;

  try {
    await db.collection('drivers').doc(driverDocId).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`🧹 [FCM] ${invalidTokens.length} token(s) invalide(s) retiré(s) pour ${driverDocId}`);
  } catch (error) {
    console.error('❌ [FCM] Échec retrait des tokens invalides:', error.message);
  }
}

/**
 * Envoie le push "mission assignée" au chauffeur de la mission.
 *
 * @param {FirebaseFirestore.Firestore} db - instance Firestore Admin.
 * @param {string} missionId - id du document mission.
 * @param {object} mission - données de la mission (doit contenir assignedTo).
 * @param {{ force?: boolean }} [options] - force ignore le flag anti-doublon.
 * @returns {Promise<{sent: boolean, reason?: string, successCount?: number, failureCount?: number}>}
 */
export async function sendMissionAssignedPush(db, missionId, mission, options = {}) {
  const { force = false } = options;
  const driverUid = mission.assignedTo;
  const status = normalizeStatus(mission.status || 'pending');

  if (!driverUid) {
    console.warn(`⚠️ [FCM] Mission ${missionId} sans assignedTo — push ignoré.`);
    return { sent: false, reason: 'no_assigned_driver' };
  }

  if (!force && mission.notificationSent === true) {
    console.log(`↪️ [FCM] Mission ${missionId} déjà notifiée — push ignoré.`);
    return { sent: false, reason: 'already_sent' };
  }

  if (!['pending', 'in_progress'].includes(status)) {
    console.warn(`⚠️ [FCM] Mission ${missionId} statut "${status}" non notifiable — push ignoré.`);
    return { sent: false, reason: 'status_not_notifiable' };
  }

  const driverDoc = await getDriverDoc(db, driverUid);
  if (!driverDoc) {
    console.warn(`⚠️ [FCM] Driver introuvable pour assignedTo=${driverUid} — push ignoré.`);
    return { sent: false, reason: 'driver_not_found' };
  }

  const tokens = collectTokens(driverDoc.data() || {});
  if (tokens.length === 0) {
    console.warn(`⚠️ [FCM] Aucun token FCM pour driver ${driverDoc.id} — push ignoré.`);
    return { sent: false, reason: 'no_tokens' };
  }

  const payload = buildMissionPayload(mission, missionId);
  console.log(`📨 [FCM] Envoi mission ${missionId} → ${tokens.length} token(s) (driver ${driverDoc.id})`);

  const response = await admin.messaging().sendEachForMulticast({ tokens, ...payload });

  console.log(
    `✅ [FCM] Mission ${missionId}: ${response.successCount} succès / ${response.failureCount} échec(s)`
  );

  await removeInvalidTokens(db, driverDoc.id, tokens, response);

  // Anti-doublon : marquer la mission comme notifiée (best-effort).
  if (response.successCount > 0) {
    try {
      await db.collection('missions').doc(missionId).set(
        {
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('❌ [FCM] Échec écriture du flag notificationSent:', error.message);
    }
  }

  return {
    sent: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

export { normalizeStatus, buildMissionPayload };
