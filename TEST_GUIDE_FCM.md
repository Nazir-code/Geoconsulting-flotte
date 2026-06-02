# TEST GUIDE — FCM Push Notifications (Firestore missions → Cloud Functions → FCM → Flutter)

## Objectif
Valider de manière **fiable** que la pipeline suivante fonctionne sans casser aucun état :
**Firestore (collection `missions`) → Cloud Functions (FCM via Firebase Admin SDK) → mobile Flutter (foreground/background/terminated)**.

## Périmètre
- ✅ On **utilise** les Cloud Functions FCM déjà existantes.
- ✅ On **n’altère pas** la logique Firestore et la structure existante.
- ✅ On **n’altère pas** la logique existante Flutter.
- ✅ On ajoute uniquement : documentation de test + script de création mission de test.

---

## 0) Vérifications préalables (à faire avant les tests)

### 0.1 Choisir un driver cible
Vous devez avoir au minimum :
- un **UID de driver valide** à mettre dans `missions.assignedTo`
- un driver dont le token FCM est enregistré dans :
  - `drivers/{driverUid}.fcmToken` (string) et/ou
  - `drivers/{driverUid}.fcmTokens` (array)

> Côté Flutter, la query est :
> `missions.where('assignedTo', isEqualTo: uid)`

### 0.2 Vérifier que Firebase Messaging est actif sur le mobile
Sur le terminal Flutter (ou logs) attendre que vous voyez :
- `🚀 [FCM SERVICE] Démarrage pour driver: <uid>`
- `✅ [FCM SERVICE] Permissions FCM initialisées`
- `📞 [FCM SERVICE] Token sauvegardé (1ère fois)`
- `✅ [TOKEN SAVE] Token enregistré avec SUCCÈS dans Firestore!`

Si le token n’est pas enregistré : ouvrez l’app une fois et connectez-vous au driver ciblé.

---

## 1) Script de création mission de test
On va créer une mission Firestore dont :
- `title: "TEST PUSH NOTIFICATION"`
- `location: "Test"`
- `assignedTo: <UID driver valide>`
- `status: "pending"` (recommandé)

### 1.1 Fichiers
- Script : `backend/create-test-mission-fcm.js`

---

## 2) Logs à surveiller (obligatoire)

### 2.1 Logs Cloud Functions (Firebase Console)
Chercher les logs liés à votre `missionId` (copiez l’ID renvoyé par le script) et en particulier :

- ` [TOKENS] Searching tokens for driver` 
- ` [TOKENS] Found fcmToken` **et/ou** ` [TOKENS] Found fcmTokens array`
- ` [NOTIFICATION] Starting notification process` 
- ` [NOTIFICATION] Notification payload`
- ` [NOTIFICATION] 📩 Sending FCM notifications`
- ` [NOTIFICATION] ✅ FCM send complete`
- ` [NOTIFICATION] Some messages failed` (si problème)

> Important : la function skip si `mission.notificationSent === true`.

### 2.2 Logs Mobile Flutter
Chercher :

**Foreground (app ouverte)**
- `✅ [FCM SERVICE] Notification FCM recue au premier plan:`
- `🎯 [FCM HANDLER] Traitement notification: type=mission_assigned, missionId=<id>`
- `📌 [FCM HANDLER] Données complètes:`

**Background (app en arrière-plan)**
- `📲 [FCM SERVICE] Notification FCM ouvert depuis background:`
- et/ou ` [BACKGROUND] Notification reçue en arrière-plan` (selon cas)

**Terminated (app fermée + tap sur notif)**
- `⏰ [FCM SERVICE] Message initial détecté (app lancée depuis notif)`

---

## 3) Procédure Step-by-step — 3 états

### Cas A — App fermée (terminated)
1. Assurez-vous que le driver ciblé est connecté (ou connectez-vous une fois avant).
2. Vérifiez que le token est enregistré (logs `[TOKEN SAVE]`).
3. Fermez complètement l’app (swipe / kill).
4. Exécutez le script de mission test (mode créé) :
   - title: `TEST PUSH NOTIFICATION`
   - location: `Test`
   - assignedTo: `<UID driver>`
   - status: `pending`
5. Attendre quelques secondes.
6. Ouvrir le centre de notifications et **taper** sur la notification.
7. Valider :
   - Cloud Function : `✅ FCM send complete` pour votre `missionId`
   - Mobile :
     - `⏰ [FCM SERVICE] Message initial détecté...`
     - `🎯 [FCM HANDLER] ... missionId=<id>`

### Cas B — App en arrière-plan (background)
1. Lancer l’app et connectez-vous au driver cible.
2. Mettre l’app en arrière-plan (bouton Home / switch).
3. Exécuter le script mission test (mode créé).
4. Valider :
   - Notification système reçue (device)
   - Mobile logs :
     - `📲 [FCM SERVICE] Notification FCM ouvert depuis background:` (au moment de l’ouverture depuis la notif)
     - et possiblement : `[BACKGROUND] Notification reçue en arrière-plan`.

### Cas C — App ouverte (foreground)
1. Garder l’app ouverte sur l’écran du driver.
2. Exécuter le script mission test (mode créé).
3. Valider :
   - Vous voyez la notification système OU au minimum la preuve en logs.
   - Mobile logs :
     - `✅ [FCM SERVICE] Notification FCM recue au premier plan:`
     - `🎯 [FCM HANDLER] Traitement notification: type=mission_assigned, missionId=<id>`

---

## 4) Checklist finale de validation (pipeline complète)
Cochez chaque item.

### Backend (Firestore → Functions → FCM)
- [ ] Mission test créée avec `title/location/assignedTo/status` corrects
- [ ] Logs Functions contiennent `Searching tokens for driver` avec le bon `driverUid`
- [ ] Logs Functions contiennent `Sending FCM notifications` avec `tokenCount > 0`
- [ ] Logs Functions contiennent `✅ FCM send complete` pour ce `missionId`

### Mobile (3 états)
- [ ] Terminated : notification reçue puis ouverture → logs `Message initial détecté`
- [ ] Background : notification reçue puis ouverture → logs `ouvert depuis background`
- [ ] Foreground : logs `Notification FCM recue au premier plan`

---

## 5) Logs attendus (exemples)

### Cloud Function
- `[TOKENS] Searching tokens for driver { driverUid: "<uid>" }`
- `[TOKENS] Found fcmToken { token: "abcd..." }`
- `[NOTIFICATION] Starting notification process { missionId, driverUid }`
- `[NOTIFICATION] 📩 Sending FCM notifications { tokenCount: 1 }`
- `[NOTIFICATION] ✅ FCM send complete { successCount: 1, failureCount: 0, ... }`

### Flutter
- `🚀 [FCM SERVICE] Démarrage pour driver: <uid>`
- `📩 [FCM HANDLER] Traitement notification: type=mission_assigned, missionId=<missionId>`
- `🎯 [FCM HANDLER] Données complètes: { type: mission_assigned, missionId: <id>, ... }`

---

## 6) Si un test échoue (diagnostic rapide)
- Pas de logs Functions → la mission test ne déclenche pas la fonction :
  - vérifier `status` et/ou que `assignedTo` est bien présent
- Logs Functions montrent `tokenCount: 0` → token absent/expiré :
  - ouvrir l’app sur le device ciblé puis attendre `TOKEN SAVE`
- Notification reçue mais pas de logs Flutter :
  - vérifier permission notification + connexion Firebase
  - vérifier si l’utilisateur a bien le bon `uid` (query Firestore)

