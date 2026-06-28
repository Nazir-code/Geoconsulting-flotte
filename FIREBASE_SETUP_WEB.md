# 📋 Guide d'Installation - Firebase Integration Web

## ✅ Étape 1: Installer les dépendances Firebase

```bash
cd Frontend
npm install firebase
```

**Dépendance ajoutée:** `firebase@^10.7.1`

---

## ✅ Étape 2: Fichiers Créés

Les fichiers suivants ont été créés et sont prêts à utiliser:

### Configuration Firebase
- **`src/lib/firebaseConfig.ts`** - Configuration Firebase avec credentials du projet `geoconsulting-fleet`
- **`src/lib/firestoreService.ts`** - Service Firestore pour opérations générales (CRUD, listeners, timestamps)

### Services Firestore
- **`src/services/firestoreDriverService.ts`** - Gestion des profils drivers (créer, mettre à jour, écouter en temps réel)
- **`src/services/firestoreMissionService.ts`** - Gestion des missions (créer, assigner, suivre, écouter)

### Authentification Firebase
- **`src/context/AuthContext_Firebase.tsx`** - Nouveau contexte d'authentification avec Firebase Auth réel (remplace le système mock)

---

## ✅ Étape 3: Remplacer l'AuthContext

### Étape 3a: Sauvegarder l'ancien contexte
```bash
# Renommer l'ancien pour garder une copie
mv src/context/AuthContext.tsx src/context/AuthContext_Mock.tsx
```

### Étape 3b: Utiliser le nouveau contexte
```bash
# Renommer le nouveau
mv src/context/AuthContext_Firebase.tsx src/context/AuthContext.tsx
```

### Étape 3c: Mettre à jour les imports dans main.tsx
Vérifier que le `AuthProvider` est importé du bon contexte:

```typescript
// src/main.tsx
import { AuthProvider } from '@/context/AuthContext';

// Le reste du code reste identique
```

---

## ✅ Étape 4: Configurer les Variables d'Environnement

Créer/Modifier le fichier **`.env.local`**:

```bash
# .env.local

# Firebase Config (déjà compilée dans firebaseConfig.ts)
# Les variables ne sont pas nécessaires car les credentials sont en dur
# (Pour la production, utiliser des variables d'env)

# API Backend (optionnel, si vous avez un backend)
VITE_API_URL=/api
VITE_SOCKET_URL=/
```

> **Note:** Les credentials Firebase sont compilées dans `firebaseConfig.ts`. Pour la production, utilisez des variables d'environnement.

---

## ✅ Étape 5: Vérifier la Configuration

Tester que Firebase est bien configuré:

```bash
# Dans le navigateur, ouvrir la console et tester:
npm run dev
```

Puis dans la console du navigateur (F12):
```javascript
// Devrait afficher l'app Firebase initialisée
```

---

## 🎯 Qu'est-ce qui a changé?

### AVANT (Mock Data):
```typescript
// AuthContext_Mock.tsx
const MOCK_USERS = {
  'manager@fleetnexus.ng': { password: 'manager123' },  // ❌ Hardcoded
  'driver1@fleetnexus.ng': { password: 'driver123' },   // ❌ Hardcoded
};

// Login simulé
const login = (email, password) => {
  const user = MOCK_USERS[email];
  if (!user || user.password !== password) throw Error;
  // ❌ Pas d'authentification réelle
  // ❌ Pas de synchronisation Firestore
};
```

### APRÈS (Firebase Auth):
```typescript
// AuthContext.tsx (Firebase)
const login = async (data) => {
  // ✅ Authentification Firebase réelle
  const userCredential = await signInWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  
  // ✅ Mise à jour automatique du statut dans Firestore
  await FirestoreDriverService.updateDriverStatus(uid, 'online');
  
  // ✅ Synchronisation avec le dashboard web
  // ✅ Visible en temps réel sur tous les appareils
};
```

---

## 🔄 Flux de Synchronisation

### Avant:
```
WEB: Mock Auth + Local State
     ❌ Non connectée au mobile
     ❌ Données perdues au refresh
     ❌ Pas de temps réel
```

### Après:
```
WEB: Firebase Auth + Firestore Time Real
MOBILE: Firebase Auth + Firestore Real Time
     ↓
     ✅ SYNCHRONISÉS
     ✅ Données persistantes
     ✅ Mises à jour en temps réel
```

---

## 📊 Colleciton Firestore Créées Automatiquement

La première fois qu'un utilisateur se connecte via web:

**Collection: `drivers`**
```
drivers/{uid}/
  ├─ name: "Jean Dupont"
  ├─ email: "jean@example.com"
  ├─ phone: "+33612345678"
  ├─ status: "online"
  ├─ latitude: 48.8566
  ├─ longitude: 2.3522
  ├─ lastLocationUpdate: 2026-04-29T14:30:00Z
  ├─ lastSeen: 2026-04-29T14:30:00Z
  ├─ createdAt: 2026-04-20T10:00:00Z
  └─ updatedAt: 2026-04-29T14:30:00Z
```

---

## 🧪 Test: Connexion Web

### Tester Inscription
```bash
npm run dev
# Aller à l'écran de connexion
# Cliquer "S'inscrire"
# Remplir le formulaire:
#   Email: test@example.com
#   Mot de passe: Test1234
#   Nom: Test User
#   Téléphone: +33612345678
# Cliquer "S'inscrire"
```

### Vérifier dans Firebase Console
```
https://console.firebase.google.com
Projet: geoconsulting-fleet
→ Authentication: Voir l'utilisateur créé
→ Firestore: drivers/{uid} créé automatiquement
```

---

## 📱 Test: Synchronisation Mobile ↔ Web

### 1. Inscription sur Mobile
```dart
// Créer un utilisateur sur l'app Flutter
email: driver@example.com
mot de passe: Driver1234
nom: Driver Name
```

### 2. Voir sur Web
```
Dashboard web
→ Chauffeurs en ligne (Live)
→ Voir "Driver Name" en online
→ Position GPS en temps réel
```

### 3. Attribution Mission (Web)
```
Dashboard web
→ Créer Mission
→ Assigner à "Driver Name"
```

### 4. Recevoir sur Mobile
```
App Flutter
→ Nouvelle mission reçue automatiquement
→ Chauffeur peut accepter/refuser
```

---

## ⚠️ Problèmes Courants

### Erreur: "firebaseConfig is not defined"
```
Solution: Vérifier que firebaseConfig.ts existe dans src/lib/
```

### Erreur: "auth is not defined"
```
Solution: Importer correctement:
import { auth } from '@/lib/firebaseConfig';
```

### Erreur: "Firebase: Error (auth/configuration-not-found)"
```
Solution: Vérifier les credentials dans firebaseConfig.ts
- apiKey
- projectId
- authDomain
```

### Les utilisateurs ne sont pas créés dans Firestore
```
Solution: 
1. Vérifier que FirestoreDriverService.createOrUpdateDriver() est appelé
2. Vérifier que les Firestore rules permettent la création:
   allow create: if request.auth != null;
```

### Les changements ne se synchronisent pas en temps réel
```
Solution:
1. Vérifier que les listeners (onSnapshot) sont actifs
2. Vérifier les Firestore rules pour les permissions
3. Vérifier la connexion Internet
```

---

## 🚀 Prochaines Étapes

Après avoir complété cette installation:

1. **✅ PHASE 2 COMPLÉTÉE:** Authentication Firebase
2. **PHASE 3:** Créer Dashboard Live des Drivers (src/screens/DriversLive.tsx)
3. **PHASE 4:** Créer Système Missions (src/screens/MissionsBoard.tsx)
4. **PHASE 5:** Intégrer GPS temps réel sur la carte
5. **PHASE 6:** Supprimer complètement les mock data
6. **PHASE 7:** Tests complets
7. **PHASE 8:** Déploiement

---

## 📞 Commandes Utiles

```bash
# Installer les dépendances
npm install

# Démarrer le développement
npm run dev

# Build pour production
npm run build

# Linter le code
npm run lint
```

---

## ✨ Résumé des Changements

| Aspect | Avant | Après |
|--------|-------|-------|
| **Auth** | Mock users hardcoded | ✅ Firebase Auth |
| **Database** | Local state | ✅ Cloud Firestore |
| **Sync** | Aucune | ✅ Real-time Firestore |
| **Profils** | Hardcoded | ✅ Firestore collection |
| **Statut** | Jamais mis à jour | ✅ online/offline sync |
| **Sécurité** | ❌ Faible | ✅ JWT tokens |

---

## 🎉 Prêt?

```bash
# 1. Installer
npm install firebase

# 2. Remplacer AuthContext
mv src/context/AuthContext.tsx src/context/AuthContext_Mock.tsx
mv src/context/AuthContext_Firebase.tsx src/context/AuthContext.tsx

# 3. Tester
npm run dev

# 4. Aller à http://localhost:5173
# 5. Tester l'inscription/connexion
```

**Bon courage!** 🚀
