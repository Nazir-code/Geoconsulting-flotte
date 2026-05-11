const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

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
  if (!driverUid) return [];

  const driverDoc = await db.collection('drivers').doc(driverUid).get();
  if (!driverDoc.exists) {
    logger.warn('Driver profile not found for mission notification', { driverUid });
    return [];
  }

  const driver = driverDoc.data() || {};
  const tokens = new Set();

  if (typeof driver.fcmToken === 'string' && driver.fcmToken.trim()) {
    tokens.add(driver.fcmToken.trim());
  }

  if (Array.isArray(driver.fcmTokens)) {
    for (const token of driver.fcmTokens) {
      if (typeof token === 'string' && token.trim()) {
        tokens.add(token.trim());
      }
    }
  }

  return Array.from(tokens);
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
    await db.collection('drivers').doc(driverUid).set({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

async function sendMissionNotification(missionId, mission) {
  const driverUid = mission.assignedTo;
  const status = mission.status || 'pending';

  if (!driverUid || !['pending', 'in_progress'].includes(status)) {
    return;
  }

  const tokens = await getDriverTokens(driverUid);
  if (tokens.length === 0) {
    logger.warn('No FCM token found for assigned driver', { driverUid, missionId });
    return;
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    ...missionNotificationPayload(mission, missionId),
  });

  await removeInvalidTokens(driverUid, tokens, response);

  logger.info('Mission FCM notification sent', {
    missionId,
    driverUid,
    successCount: response.successCount,
    failureCount: response.failureCount,
  });
}

exports.notifyDriverOnMissionCreated = onDocumentCreated('missions/{missionId}', async (event) => {
  const mission = event.data && event.data.data();
  if (!mission) return;

  await sendMissionNotification(event.params.missionId, mission);
});

exports.notifyDriverOnMissionAssigned = onDocumentUpdated('missions/{missionId}', async (event) => {
  const before = event.data && event.data.before.data();
  const after = event.data && event.data.after.data();
  if (!before || !after) return;

  const assignedDriverChanged = before.assignedTo !== after.assignedTo;
  const becameActionable =
    before.status !== after.status && ['pending', 'in_progress'].includes(after.status);

  if (assignedDriverChanged || becameActionable) {
    await sendMissionNotification(event.params.missionId, after);
  }
});
