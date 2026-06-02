#!/usr/bin/env node
/**
 * Test COMPLET du flux de notifications
 * Usage: node test-notification-flow.js
 * 
 * Ce script teste le flux complet:
 * 1. Vérifier les drivers et tokens
 * 2. Créer une mission de test
 * 3. Vérifier que la mission a assignedTo correct
 * 4. Vérifier que la FCM serait envoyée
 */

const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_TOKEN = 'driver-token-1'; // Test driver

async function testNotificationFlow() {
  console.log('\n✅ TEST COMPLET - Flux de Notifications\n');
  console.log('='.repeat(60));

  try {
    await initializeApp();
    const db = admin.firestore();
    console.log('\n✅ Firebase Admin initialisé\n');

    // TEST 1: Vérifier les drivers
    console.log('📋 TEST 1: Vérifier les drivers\n');
    const driversSnapshot = await db.collection('drivers').get();
    const drivers = [];
    driversSnapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    console.log(`   ✅ ${drivers.length} drivers trouvés\n`);

    // Find test driver (d1)
    const testDriver = drivers.find(d => d.id === 'd1');
    if (!testDriver) {
      console.log('   ❌ Driver d1 non trouvé!');
      console.log('   💡 Drivers disponibles:');
      drivers.forEach(d => console.log(`      - ${d.id}: ${d.name || d.email || 'N/A'}`));
      process.exit(1);
    }

    console.log(`   ✅ Driver trouvé: ${testDriver.name || 'd1'}`);
    console.log(`      - ID: ${testDriver.id}`);
    console.log(`      - FCM Token: ${testDriver.fcmToken ? '✅ OUI' : '❌ NON'}`);
    if (testDriver.fcmToken) {
      console.log(`      - Token: ${testDriver.fcmToken.substring(0, 20)}...`);
    }
    console.log();

    // TEST 2: Créer une mission de test
    console.log('\n📋 TEST 2: Créer une mission de test\n');
    console.log(`   🚀 Appel API: POST ${API_BASE}/api/driver/me/missions`);
    console.log(`      Headers: Authorization: Bearer ${TEST_TOKEN}`);

    let missionId;
    try {
      const response = await axios.post(
        `${API_BASE}/api/driver/me/missions`,
        {
          destination: 'TEST_DESTINATION',
          purpose: 'Test de notifications',
        },
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data) {
        missionId = response.data.data.id;
        console.log(`   ✅ Mission créée avec succès!`);
        console.log(`      - ID: ${missionId}\n`);
      } else {
        console.log(`   ⚠️  Réponse inattendue:`, response.data);
        process.exit(1);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lors de la création de mission:`);
      console.log(`      - Code: ${error.response?.status}`);
      console.log(`      - Message: ${error.response?.data?.error || error.message}`);
      console.log(`   💡 Assurez-vous que le backend est lancé sur ${API_BASE}`);
      process.exit(1);
    }

    // TEST 3: Vérifier la mission créée
    console.log('\n📋 TEST 3: Vérifier la mission créée\n');
    const missionDoc = await db.collection('missions').doc(missionId).get();
    if (!missionDoc.exists) {
      console.log('   ❌ Mission non trouvée dans Firestore!');
      console.log(`      - Attendu doc ID: ${missionId}`);
      process.exit(1);
    }

    const mission = missionDoc.data();
    console.log(`   ✅ Mission trouvée dans Firestore!\n`);
    console.log(`   Détails de la mission:`);
    console.log(`      - ID: ${missionId}`);
    console.log(`      - assignedTo: ${mission.assignedTo}`);
    console.log(`      - driverId: ${mission.driverId}`);
    console.log(`      - destination: ${mission.destination}`);
    console.log(`      - status: ${mission.status}`);
    console.log();

    // TEST 4: Vérifier la cohérence
    console.log('\n📋 TEST 4: Vérifier la cohérence\n');

    if (mission.assignedTo === testDriver.id) {
      console.log(`   ✅ COHÉRENCE OK!`);
      console.log(`      - mission.assignedTo = "${mission.assignedTo}"`);
      console.log(`      - driver.id = "${testDriver.id}"`);
      console.log(`      - ✅ Les IDs matchent! Le mobile trouvera la mission`);
    } else {
      console.log(`   ❌ MISMATCH D'IDs!`);
      console.log(`      - mission.assignedTo = "${mission.assignedTo}"`);
      console.log(`      - driver.id = "${testDriver.id}"`);
      console.log(`      - ❌ Les IDs NE matchent PAS! Le mobile ne trouvera PAS la mission`);
    }

    // TEST 5: Vérifier la requête Firestore du mobile
    console.log('\n📋 TEST 5: Simuler la requête Firestore du mobile\n');

    const mobileQuery = await db.collection('missions')
      .where('assignedTo', '==', testDriver.id)
      .where('status', 'in', ['pending', 'in_progress'])
      .get();

    console.log(`   🔍 Requête: db.collection('missions')`);
    console.log(`      .where('assignedTo', '==', '${testDriver.id}')`);
    console.log(`      .where('status', 'in', ['pending', 'in_progress'])`);
    console.log(`      .get()\n`);
    console.log(`   Résultat: ${mobileQuery.size} documents trouvés\n`);

    if (mobileQuery.size > 0) {
      console.log(`   ✅ SUCCESS! Le mobile trouvera la mission`);
      mobileQuery.forEach(doc => {
        console.log(`      - Mission: ${doc.id}`);
        console.log(`        Status: ${doc.data().status}`);
        console.log(`        Destination: ${doc.data().destination}`);
      });
    } else {
      console.log(`   ❌ PROBLÈME! Le mobile NE trouvera PAS la mission`);
      console.log(`   💡 Raisons possibles:`);
      console.log(`      1. assignedTo ne correspond pas à un driver ID`);
      console.log(`      2. status n'est pas 'pending' ou 'in_progress'`);
      console.log(`      3. Le driver n'existe pas dans Firestore`);
    }

    // TEST 6: Vérifier les tokens FCM
    console.log('\n📋 TEST 6: Vérifier les tokens FCM\n');
    if (testDriver.fcmToken) {
      console.log(`   ✅ Token FCM disponible!`);
      console.log(`      - FCM serait envoyée au chauffeur`);
      console.log(`   🚀 Notification:`);
      console.log(`      - Title: "Nouvelle Mission"`);
      console.log(`      - Body: "Mission vers ${mission.destination} assignée"`);
      console.log(`      - Data: { type: "mission_assigned", missionId: "${missionId}" }`);
    } else {
      console.log(`   ❌ Pas de token FCM!`);
      console.log(`      - Les notifications ne seront PAS envoyées`);
      console.log(`   💡 Solution: Lancer l'app mobile et attendre que le token soit sauvegardé`);
    }

    // RÉSUMÉ FINAL
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL\n');

    let allOk = true;
    if (testDriver.fcmToken) {
      console.log('✅ Token FCM: OK');
    } else {
      console.log('❌ Token FCM: NON ENREGISTRÉ');
      allOk = false;
    }

    if (mission.assignedTo === testDriver.id) {
      console.log('✅ Cohérence IDs: OK');
    } else {
      console.log('❌ Cohérence IDs: MISMATCH');
      allOk = false;
    }

    if (mobileQuery.size > 0) {
      console.log('✅ Requête Firestore Mobile: OK');
    } else {
      console.log('❌ Requête Firestore Mobile: AUCUN RÉSULTAT');
      allOk = false;
    }

    console.log('\n' + '='.repeat(60));
    if (allOk) {
      console.log('\n🎉 TOUS LES TESTS PASSENT! Le système devrait fonctionner!\n');
    } else {
      console.log('\n🔴 CERTAINS TESTS ONT ÉCHOUÉ. Voir logs ci-dessus.\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

testNotificationFlow().catch(console.error);
