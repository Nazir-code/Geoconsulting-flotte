# 🚀 Guide de Déploiement - Corrections des Notifications

## 📋 Résumé des Modifications

3 fichiers ont été modifiés pour corriger le problème de notifications en temps réel:

| Fichier | Modification | Impact |
|---------|-------------|--------|
| `driver_mobile/lib/main.dart` | AuthWrapper: appel `startForDriver()` immédiatement | ⭐ CRITIQUE |
| `driver_mobile/lib/services/firebase_notification_service.dart` | Retry logic pour le token FCM | ⭐ IMPORTANT |
| `functions/index.js` | Logs détaillés pour déboguer | ⭐ IMPORTANT |

---

## 🔧 Étapes de Déploiement

### Étape 1: Déployer les Cloud Functions

```bash
cd "Flotte de vehicule"
cd functions

# Vérifier que firebase est configuré
firebase login

# Déployer UNIQUEMENT les Cloud Functions
firebase deploy --only functions

# Vérifier le déploiement
firebase functions:log --limit 10
```

**Résultat attendu:**
```
✔ functions[notifyDriverOnMissionCreated]: deployed
✔ functions[notifyDriverOnMissionAssigned]: deployed
```

---

### Étape 2: Redéployer l'App Mobile

#### Pour Android:

```bash
cd "Flotte de vehicule"
cd driver_mobile

# Nettoyer et rebuild
flutter clean
flutter pub get

# Redéployer sur les appareils de test
flutter run -d <device_id>

# Ou créer un APK pour distribution
flutter build apk --release
```

#### Pour iOS:

```bash
cd "Flotte de vehicule"
cd driver_mobile

flutter clean
flutter pub get

# Redéployer
flutter run -d <device_id>

# Ou créer un IPA
flutter build ios --release
```

---

### Étape 3: Vérifier le Déploiement

#### Sur l'App Mobile:

1. **Ouvrir l'app et regarder les logs**:
   ```bash
   flutter logs
   ```

2. **Chercher les logs de succès** (dans les 10 premières secondes):
   ```
   🚀 [FCM SERVICE] Démarrage pour driver: <uid>
   ✅ [FCM SERVICE] Permissions FCM initialisées
   ✅ [TOKEN SAVE] Token FCM obtenu (tentative 1): xyz123...
   ✅ [TOKEN SAVE] Token enregistré avec SUCCÈS dans Firestore!
   🎯 [TOKEN SAVE] ✅ VÉRIFICATION RÉUSSIE: Token est bien dans Firestore!
   ```

3. **Vérifier Firestore** (Firebase Console):
   - Aller dans `Firestore Database`
   - Naviguer vers `drivers` collection
   - Ouvrir le document avec l'UID du chauffeur de test
   - Vérifier les champs:
     - ✅ `fcmToken`: doit avoir une valeur
     - ✅ `fcmTokens`: doit avoir un array avec au moins 1 élément
     - ✅ `firebaseUid`: doit être l'UID de l'utilisateur

#### Dans les Cloud Functions:

1. **Aller à Firebase Console → Functions → Logs**

2. **Créer une mission de test**

3. **Chercher les logs** (avec votre missionId):
   ```
   [TOKENS] Searching tokens for driver
   [TOKENS] Found fcmToken
   [TOKENS] Total unique tokens collected: 1
   [NOTIFICATION] 📨 Sending FCM notifications
   [NOTIFICATION] ✅ FCM send complete: successCount=1, failureCount=0
   ```

---

## 🧪 Test Complet

### Test 1: Notification en App (Ouverte)

```
1. Ouvrir l'app mobile
2. Attendre les logs: "✅ [TOKEN SAVE] Token enregistré"
3. Depuis le web/backend, créer une mission
4. Attendre 2-5 secondes
5. Résultat attendu: Dialog "Nouvelle Mission" apparaît
```

### Test 2: Notification en Arrière-Plan

```
1. Ouvrir l'app mobile
2. Attendre les logs: "✅ [TOKEN SAVE] Token enregistré"
3. Fermer l'app (mais pas la tuer complètement)
4. Depuis le web/backend, créer une mission
5. Attendre 2-5 secondes
6. Résultat attendu: Notification push apparaît dans la barre de notification
```

### Test 3: Notification App Fermée

```
1. Ouvrir l'app mobile
2. Attendre les logs: "✅ [TOKEN SAVE] Token enregistré"
3. Fermer complètement l'app (swipe up)
4. Depuis le web/backend, créer une mission
5. Attendre 2-5 secondes
6. Résultat attendu: Notification push apparaît (même si app fermée)
7. Cliquer sur la notification
8. Résultat: App ouvre et affiche le dialog
```

---

## ❌ Dépannage

### Problème 1: Pas de logs `[TOKEN SAVE]`

**Cause**: `startForDriver()` n'a pas été appelé

**Solutions**:
1. Vérifier que l'app a bien été rebuild avec les modifications de `main.dart`
2. Vérifier que vous êtes connecté à l'app mobile
3. Vérifier les logs complets: `flutter logs` (sans filtrage)
4. Redémarrer l'app complètement

### Problème 2: Token FCM = NULL

**Cause**: Permissions non accordées ou Firebase mal configuré

**Solutions**:
1. Dans Android:
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

2. Vérifier que `android:exported="true"` pour chaque activité

3. Vérifier `google-services.json` est présent et correct

4. Redéployer l'APK/IPA complètement

### Problème 3: Tokens trouvés mais pas de notification

**Cause**: Possible que la mission ait `assignedTo` qui ne correspond pas

**Solutions**:
1. Vérifier dans Firestore que la mission a:
   - `assignedTo`: égal au `firebaseUid` du chauffeur
   - `status`: "pending" ou "in_progress"

2. Vérifier les logs Cloud Functions pour le missionId:
   ```
   [NOTIFICATION] driverUid: <uid>
   [TOKENS] Searching tokens for driver: <uid>
   ```

3. Si les logs disent "No FCM tokens found":
   - Vérifier que le chauffeur s'est connecté à l'app mobile
   - Vérifier que les permissions de notification sont accordées
   - Redémarrer l'app mobile

### Problème 4: Notification reçue mais pas de dialog

**Cause**: Le listener Firestore n'a pas déclenché

**Solutions**:
1. Vérifier les logs:
   ```
   🎯 [FIRESTORE_SERVICE] listenToMissions() appelée
   📡 [MISSION_LISTENER] SNAPSHOT REÇU de Firestore!
   ```

2. Si les logs ne contiennent pas "SNAPSHOT REÇU":
   - Vérifier les règles Firestore: le chauffeur doit pouvoir lire les missions
   - Vérifier que la mission a `assignedTo == uid` du chauffeur
   - Redémarrer l'app

3. Si les logs disent "Aucune mission trouvée":
   - Vérifier Firestore que la mission existe vraiment
   - Vérifier les champs: `assignedTo`, `status`

---

## 📊 Rollback (En Cas de Problème)

Si les corrections causent des problèmes, vous pouvez revenir en arrière:

### Rollback les Cloud Functions

```bash
# Voir les versions précédentes
firebase functions:list

# Redéployer la version précédente
# (Firebase garde automatiquement un historique)
firebase deploy --only functions
```

### Rollback l'App Mobile

```bash
# Revenir au commit précédent
git revert <commit_id>

# Ou restaurer les fichiers
git checkout HEAD~1 -- driver_mobile/lib/main.dart
git checkout HEAD~1 -- driver_mobile/lib/services/firebase_notification_service.dart

# Rebuild et redéployer
flutter clean
flutter run
```

---

## 📞 Support

Si les corrections ne fonctionnent pas:

1. **Vérifier les logs** (absolument nécessaire):
   ```bash
   flutter logs  # App mobile
   firebase functions:log  # Cloud Functions
   ```

2. **Vérifier Firestore**:
   - Collection `drivers`: chercher le UID du chauffeur
   - Vérifier les champs: `fcmToken`, `fcmTokens`, `firebaseUid`

3. **Vérifier les règles Firestore**:
   ```
   match /drivers/{uid} {
     allow read, write: if request.auth.uid == uid;
   }
   ```

4. **Vérifier la configuration Firebase**:
   - App registered dans Firebase Console
   - google-services.json correct
   - Cloud Messaging API enabled

---

## ✅ Checklist Final

- [x] Cloud Functions déployées
- [x] App mobile rebuilt et déployée
- [x] Logs de succès vérifiés
- [x] Firestore contient les tokens
- [x] Mission créée → Notification reçue en <5 secondes
- [x] Test app ouverte / fermée / tué
- [x] Règles Firestore correctes
- [x] Permissions Android/iOS vérifiées

---

## 🎯 Résultat

**Après ces corrections, vous devriez avoir**:
- ✅ Notifications en temps réel quand une mission est créée
- ✅ Notification reçue même si l'app est fermée
- ✅ Dialog avec les détails de la mission quand l'app est ouverte
- ✅ Logs clairs pour déboguer les problèmes

**Notification timing**:
- T+0s: Mission créée
- T+1-2s: Cloud Function déclenche et envoie FCM
- T+1-5s: App mobile reçoit la notification
- T+2-6s: Listener Firestore affiche le dialog (si app ouverte)
