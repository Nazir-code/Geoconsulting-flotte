#!/usr/bin/env node
/**
 * Guide interactif de réparation des notifications
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function interactiveGuide() {
  console.clear();
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     🔔 GUIDE INTERACTIF - NOTIFICATIONS DE MISSIONS       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Ce guide va vous aider à diagnostiquer et résoudre le problème\n');

  // ÉTAPE 1: Vérification initiale
  console.log('📋 ÉTAPE 1: Diagnostic Initial\n');
  console.log('Je vais vérifier l\'état du système...\n');
  
  const { execSync } = require('child_process');
  
  try {
    console.log('Exécution du diagnostic complet...\n');
    execSync('node diagnostic-complete.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n⚠️ Erreur lors du diagnostic');
  }

  // ÉTAPE 2: Questions
  console.log('\n\n📋 ÉTAPE 2: Questions de Diagnostic\n');

  const hasToken = await question('✅ Avez-vous au moins 1 driver avec un token FCM? (oui/non): ');
  
  if (hasToken.toLowerCase() !== 'oui' && hasToken.toLowerCase() !== 'o' && hasToken.toLowerCase() !== 'yes' && hasToken.toLowerCase() !== 'y') {
    console.log('\n⚠️ PROBLÈME IDENTIFIÉ: Aucun driver n\'a de token FCM\n');
    
    const setupTest = await question('Voulez-vous créer un driver de test? (oui/non): ');
    if (setupTest.toLowerCase().startsWith('o') || setupTest.toLowerCase().startsWith('y')) {
      console.log('\nCréation du driver de test...\n');
      try {
        execSync('node setup-test-driver.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('\n❌ Erreur lors de la création du driver de test');
      }
    }
  }

  const hasMissions = await question('\n✅ Avez-vous au moins 1 mission avec le champ assignedTo? (oui/non): ');

  if (hasMissions.toLowerCase() !== 'oui' && hasMissions.toLowerCase() !== 'o' && hasMissions.toLowerCase() !== 'yes' && hasMissions.toLowerCase() !== 'y') {
    console.log('\n⚠️ PROBLÈME IDENTIFIÉ: Pas de missions avec assignedTo\n');
    console.log('Solution: Créer une nouvelle mission depuis le dashboard manager\n');
  }

  // ÉTAPE 3: Déploiement
  console.log('\n📋 ÉTAPE 3: Déploiement des Cloud Functions\n');
  
  const deployFunctions = await question('Voulez-vous déployer les Cloud Functions maintenant? (oui/non): ');
  
  if (deployFunctions.toLowerCase().startsWith('o') || deployFunctions.toLowerCase().startsWith('y')) {
    console.log('\nDéploiement des Cloud Functions...\n');
    try {
      execSync('firebase deploy --only functions', { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../')
      });
    } catch (error) {
      console.log('\n⚠️ Erreur lors du déploiement');
      console.log('Assurez-vous que Firebase CLI est installé: npm install -g firebase-tools');
    }
  }

  // ÉTAPE 4: App Mobile
  console.log('\n\n📱 ÉTAPE 4: Configuration de l\'App Mobile\n');
  
  console.log('Actions à effectuer sur l\'appareil mobile:\n');
  console.log('1. 🔴 FERMER complètement l\'app FleetNexus');
  console.log('2. ⏳ Attendre 5-10 secondes');
  console.log('3. 🟢 RELANCER l\'app FleetNexus');
  console.log('4. 📲 Vérifier que le token FCM est enregistré');
  console.log('\nPour vérifier les logs:');
  console.log('  $ flutter logs | grep -i "fcm\\|token"\n');

  const appRestarted = await question('✅ Avez-vous redémarré l\'app mobile? (oui/non): ');

  // ÉTAPE 5: Test
  console.log('\n📋 ÉTAPE 5: Test d\'Envoi de Notification\n');
  
  const runTest = await question('Voulez-vous lancer le test d\'envoi? (oui/non): ');
  
  if (runTest.toLowerCase().startsWith('o') || runTest.toLowerCase().startsWith('y')) {
    console.log('\nLancement du test...\n');
    try {
      execSync('node test-mission-notifications-fix.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n⚠️ Erreur lors du test');
    }

    console.log('\n🔔 Vérifiez votre téléphone:\n');
    console.log('Vous devriez recevoir une notification avec:');
    console.log('  • Titre: "🧪 Mission de Test - Notifications"');
    console.log('  • Destination: "Maradi"');
    console.log('  • Type: Mission assignée\n');

    const notificationReceived = await question('✅ Avez-vous reçu la notification? (oui/non): ');
    
    if (notificationReceived.toLowerCase().startsWith('o') || notificationReceived.toLowerCase().startsWith('y')) {
      console.log('\n\n🎉 SUCCÈS! Les notifications fonctionnent!\n');
      console.log('✅ Le système est maintenant prêt en production');
    } else {
      console.log('\n\n❌ PROBLÈME: Notification non reçue\n');
      console.log('Vérifications supplémentaires:');
      console.log('1. Permissions de notification sur le téléphone');
      console.log('   - Android: Paramètres > Applications > FleetNexus > Notifications');
      console.log('   - iOS: Paramètres > Notifications > FleetNexus');
      console.log('\n2. Vérifier les logs Firebase:');
      console.log('   $ firebase functions:log');
      console.log('\n3. Vérifier les logs de l\'app:');
      console.log('   $ flutter logs');
    }
  }

  // ÉTAPE 6: Résumé
  console.log('\n\n📋 ÉTAPE 6: Résumé et Ressources\n');
  
  console.log('Commandes utiles:');
  console.log('  • Diagnostic complet:');
  console.log('    $ node diagnostic-complete.js');
  console.log('\n  • Vérifier les Cloud Functions:');
  console.log('    $ node check-cloud-functions.js');
  console.log('\n  • Voir les logs Firebase:');
  console.log('    $ firebase functions:log');
  console.log('\n  • Voir les logs de l\'app:');
  console.log('    $ flutter logs\n');

  console.log('Documentation:');
  console.log('  • Guide complet: NOTIFICATION_FIXES.md');
  console.log('  • Dépannage: TROUBLESHOOTING_NOTIFICATIONS.md');
  console.log('  • Quick start: QUICK_START_NOTIFICATIONS.md\n');

  const moreHelp = await question('Avez-vous besoin d\'aide supplémentaire? (oui/non): ');
  
  if (moreHelp.toLowerCase().startsWith('o') || moreHelp.toLowerCase().startsWith('y')) {
    console.log('\n📚 Ressources supplémentaires:\n');
    console.log('1. Consultez TROUBLESHOOTING_NOTIFICATIONS.md pour:');
    console.log('   - Solutions aux problèmes courants');
    console.log('   - Dépannage avancé');
    console.log('   - Vérifications approfondies\n');
    console.log('2. Contactez le support Firebase:');
    console.log('   - Console Firebase > Support');
    console.log('   - https://firebase.google.com/support\n');
  }

  console.log('\n✨ Guide terminé\n');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  rl.close();
}

interactiveGuide().catch(console.error);
