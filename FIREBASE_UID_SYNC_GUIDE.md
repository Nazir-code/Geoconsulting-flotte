# 🔐 Guide Complet - Synchronisation Firebase UID

**Date**: 21 mai 2026  
**Objectif**: Synchroniser les Firebase UIDs entre le mobile et le backend pour les notifications en temps réel

---

## 📋 Ce qui a été modifié

### **Backend (Node.js)**

1. **server.js** - Nouveau endpoint
   ```
   POST /api/driver/me/register-firebase-uid
   Body: { firebaseUid: "..." }
   ```
   Permet au mobile d'enregistrer son Firebase UID avec le backend

2. **firebaseStore.js** - Modification de `createMissionForUser()`
   ```javascript
   assignedTo: driver.firebaseUid || driver.id
   ```
   Les missions utilisent maintenant le Firebase UID si disponible

3. **Scripts de vérification et correction**
   - `verify-firebase-uid-sync.js` - Audit complet
   - `fix-firebase-uid-sync.js` - Correction automatique

### **Mobile (Flutter/Dart)**

1. **auth_service.dart**
   - Appelle `registerFirebaseUidWithBackend()` après la connexion

2. **firestore_service.dart**
   - Nouvelle méthode `registerFirebaseUidWithBackend()`
   - Enregistre le Firebase UID dans le doc driver Firestore

---

## 🚀 Procédure de Test & Vérification

### **ÉTAPE 1: Audit Initial du Système**

```bash
cd "Flotte de vehicule/backend"
node verify-firebase-uid-sync.js
```

**Attendez-vous à voir:**
```
📋 [ÉTAPE 1] Vérification des drivers
   ✅ Trouvé 5 drivers

📊 [ÉTAPE 5] État du système
   ⚠️  MIXTE: Certains drivers avec Firebase UID, d'autres non
   
💡 [ÉTAPE 6] Recommandations
   📱 Pour chaque driver:
      1. Lancer l'app mobile
      2. Se connecter avec Firebase Auth
      3. Attendre 5-10 secondes
      4. Relancer ce script
```

### **ÉTAPE 2: Lancer l'App Mobile**

```bash
# Terminal 1: Logs Firebase/FCM
flutter logs | grep -E "FIREBASE|FCM|TOKEN|SYNC"
```

```bash
# Terminal 2: Lancer l'app
flutter run
```

**Attendez-vous à voir dans les logs:**
```
✅ [AuthService] Utilisateur connecté: Z5jXnK2pQwRvLm...
✅ [AuthService] Profil créé dans Firestore
✅ [AuthService] Statut "online" défini dans Firestore

🔐 [FIREBASE_SYNC] Enregistrement du Firebase UID avec le backend
   ├─ Firebase UID: Z5jXnK2pQwRvLm...
   ✅ Firebase UID enregistré dans Firestore!
   │  └─ Path: /drivers/Z5jXnK2pQwRvLm...
   │  └─ Field: firebaseUid = Z5jXnK2pQwRvLm...
   └─ ✅ Synchronisation Firebase UID complète!
```

### **ÉTAPE 3: Vérifier la Synchronisation**

```bash
node verify-firebase-uid-sync.js
```

**Attendez-vous à voir:**
```
📊 [ÉTAPE 5] État du système
   ✅ EXCELLENT: Tous les drivers ont leur firebaseUid enregistré!
   🚀 Le système est prêt à être testé
```

### **ÉTAPE 4: Corriger les Problèmes (Si Nécessaire)**

```bash
node fix-firebase-uid-sync.js
```

Le script va:
1. Synchroniser les drivers sans firebaseUid
2. Supprimer les missions orphelines
3. Afficher un résumé des corrections

### **ÉTAPE 5: Créer une Nouvelle Mission**

```bash
# Créer une mission pour le driver backend d1
curl -X POST http://localhost:3000/api/driver/me/missions \
  -H "Authorization: Bearer driver-token-1" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Niamey Central",
    "purpose": "Test Firebase UID Sync"
  }'
```

**Logs attendus au backend:**
```
📝 [CREATE_MISSION] Initialisation de la création de mission
   ├─ userId (from token): 1
   ├─ driver.id (Firestore doc ID): d1
   ├─ driver.firebaseUid: Z5jXnK2pQwRvLm...
   ├─ assignedTo (value used): Z5jXnK2pQwRvLm...
   │  └─ Raison: ✅ Firebase UID disponible
   └─ destination: Niamey Central

✅ [CREATE_MISSION] Mission créée dans Firestore!
   ├─ Mission ID: xyz123abc
   ├─ assignedTo: Z5jXnK2pQwRvLm...
```

**Logs attendus au mobile:**
```
✅ [FCM SERVICE] Notification FCM recue au premier plan: Nouvelle Mission
🎯 [FCM HANDLER] Traitement notification: type=mission_assigned

📡 [MISSION_LISTENER] SNAPSHOT REÇU de Firestore!
   ├─ Documents trouvés: 1
   ├─ Status: pending
   └─ AssignedTo: Z5jXnK2pQwRvLm...

📝 [MISSION_LISTENER] Mission détectée:
   ├─ ID: xyz123abc
   ├─ Status: pending
   ├─ AssignedTo: Z5jXnK2pQwRvLm...
   ├─ Destination: Niamey Central
   └─ CreatedAt: 2025-05-21T...

✨ [MISSION_LISTENER] Affichage du DIALOG pour mission: xyz123abc
```

### **ÉTAPE 6: Valider le Dialog**

- ✅ Un dialog s'affiche avec "Nouvelle Mission !"
- ✅ Destination: "Niamey Central"
- ✅ Boutons: IGNORER / ACCEPTER
- ✅ Cliquer ACCEPTER lance le TrackingScreen

### **ÉTAPE 7: Test Automatisé Complet**

```bash
node test-notification-flow.js
```

Doit afficher:
```
✅ Token FCM: OK
✅ Cohérence IDs: OK
✅ Requête Firestore Mobile: OK
🎉 TOUS LES TESTS PASSENT!
```

---

## 🔍 État Final Attendu

### **Firestore**

**Drivers**:
```
/drivers/d1
  ├─ id: d1
  ├─ name: John Doe
  ├─ firebaseUid: Z5jXnK2pQwRvLm... ✅
  ├─ fcmToken: eyJhbGc... ✅
  └─ status: online

/drivers/Z5jXnK2pQwRvLm...
  ├─ id: Z5jXnK2pQwRvLm...
  ├─ uid: Z5jXnK2pQwRvLm... ✅ (Firebase Auth)
  ├─ firebaseUid: Z5jXnK2pQwRvLm... ✅
  ├─ fcmToken: eyJhbGc... ✅
  └─ status: online
```

**Missions**:
```
/missions/xyz123abc
  ├─ id: xyz123abc
  ├─ assignedTo: Z5jXnK2pQwRvLm... ✅ (Firebase UID)
  ├─ destination: Niamey Central
  ├─ status: pending
  └─ createdAt: 2025-05-21T...
```

---

## 🐛 Troubleshooting

### **Problème: Firebase UID ne s'enregistre pas**

```
🔐 [FIREBASE_SYNC] Enregistrement du Firebase UID...
❌ Erreur lors de l'enregistrement du Firebase UID: permission denied
```

**Solution:**
```
1. Vérifier les règles Firestore
2. Vérifier que le doc /drivers/{uid} existe
3. Vérifier l'authentification
```

### **Problème: Missions ont toujours assignedTo = driver.id**

```
📝 [CREATE_MISSION]
   ├─ driver.firebaseUid: ❌ NON ENREGISTRÉ
   ├─ assignedTo (value used): d1
   │  └─ Raison: ⚠️  Firebase UID non enregistré, utilise driver.id
```

**Solution:**
```
1. S'assurer que l'app mobile a enregistré le Firebase UID
2. Lancer: node verify-firebase-uid-sync.js
3. Lancer: node fix-firebase-uid-sync.js
```

### **Problème: Mobile ne reçoit pas les missions**

```
📡 [MISSION_LISTENER] SNAPSHOT REÇU
   ├─ Documents trouvés: 0
   ├─ UID écouté: Z5jXnK2pQwRvLm...
   └─ Aucune mission avec assignedTo=Z5jXnK2pQwRvLm...
```

**Solution:**
```
1. Vérifier que mission.assignedTo = Firebase UID du driver
2. Lancer: node verify-firebase-uid-sync.js
3. Vérifier que le mobile cherche avec le bon UID
```

---

## ✅ Checklist de Validation

### **Backend**
- [ ] Endpoint `/api/driver/me/register-firebase-uid` fonctionne
- [ ] Logs `[CREATE_MISSION]` montrent `firebaseUid` utilisé
- [ ] Logs `[FCM]` montrent que la notification est envoyée
- [ ] `verify-firebase-uid-sync.js` montre "EXCELLENT"

### **Mobile**
- [ ] Logs `[FIREBASE_SYNC]` montrent l'enregistrement
- [ ] Doc driver a le champ `firebaseUid`
- [ ] Logs `[MISSION_LISTENER]` montrent les missions reçues
- [ ] Dialog s'affiche avec les bonnes informations

### **Flux Complet**
- [ ] Mission créée avec `assignedTo = Firebase UID`
- [ ] FCM envoyée au mobile
- [ ] Mobile reçoit la mission
- [ ] Dialog s'affiche
- [ ] Accepter lance le TrackingScreen

### **Test Automatisé**
- [ ] `test-notification-flow.js` affiche 3x ✅

---

## 🎯 Résumé des Améliorations

| Aspect | Avant | Après |
|--------|-------|-------|
| **Backend Auth** | Tokens simples | Tokens simples (compatible) |
| **Mobile Auth** | Firebase Auth | Firebase Auth (enregistré) |
| **Mission assignedTo** | `driver.userId` (non-synchronisé) | `driver.firebaseUid` (synchronisé) |
| **Correspondance IDs** | ❌ Zéro match | ✅ Match automatique |
| **Notifications** | ❌ Zéro reçues | ✅ Temps réel |
| **Synchronisation** | ❌ Aucune | ✅ Firebase UID synchro |

---

## 📞 Support

Si le système ne fonctionne pas après avoir suivi ce guide:

1. Lancer les scripts de diagnostic:
   ```bash
   node verify-firebase-uid-sync.js
   node test-notification-flow.js
   ```

2. Partager les logs de:
   ```
   Backend: npm start 2>&1 | grep -E "CREATE_MISSION|FCM|FIREBASE_SYNC"
   Mobile: flutter logs | grep -E "FIREBASE|MISSION|LISTENER"
   ```

3. Utiliser le script de correction:
   ```bash
   node fix-firebase-uid-sync.js
   ```
