const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Tolérance aux deux conventions de statut (français legacy + anglais canonique).
// Garantit que le FCM se déclenche même pour des missions créées avant
// l'unification des statuts côté web.
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

function missionNotificationPayload(mission, missionId) {
  const title = mission.title || mission.purpose || 'Nouvelle mission';
  const location = mission.location || mission.destination || '';
  const body = location
    ? `Destination: ${location}`
    : mission.description || 'Une mission vient de vous etre assignee.';

  return {
    notification: {
      title,
      body,
    },
    data: {
      type: 'mission_assigned',
      missionId,
      status: mission.status || 'pending',
      title,
      location,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'mission_assignments',
        sound: 'default',
        priority: 'high',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };
}

async function getDriverTokens(driverUid) {
  if (!driverUid) {
    logger.warn('[TOKENS] driverUid is empty or null');
    return [];
  }

  logger.info('[TOKENS] Searching tokens for driver', { driverUid });
  
  const driverDoc = await db.collection('drivers').doc(driverUid).get();
  if (!driverDoc.exists) {
    logger.warn('[TOKENS] Driver profile NOT found in Firestore', { driverUid, path: `/drivers/${driverUid}` });
    return [];
  }

  const driver = driverDoc.data() || {};
  const tokens = new Set();

  // Collect all unique tokens
  if (typeof driver.fcmToken === 'string' && driver.fcmToken.trim()) {
    logger.info('[TOKENS] Found fcmToken', { token: driver.fcmToken.substring(0, 30) + '...' });
    tokens.add(driver.fcmToken.trim());
  } else {
    logger.warn('[TOKENS] fcmToken field is empty or missing');
  }

  if (Array.isArray(driver.fcmTokens)) {
    logger.info('[TOKENS] Found fcmTokens array', { count: driver.fcmTokens.length });
    for (const token of driver.fcmTokens) {
      if (typeof token === 'string' && token.trim()) {
        logger.info('[TOKENS] Adding token from array', { token: token.substring(0, 30) + '...' });
        tokens.add(token.trim());
      }
    }
  } else {
    logger.warn('[TOKENS] fcmTokens array is empty or missing');
  }

  const uniqueTokens = Array.from(tokens);
  logger.info('[TOKENS] Total unique tokens collected', { count: uniqueTokens.length, driverUid });
  
  return uniqueTokens;
}

async function removeInvalidTokens(driverUid, tokens, response) {
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

  if (invalidTokens.length > 0) {
    logger.info('Removing invalid tokens', { driverUid, count: invalidTokens.length });
    
    try {
      await db.collection('drivers').doc(driverUid).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error removing invalid tokens', { driverUid, error: error.message });
    }
  }
}

async function sendMissionNotification(missionId, mission) {
  // Strategy OPTION A: Firebase Auth UID is the sole source of truth.
  // assignedTo is expected to be that Firebase Auth UID.
  const driverUid = mission.assignedTo;
  const status = normalizeStatus(mission.status || 'pending');

  if (driverUid === undefined || driverUid === null || driverUid === '') {
    logger.warn('[NOTIFICATION] ❌ No driver assigned - skipping notification', {
      missionId,
      reason: 'missions.assignedTo is empty',
    });
    return;
  }



  // ✅ Anti-doublon (safety): si déjà envoyé, on stop.
  if (mission && mission.notificationSent === true) {
    logger.info('[NOTIFICATION] Skipped (already sent) inside sendMissionNotification', {
      missionId,
    });
    return;
  }


  logger.info('[NOTIFICATION] Starting notification process', {
    missionId,
    driverUid,
    status,
    assignedTo: mission.assignedTo,
    driverId: mission.driverId,
  });

  // (guard already handled earlier for driverUid)


  if (!['pending', 'in_progress'].includes(status)) {
    logger.warn('[NOTIFICATION] ❌ Invalid mission status - skipping notification', {
      missionId,
      status,
      reason: `Status "${status}" is not in [pending, in_progress]`,
    });
    return;
  }

  logger.info('[NOTIFICATION] Getting FCM tokens', { missionId, driverUid });
  const tokens = await getDriverTokens(driverUid);

  if (tokens.length === 0) {
    logger.warn('[NOTIFICATION] ❌ No FCM tokens found', {
      missionId,
      driverUid,
      reason: 'Driver profile exists but no tokens registered',
      possibleCauses: [
        'Mobile app not opened yet',
        'Notifications not enabled on mobile',
        'Tokens expired',
        'User not logged into mobile app'
      ],
    });
    return;
  }

  logger.info('[NOTIFICATION] 📨 Sending FCM notifications', {
    missionId,
    driverUid,
    tokenCount: tokens.length,
  });

  const payload = missionNotificationPayload(mission, missionId);
  logger.info('[NOTIFICATION] Notification payload', { missionId, payload });

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    ...payload,
  });

  logger.info('[NOTIFICATION] ✅ FCM send complete', {
    missionId,
    driverUid,
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses.map((r, i) => ({
      index: i,
      success: r.success,
      error: r.error ? { code: r.error.code, message: r.error.message } : null,
    })),
  });

  if (response.failureCount > 0) {
    logger.warn('[NOTIFICATION] Some messages failed', { missionId, failureCount: response.failureCount });
  }

  await removeInvalidTokens(driverUid, tokens, response);

  logger.info('[NOTIFICATION] 🎉 Mission notification sent successfully', {
    missionId,
    driverUid,
    successCount: response.successCount,
  });

  // ✅ Anti-doublon: marquer la mission comme notifiée pour empêcher les triggers multiples
  try {
    if (response.successCount > 0) {
      await db.collection('missions').doc(missionId).set(
        {
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (e) {
    logger.error('[NOTIFICATION] Failed to set notificationSent flag', {
      missionId,
      error: e.message,
    });
  }
}

exports.notifyDriverOnMissionCreated = onDocumentCreated('missions/{missionId}', async (event) => {
  const mission = event.data && event.data.data();
  if (!mission) return;

  // ✅ Anti-doublon: si déjà envoyé, ne rien faire
  if (mission.notificationSent === true) {
    logger.info('[NOTIFICATION] Skipped (already sent) onCreated', {
      missionId: event.params.missionId,
    });
    return;
  }

  await sendMissionNotification(event.params.missionId, mission);
});

exports.notifyDriverOnMissionAssigned = onDocumentUpdated('missions/{missionId}', async (event) => {
  const before = event.data && event.data.before.data();
  const after = event.data && event.data.after.data();
  if (!before || !after) return;

  // ✅ Anti-doublon: ne déclenche que si pas encore envoyé
  if (after.notificationSent === true) {
    logger.info('[NOTIFICATION] Skipped (already sent) onUpdated', {
      missionId: event.params.missionId,
    });
    return;
  }

  const assignedDriverChanged = before.assignedTo !== after.assignedTo;
  const becameActionable =
    before.status !== after.status &&
    ['pending', 'in_progress'].includes(normalizeStatus(after.status));

  // Strategy OPTION A: ignore driverId changes; only care assignedTo and actionable status
  if (assignedDriverChanged || becameActionable) {
    await sendMissionNotification(event.params.missionId, after);
  }

});

