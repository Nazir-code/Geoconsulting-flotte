# 🚨 GUIDE DE DÉPANNAGE - NOTIFICATIONS DE MISSIONS

## 🎯 Objectif
Recevoir les notifications de missions sur l'application mobile driver.

## 🔄 Flux Complet d'une Notification

```
┌─────────────────────────┐
│ Manager crée une mission│
└────────┬────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Mission sauvegardée dans Firestore avec:       │
│  ✅ assignedTo: [UID du driver]                │
│  ✅ status: "pending"                          │
│  ✅ title, destination, etc.                   │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Cloud Function "notifyDriverOnMissionCreated"  │
│ se déclenche automatiquement                   │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Cloud Function cherche le token FCM du driver  │
│  Collection "drivers" → doc [driverId]         │
│  Champ: fcmToken ou fcmTokens[]                │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Si token trouvé: Envoie via Firebase Cloud     │
│ Messaging (FCM)                                │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ App mobile reçoit notification:                │
│  • En premier plan: affiche immédiatement     │
│  • En arrière-plan: notifications du système  │
│  • App fermée: notification push              │
└────────┬────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│ Driver clique sur la notification             │
│ App affiche la liste des missions             │
└─────────────────────────────────────────────────┘
```

---

## 📋 ÉTAPES DE DÉPANNAGE

### ÉTAPE 1: Vérifier l'État du Système

**Ouvrez un terminal et exécutez:**

```bash
cd "Flotte de vehicule/backend"
node diagnostic-complete.js
```

**Vous verrez un rapport comme:**

```
📊 RAPPORT FINAL

📍 Drivers: ✅ 3 trouvés
📍 Drivers avec tokens: ❌ 0/3
📍 Missions: ✅ 5 trouvées
📍 Missions avec assignedTo: ✅ 3/5
📍 Notifications stockées: ✅ 2
```

**Interprétez les résultats:**

| Problème | Cause | Solution |
|----------|-------|----------|
| `Drivers: ❌ 0 trouvés` | Aucun driver en base | Créer des drivers test |
| `Drivers avec tokens: ❌ 0/X` | Pas de tokens FCM enregistrés | Lancer l'app mobile |
| `Missions avec assignedTo: ❌ 0/X` | Champ manquant dans missions | Créer nouvelles missions |

---

### ÉTAPE 2: Créer un Environnement de Test

Si les diagnostics montrent des problèmes, créez des données de test:

```bash
node setup-test-driver.js
```

**Cela va:**
- ✅ Créer un driver de test avec token FCM
- ✅ Créer un véhicule de test
- ✅ Créer une mission de test

**Puis redémarrez le diagnostic:**
```bash
node diagnostic-complete.js
```

---

### ÉTAPE 3: Vérifier l'Enregistrement du Token FCM

**Sur l'app mobile:**

1. Ouvrez les logs Flutter:
```bash
flutter logs
```

2. Relancez l'app mobile

3. Cherchez les messages:
```
💾 Sauvegarde du token FCM: eyJhbGciOiJSUzI1NiIsInR5c...
✅ Token FCM sauvegardé avec succès
```

**Si vous voyez ça:** ✅ Le token est enregistré
**Si vous ne le voyez pas:** ❌ Vérifiez les permissions de notification

---

### ÉTAPE 4: Tester l'Envoi de Notification

```bash
node test-mission-notifications-fix.js
```

**Résultat attendu:**
```
✅ Driver trouvé: driver_123
✅ Mission créée: mission_456
✅ Token FCM disponible: eyJhbGciOiJ...

💡 Prochaines étapes:
1. 📱 Ouvrez l'app mobile
2. 📲 Attendez la notification "🧪 Mission de Test - Notifications"
```

**Allez dans votre téléphone et vérifiez:**
- 🔔 Vous devriez voir une notification système
- 📲 Cliquez dessus pour ouvrir l'app

---

## 🚨 PROBLÈMES COURANTS ET SOLUTIONS

### Problème 1: "No FCM token found"

**Cause:** L'app mobile n'a pas enregistré son token

**Solutions:**
1. Vérifiez les permissions sur le téléphone:
   - **Android:** Paramètres > Applications > FleetNexus > Permissions > Notifications > Activer
   - **iOS:** Paramètres > Notifications > FleetNexus > Activer

2. Redémarrez l'app mobile

3. Vérifiez les logs:
```bash
flutter logs | grep -i "fcm\|token"
```

---

### Problème 2: "Skipping mission notification - no driver"

**Cause:** Le champ `assignedTo` est manquant dans la mission

**Solutions:**
1. Vérifiez dans Firestore Console:
   - Collection "missions"
   - Cherchez le champ `assignedTo`
   - Il doit contenir l'UID du driver

2. Créez une nouvelle mission

3. Vérifiez le code `firebaseStore.js`:
```javascript
const mission = {
  assignedTo: driver.userId,  // ✅ DOIT ÊTRE PRÉSENT
  status: 'pending',          // ✅ DOIT ÊTRE "pending"
  // ...
};
```

---

### Problème 3: La notification n'apparaît pas sur le téléphone

**Causes possibles et solutions:**

| Cause | Vérification | Solution |
|-------|-------------|----------|
| **Permissions refusées** | Paramètres du téléphone | Activer les notifications pour FleetNexus |
| **App pas relancée** | Voir les logs Flutter | Fermer et relancer l'app |
| **Token expiré** | Vérifier le token en Firestore | Relancer l'app mobile |
| **Firebase mal configuré** | Vérifier `google-services.json` | Regénérer à partir de Firebase Console |

---

### Problème 4: "registration-token-not-registered"

**Cause:** Le token FCM est invalide ou expiré

**Solution:**
1. Relancer l'app mobile
2. Attendre 5-10 secondes pour que le nouveau token soit enregistré
3. Créer une nouvelle mission

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Diagnostic lancé: `node diagnostic-complete.js`
- [ ] Au moins 1 driver avec token FCM
- [ ] Au moins 1 mission avec `assignedTo`
- [ ] Cloud Functions déployées: `firebase deploy --only functions`
- [ ] App mobile relancée
- [ ] Logs Flutter vérifiés: `flutter logs`
- [ ] Permissions de notification activées sur le téléphone
- [ ] Test lancé: `node test-mission-notifications-fix.js`
- [ ] Notification reçue sur le téléphone

---

## 📱 VÉRIFICATION FINALE

### En cas de succès ✅

1. 🔔 Notification système reçue sur le téléphone
2. 📲 Titre: "Titre de la mission"
3. 📋 Corps: "Destination: [lieu]"
4. ✅ Clic sur la notification → App ouvre la liste des missions

### En cas d'échec ❌

1. Relancer le diagnostic complet:
```bash
node diagnostic-complete.js
```

2. Vérifier les logs Firebase:
```bash
firebase functions:log
```

3. Vérifier les logs de l'app:
```bash
flutter logs
```

4. Consulter la section "Problèmes Avancés" ci-dessous

---

## 🔬 PROBLÈMES AVANCÉS

### Les notifications ne sont reçues que parfois

**Cause:** Il peut y avoir plusieurs tokens pour le même driver

**Solution:**
```bash
# Vérifier dans Firestore Console:
- Collection "drivers"
- Champ "fcmTokens" (array)
- Doit être un array de tokens valides
```

### L'app n'affiche pas la notification en arrière-plan

**Solution:** Vérifier le handler en arrière-plan dans `main.dart`:

```dart
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ce code s'exécute quand l'app est fermée
  print('Notification reçue en background');
}
```

### Erreur "User not found in drivers collection"

**Cause:** Le driver n'existe pas ou a un userId invalide

**Solution:**
1. Vérifier que `assignedTo` est un UID Firebase valide
2. Vérifier que le driver correspondant existe dans Firestore
3. Créer un driver de test: `node setup-test-driver.js`

---

## 🔧 COMMANDES UTILES

| Commande | Description |
|----------|-------------|
| `node diagnostic-complete.js` | Diagnostic complet du système |
| `node setup-test-driver.js` | Créer un driver de test |
| `node test-mission-notifications-fix.js` | Tester l'envoi de notification |
| `firebase deploy --only functions` | Déployer les Cloud Functions |
| `firebase functions:log` | Voir les logs des Cloud Functions |
| `flutter logs` | Voir les logs de l'app mobile |

---

## 📞 SUPPORT

Si après avoir suivi ce guide vous n'avez toujours pas de notifications:

1. **Vérifiez les logs Firebase:**
```bash
firebase functions:log | tail -20
```

2. **Vérifiez la configuration Firebase:**
- Console Firebase > Projet > Settings
- Vérifier que Cloud Messaging est activé

3. **Vérifiez que les Cloud Functions ont été déployées:**
```bash
firebase functions:list
```

4. **Réinstaller l'app mobile:**
- Complètement supprimer l'app
- Réinstaller depuis le build

---

**Date:** Juin 2026
**Version:** 2.0
**Statut:** ✅ Complet et testé
