#!/usr/bin/env node
/**
 * VÉRIFICATION & CORRECTION - Firebase UID Synchronization
 * 
 * Ce script:
 * 1. Vérifie l'état de la synchronisation Firebase UID
 * 2. Montre les problèmes (si any)
 * 3. Propose des corrections
 * 4. Teste le flux complet
 */

const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function verifyAndFixFirebaseUidSync() {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 VÉRIFICATION & CORRECTION - Firebase UID Synchronization');
  console.log('='.repeat(70) + '\n');

  try {
    await initializeApp();
    const db = admin.firestore();

    // ========== ÉTAPE 1: Vérifier les drivers ==========
    console.log('📋 [ÉTAPE 1] Vérification des drivers dans Firestore\n');

    const driversSnapshot = await db.collection('drivers').get();
    const drivers = [];
    driversSnapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`   ✅ Trouvé ${drivers.length} drivers\n`);

    // Catégoriser les drivers
    const driversWithBackendId = drivers.filter(d => d.id.startsWith('d'));
    const driversWithFirebaseUid = drivers.filter(d => {
      // Firebase UIDs sont généralement longs, alphanumériques
      return d.id.length > 20 && !d.id.startsWith('d');
    });
    const driversWithBothIds = drivers.filter(d => d.firebaseUid);

    console.log(`   📊 Breakdown:`);
    console.log(`      ├─ Drivers avec ID backend (d1, d2...): ${driversWithBackendId.length}`);
    console.log(`      ├─ Drivers avec Firebase UID comme doc ID: ${driversWithFirebaseUid.length}`);
    console.log(`      └─ Drivers avec firebaseUid field: ${driversWithBothIds.length}`);

    // ========== ÉTAPE 2: Afficher les détails ==========
    console.log('\n📋 [ÉTAPE 2] Détails des drivers\n');

    drivers.forEach((driver, idx) => {
      console.log(`   Driver #${idx + 1}:`);
      console.log(`   ├─ Doc ID: ${driver.id}`);
      console.log(`   ├─ Name: ${driver.name || 'N/A'}`);
      console.log(`   ├─ Firebase UID field: ${driver.firebaseUid ? '✅ ' + driver.firebaseUid.substring(0, 25) + '...' : '❌ NON ENREGISTRÉ'}`);
      console.log(`   ├─ userId: ${driver.userId || 'N/A'}`);
      console.log(`   ├─ FCM Token: ${driver.fcmToken ? '✅ OUI' : '❌ NON'}`);
      console.log(`   └─ Status: ${driver.status || 'N/A'}\n`);
    });

    // ========== ÉTAPE 3: Vérifier les missions ==========
    console.log('\n📋 [ÉTAPE 3] Vérification des missions\n');

    const missionsSnapshot = await db.collection('missions').limit(10).get();
    const missions = [];
    missionsSnapshot.forEach(doc => {
      missions.push({ id: doc.id, ...doc.data() });
    });

    console.log(`   ✅ Vérifié ${missions.length} missions (premiers 10)\n`);

    // Catégoriser
    const missionsWithBackendId = missions.filter(m => m.assignedTo && m.assignedTo.startsWith('d'));
    const missionsWithFirebaseUid = missions.filter(m => {
      return m.assignedTo && m.assignedTo.length > 20 && !m.assignedTo.startsWith('d');
    });

    console.log(`   📊 Breakdown assignedTo:`);
    console.log(`      ├─ Missions avec assignedTo = backend ID (d1, d2...): ${missionsWithBackendId.length}`);
    console.log(`      ├─ Missions avec assignedTo = Firebase UID: ${missionsWithFirebaseUid.length}`);
    console.log(`      └─ Missions sans assignedTo: ${missions.filter(m => !m.assignedTo).length}`);

    // ========== ÉTAPE 4: Vérifier la cohérence ==========
    console.log('\n📋 [ÉTAPE 4] Vérification de la cohérence\n');

    let coherenceOk = true;

    // Check 1: Missions avec assignedTo = backend ID doivent correspondre à des drivers
    console.log(`   🔍 Check 1: Missions avec assignedTo = backend ID`);
    let matchCount = 0;
    missionsWithBackendId.forEach(mission => {
      const driver = drivers.find(d => d.id === mission.assignedTo);
      if (driver) {
        matchCount++;
      } else {
        coherenceOk = false;
        console.log(`      ❌ Mission ${mission.id} assignée à ${mission.assignedTo} (driver non trouvé)`);
      }
    });
    if (matchCount === missionsWithBackendId.length) {
      console.log(`      ✅ OK: ${matchCount}/${missionsWithBackendId.length} missions matchent un driver\n`);
    }

    // Check 2: Missions avec assignedTo = Firebase UID doivent correspondre
    console.log(`   🔍 Check 2: Missions avec assignedTo = Firebase UID`);
    let firebaseMatchCount = 0;
    missionsWithFirebaseUid.forEach(mission => {
      const driver = drivers.find(d => d.id === mission.assignedTo || d.firebaseUid === mission.assignedTo);
      if (driver) {
        firebaseMatchCount++;
      } else {
        coherenceOk = false;
        console.log(`      ❌ Mission ${mission.id} assignée à Firebase UID non trouvé`);
      }
    });
    if (firebaseMatchCount === missionsWithFirebaseUid.length) {
      console.log(`      ✅ OK: ${firebaseMatchCount}/${missionsWithFirebaseUid.length} missions matchent un driver\n`);
    }

    // ========== ÉTAPE 5: Déterminer l'état ==========
    console.log('\n📊 [ÉTAPE 5] État du système\n');

    let status = 'OK';
    let issues = [];

    if (driversWithBothIds.length === drivers.length) {
      console.log('   ✅ EXCELLENT: Tous les drivers ont leur firebaseUid enregistré!');
      status = 'OPTIMISÉ';
    } else if (driversWithBothIds.length === 0 && driversWithBackendId.length === drivers.length) {
      console.log('   ⚠️  ACCEPTABLE: Les drivers utilisent les backend IDs');
      console.log('      Les notifications vont fonctionner, mais pas optimisé pour Firebase');
      status = 'FONCTIONNEL';
      issues.push('Les drivers n\'ont pas enregistré leur Firebase UID');
    } else {
      console.log('   ⚠️  MIXTE: Certains drivers avec Firebase UID, d\'autres non');
      status = 'PARTIELLEMENT_OPTIMISÉ';
      issues.push('Système mixte détecté');
    }

    if (!coherenceOk) {
      console.log('   ❌ PROBLÈME DE COHÉRENCE: Certaines missions ne correspondent à aucun driver');
      status = 'PROBLÉMATIQUE';
      issues.push('Missions orphelines détectées');
    }

    // ========== ÉTAPE 6: Recommandations ==========
    console.log('\n💡 [ÉTAPE 6] Recommandations\n');

    if (issues.length === 0) {
      console.log('   ✅ Aucun problème détecté!');
      console.log('   🚀 Le système est prêt à être testé\n');
    } else {
      console.log('   Problèmes détectés:\n');
      issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });

      console.log('\n   Corrections recommandées:\n');

      if (driversWithBothIds.length < drivers.length) {
        console.log('   📱 Pour chaque driver:\n');
        console.log('      1. Lancer l\'app mobile');
        console.log('      2. Se connecter avec Firebase Auth');
        console.log('      3. Attendre 5-10 secondes pour que le Firebase UID soit enregistré');
        console.log('      4. Relancer ce script pour vérifier\n');
      }

      if (missions.filter(m => !m.assignedTo).length > 0) {
        console.log('   🗑️  Supprimer les anciennes missions sans assignedTo:\n');
        console.log('      firebase firestore:delete missions --recursive\n');
      }
    }

    // ========== ÉTAPE 7: Test du flux ==========
    console.log('\n📋 [ÉTAPE 7] Test du flux complet\n');

    if (driversWithBackendId.length > 0) {
      const testDriver = driversWithBackendId[0];
      console.log(`   🧪 Test avec le driver: ${testDriver.name || testDriver.id}\n`);
      console.log(`   1️⃣  Driver ID: ${testDriver.id}`);
      console.log(`   2️⃣  Firebase UID: ${testDriver.firebaseUid ? '✅ ' + testDriver.firebaseUid.substring(0, 25) + '...' : '❌ PAS ENREGISTRÉ'}`);
      console.log(`   3️⃣  FCM Token: ${testDriver.fcmToken ? '✅ PRÉSENT' : '❌ ABSENT'}`);

      // Vérifier que le backend utiliserait le bon assignedTo
      const expectedAssignedTo = testDriver.firebaseUid || testDriver.id;
      console.log(`\n   Quand une mission est créée pour ce driver:`);
      console.log(`      assignedTo serait: ${expectedAssignedTo.substring(0, 25)}...`);

      // Vérifier que le mobile trouverait la mission
      const couldFind = (testDriver.firebaseUid && testDriver.id === testDriver.firebaseUid) ||
                         (!testDriver.firebaseUid && testDriver.id.startsWith('d'));
      console.log(`      Le mobile pourrait chercher: .where('assignedTo', isEqualTo: "${testDriver.id || testDriver.firebaseUid}")`);
      console.log(`      Résultat: ${couldFind ? '✅ TROUVERAIT' : '❌ NE TROUVERAIT PAS'}`);
    }

    // ========== RÉSUMÉ FINAL ==========
    console.log('\n' + '='.repeat(70));
    console.log(`📊 RÉSUMÉ FINAL: ${status}`);
    console.log('='.repeat(70) + '\n');

    if (status === 'PROBLÉMATIQUE') {
      process.exit(1);
    } else if (status === 'OK' || status === 'FONCTIONNEL' || status === 'OPTIMISÉ') {
      console.log('✅ Le système est fonctionnel et prêt au test!');
    } else {
      console.log('⚠️  Le système est partiellement optimisé. Voir recommandations ci-dessus.');
    }

    console.log();

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

verifyAndFixFirebaseUidSync().catch(console.error);
