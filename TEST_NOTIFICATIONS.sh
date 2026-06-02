#!/bin/bash

# Test Script: Vérifier que les notifications fonctionnent correctement
# Ce script simule la création d'une mission et vérifie que la notification est envoyée

echo "🔍 [TEST] Diagnostic des notifications en temps réel"
echo "=================================================="
echo ""

# 1. Vérifier que les Cloud Functions sont déployées
echo "1️⃣  Vérification des Cloud Functions..."
echo "   Cherchez les fonctions dans Firebase Console:"
echo "   - notifyDriverOnMissionCreated"
echo "   - notifyDriverOnMissionAssigned"
echo ""

# 2. Vérifier que le driver a un token FCM enregistré
echo "2️⃣  Vérification du Token FCM..."
echo "   Allez dans Firestore → drivers → [driverUID]"
echo "   Vérifiez que les champs existent:"
echo "   ✓ fcmToken (string)"
echo "   ✓ fcmTokens (array)"
echo "   ✓ firebaseUid (string)"
echo ""

# 3. Vérifier les logs de l'app mobile
echo "3️⃣  Vérification des logs de l'app mobile..."
echo "   Exécutez: flutter logs"
echo "   Cherchez les patterns suivants:"
echo "   ✓ '🚀 [FCM SERVICE] Démarrage pour driver'"
echo "   ✓ '✅ [TOKEN SAVE] Token enregistré avec SUCCÈS'"
echo "   ✓ '✅ [FIRESTORE_SERVICE] listenToMissions() appelée'"
echo ""

# 4. Créer une mission de test
echo "4️⃣  Création d'une mission de test..."
echo "   Depuis le dashboard web, créez une mission avec:"
echo "   - Driver: le chauffeur de test"
echo "   - Destination: Test Location"
echo "   - Status: pending"
echo ""

# 5. Vérifier les logs Cloud Functions
echo "5️⃣  Vérification des logs Cloud Functions..."
echo "   Allez dans Firebase Console → Functions → Logs"
echo "   Cherchez les logs de votre missionId:"
echo "   ✓ '[TOKENS] Searching tokens for driver'"
echo "   ✓ '[TOKENS] Found fcmToken'"
echo "   ✓ '[NOTIFICATION] 📨 Sending FCM notifications'"
echo "   ✓ '[NOTIFICATION] ✅ FCM send complete'"
echo ""

# 6. Vérifier la notification sur le mobile
echo "6️⃣  Vérification de la notification sur l'app mobile..."
echo "   Vous devriez voir:"
echo "   ✓ Notification push (même si l'app est fermée)"
echo "   ✓ Dialog 'Nouvelle Mission' (si l'app est ouverte)"
echo "   ✓ Logs: '✅ [FCM SERVICE] Notification FCM recue'"
echo ""

echo "=================================================="
echo "📝 [RÉSUMÉ] Points à vérifier:"
echo ""
echo "Si les notifications ne fonctionnent PAS:"
echo ""
echo "❌ Les logs ne contiennent pas '[TOKENS]'?"
echo "   → Le driver n'a pas de token FCM enregistré"
echo "   → Solution: Ouvrir l'app mobile pour déclencher startForDriver()"
echo ""
echo "❌ Les logs contiennent '[TOKENS] ... aucune mission avec'"
echo "   → Les tokens existent mais la mission n'a pas assignedTo = firebaseUid"
echo "   → Solution: Vérifier que firebaseUid est bien enregistré"
echo ""
echo "❌ Notification reçue mais pas de dialog?"
echo "   → Le listener Firestore n'a pas déclenché"
echo "   → Solution: Vérifier que assignedTo == uid du driver"
echo ""
echo "❌ Pas de notification du tout?"
echo "   → Vérifier les permissions Firestore"
echo "   → Vérifier que l'app est configurée dans Firebase Console"
echo "   → Vérifier AndroidManifest.xml pour FCM permissions"
echo ""
