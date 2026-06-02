# 📊 INDEX DES OUTILS DE DIAGNOSTIC - NOTIFICATIONS

## 🎯 Démarrage Rapide

Si vous ne reçevez pas de notifications, suivez cet ordre:

```bash
# 1. Diagnostic interactif (RECOMMANDÉ - guide pas à pas)
node interactive-guide.js

# OU

# 1. Diagnostic complet
node diagnostic-complete.js

# 2. Si pas de driver avec token
node setup-test-driver.js

# 3. Vérifier les Cloud Functions
node check-cloud-functions.js

# 4. Tester l'envoi
node test-mission-notifications-fix.js
```

---

## 🛠️ Outils Disponibles

### 1. 🎯 **interactive-guide.js** (Recommandé pour débuter)

**Utilité:** Guide interactif pas à pas avec questions

**Commande:**
```bash
node interactive-guide.js
```

**Cas d'usage:**
- ✅ Vous ne savez pas par où commencer
- ✅ Vous voulez être guidé étape par étape
- ✅ Vous préférez un dialogue interactif

**Résultat:**
- Pose des questions
- Exécute automatiquement les scripts appropriés
- Donne des recommandations personnalisées

---

### 2. 📋 **diagnostic-complete.js** (Vérification globale)

**Utilité:** Analyse complète du système

**Commande:**
```bash
node diagnostic-complete.js
```

**Vérifie:**
- ✅ Nombre de drivers en base
- ✅ Drivers avec tokens FCM
- ✅ Missions existantes
- ✅ Champ `assignedTo` dans les missions
- ✅ Notifications stockées
- ✅ Configuration Firebase

**Résultat:**
```
📍 Drivers: ✅ 3 trouvés
📍 Drivers avec tokens: ✅ 2/3
📍 Missions: ✅ 5 trouvées
📍 Missions avec assignedTo: ✅ 5/5
```

**Cas d'usage:**
- Vérification initiale du système
- Identifier rapidement les problèmes

---

### 3. 🔧 **setup-test-driver.js** (Créer des données de test)

**Utilité:** Crée un driver avec token FCM pour les tests

**Commande:**
```bash
node setup-test-driver.js
```

**Crée:**
- ✅ Un driver de test (ou met à jour s'il existe)
- ✅ Ajoute un token FCM simulé
- ✅ Un véhicule de test
- ✅ Une mission de test

**Cas d'usage:**
- Aucun driver n'existe en base
- Aucun driver n'a de token FCM
- Besoin de données de test pour développement

**Résultat:**
```
✅ Driver de test configuré
✅ Token FCM assigné
✅ Véhicule disponible
✅ Mission de test créée
```

---

### 4. ✅ **test-mission-notifications-fix.js** (Test d'envoi)

**Utilité:** Teste l'envoi d'une notification

**Commande:**
```bash
node test-mission-notifications-fix.js
```

**Effectue:**
- ✅ Cherche un driver avec token FCM
- ✅ Crée une mission de test
- ✅ Vérifie que la notification est envoyée

**Cas d'usage:**
- Après avoir configuré un driver et une mission
- Vérifier que FCM fonctionne correctement

**Résultat:**
```
✅ Driver trouvé: driver_123
✅ Mission créée: mission_456
✅ Notification envoyée
```

**Attendu sur le téléphone:**
- 🔔 Notification: "🧪 Mission de Test - Notifications"

---

### 5. 🔍 **check-cloud-functions.js** (Vérifier les Cloud Functions)

**Utilité:** Vérifie que les Cloud Functions sont bien déployées

**Commande:**
```bash
node check-cloud-functions.js
```

**Vérifie:**
- ✅ Fichier `functions/index.js` existe
- ✅ Fonctions exportées: `notifyDriverOnMissionCreated`, `notifyDriverOnMissionAssigned`
- ✅ Gère le champ `assignedTo`
- ✅ Gère le statut "pending"
- ✅ Fichier `firebase.json` configuré

**Cas d'usage:**
- Vérifier que les Cloud Functions sont correctement configurées
- S'assurer que tout est déployé

**Résultat:**
```
✅ Fichier trouvé: functions/index.js
✅ notifyDriverOnMissionCreated: existant
✅ notifyDriverOnMissionAssigned: existant
✅ Gère le champ assignedTo
✅ Gère le statut "pending"
```

---

### 6. 🧪 **test-mission-notification.js** (Test hérité)

**Utilité:** Script de test alternatif (moins complet)

**Commande:**
```bash
node test-mission-notification.js
```

**Note:** Préférez `test-mission-notifications-fix.js`

---

## 📊 MATRICE DE DIAGNOSTIC

| Symptôme | Outil à utiliser | Solution |
|----------|-----------------|----------|
| **Notifications ne s'affichent pas** | `diagnostic-complete.js` | Identifier où est le problème |
| **Pas de driver** | `setup-test-driver.js` | Créer des données de test |
| **Pas de token FCM** | `setup-test-driver.js` | Relancer l'app mobile |
| **Cloud Functions pas déployées** | `check-cloud-functions.js` | Déployer les functions |
| **Missions sans assignedTo** | `diagnostic-complete.js` | Créer de nouvelles missions |
| **Notification non envoyée** | `test-mission-notifications-fix.js` | Vérifier les erreurs FCM |

---

## 🔄 FLUX COMPLET DE DÉPANNAGE

```
┌─────────────────────────┐
│ Problème: Pas de notif │
└────────┬────────────────┘
         ↓
┌──────────────────────────────────┐
│ Étape 1: Diagnostic complet     │
│ $ node diagnostic-complete.js   │
└────────┬───────────────────────┬─┘
         │                       │
    [OK]▼                        ▼[PROBLÈME]
    Tout bon                Identifier problème
         │                       │
         │           ┌───────────┼───────────┐
         │           ▼           ▼           ▼
         │      Pas de    Pas de   Pas de
         │      driver    token    assignedTo
         │        │         │         │
         │        ▼         ▼         ▼
         │    Setup    App relancer  Créer
         │   test drv   mobile       mission
         │        │         │         │
         └────────┴─────────┴─────────┘
                   ↓
         ┌──────────────────────────────────┐
         │ Étape 2: Test d'envoi           │
         │ $ node test-mission-notifications-fix.js
         └────────┬───────────────────────┘
                  ↓
         ✅ Notification reçue ✅
                  ↓
            🎉 SUCCÈS! 🎉
```

---

## 💡 GUIDE PAR UTILISATION

### Je suis nouveau sur le système
```bash
node interactive-guide.js  # Suivez les instructions
```

### Je veux juste vérifier le système
```bash
node diagnostic-complete.js  # Rapport complet
```

### J'ai besoin de données de test
```bash
node setup-test-driver.js  # Crée tout ce qu'il faut
node test-mission-notifications-fix.js  # Test l'envoi
```

### Je dois vérifier les Cloud Functions
```bash
node check-cloud-functions.js  # Vérification détaillée
firebase deploy --only functions  # Redéployer si nécessaire
```

### Je dois vérifier rapidement si ça marche
```bash
node test-mission-notifications-fix.js  # Test d'envoi
```

---

## 🔗 RESSOURCES ASSOCIÉES

| Document | Utilité |
|----------|---------|
| **NOTIFICATION_FIXES.md** | Guide complet des corrections |
| **TROUBLESHOOTING_NOTIFICATIONS.md** | Solutions aux problèmes |
| **QUICK_START_NOTIFICATIONS.md** | Démarrage rapide (5 min) |
| **QUICK_START_FIREBASE.md** | Configuration Firebase |

---

## 🎬 EXEMPLES

### Cas 1: Premier dépannage

```bash
# 1. Diagnostic interactif
node interactive-guide.js

# Suit les étapes et tests automatiquement
```

### Cas 2: Vérification rapide

```bash
# 1. Diagnostic
node diagnostic-complete.js

# 2. Si problème détecté, setup test
node setup-test-driver.js

# 3. Test
node test-mission-notifications-fix.js
```

### Cas 3: Après modifications du code

```bash
# 1. Vérifier les Cloud Functions
node check-cloud-functions.js

# 2. Déployer
firebase deploy --only functions

# 3. Tester
node test-mission-notifications-fix.js
```

---

## 🆘 SOS - Commandes d'Urgence

### Les notifications ne fonctionnent vraiment pas
```bash
# 1. Diagnostic complet
node diagnostic-complete.js

# 2. Vérifier les logs Firebase
firebase functions:log --limit 50

# 3. Vérifier les logs de l'app
flutter logs | grep -i "fcm\|notification\|error"

# 4. Redéployer tout
firebase deploy --only functions

# 5. Relancer l'app mobile
# (Fermer et relancer l'app)

# 6. Retester
node test-mission-notifications-fix.js
```

### L'app mobile ne reçoit rien
```bash
# 1. Vérifier les logs mobiles
flutter logs | grep -i "fcm"

# 2. Vérifier les permissions
# Paramètres > Applications > FleetNexus > Notifications

# 3. Vérifier que le token est enregistré
node diagnostic-complete.js
# Chercher "Drivers avec tokens"

# 4. Redémarrer l'app
# Fermer complètement et relancer
```

---

## 📞 SUPPORT

Pour plus d'aide:
1. Consultez **TROUBLESHOOTING_NOTIFICATIONS.md**
2. Vérifiez les logs Firebase: `firebase functions:log`
3. Vérifiez les logs de l'app: `flutter logs`

---

**Version:** 2.0
**Dernière mise à jour:** Juin 2026
**Statut:** ✅ Complet
