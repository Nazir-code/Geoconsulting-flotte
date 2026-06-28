# 🔍 Diagnostic - Synchronisation Temps Réel Drivers

## Problème Signalé
- ❌ Carte vide (pas de drivers affichés)
- ❌ Présence en ligne non visible quand le chauffeur se connecte

---

## ✅ Checklist de Diagnostic

### 1️⃣ Vérifier les Permissions Firestore (CRITIQUE)

**Status:** 🔴 **À VÉRIFIER D'URGENCE**

Va à [Firebase Console](https://console.firebase.google.com) → Firestore Rules

**Règles Actuelles:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // À VÉRIFIER
  }
}
```

**Règles Recommandées:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Drivers collection - lectures autorisées si authentifié
    match /drivers/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    
    // Missions collection
    match /missions/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

✅ **Action:** Copie-colle les règles ci-dessus dans Firebase Console

---

### 2️⃣ Vérifier les Logs Frontend

**Outils:** Ouvre **DevTools** (F12) → Console

**Ce que tu dois voir après la connexion du chauffeur:**
```
🔄 [DriversLive] Chauffeurs reçus de Firestore: {
  count: 1,
  drivers: [{
    id: "uid-123",
    name: "John Doe",
    status: "online",          ← DOIT être "online"
    hasGPS: false,             ← PAS ENCORE de GPS (jusqu'à bouton "Démarrer")
    lat: undefined,
    lng: undefined
  }]
}
```

**Si tu vois `count: 0`:**
- ❌ Les drivers ne sont pas créés dans Firestore
- ❌ Vérifier les permissions (étape 1)
- ❌ Vérifier les logs mobiles (étape 3)

---

### 3️⃣ Vérifier les Logs Mobile

**Outils:** Android Studio → Logcat OU Xcode → Console

**Ce que tu dois voir après connexion:**
```
✅ [AuthService] Utilisateur connecté: firebase-uid-123
✅ [AuthService] Profil créé dans Firestore
✅ [AuthService] Statut "online" défini dans Firestore
```

**Si tu ne vois PAS ces logs:**
- ❌ Firebase Auth n'est pas initialisée
- ❌ Firestore ne répond pas
- ❌ Les permissions bloquent les écritures

---

### 4️⃣ Vérifier Manuellement dans Firebase Console

Va à [Firebase Console](https://console.firebase.google.com):
1. Clique sur **Firestore Database**
2. Cherche la collection **drivers**
3. Tu dois voir un document par chauffeur connecté

**Si la collection n'existe pas:**
- ❌ Aucun chauffeur ne s'est connecté
- ❌ Ou les profils ne sont pas créés

**Si la collection existe, vérifie les champs:**
- ✅ `uid` - Firebase UID
- ✅ `email` - Email du chauffeur
- ✅ `status` - DOIT être "online"
- ✅ `name` - Nom du chauffeur

---

### 5️⃣ Tester le GPS Streaming

**Sur l'app mobile:**
1. Connexion ✅
2. Clique **"Démarrer Tracking"**
3. Accepte les permissions GPS
4. Regarde les logs: `updateLocation` doit être appelée

**Dans Firebase Console:**
5. Rafraîchis les documents drivers
6. Les champs `latitude`, `longitude` doivent être mis à jour

**Si pas de mise à jour:**
- ❌ GPS permissions refusées
- ❌ Service de location ne démarre pas

---

### 6️⃣ Tester la Sync Web

**Sur le dashboard web:**
1. Ouvre DevTools (F12)
2. Va à Console
3. Tu dois voir le log `🔄 [DriversLive]`

**Si le log n'apparaît pas:**
- ❌ Firestore listener ne démarre pas
- ❌ Permissions Firestore bloquent les lectures

---

## 🚀 Flux Complet de Test

```
ÉTAPE 1: Vérifier les permissions Firestore
         ↓
ÉTAPE 2: Ouvrir le web dashboard (DevTools)
         ↓
ÉTAPE 3: Connecter un chauffeur sur mobile
         ↓
ÉTAPE 4: Vérifier les logs mobile (✅ "online" défini)
         ↓
ÉTAPE 5: Vérifier les logs web (🔄 Drivers reçus)
         ↓
ÉTAPE 6: Vérifier Firestore Console (document driver existe)
         ↓
ÉTAPE 7: Cliquer "Démarrer Tracking" sur mobile
         ↓
ÉTAPE 8: Vérifier lat/lng dans Firestore Console
         ↓
ÉTAPE 9: Voir la carte se remplir sur le web ✅
```

---

## 📊 État Attendu Après Configuration

### Firestore Structure
```
drivers/
  └── firebase-uid-123/
      ├── uid: "firebase-uid-123"
      ├── email: "driver@example.com"
      ├── name: "John Doe"
      ├── status: "online"  ← Le chauffeur est connecté
      ├── latitude: 2.1098   ← GPS activé
      ├── longitude: 13.5137
      ├── lastLocationUpdate: 2026-05-04T10:30:00.000Z
      └── lastSeen: 2026-05-04T10:30:00.000Z
```

### Web Dashboard
```
✅ Suivi GPS en Direct
✅ 1 chauffeur en ligne
✅ 1 chauffeur avec GPS
✅ Carte centrée sur la position du chauffeur
✅ Marker avec initiales "JD" (John Doe)
```

---

## 🔧 Fixes Probables

### Fix 1: Permissions Firestore (80% des cas)
→ Copie les règles de l'étape 1

### Fix 2: Firestore pas initialisée
→ Vérifier que Firebase est initialisé côté mobile
```dart
// driver_mobile/lib/main.dart
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### Fix 3: GPS permissions refusées
→ Accepter les permissions quand l'app demande

### Fix 4: Web n'écoute pas
→ Vérifier que le listener Firestore se lance
```
useEffect(() => {
  FirestoreDriverService.allDriversListener((list) => {
    // Doit être appelé
  });
}, []);
```

---

## 📞 Support Debugging

**Si le problème persiste:**
1. Partage les logs console (web + mobile)
2. Partage une screenshot Firestore Console
3. Vérifie que Firebase Auth fonctionne (connexion réussie)

---

## ✅ Marquer comme Résolu

Quand tout fonctionne, tu dois voir:
- ✅ Logs du chauffeur connecté
- ✅ Document driver créé dans Firestore
- ✅ Web reçoit les changements
- ✅ Carte affiche les drivers
- ✅ GPS streaming met à jour les positions
