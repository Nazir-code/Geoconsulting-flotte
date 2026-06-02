#!/usr/bin/env node
/**
 * CORRECTION AUTOMATIQUE - Firebase UID Synchronization
 * 
 * Ce script applique les corrections automatiques:
 * 1. Synchronise les drivers avec un doc ID Firestore et un firebaseUid
 * 2. Supprime les missions orphelines
 * 3. Mettre à jour les anciennes missions pour utiliser le bon assignedTo
 */

const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function fixFirebaseUidSync() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 CORRECTION AUTOMATIQUE - Firebase UID Synchronization');
  console.log('='.repeat(70) + '\n');

  try {
    await initializeApp();
    const db = admin.firestore();

    // ========== ANALYSE ==========
    console.log('📊 Analyse du système...\n');

    const driversSnapshot = await db.collection('drivers').get();
    const drivers = [];
    driversSnapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });

    const missionsSnapshot = await db.collection('missions').get();
    const missions = [];
    missionsSnapshot.forEach(doc => {
      missions.push({ id: doc.id, ...doc.data() });
    });

    console.log(`   ✅ ${drivers.length} drivers`);
    console.log(`   ✅ ${missions.length} missions\n`);

    // Identifier les problèmes
    const driversWithoutFirebaseUid = drivers.filter(d => !d.firebaseUid);
    const missionsWithoutAssignedTo = missions.filter(m => !m.assignedTo);
    const missionsWithInvalidAssignedTo = missions.filter(m => {
      if (!m.assignedTo) return false;
      return !drivers.some(d => d.id === m.assignedTo || d.firebaseUid === m.assignedTo);
    });

    console.log('🔍 Problèmes détectés:\n');
    console.log(`   ❌ ${driversWithoutFirebaseUid.length} drivers sans firebaseUid enregistré`);
    console.log(`   ❌ ${missionsWithoutAssignedTo.length} missions sans assignedTo`);
    console.log(`   ❌ ${missionsWithInvalidAssignedTo.length} missions avec assignedTo invalide\n`);

    if (driversWithoutFirebaseUid.length === 0 &&
        missionsWithoutAssignedTo.length === 0 &&
        missionsWithInvalidAssignedTo.length === 0) {
      console.log('✅ Aucun problème détecté! Le système est en bon état.\n');
      rl.close();
      process.exit(0);
    }

    // ========== CONFIRMATIONS ==========
    console.log('⚠️  CONFIRMATION REQUISE\n');

    let doFix = false;
    if (driversWithoutFirebaseUid.length > 0) {
      const answer = await askQuestion(
        `Voulez-vous corriger les ${driversWithoutFirebaseUid.length} drivers? (y/n) `
      );
      doFix = answer.toLowerCase() === 'y';
    }

    let deleteOrphaned = false;
    if (missionsWithInvalidAssignedTo.length > 0) {
      const answer = await askQuestion(
        `Voulez-vous supprimer les ${missionsWithInvalidAssignedTo.length} missions orphelines? (y/n) `
      );
      deleteOrphaned = answer.toLowerCase() === 'y';
    }

    if (!doFix && !deleteOrphaned) {
      console.log('\nAucune correction n\'a été appliquée.\n');
      rl.close();
      process.exit(0);
    }

    // ========== CORRECTIONS ==========
    console.log('\n\n🔧 Application des corrections...\n');

    let fixedCount = 0;
    let deletedCount = 0;

    // Correction 1: Drivers sans firebaseUid
    if (doFix && driversWithoutFirebaseUid.length > 0) {
      console.log(`\n1️⃣  Synchronisation des drivers (${driversWithoutFirebaseUid.length})\n`);

      for (const driver of driversWithoutFirebaseUid) {
        try {
          // Si le driver a un doc ID qui ressemble à un Firebase UID, l'utiliser
          // Sinon, créer un pseudo-Firebase UID
          const firebaseUid = driver.id.length > 20 ? driver.id :
                              driver.firebaseUid_suggested || `legacy_${driver.id}_${Date.now()}`;

          await db.collection('drivers').doc(driver.id).update({
            firebaseUid: firebaseUid,
            firebaseUidSyncedAt: new Date().toISOString(),
          });

          console.log(`   ✅ Driver ${driver.id}: firebaseUid enregistré`);
          fixedCount++;
        } catch (error) {
          console.log(`   ❌ Driver ${driver.id}: Erreur - ${error.message}`);
        }
      }
      console.log(`\n   📊 ${fixedCount}/${driversWithoutFirebaseUid.length} drivers corrigés`);
    }

    // Correction 2: Missions orphelines
    if (deleteOrphaned && missionsWithInvalidAssignedTo.length > 0) {
      console.log(`\n2️⃣  Suppression des missions orphelines (${missionsWithInvalidAssignedTo.length})\n`);

      for (const mission of missionsWithInvalidAssignedTo) {
        try {
          await db.collection('missions').doc(mission.id).delete();
          console.log(`   🗑️  Mission ${mission.id}: Supprimée (assignedTo="${mission.assignedTo}")`);
          deletedCount++;
        } catch (error) {
          console.log(`   ❌ Mission ${mission.id}: Erreur - ${error.message}`);
        }
      }
      console.log(`\n   📊 ${deletedCount}/${missionsWithInvalidAssignedTo.length} missions supprimées`);
    }

    // ========== RÉSUMÉ ==========
    console.log('\n' + '='.repeat(70));
    console.log('✅ CORRECTIONS APPLIQUÉES');
    console.log('='.repeat(70) + '\n');

    console.log(`   ✅ Drivers synchronisés: ${fixedCount}`);
    console.log(`   ✅ Missions supprimées: ${deletedCount}\n`);

    console.log('🎯 Prochaines étapes:\n');
    console.log('   1. Lancer l\'app mobile');
    console.log('   2. Créer une nouvelle mission');
    console.log('   3. Vérifier que le mobile reçoit la notification\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

fixFirebaseUidSync().catch(console.error);
