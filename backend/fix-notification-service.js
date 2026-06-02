// Script pour corriger le service de notification FCM manquant dans le backend
const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');

async function fixNotificationService() {
  try {
    console.log('🔧 Initialisation Firebase Admin...');
    await initializeApp();
    
    const db = admin.firestore();
    
    // Fonction pour envoyer notification FCM
    async function sendNotificationToUser(userId, title, message, data = {}) {
      try {
        // Récupérer le driver pour obtenir le token FCM
        const driverSnapshot = await db.collection('drivers')
          .where('userId', '==', userId)
          .limit(1)
          .get();
        
        if (driverSnapshot.empty) {
          console.log(`❌ Aucun driver trouvé pour userId: ${userId}`);
          return false;
        }
        
        const driver = driverSnapshot.docs[0].data();
        const fcmToken = driver.fcmToken;
        
        
        if (!fcmToken) {
          console.log(`❌ Pas de token FCM pour driver: ${driverSnapshot.docs[0].id}`);
          return false;
        }
        
        // Envoyer la notification FCM
        const notificationPayload = {
          token: fcmToken,
          notification: {
            title: title,
            body: message,
            sound: 'default',
            badge: '1',
          },
          data: {
            type: data.type || 'general',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            ...data,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        };
        
        await admin.messaging().send(notificationPayload);
        console.log(`✅ Notification FCM envoyée à ${userId}`);
        return true;
        
      } catch (error) {
        console.error(`❌ Erreur envoi FCM à ${userId}:`, error.message);
        return false;
      }
    }
    
    // Mettre à jour la fonction createMissionForUser pour inclure FCM
    console.log('📝 Mise à jour du service de notification...');
    
    // Test avec une mission existante ou création d'une nouvelle
    const testUserId = 'user_test_123';
    const testDriverId = 'driver_test_123';
    
    // Créer driver de test avec token FCM (remplacer par vrai token)
    await db.collection('drivers').doc(testDriverId).set({
      userId: testUserId,
      fcmToken: 'votre_vrai_token_fcm_ici', // À REMPLACER
      notificationsEnabled: true,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Tester l'envoi de notification
    console.log('📤 Test envoi notification...');
    await sendNotificationToUser(
      testUserId,
      'Test Notification',
      'Ceci est un test de notification FCM',
      { type: 'test', timestamp: Date.now().toString() }
    );
    
    console.log('\n🎯 Instructions pour corriger le système:');
    console.log('1. Ajoutez la fonction sendNotificationToUser dans firebaseStore.js');
    console.log('2. Appelez cette fonction dans createMissionForUser()');
    console.log('3. Appelez cette fonction dans completeMissionForUser()');
    console.log('4. Remplacez "votre_vrai_token_fcm_ici" par un vrai token depuis l\'app Flutter');
    console.log('\n📱 Pour obtenir le token FCM depuis Flutter:');
    console.log('await FirebaseMessaging.instance.getToken()');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la correction
fixNotificationService().then(() => {
  console.log('\n✨ Correction terminée');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
