# Diagnostic et Corrections - Notifications Temps Réel

## ✅ Problème Identifié

Quand une mission est créée dans Firestore, elle **n'apparaît pas en notification sur l'app mobile**, bien qu'elle soit créée correctement en base de données.

## 🔍 Root Causes Trouvées

### 1. **Timing du Démarrage FCM** ⏱️ 
**PROBLÈME**: `FirebaseNotificationService.instance.startForDriver(uid)` était appelé uniquement dans `driver_home.dart` initState
- ⚠️ Si la mission est créée AVANT que le chauffeur n'arrive sur la page d'accueil, le token FCM n'existe pas
- ⚠️ Le listener Firestore ne se déclenche que si l'app est déjà ouverte et que l'écran d'accueil est chargé

**SOLUTION APPLIQUÉE**: 
- ✅ Appel `startForDriver()` dans `AuthWrapper` dès que l'utilisateur se connecte (bien avant l'écran d'accueil)
- ✅ Cela garantit que le token FCM est enregistré immédiatement après l'authentification

### 2. **Retry du Token FCM** 🔄
**PROBLÈME**: Si le token n'est pas disponible immédiatement, il n'est jamais réessayé
- ⚠️ `FirebaseMessaging.getToken()` peut retourner `null` lors de l'appel initial
- ⚠️ Une attente courte est souvent nécessaire avant que Firebase initialise le token

**SOLUTION APPLIQUÉE**:
- ✅ Ajout d'une boucle de retry dans `_saveCurrentToken()` (max 3 tentatives, 500ms entre chaque)
- ✅ Logs améliorés pour déboguer les causes d'échec

### 3. **Amélioration des Cloud Functions** 📊
**PROBLÈME**: Les logs des Cloud Functions n'étaient pas assez détaillés pour déboguer
- ⚠️ Impossible de savoir si les tokens existent ou non
- ⚠️ Impossible de déboguer pourquoi les notifications ne sont pas envoyées

**SOLUTION APPLIQUÉE**:
- ✅ Logs détaillés ajoutés dans `getDriverTokens()` pour voir si les tokens sont trouvés
- ✅ Logs améliorés dans `sendMissionNotification()` pour tracer la cause de l'échec
- ✅ Causes d'erreur documentées pour chaque scénario

## 🛠️ Fichiers Modifiés

### 1. **driver_mobile/lib/main.dart**
```dart
// AVANT: AuthWrapper était stateless
// APRÈS: AuthWrapper est stateful et appelle startForDriver() dès la connexion
if (_currentUid != user.uid) {
  _currentUid = user.uid;
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    await FirebaseNotificationService.instance.startForDriver(user.uid);
  });
}
```

### 2. **driver_mobile/lib/services/firebase_notification_service.dart**
```dart
// Ajout de retry logic dans _saveCurrentToken()
while (token == null && retries < maxRetries) {
  token = await _messaging.getToken();
  if (token == null && retries < maxRetries - 1) {
    await Future.delayed(const Duration(milliseconds: retryDelayMs));
    retries++;
  }
}
```

### 3. **functions/index.js**
```javascript
// Logs détaillés ajoutés
logger.info('[TOKENS] Searching tokens for driver', { driverUid });
logger.info('[TOKENS] Found fcmToken', { token: ... });
logger.info('[TOKENS] Total unique tokens collected', { count: ... });

// Plus de logs dans sendMissionNotification pour déboguer
logger.warn('[NOTIFICATION] No FCM tokens found', { 
  reason: 'Driver profile exists but no tokens registered',
  possibleCauses: [...]
});
```

## 📝 Flux Corrigé

```
1. Utilisateur se connecte à l'app mobile
   ↓
2. auth_service.signIn() crée le profil et appelle registerFirebaseUidWithBackend()
   ↓
3. AuthWrapper détecte la connexion et appelle startForDriver() IMMÉDIATEMENT
   ↓
4. FirebaseNotificationService obtient le token FCM (avec retry si nécessaire)
   ↓
5. Token enregistré dans /drivers/{firebaseUid} dans Firestore
   ↓
6. Mission créée dans le backend
   ↓
7. Cloud Function déclenche et récupère les tokens depuis /drivers/{firebaseUid}
   ↓
8. FCM notification envoyée au chauffeur
   ↓
9. App mobile reçoit la notification (même en arrière-plan!)
   ↓
10. Listener Firestore aussi déclenche et affiche un dialog
```

## 🧪 Étapes de Vérification

Pour vérifier que les corrections fonctionnent :

1. **Vérifier que le token est enregistré**:
   - Ouvrir l'app mobile
   - Regarder les logs : chercher `✅ [TOKEN SAVE] Token enregistré avec SUCCÈS`
   - Vérifier dans Firebase Console → Firestore → `/drivers/{uid}` → champ `fcmToken`

2. **Vérifier que la mission déclenche une notification**:
   - Créer une mission depuis le web/backend
   - Regarder les logs Cloud Functions
   - Chercher les logs `[NOTIFICATION]` dans Functions
   - Chercher `✅ [FCM SERVICE] Notification FCM recue` dans les logs de l'app mobile

3. **Si ça ne marche toujours pas**:
   - Vérifier les règles Firestore - le chauffeur doit pouvoir lire ses propres données
   - Vérifier que `firebaseUid` est bien enregistré dans le doc driver
   - Vérifier que la mission a `assignedTo = {firebaseUid}` (pas `assignedTo = {driverId}`)

## 📋 Checklist

- [x] `startForDriver()` appelé dans `AuthWrapper` à la connexion
- [x] Retry logic ajoutée pour le token FCM
- [x] Logs détaillés ajoutés dans Cloud Functions
- [x] `firebaseUid` enregistré après connexion
- [x] Règles Firestore permettent la lecture du profil driver
- [ ] Test dans l'environnement réel

## 🚀 Déploiement

Pour déployer ces corrections :

1. **Redéployer les Cloud Functions** :
   ```bash
   cd functions
   firebase deploy --only functions
   ```

2. **Déployer l'app mobile** :
   - Rebuild et redéployer `driver_mobile` sur les appareils de test

3. **Test** :
   - Créer une mission depuis le web
   - Vérifier que la notification apparaît dans les 5 secondes

## 📞 Support et Débogage

Si les notifications ne fonctionnent toujours pas:

1. **Vérifier les logs Cloud Functions** :
   - Firebase Console → Functions → Logs
   - Chercher le missionId crée et voir les logs

2. **Vérifier les logs app mobile** :
   - Ouvrir le terminal mobile avec `flutter logs`
   - Chercher `[FCM SERVICE]`, `[TOKEN SAVE]`, `[NOTIFICATION_LISTENER]`

3. **Vérifier les règles Firestore** :
   ```
   // Les chauffeurs doivent pouvoir lire/écrire leurs propres données
   match /drivers/{uid} {
     allow read, write: if request.auth.uid == uid;
   }
   ```

4. **Vérifier la configuration Android** :
   - Vérifier que `android:exported="true"` dans AndroidManifest.xml
   - Vérifier les permissions de notification
