// Test script pour simuler une mission et vérifier les notifications FCM
const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');

async function testMissionNotification() {
  try {
    console.log('🧪 Initialisation Firebase Admin...');
    await initializeApp();
    
    const db = admin.firestore();
    
    // ID du driver de test (à adapter selon votre base)
    const testDriverId = 'driver_test_123';
    const testUserId = 'user_test_123';
    
    console.log('📋 Création d\'une mission de test...');
    
    // Créer un driver de test si n'existe pas
    const driverRef = db.collection('drivers').doc(testDriverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      console.log('👤 Création driver de test...');
      await driverRef.set({
        userId: testUserId,
        currentVehicleId: 'veh_test_001',
        status: 'available',
        fcmToken: 'test_fcm_token_placeholder', // À remplacer par un vrai token
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Créer un véhicule de test si n'existe pas
    const vehicleRef = db.collection('vehicles').doc('veh_test_001');
    const vehicleDoc = await vehicleRef.get();
    
    if (!vehicleDoc.exists) {
      console.log('🚗 Création véhicule de test...');
      await vehicleRef.set({
        plateNumber: 'V-TEST-001',
        brand: 'Test',
        model: 'Model',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Créer la mission
    console.log('🎯 Création mission de test...');
    const missionData = {
      driverId: testDriverId,
      vehicleId: 'veh_test_001',
      destination: 'Maradi',
      purpose: 'Livraison test',
      startLocation: 'Niamey',
      status: 'in_progress',
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const missionRef = await db.collection('missions').add(missionData);
    console.log(`✅ Mission créée avec ID: ${missionRef.id}`);
    
    // Créer la notification
    console.log('📱 Création notification FCM...');
    const notificationData = {
      userId: testUserId,
      title: 'Nouvelle mission assignée',
      message: `Mission vers ${missionData.destination} - ${missionData.purpose}`,
      type: 'mission_assigned',
      missionId: missionRef.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.collection('notifications').add(notificationData);
    console.log('✅ Notification créée dans Firestore');
    
    // Tenter d'envoyer la notification FCM (si token valide)
    const driverSnapshot = await driverRef.get();
    const driverData = driverSnapshot.data();
    
    if (driverData.fcmToken && driverData.fcmToken !== 'test_fcm_token_placeholder') {
      console.log('📤 Envoi notification FCM...');
      try {
        await admin.messaging().send({
          token: driverData.fcmToken,
          notification: {
            title: notificationData.title,
            body: notificationData.message,
            sound: 'default',
            badge: '1',
          },
          data: {
            type: notificationData.type,
            missionId: missionRef.id,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        });
        console.log('✅ Notification FCM envoyée avec succès');
      } catch (fcmError) {
        console.log('❌ Erreur FCM:', fcmError.message);
      }
    } else {
      console.log('⚠️ Token FCM invalide ou manquant - notification stockée uniquement');
    }
    
    console.log('\n🎯 Test terminé !');
    console.log('📊 Résultats:');
    console.log(`- Mission ID: ${missionRef.id}`);
    console.log(`- Driver ID: ${testDriverId}`);
    console.log(`- User ID: ${testUserId}`);
    console.log(`- Token FCM: ${driverData.fcmToken || 'Non défini'}`);
    console.log('\n📱 Vérifiez l\'application mobile Flutter pour les notifications');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testMissionNotification().then(() => {
  console.log('\n✨ Test complété');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
