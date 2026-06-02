// backend/endpoint-firebase-sync.js
// Ajouter cet endpoint à server.js pour synchroniser les Firebase UIDs

/**
 * ENDPOINT: POST /api/driver/register-firebase-uid
 * 
 * Called by the Flutter mobile app to register its Firebase UID with the backend
 * So that the backend can use the correct UID when creating missions
 * 
 * Usage from Flutter:
 * ```dart
 * POST http://localhost:3000/api/driver/register-firebase-uid
 * Headers: {
 *   'Authorization': 'Bearer driver-token-1',
 *   'Content-Type': 'application/json'
 * }
 * Body: {
 *   'firebaseUid': 'Z5jXnK2pQwRvLm...'
 * }
 * ```
 */

app.post('/api/driver/register-firebase-uid', requireDriverAuth, async (req, res) => {
  try {
    const userId = req.userId; // From token 'driver-token-1'
    const { firebaseUid } = req.body || {};

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        error: 'firebaseUid est requis dans le body',
      });
    }

    console.log(`📲 [FIREBASE_SYNC] Enregistrement Firebase UID`);
    console.log(`   ├─ Backend userId: ${userId}`);
    console.log(`   ├─ Firebase UID: ${firebaseUid.substring(0, 20)}...`);

    // Get the driver by userId
    const driver = await store.getDriverForUser(userId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver non trouvé',
      });
    }

    console.log(`   ├─ Driver ID (Firestore doc ID): ${driver.id}`);

    // Update the driver document with the Firebase UID
    await db.collection('drivers').doc(driver.id).update({
      firebaseUid: firebaseUid,
      updatedAt: new Date().toISOString(),
    });

    console.log(`   └─ ✅ Firebase UID enregistré avec succès!`);

    res.status(200).json({
      success: true,
      data: {
        driverId: driver.id,
        firebaseUid: firebaseUid,
        message: 'Firebase UID enregistré avec succès',
      },
      message: 'Synchronisation réussie',
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement Firebase UID:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
