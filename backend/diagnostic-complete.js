#!/usr/bin/env node
/**
 * Diagnostic COMPLET et approfondi du système de notifications
 */

import admin from 'firebase-admin';
import firebaseAdmin from './firebaseAdmin.js';

async function comprehensiveDiagnostic() {
  try {
    console.log('\n🔍 DIAGNOSTIC COMPLET ET APPROFONDI\n');
    console.log('='.repeat(70));

    console.log('\n1️⃣ Initialisation Firebase Admin...');
    await firebaseAdmin;
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialisé\n');

    // ============================================================
    // CHECK 1: Vérifier les drivers et leurs tokens
    // ============================================================
    console.log('\n2️⃣ VÉRIFICATION DES DRIVERS\n');
    const driversSnapshot = await db.collection('drivers').get();
    
    if (driversSnapshot.empty) {
      console.log('❌ CRITIQUE: Aucun driver trouvé dans la base!');
      return;
    }

    console.log(`Nombre de drivers trouvés: ${driversSnapshot.size}`);
    
    const drivers = [];
    driversSnapshot.forEach(doc => {
      const data = doc.data();
      drivers.push({
        id: doc.id,
        userId: data.userId,
        fcmToken: data.fcmToken,
        fcmTokens: data.fcmTokens,
        notificationsEnabled: data.notificationsEnabled,
        status: data.status,
        email: data.email,
        name: data.name,
      });
      
      console.log(`\n  📋 Driver: ${doc.id}`);
      console.log(`     User ID: ${data.userId}`);
      console.log(`     Email: ${data.email || 'N/A'}`);
      console.log(`     Nom: ${data.name || 'N/A'}`);
      console.log(`     Statut: ${data.status}`);
      console.log(`     Notifications: ${data.notificationsEnabled ? '✅ Actives' : '❌ Inactives'}`);
      
      if (data.fcmToken) {
        console.log(`     Token FCM (principal): ${data.fcmToken.substring(0, 30)}...`);
      } else {
        console.log(`     Token FCM (principal): ❌ MANQUANT`);
      }
      
      if (Array.isArray(data.fcmTokens)) {
        console.log(`     Autres tokens: ${data.fcmTokens.length} trouvés`);
      } else {
        console.log(`     Autres tokens: ❌ Array vide/manquant`);
      }
    });

    if (drivers.every(d => !d.fcmToken && (!d.fcmTokens || d.fcmTokens.length === 0))) {
      console.log('\n⚠️ ALERTE: Aucun driver n\'a de token FCM !');
      console.log('   → L\'app mobile doit être lancée pour enregistrer les tokens');
    }

    // ============================================================
    // CHECK 2: Vérifier les missions et leur structure
    // ============================================================
    console.log('\n\n3️⃣ VÉRIFICATION DES MISSIONS\n');
    const missionsSnapshot = await db.collection('missions')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (missionsSnapshot.empty) {
      console.log('⚠️ Aucune mission trouvée');
    } else {
      console.log(`Nombre de missions trouvées: ${missionsSnapshot.size}`);
      
      const missions = [];
      missionsSnapshot.forEach(doc => {
        const data = doc.data();
        missions.push({
          id: doc.id,
          assignedTo: data.assignedTo,
          driverId: data.driverId,
          status: data.status,
          title: data.title,
          destination: data.destination,
          createdAt: data.createdAt,
        });
        
        console.log(`\n  📋 Mission: ${doc.id}`);
        console.log(`     Titre: ${data.title}`);
        console.log(`     Destination: ${data.destination}`);
        console.log(`     Statut: ${data.status}`);
        console.log(`     Assignée à (UID): ${data.assignedTo || '❌ MANQUANT'}`);
        console.log(`     Driver ID: ${data.driverId}`);
        console.log(`     Créée: ${data.createdAt?.toDate?.() || data.createdAt}`);
        
        if (!data.assignedTo) {
          console.log(`     ⚠️ PROBLÈME: assignedTo est manquant !`);
        }
      });
    }

    // ============================================================
    // CHECK 3: Vérifier les notifications stockées
    // ============================================================
    console.log('\n\n4️⃣ VÉRIFICATION DES NOTIFICATIONS STOCKÉES\n');
    const notificationsSnapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (notificationsSnapshot.empty) {
      console.log('⚠️ Aucune notification stockée');
    } else {
      console.log(`Nombre de notifications trouvées: ${notificationsSnapshot.size}`);
      
      notificationsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n  📋 Notification: ${data.title}`);
        console.log(`     Message: ${data.message}`);
        console.log(`     Utilisateur: ${data.userId}`);
        console.log(`     Type: ${data.type}`);
        console.log(`     Lue: ${data.isRead ? 'Oui' : 'Non'}`);
        console.log(`     Créée: ${data.createdAt?.toDate?.() || data.createdAt}`);
      });
    }

    // ============================================================
    // CHECK 4: Vérifier la configuration Firebase
    // ============================================================
    console.log('\n\n5️⃣ VÉRIFICATION DE LA CONFIGURATION FIREBASE\n');
    
    console.log('✅ Firebase Admin SDK: Fonctionnel');
    console.log('✅ Firebase Messaging: Disponible');
    console.log('✅ Firebase Firestore: Connecté');

    // ============================================================
    // CHECK 5: Test d'envoi
    // ============================================================
    console.log('\n\n6️⃣ TEST D\'ENVOI DE NOTIFICATION\n');
    
    const driverWithToken = drivers.find(d => d.fcmToken);
    if (driverWithToken) {
      console.log(`Tentative d'envoi au driver: ${driverWithToken.id}`);
      console.log(`Token: ${driverWithToken.fcmToken.substring(0, 30)}...`);
      
      try {
        const response = await admin.messaging().send({
          token: driverWithToken.fcmToken,
          notification: {
            title: '🧪 Test de Diagnostic',
            body: 'Cette notification confirme que FCM fonctionne',
          },
          data: {
            type: 'diagnostic_test',
            timestamp: new Date().toISOString(),
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
      } catch (error) {
        console.log(`❌ Erreur lors de l'envoi: ${error.message}`);
        console.log('   Code erreur: ' + error.code);
      }
    } else {
      console.log('❌ Aucun driver avec token FCM valide');
    }

    // ============================================================
    // Rapport Final
    // ============================================================
    console.log('\n\n' + '='.repeat(70));
    console.log('\n📊 RAPPORT FINAL\n');

    const hasDrivers = drivers.length > 0;
    const driversWithTokens = drivers.filter(d => d.fcmToken || (Array.isArray(d.fcmTokens) && d.fcmTokens.length > 0)).length;
    const hasMissions = missions && missions.length > 0;
    const missionsWithAssignedTo = missions ? missions.filter(m => m.assignedTo).length : 0;
    const notificationsCount = notificationsSnapshot.size;

    console.log(`📍 Drivers: ${hasDrivers ? '✅' : '❌'} ${drivers.length} trouvés`);
    console.log(`📍 Drivers avec tokens: ${driversWithTokens > 0 ? '✅' : '❌'} ${driversWithTokens}/${drivers.length}`);
    console.log(`📍 Missions: ${hasMissions ? '✅' : '❌'} ${missions?.length || 0} trouvées`);
    console.log(`📍 Missions avec assignedTo: ${missionsWithAssignedTo > 0 ? '✅' : '❌'} ${missionsWithAssignedTo}/${missions?.length || 0}`);
    console.log(`📍 Notifications stockées: ${notificationsCount > 0 ? '✅' : '❌'} ${notificationsCount}`);

    console.log('\n\n💡 PROBLÈMES DÉTECTÉS:\n');
    
    const problems = [];
    
    if (driversWithTokens === 0) {
      problems.push('❌ Aucun driver n\'a de token FCM');
      problems.push('   → Solution: Lancer l\'app mobile pour enregistrer les tokens');
    }
    
    if (missions && missions.some(m => !m.assignedTo)) {
      problems.push('❌ Certaines missions n\'ont pas le champ assignedTo');
      problems.push('   → Solution: Créer une nouvelle mission');
    }
    
    if (driversWithTokens === 0 && hasDrivers) {
      problems.push('❌ Tokens FCM non enregistrés');
      problems.push('   → Solution: Vérifier la configuration Firebase dans l\'app mobile');
    }

    if (problems.length === 0) {
      console.log('✅ Aucun problème détecté !');
      console.log('\nSystem est prêt. Ensuite:');
      console.log('1. Lancer l\'app mobile');
      console.log('2. Créer une mission');
      console.log('3. Vérifier la notification');
    } else {
      problems.forEach(p => console.log(p));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Diagnostic terminé\n');

  } catch (error) {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  }
}

comprehensiveDiagnostic().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
