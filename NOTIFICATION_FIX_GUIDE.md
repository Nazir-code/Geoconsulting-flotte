# 🔧 Guide de Correction des Notifications - Étapes Complètes

## 🚨 PROBLÈME IDENTIFIÉ

Les notifications de missions ne fonctionnent plus car il existe une **divergence d'authentification**:

| Aspect | Mobile | Backend | Status |
|--------|--------|---------|--------|
| **Auth System** | Firebase Auth | Token Simple | ❌ Non-synchronisé |
| **Driver Doc ID** | Firebase UID | d1, d2, d3 | ❌ Mismatch |
| **mission.assignedTo** | Cherche Firebase UID | Crée avec driver.id | ⚠️ Maintenant corrigé |

## ✅ CORRECTIONS APPORTÉES

### 1. **Backend - firebaseStore.js (LIGNE 237)**
```javascript
// AVANT: assignedTo: driver.userId,
// APRÈS: assignedTo: driver.id,  ✅ CORRIGÉ
```
→ Les missions utilisent maintenant `driver.id` (doc ID Firestore)

### 2. **Logs Détaillés Ajoutés**

#### Mobile Logs:
- **firebase_notification_service.dart**: Logs token FCM, sauvegarde, vérification
- **driver_home.dart**: Logs listener Firestore, filtres, missions reçues
- **firestore_service.dart**: Logs query Firestore

#### Backend Logs:
- **firebaseStore.js**: Logs création mission, value de assignedTo, FCM envoi

### 3. **Script Diagnostic Amélioré**
```bash
node backend/diagnostic-notifications.js
```
→ Vérifie tokens, missions, cohérence système

## 🚀 ÉTAPES POUR TESTER & CORRIGER

### **ÉTAPE 1: Préparer l'App Mobile**

```bash
# Terminal 1: Voir les logs Flutter
flutter logs | grep -E "FCM|MISSION|TOKEN|LISTENER"
```

### **ÉTAPE 2: Lancer l'App Mobile**

```bash
# Terminal 2: Lancer l'app
flutter run
```

**Attendez-vous à voir:**
```
🚀 [FCM SERVICE] Démarrage pour driver: Z5jXnK2pQwRvLm...
📍 [TOKEN SAVE] Tentative d'obtenir le token FCM...
✅ [TOKEN SAVE] Token FCM obtenu: eyJhbGciOiJSUzI1Ni...
💾 [TOKEN SAVE] Enregistrement du token pour UID: Z5jXnK2pQwRvLm...
✅ [TOKEN SAVE] Token enregistré avec SUCCÈS dans Firestore!
🎯 [TOKEN SAVE] ✅ VÉRIFICATION RÉUSSIE: Token est bien dans Firestore!
```

**Si vous voyez ça:**
```
⚠️ [TOKEN SAVE] ❌ getToken() a retourné NULL!
```
→ **PROBLÈME**: Permissions de notification pas accordées
→ **SOLUTION**: Vérifier que vous accordez les permissions quand demandé

### **ÉTAPE 3: Se Connecter au Mobile**

```
Email: test@example.com
Password: (ask admin)
```

**Attendez-vous à voir:**
```
🚀 [MISSION_LISTENER] Démarrage pour UID: Z5jXnK2pQwRvLm...
📡 [MISSION_LISTENER] SNAPSHOT REÇU de Firestore!
   ├─ Documents trouvés: 0
   └─ Aucune mission avec assignedTo=Z5jXnK2pQwRvLm... (c'est normal au départ)
```

### **ÉTAPE 4: Créer une Mission** 

**Depuis le Dashboard/API:**
```bash
curl -X POST http://localhost:3000/api/driver/me/missions \
  -H "Authorization: Bearer driver-token-1" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Dosso",
    "purpose": "Livraison test"
  }'
```

**Attendez-vous à voir dans les logs Backend:**
```
📝 [CREATE_MISSION] Initialisation de la création de mission
   ├─ userId (from token): 1
   ├─ driver.id (Firestore doc ID): d1
   ├─ assignedTo (value used): d1
   └─ destination: Dosso
✅ [CREATE_MISSION] Mission créée dans Firestore!
   ├─ Mission ID: mission123
   ├─ assignedTo: d1
   └─ Mobile cherchera: .where('assignedTo', isEqualTo: "d1")
📲 [FCM] Recherche de token FCM pour driver: d1
   ├─ fcmToken existe: true/false
   └─ Envoi FCM vers token: ...
✅ [FCM] Notification FCM envoyée avec succès!
```

### **ÉTAPE 5: Observer les Logs Mobiles**

**Si tout fonctionne:**
```
✅ [FCM SERVICE] Notification FCM recue au premier plan: Nouvelle Mission
🎯 [FCM HANDLER] Traitement notification: type=mission_assigned, missionId=...
🚗 [FCM HANDLER] ✅ Nouvelle mission assignée détectée: mission123
```

**ET SIMULTANÉMENT:**
```
📡 [MISSION_LISTENER] SNAPSHOT REÇU de Firestore!
   ├─ Documents trouvés: 1
   ├─ Status: pending
   └─ AssignedTo: d1
📝 [MISSION_LISTENER] Mission détectée:
   ├─ ID: mission123
   ├─ Status: pending
   ├─ AssignedTo: d1
   ├─ Destination: Dosso
   └─ CreatedAt: 2025-05-21T...
✨ [MISSION_LISTENER] Affichage du DIALOG pour mission: mission123
```

**Et on voit le dialog "Nouvelle Mission !"**

## 🔴 SI ÇA NE FONCTIONNE TOUJOURS PAS

### **Cause #1: Token FCM = NULL**
```
Solution: Vérifier les permissions Android/iOS
         Relancer l'app
         Vérifier Firestore > drivers > votre UID > fcmToken
```

### **Cause #2: Listener reçoit 0 documents**
```
Solution: Lancer: node backend/diagnostic-notifications.js
         Vérifier que la mission a bien assignedTo=d1 (ou autre driver ID)
         Vérifier que le UID de l'app correspond au doc ID du driver
```

### **Cause #3: FCM est envoyée mais app ne reçoit rien**
```
Solution: Vérifier que l'app n'est pas crashée
         Vérifier flutter logs pour les exceptions
         Vérifier que FirebaseMessaging.onMessage.listen() est appelé
```

## 🎯 PROBLÈME ARCHITECTURAL ENCORE NON RÉSOLU

**Il existe une divergence d'ID qui n'est PAS COMPLÈTEMENT RÉSOLVABLE sans changement d'architecture:**

- Le backend crée les drivers avec `doc ID = d1` et `userId = 1`
- Le mobile Firebase Auth crée les drivers avec `doc ID = Firebase UID`
- Ces deux IDs ne correspondent jamais!

**Solution recommandée (pour plus tard):**
1. Ajouter un endpoint backend `/api/register-firebase-uid`
2. L'app mobile appelle cet endpoint avec son `Firebase UID`
3. Le backend enregistre ce UID et l'utilise pour `assignedTo` dans les missions

**Pour maintenant:** Les logs améliorés vous aideront à voir exactement où ça casse.

## 📊 Commandes Utiles

```bash
# Voir le diagnostic complet
node backend/diagnostic-notifications.js

# Nettoyer les anciennes missions
firebase firestore:delete missions --recursive

# Voir les logs du backend en temps réel
npm start 2>&1 | grep -E "CREATE_MISSION|FCM|MISSION"
```

## ✅ Checklist de Validation

- [ ] Token FCM enregistré dans Firestore ✅
- [ ] Mission créée avec assignedTo=driver.id ✅
- [ ] FCM reçue sur l'app ✅
- [ ] Listener Firestore reçoit la mission ✅
- [ ] Dialog apparaît avec détails mission ✅
- [ ] Chauffeur peut accepter/ignorer ✅
- [ ] Accepter lance le TrackingScreen ✅
