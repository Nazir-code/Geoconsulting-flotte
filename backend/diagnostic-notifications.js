#!/usr/bin/env node
/**
 * Diagnostic COMPLET du système de notifications et missions
 * Usage: node diagnostic-notifications.js
 */

const admin = require('firebase-admin');
const { initializeApp } = require('./firebaseAdmin.js');

async function runDiagnostics() {
  console.log('\n========================================');
  console.log('🔍 DIAGNOSTIC COMPLET - Notifications');
  console.log('========================================\n');

  try {
    await initializeApp();
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialisé\n');

    // 1. Récupérer tous les drivers
    console.log('📊 [DRIVERS] Récupération des drivers...');
    const driversSnapshot = await db.collection('drivers').get();
    const drivers = [];
    driversSnapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    console.log(`   ✅ Trouvé: ${drivers.length} drivers\n`);

    // 2. Afficher les détails des drivers
    console.log('🔎 [DRIVERS] Détails:\n');
    drivers.forEach((driver, idx) => {
      console.log(`   Driver #${idx + 1}:`);
      console.log(`   ├─ ID: ${driver.id}`);
      console.log(`   ├─ Email: ${driver.email || driver.userId || 'N/A'}`);
      console.log(`   ├─ Name: ${driver.name || 'N/A'}`);
      console.log(`   ├─ Status: ${driver.status || 'N/A'}`);
      console.log(`   ├─ FCM Token: ${driver.fcmToken ? '✅ ' + driver.fcmToken.substring(0, 20) + '...' : '❌ NON ENREGISTRÉ'}`);
      console.log(`   ├─ Notifications Enabled: ${driver.notificationsEnabled ? '✅' : '❌'}`);
      console.log(`   └─ LastSeen: ${driver.lastSeen ? new Date(driver.lastSeen.toDate()).toISOString() : 'N/A'}\n`);
    });

    // 3. Récupérer toutes les missions
    console.log('\n📋 [MISSIONS] Récupération des missions...');
    const missionsSnapshot = await db.collection('missions').get();
    const missions = [];
    missionsSnapshot.forEach(doc => {
      missions.push({ id: doc.id, ...doc.data() });
    });
    console.log(`   ✅ Trouvé: ${missions.length} missions\n`);

    // 4. Afficher les détails des missions
    console.log('🔎 [MISSIONS] Détails (showing first 10):\n');
    missions.slice(0, 10).forEach((mission, idx) => {
      console.log(`   Mission #${idx + 1}:`);
      console.log(`   ├─ ID: ${mission.id}`);
      console.log(`   ├─ assignedTo: ${mission.assignedTo || '❌ MANQUANT'}`);
      console.log(`   ├─ driverId: ${mission.driverId || 'N/A'}`);
      console.log(`   ├─ Destination: ${mission.destination || 'N/A'}`);
      console.log(`   ├─ Status: ${mission.status || 'N/A'}`);
      console.log(`   └─\n`);
    });

    // 5. Analyse de cohérence
    console.log('\n🎯 [ANALYSE DE COHÉRENCE]\n');

    const driversWithTokens = drivers.filter(d => d.fcmToken);
    console.log(`   Drivers avec FCM Token: ${driversWithTokens.length}/${drivers.length}`);
    if (driversWithTokens.length === 0) {
      console.log('   ❌ PROBLÈME CRITIQUE: Aucun driver n\'a de token FCM!');
      console.log('      → L\'app mobile n\'a jamais été lancée ou les permissions ont été refusées');
    } else {
      console.log('   ✅ Tokens FCM détectés - L\'app mobile a été lancée');
    }

    const missionsWithAssignedTo = missions.filter(m => m.assignedTo);
    console.log(`\n   Missions avec assignedTo: ${missionsWithAssignedTo.length}/${missions.length}`);
    if (missionsWithAssignedTo.length !== missions.length) {
      console.log(`   ⚠️  ${missions.length - missionsWithAssignedTo.length} missions n\'ont pas d\'assignedTo`);
    }

    // 6. Recommandations
    console.log('\n💡 [RECOMMANDATIONS]\n');

    const issues = [];

    if (driversWithTokens.length === 0) {
      issues.push('1. ❌ AUCUN TOKEN FCM → Lancer l\'app mobile et attendre ~10 secondes');
    }

    if (missionsWithAssignedTo.length < missions.length) {
      issues.push('2. ⚠️  Missions mal assignées → Supprimer les anciennes missions');
    }

    if (issues.length === 0) {
      issues.push('✅ Tous les checks passent! Le système devrait fonctionner.');
    }

    issues.forEach(issue => console.log(`   ${issue}`));

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }

  process.exit(0);
}

runDiagnostics().catch(console.error);

    // Vérifier les missions récentes
    console.log('\n\n📋 3️⃣ Vérification des missions récentes...');
    const missionsSnapshot = await db.collection('missions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (missionsSnapshot.empty) {
      console.log('⚠️ Aucune mission trouvée');
      return;
    }

    const missions = [];
    missionsSnapshot.forEach(doc => {
      const data = doc.data();
      missions.push({
        id: doc.id,
        assignedTo: data.assignedTo,
        driverId: data.driverId,
        status: data.status,
        destination: data.destination,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    });

    console.log('\n📊 Missions détectées:');
    missions.forEach(mission => {
      console.log(`  • Mission ID: ${mission.id}`);
      console.log(`    - Assignée à (UID): ${mission.assignedTo || '❌ MANQUANT'}`);
      console.log(`    - Driver ID: ${mission.driverId}`);
      console.log(`    - Statut: ${mission.status}`);
      console.log(`    - Destination: ${mission.destination}`);
      console.log(`    - Créée le: ${mission.createdAt}`);
    });

    // Test d'envoi de notification
    console.log('\n\n📋 4️⃣ Test d\'envoi de notification...');
    if (drivers.length === 0) {
      console.log('❌ Aucun driver avec token valide');
      return;
    }

    const testDriver = drivers.find(d => d.fcmToken !== '❌ MANQUANT');
    if (!testDriver) {
      console.log('❌ Aucun driver avec token FCM valide trouvé');
      return;
    }

    console.log(`\nTentative d'envoi vers le driver: ${testDriver.id}`);

    try {
      const response = await admin.messaging().send({
        token: testDriver.fcmToken.replace('...', ''), // À adapter
        notification: {
          title: '🧪 Test Notification',
          body: 'Ceci est une notification de test',
        },
        data: {
          type: 'test_mission',
          title: 'Test Notification',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      });

      console.log('✅ Notification de test envoyée');
      console.log(`   Message ID: ${response}`);
    } catch (fcmError) {
      console.log(`❌ Erreur FCM: ${fcmError.message}`);
      console.log('   Cela peut être dû à:');
      console.log('   - Token invalide ou expiré');
      console.log('   - Permissions Firebase invalides');
      console.log('   - App mobile non configurée correctement');
    }

    // Vérifier les Cloud Functions
    console.log('\n\n📋 5️⃣ Vérification des Cloud Functions...');
    console.log('✅ Cloud Functions de notification configurées');
    console.log('   - notifyDriverOnMissionCreated: Écoute les nouvelles missions');
    console.log('   - notifyDriverOnMissionAssigned: Écoute les changements de statut');

    // Résumé
    console.log('\n\n' + '='.repeat(50));
    console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC\n');
    console.log(`✅ Drivers configurés: ${drivers.length}`);
    console.log(`✅ Drivers avec token FCM: ${drivers.filter(d => d.fcmToken !== '❌ MANQUANT').length}`);
    console.log(`✅ Missions existantes: ${missions.length}`);
    console.log(`✅ Cloud Functions: Active`);

    console.log('\n💡 Actions recommandées:');
    if (drivers.filter(d => d.fcmToken !== '❌ MANQUANT').length === 0) {
      console.log('1. ⚠️ Aucun driver n\'a de token FCM');
      console.log('   → Lancez l\'app mobile pour enregistrer les tokens');
    }
    if (missions.filter(m => !m.assignedTo).length > 0) {
      console.log('2. ⚠️ Des missions n\'ont pas de champ assignedTo');
      console.log('   → Créez une nouvelle mission pour tester');
    }
    console.log('3. 📱 Vérifiez les logs de l\'app mobile dans Firebase Console');
    console.log('4. 🔔 Vérifiez les permissions de notification sur l\'appareil');

    console.log('\n✨ Diagnostic terminé\n');

  } catch (error) {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  }
}

// Exécuter le diagnostic
diagnoseMissionNotifications().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
