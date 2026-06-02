#!/usr/bin/env node
/**
 * Créateur de Driver de Test avec Token FCM
 * Simule ce qui devrait se passer quand l'app mobile démarre
 */

import admin from 'firebase-admin';
import firebaseAdmin from './firebaseAdmin.js';

async function createTestDriverWithToken() {
  try {
    console.log('\n🔧 CRÉATION DE DRIVER DE TEST\n');
    console.log('='.repeat(60));

    console.log('\n1️⃣ Initialisation Firebase Admin...');
    await firebaseAdmin;
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialisé\n');

    // Vérifier s'il existe déjà un driver
    console.log('2️⃣ Vérification des drivers existants...');
    const driversSnapshot = await db.collection('drivers').limit(1).get();
    
    if (!driversSnapshot.empty) {
      const firstDriver = driversSnapshot.docs[0];
      const driverData = firstDriver.data();
      
      console.log(`ℹ️ Driver trouvé: ${firstDriver.id}`);
      console.log(`   User ID: ${driverData.userId}`);
      
      if (!driverData.fcmToken) {
        console.log('\n3️⃣ Ajout d\'un token FCM au driver existant...');
        
        // Générer un token FCM simulé
        const testToken = `test_fcm_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await db.collection('drivers').doc(firstDriver.id).set({
          fcmToken: testToken,
          fcmTokens: [testToken],
          notificationsEnabled: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        
        console.log('✅ Token FCM ajouté');
        console.log(`   Token: ${testToken.substring(0, 30)}...`);
      } else {
        console.log(`\n3️⃣ Driver a déjà un token FCM:`);
        console.log(`   Token: ${driverData.fcmToken.substring(0, 30)}...`);
      }
    } else {
      console.log('❌ Aucun driver trouvé dans la base');
      console.log('\n3️⃣ Création d\'un driver de test...');
      
      // Créer un driver de test
      const testUserId = 'user_test_' + Date.now();
      const testToken = `test_fcm_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const newDriverRef = await db.collection('drivers').add({
        userId: testUserId,
        name: 'Test Driver',
        email: 'test.driver@example.com',
        status: 'online',
        fcmToken: testToken,
        fcmTokens: [testToken],
        notificationsEnabled: true,
        currentVehicleId: 'test_vehicle_001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ Driver créé: ${newDriverRef.id}`);
      console.log(`   User ID: ${testUserId}`);
      console.log(`   Token: ${testToken.substring(0, 30)}...`);
    }

    // Créer un véhicule de test s'il n'existe pas
    console.log('\n4️⃣ Vérification des véhicules...');
    const vehiclesSnapshot = await db.collection('vehicles').limit(1).get();
    
    if (vehiclesSnapshot.empty) {
      console.log('Création d\'un véhicule de test...');
      await db.collection('vehicles').add({
        plateNumber: 'TEST-001',
        brand: 'Test',
        model: 'Vehicle',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Véhicule créé');
    } else {
      console.log(`✅ ${vehiclesSnapshot.size} véhicule(s) existant(s)`);
    }

    // Créer une mission de test
    console.log('\n5️⃣ Création d\'une mission de test...');
    
    const driverSnapshot = await db.collection('drivers').limit(1).get();
    if (!driverSnapshot.empty) {
      const driver = driverSnapshot.docs[0];
      const driverData = driver.data();
      
      const missionRef = await db.collection('missions').add({
        assignedTo: driverData.userId,
        driverId: driver.id,
        vehicleId: 'test_vehicle_001',
        title: 'Mission de Test FCM',
        description: 'Ceci est une mission de test pour vérifier les notifications FCM',
        destination: 'Maradi',
        location: 'Maradi',
        purpose: 'Test notifications',
        priority: 'high',
        status: 'pending',
        startLocation: 'Niamey',
        createdBy: driverData.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ Mission créée: ${missionRef.id}`);
      console.log(`   Assignée à: ${driverData.userId}`);
      console.log(`   Destination: Maradi`);
      console.log(`   Statut: pending`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ\n');
    console.log('✅ Driver de test configuré');
    console.log('✅ Token FCM assigné');
    console.log('✅ Véhicule disponible');
    console.log('✅ Mission de test créée');
    console.log('\n💡 Ensuite:\n');
    console.log('1. Vérifiez le système avec: node diagnostic-complete.js');
    console.log('2. Testez l\'envoi: node test-mission-notifications-fix.js');
    console.log('3. Lancez l\'app mobile pour voir la notification');

    console.log('\n✨ Configuration complète\n');

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestDriverWithToken().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
