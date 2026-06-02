#!/usr/bin/env node
/**
 * Test d'envoi de notification de mission
 * Simule l'assignation d'une mission et teste l'envoi de notification
 */

import admin from 'firebase-admin';
import firebaseAdmin from './firebaseAdmin.js';

async function testMissionNotificationFlow() {
  try {
    console.log('\n🧪 TEST COMPLET DU SYSTÈME DE NOTIFICATIONS\n');
    console.log('='.repeat(60));

    console.log('\n1️⃣ Initialisation Firebase Admin...');
    await firebaseAdmin;
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialisé\n');

    // Récupérer un driver avec token FCM
    console.log('2️⃣ Recherche d\'un driver avec token FCM...');
    const driverSnapshot = await db.collection('drivers')
      .where('fcmToken', '!=', '')
      .limit(1)
      .get();

    if (driverSnapshot.empty) {
      console.log('❌ Aucun driver avec token FCM trouvé');
      console.log('💡 Solution: Lancez l\'app mobile pour enregistrer un token\n');
      return;
    }

    const driverDoc = driverSnapshot.docs[0];
    const driverData = driverDoc.data();
    const driverId = driverDoc.id;
    const driverUid = driverData.userId;
    const fcmToken = driverData.fcmToken;

    console.log(`✅ Driver trouvé: ${driverId}`);
    console.log(`   - User ID: ${driverUid}`);
    console.log(`   - Token FCM: ${fcmToken.substring(0, 20)}...`);
    console.log(`   - Statut: ${driverData.status}`);
    console.log(`   - Notifications: ${driverData.notificationsEnabled ? 'Activées' : 'Désactivées'}\n`);

    // Récupérer un véhicule
    console.log('3️⃣ Recherche d\'un véhicule disponible...');
    const vehicleSnapshot = await db.collection('vehicles')
      .where('status', '==', 'available')
      .limit(1)
      .get();

    let vehicleId = 'test_vehicle_001';
    if (!vehicleSnapshot.empty) {
      vehicleId = vehicleSnapshot.docs[0].id;
      console.log(`✅ Véhicule trouvé: ${vehicleId}\n`);
    } else {
      console.log(`ℹ️ Pas de véhicule disponible, utilisation d'ID test: ${vehicleId}\n`);
    }

    // Créer une mission de test
    console.log('4️⃣ Création d\'une mission de test...');
    const missionData = {
      assignedTo: driverUid,
      driverId: driverId,
      vehicleId: vehicleId,
      title: '🧪 Mission de Test - Notifications',
      description: 'Ceci est une mission de test pour valider le système de notifications',
      destination: 'Maradi',
      location: 'Maradi',
      purpose: 'Test des notifications FCM',
      priority: 'high',
      status: 'pending',
      startLocation: 'Niamey',
      createdBy: driverUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const missionRef = await db.collection('missions').add(missionData);
    console.log(`✅ Mission créée: ${missionRef.id}`);
    console.log(`   - Statut: pending`);
    console.log(`   - Destination: ${missionData.destination}`);
    console.log(`   - Assignée à: ${driverUid}\n`);

    // Attendre que les Cloud Functions envoient la notification
    console.log('5️⃣ Attente de traitement par les Cloud Functions...');
    console.log('   (Cela peut prendre quelques secondes)\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier les notifications stockées
    console.log('6️⃣ Vérification des notifications stockées...');
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', driverUid)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    if (!notificationsSnapshot.empty) {
      console.log('✅ Notifications trouvées:');
      notificationsSnapshot.forEach(doc => {
        const notif = doc.data();
        console.log(`   - ${notif.title}: ${notif.message}`);
        console.log(`     Créée le: ${notif.createdAt}`);
      });
    } else {
      console.log('ℹ️ Aucune notification stockée trouvée');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSULTATS DU TEST\n');
    console.log(`✅ Mission créée avec succès: ${missionRef.id}`);
    console.log(`✅ Assignée au driver: ${driverUid}`);
    console.log(`✅ Token FCM disponible: ${fcmToken.substring(0, 20)}...`);
    console.log('\n💡 Prochaines étapes:');
    console.log('1. 📱 Ouvrez l\'app mobile');
    console.log('2. 📲 Attendez la notification de la nouvelle mission');
    console.log('3. ✅ Vérifiez que le titre est: "' + missionData.title + '"');
    console.log('4. 🔄 Si la notification n\'apparaît pas:');
    console.log('   • Vérifiez les logs Firebase Console > Functions');
    console.log('   • Vérifiez les permissions de notification sur l\'appareil');
    console.log('   • Vérifiez que Firebase Messaging est bien configuré\n');

    console.log('✨ Test terminé\n');

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testMissionNotificationFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
