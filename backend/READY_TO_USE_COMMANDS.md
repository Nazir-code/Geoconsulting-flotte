# 🔧 COMMANDES PRÊTES À UTILISER

Copiez-collez les commandes directement dans le terminal

---

## 🚀 DÉMARRAGE RAPIDE (5 minutes)

### Étape 1: Diagnostic Complet
```bash
cd "Flotte de vehicule/backend"
node diagnostic-complete.js
```

### Étape 2: Créer un Driver de Test (si nécessaire)
```bash
node setup-test-driver.js
```

### Étape 3: Tester l'Envoi
```bash
node test-mission-notifications-fix.js
```

---

## 📱 PENDANT CE TEMPS SUR LE TÉLÉPHONE

### Terminal 1: Voir les logs de l'app
```bash
flutter logs | grep -i "fcm\|notification\|token"
```

### Terminal 2: Relancer l'app
```bash
# Fermez l'app complètement
# Attendez 5 secondes
# Relancez l'app
```

---

## 🔍 DIAGNOSTIC APPROFONDI

### Voir toutes les informations des drivers
```bash
cd "Flotte de vehicule/backend"
node diagnostic-complete.js | head -50
```

### Vérifier juste les tokens FCM
```bash
cd "Flotte de vehicule/backend"
node diagnostic-complete.js | grep -i "token\|driver"
```

### Vérifier les Cloud Functions
```bash
cd "Flotte de vehicule/backend"
node check-cloud-functions.js
```

---

## 🔌 DÉPLOIEMENT DES CLOUD FUNCTIONS

### Déployer uniquement les functions
```bash
firebase deploy --only functions
```

### Vérifier le déploiement
```bash
firebase functions:list
```

### Voir les logs des functions
```bash
firebase functions:log --limit 20
```

### Voir les logs en temps réel
```bash
firebase functions:log -f
```

---

## 📊 INTERROGER FIRESTORE

### Voir tous les drivers et leurs tokens
```bash
firebase firestore:get /drivers --all
```

### Voir les missions récentes
```bash
firebase firestore:get /missions --all --limit 10
```

### Voir les notifications stockées
```bash
firebase firestore:get /notifications --all --limit 5
```

---

## 🧪 TESTS COMPLETS

### Mode interactif (guide pas à pas)
```bash
cd "Flotte de vehicule/backend"
node interactive-guide.js
```

### Test d'envoi complet
```bash
cd "Flotte de vehicule/backend"
node test-mission-notifications-fix.js
```

### Créer des données de test
```bash
cd "Flotte de vehicule/backend"
node setup-test-driver.js
```

---

## 🔄 PROCESSUS COMPLET DE RÉPARATION

### Toutes les commandes d'affilée:
```bash
# 1. Aller au dossier backend
cd "Flotte de vehicule/backend"

# 2. Diagnostic
echo "=== DIAGNOSTIC ==="
node diagnostic-complete.js

# 3. Setup test si besoin
echo "=== SETUP TEST ==="
node setup-test-driver.js

# 4. Vérifier Cloud Functions
echo "=== VÉRIFICATION CLOUD FUNCTIONS ==="
node check-cloud-functions.js

# 5. Déployer
echo "=== DÉPLOIEMENT ==="
firebase deploy --only functions

# 6. Attendre un peu
sleep 5

# 7. Tester
echo "=== TEST ==="
node test-mission-notifications-fix.js

# 8. Voir les logs
echo "=== LOGS ==="
firebase functions:log --limit 10
```

---

## 🔍 DÉPANNAGE - COMMANDES UTILES

### Si l'app n'enregistre pas le token
```bash
# Terminal Flutter
flutter logs | grep -i "fcm"

# Cherchez: "Sauvegarde du token FCM" ou "Token FCM sauvegardé"
```

### Si les functions ne s'exécutent pas
```bash
# Voir les logs
firebase functions:log

# Redéployer
firebase deploy --only functions

# Vérifier l'état
firebase functions:list
```

### Si une mission n'envoie pas de notification
```bash
# Vérifier que assignedTo existe
firebase firestore:get /missions/[MISSION_ID]

# Vérifier que le driver a un token
firebase firestore:get /drivers/[DRIVER_ID]

# Relancer le test
node test-mission-notifications-fix.js
```

### Voir les erreurs en temps réel
```bash
# Log en continu
firebase functions:log -f

# Pendant ce temps, créez une mission depuis l'app
```

---

## 📋 PERMUTATIONS COURANTES

### Redémarrer complètement
```bash
# 1. Fermer l'app
# 2. Attendre 10 secondes
# 3. Relancer l'app
# 4. Vérifier les logs
flutter logs | grep -i "fcm"
```

### Réinstaller complètement
```bash
# Sur le téléphone:
# 1. Paramètres > Applications > FleetNexus > Supprimer
# 2. Attendre 30 secondes
# 3. Réinstaller l'app
# 4. Relancer
```

### Forcer un redéploiement
```bash
firebase deploy --only functions --force
```

---

## 🎯 VÉRIFICATION FINALE

### Checklist de vérification
```bash
# 1. Drivers avec tokens
firebase firestore:get /drivers --all | grep -i "fcmtoken"

# 2. Missions avec assignedTo
firebase firestore:get /missions --all | grep -i "assignedto"

# 3. Cloud Functions déployées
firebase functions:list

# 4. Test d'envoi
cd "Flotte de vehicule/backend"
node test-mission-notifications-fix.js
```

---

## 💾 SAUVEGARDE / RESTAURATION

### Exporter les données
```bash
firebase firestore:export gs://[PROJECT_ID]-exports/export-$(date +%Y%m%d_%H%M%S)
```

### Importer les données
```bash
firebase firestore:import gs://[PROJECT_ID]-exports/[EXPORT_NAME]/
```

---

## 🔗 COMMANDES FIREBASE CLI

### Se connecter
```bash
firebase login
```

### Sélectionner un projet
```bash
firebase use [PROJECT_ID]
```

### Voir le projet courant
```bash
firebase projects:list
firebase use
```

### Initialiser firebase
```bash
firebase init
```

---

## 🆘 SOS RAPIDE

### Tout est cassé - commandes de récupération
```bash
cd "Flotte de vehicule"

# 1. Nettoyer et redéployer
cd backend
node diagnostic-complete.js
node setup-test-driver.js

cd ../functions
firebase deploy --only functions

# 2. Tester
cd ../backend
node test-mission-notifications-fix.js

# 3. Relancer l'app mobile
# (Fermer complètement et relancer)

# 4. Vérifier les logs
firebase functions:log --limit 20
flutter logs | grep -i "fcm"
```

---

## 📊 APERÇU RAPIDE DU SYSTÈME

### Voir tout en un coup d'œil
```bash
cd "Flotte de vehicule/backend"

echo "=== DRIVERS ==="
firebase firestore:get /drivers --all --limit 3

echo ""
echo "=== MISSIONS ==="
firebase firestore:get /missions --all --limit 3

echo ""
echo "=== CLOUD FUNCTIONS ==="
firebase functions:list

echo ""
echo "=== LOGS RÉCENTS ==="
firebase functions:log --limit 5
```

---

## 🎓 RESSOURCES

### Documentation complète
```bash
# Lire ces fichiers
cat "Flotte de vehicule/NOTIFICATION_FIXES.md"
cat "Flotte de vehicule/TROUBLESHOOTING_NOTIFICATIONS.md"
cat "Flotte de vehicule/QUICK_START_NOTIFICATIONS.md"
```

### Aide Firebase
```bash
firebase --help
firebase functions:help
firebase firestore:help
```

---

**💡 TIP:** Collez les commandes une par une et attendez la réponse avant la suivante.

**⏱️ Temps total estimé:** 10-15 minutes

---
