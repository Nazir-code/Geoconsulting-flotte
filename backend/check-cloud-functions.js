#!/usr/bin/env node
/**
 * Vérificateur des Cloud Functions
 * Vérifie que les Cloud Functions sont bien déployées et fonctionnent
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import firebaseAdmin from './firebaseAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkCloudFunctions() {
  try {
    console.log('\n🔍 VÉRIFICATION DES CLOUD FUNCTIONS\n');
    console.log('='.repeat(70));

    console.log('\n1️⃣ Initialisation Firebase Admin...');
    await firebaseAdmin;
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialisé\n');

    // ============================================================
    // CHECK 1: Vérifier le fichier functions/index.js
    // ============================================================
    console.log('2️⃣ Vérification du fichier functions/index.js...');
    
    const functionsPath = path.resolve(__dirname, '../functions/index.js');
    if (fs.existsSync(functionsPath)) {
      console.log(`✅ Fichier trouvé: ${functionsPath}`);
      
      const content = fs.readFileSync(functionsPath, 'utf8');
      
      // Vérifier les fonctions clés
      const checks = {
        'notifyDriverOnMissionCreated': content.includes('notifyDriverOnMissionCreated'),
        'notifyDriverOnMissionAssigned': content.includes('notifyDriverOnMissionAssigned'),
        'sendMissionNotification': content.includes('sendMissionNotification'),
        'getDriverTokens': content.includes('getDriverTokens'),
        'missionNotificationPayload': content.includes('missionNotificationPayload'),
      };

      console.log('\n   Fonctions exportées:');
      Object.entries(checks).forEach(([name, found]) => {
        console.log(`   ${found ? '✅' : '❌'} ${name}`);
      });

      // Vérifier les champs dans les missions
      if (content.includes("mission.assignedTo") || content.includes("assignedTo")) {
        console.log('\n   ✅ Gère le champ assignedTo');
      } else {
        console.log('\n   ❌ Ne gère pas le champ assignedTo');
      }

      if (content.includes("'pending'") || content.includes('"pending"')) {
        console.log('   ✅ Gère le statut "pending"');
      } else {
        console.log('   ❌ Ne gère pas le statut "pending"');
      }
    } else {
      console.log(`❌ Fichier NOT trouvé: ${functionsPath}`);
      console.log('   → Les Cloud Functions ne sont pas configurées');
    }

    // ============================================================
    // CHECK 2: Vérifier le déploiement
    // ============================================================
    console.log('\n\n3️⃣ Vérification du déploiement...');
    
    try {
      // Essayer d'appeler les Cloud Functions
      const testDoc = {
        assignedTo: 'test_uid_' + Date.now(),
        status: 'pending',
        title: 'Test',
      };

      // Créer un document de test
      const missionRef = db.collection('missions').doc('test_' + Date.now());
      console.log('   Création d\'un document de test...');
      
      await missionRef.set(testDoc);
      console.log('   ✅ Document créé dans Firestore');
      
      // Attendre un peu pour que la Cloud Function se déclenche
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérifier si la Cloud Function a été exécutée
      const doc = await missionRef.get();
      if (doc.exists) {
        console.log('   ✅ Cloud Function trigger fonctionne');
      }
      
      // Supprimer le document de test
      await missionRef.delete();
      console.log('   ✅ Document de test supprimé');
      
    } catch (error) {
      console.log(`   ⚠️ Erreur lors du test: ${error.message}`);
    }

    // ============================================================
    // CHECK 3: Vérifier les logs des Cloud Functions
    // ============================================================
    console.log('\n\n4️⃣ Derniers logs des Cloud Functions...');
    console.log('   (À vérifier manuellement avec: firebase functions:log)');
    console.log('\n   Exécutez dans le terminal:');
    console.log('   $ firebase functions:log --limit 20');

    // ============================================================
    // CHECK 4: Recommandations
    // ============================================================
    console.log('\n\n5️⃣ Recommandations\n');
    
    console.log('✅ Pour s\'assurer que tout est bon:\n');
    console.log('   1. Déployer les Cloud Functions:');
    console.log('      $ cd functions');
    console.log('      $ firebase deploy --only functions');
    console.log('');
    console.log('   2. Vérifier le déploiement:');
    console.log('      $ firebase functions:list');
    console.log('');
    console.log('   3. Vérifier les logs:');
    console.log('      $ firebase functions:log --limit 20');
    console.log('');
    console.log('   4. Tester l\'envoi:');
    console.log('      $ node test-mission-notifications-fix.js');

    // ============================================================
    // CHECK 5: Vérifier la configuration Firebase
    // ============================================================
    console.log('\n6️⃣ Vérification de la configuration Firebase...');
    
    const firebaseJsonPath = path.resolve(__dirname, '../firebase.json');
    if (fs.existsSync(firebaseJsonPath)) {
      console.log('✅ firebase.json trouvé');
      
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
        
        if (firebaseConfig.functions) {
          console.log('✅ Section "functions" configurée');
          
          if (Array.isArray(firebaseConfig.functions)) {
            firebaseConfig.functions.forEach((func, i) => {
              console.log(`   ${i + 1}. ${func.source || 'functions'}`);
            });
          } else {
            console.log(`   Source: ${firebaseConfig.functions.source || 'functions'}`);
          }
        } else {
          console.log('⚠️ Section "functions" NOT configurée dans firebase.json');
        }
      } catch (error) {
        console.log(`⚠️ Erreur lors de la lecture firebase.json: ${error.message}`);
      }
    } else {
      console.log(`❌ firebase.json NOT trouvé: ${firebaseJsonPath}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Vérification complète\n');

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  }
}

checkCloudFunctions().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
