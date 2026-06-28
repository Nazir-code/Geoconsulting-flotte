# 🏗️ PLAN D'ARCHITECTURE - Integration Firebase Web/Mobile

## 📋 Credentials Firebase Confirmés
```
Project ID: geoconsulting-fleet
Web API Key: AIzaSyCZXQlz8tLydBMeFAg-zgnqrNzaVONM6x0
Auth Domain: geoconsulting-fleet.firebaseapp.com
Messaging Sender ID: 119982444575
Storage Bucket: geoconsulting-fleet.firebasestorage.app
```

---

## 🎯 PHASES D'IMPLÉMENTATION

### ✅ PHASE 1: Configuration Firebase React (1-2h)
- [x] Credentials identifiés
- [ ] Créer firebaseConfig.ts
- [ ] Installer dépendances Firebase npm
- [ ] Configurer .env.local
- [ ] Tester connexion Firebase

### 🔐 PHASE 2: Authentification Firebase Web (2-3h)
- [ ] Remplacer AuthContext par Firebase Auth
- [ ] Implémenter signUp avec profil Firestore
- [ ] Implémenter signIn
- [ ] Implémenter logout
- [ ] Tester auth bidirectionnelle (web/mobile)

### 👥 PHASE 3: Synchronisation Drivers (2-3h)
**Firestore Structure:**
```
drivers/
  {uid}/
    name: string
    email: string
    phone: string
    status: "online" | "offline"
    lastSeen: timestamp
    currentMission: string (missionId)
    latitude: number
    longitude: number
    lastLocationUpdate: timestamp
    createdAt: timestamp
    updatedAt: timestamp
```
- [ ] Créer firestoreService.ts pour web
- [ ] Créer driver listener en temps réel
- [ ] Créer dashboard drivers live
- [ ] Tester sync mobile → web

### 📋 PHASE 4: Système Missions (2-3h)
**Firestore Structure:**
```
missions/
  {missionId}/
    title: string
    description: string
    assignedTo: string (driverUid)
    status: "pending" | "in_progress" | "completed"
    priority: "low" | "medium" | "high"
    location: string
    createdAt: timestamp
    assignedAt: timestamp
    completedAt: timestamp (optional)
    notes: string[]
    createdBy: string (managerUid)
```
- [ ] Créer collection missions dans Firestore
- [ ] Créer formId pour créer missions
- [ ] Implémenter listener missions web
- [ ] Tester création missions

### 🎯 PHASE 5: Attribution Missions (1-2h)
- [ ] Créer bouton "Assigner" dashboard web
- [ ] Implémenter updateMission() avec assignedTo
- [ ] Tester assignation mission

### 📱 PHASE 6: Réception Missions Mobile (1-2h)
- [ ] Créer missions listener Flutter
- [ ] Créer écran "Missions" dans driver_home
- [ ] Afficher missions assignées en temps réel
- [ ] Ajouter bouton "Accepter" / "Refuser"
- [ ] Tester sync web → mobile

### 🗑️ PHASE 7: Suppression Mock Data (1h)
- [ ] Supprimer AuthContext mock
- [ ] Supprimer dataService mock
- [ ] Supprimer GPS simulator
- [ ] Supprimer hardcoded users

### ✅ PHASE 8: Tests Intégration (2-3h)
- [ ] Test: Créer driver sur mobile
- [ ] Test: Voir driver sur web
- [ ] Test: Assigner mission sur web
- [ ] Test: Recevoir mission sur mobile
- [ ] Test: Offline sync
- [ ] Test: Authentification bidirectionnelle

---

## 📁 FICHIERS À CRÉER/MODIFIER

### WEB (React)
```
Frontend/
├── src/
│   ├── lib/
│   │   ├── firebaseConfig.ts          ← NEW
│   │   └── firestoreService.ts        ← NEW
│   ├── context/
│   │   ├── AuthContext.tsx            ← MODIFY
│   │   └── MissionContext.tsx         ← NEW
│   ├── services/
│   │   ├── firestoreDriverService.ts  ← NEW
│   │   ├── firestoreMissionService.ts ← NEW
│   │   └── dataService.ts             ← DELETE
│   ├── screens/
│   │   ├── DriversLive.tsx            ← NEW
│   │   └── MissionsBoard.tsx          ← NEW
│   └── components/
│       ├── DriverCard.tsx             ← NEW (drivers live)
│       └── MissionForm.tsx            ← NEW
├── .env.local                         ← MODIFY
└── package.json                       ← MODIFY
```

### MOBILE (Flutter)
```
driver_mobile/lib/
├── screens/
│   ├── missions_screen.dart           ← NEW
│   └── driver_home.dart               ← MODIFY
├── services/
│   ├── missions_service.dart          ← NEW
│   └── firestore_service.dart         ← MODIFY
└── models/
    ├── mission_model.dart             ← NEW
    └── app_models.dart                ← MODIFY
```

---

## 🔄 FLUX DE DONNÉES

### 1. Authentification
```
WEB LOGIN
  ↓
Firebase Auth (createUser / signIn)
  ↓
Firestore: drivers/{uid} created with status="online"
  ↓
MOBILE LOGIN (same Firebase)
  ↓
Firestore: drivers/{uid} updated with status="online"
  ↓
✅ Deux utilisateurs authentifiés au même Firebase
```

### 2. Synchronisation Drivers
```
MOBILE
  ├─ Chauffeur se connecte
  ├─ AuthService.authStateChanges()
  ├─ Crée/met à jour drivers/{uid}
  │   ├─ status: "online"
  │   ├─ latitude, longitude
  │   └─ lastSeen: serverTimestamp
  └─ GPS Stream → updateDriverLocation() toutes les 5s

WEB (Dashboard DG)
  ├─ onAuthStateChanged() → chargé
  ├─ Écoute collection drivers (onSnapshot)
  │   ├─ Filter: status == "online"
  │   ├─ Affiche liste chauffeurs LIVE
  │   └─ Met à jour position GPS en temps réel
  └─ Montre sur carte
```

### 3. Attribution Missions
```
WEB DASHBOARD
  ├─ DG sélectionne driver
  ├─ DG crée mission
  ├─ Clique "Assigner"
  └─ createMission() → Firestore missions/
      ├─ title, description
      ├─ assignedTo: driverUid
      ├─ status: "pending"
      └─ createdAt: serverTimestamp

MOBILE
  ├─ MissionsService.listenToMyMissions(driverUid)
  ├─ onSnapshot(missions where assignedTo == uid)
  ├─ Affiche automatiquement nouvelles missions
  ├─ Chauffeur peut "Accepter" ou "Refuser"
  └─ Met à jour mission.status = "in_progress"
```

### 4. Suivi Missions
```
MOBILE
  ├─ Mission acceptée
  ├─ Chauffeur se déplace
  ├─ GPS met à jour position toutes les 5s
  └─ missions/{missionId}/status = "in_progress"

WEB
  ├─ Écoute missions en temps réel
  ├─ Affiche statut = "in_progress"
  ├─ Affiche position GPS en direct
  ├─ Montre progression mission
  └─ Notifications en temps réel
```

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Drivers: Visible à tous, modifiable par le driver lui-même
    match /drivers/{uid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == uid;
      allow delete: if request.auth.uid == uid;
    }
    
    // Missions: Visible à tous, créé par manager, modifié par driver assigné
    match /missions/{missionId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role == 'manager';
      allow update: if request.auth.uid == resource.data.assignedTo ||
                       request.auth.token.role == 'manager';
      allow delete: if request.auth.token.role == 'manager';
    }
  }
}
```

---

## 📊 Firestore Collections Structure

```
DRIVERS COLLECTION
drivers/
├── user_uid_1/
│   ├── name: "Jean Dupont"
│   ├── email: "jean@example.com"
│   ├── phone: "+33612345678"
│   ├── status: "online"
│   ├── latitude: 48.8566
│   ├── longitude: 2.3522
│   ├── lastLocationUpdate: 2026-04-29T14:30:00Z
│   ├── lastSeen: 2026-04-29T14:30:00Z
│   ├── currentMission: "mission_id_123"
│   ├── createdAt: 2026-04-20T10:00:00Z
│   └── updatedAt: 2026-04-29T14:30:00Z
└── user_uid_2/
    └── ...

MISSIONS COLLECTION
missions/
├── mission_id_123/
│   ├── title: "Livraison Niamey"
│   ├── description: "Livrer 50 cartons à l'entrepôt"
│   ├── priority: "high"
│   ├── location: "Niamey, Niger"
│   ├── assignedTo: "user_uid_1"
│   ├── status: "in_progress"
│   ├── createdAt: 2026-04-29T10:00:00Z
│   ├── assignedAt: 2026-04-29T10:05:00Z
│   ├── completedAt: null
│   ├── notes: ["Note 1", "Note 2"]
│   └── createdBy: "manager_uid_1"
└── mission_id_124/
    └── ...
```

---

## 🛠️ Installation Dépendances

### Web (React)
```bash
npm install firebase
```

### Mobile (Flutter) - Déjà installé
```bash
flutter pub get
# firebase_core, cloud_firestore, firebase_auth déjà présents
```

---

## 🎯 Success Criteria

✅ **Phase 1:** Firestore accessible depuis web  
✅ **Phase 2:** Utilisateur peut se connecter web avec même compte mobile  
✅ **Phase 3:** Dashboard web montre chauffeurs LIVE (position + statut)  
✅ **Phase 4:** Collections missions créées et structurées  
✅ **Phase 5:** DG peut assigner missions  
✅ **Phase 6:** Chauffeur reçoit missions en temps réel  
✅ **Phase 7:** Zéro mock data  
✅ **Phase 8:** Tests complets réussis  

---

## ⏱️ Timeline Estimée

| Phase | Tâches | Durée |
|-------|--------|-------|
| 1 | Config Firebase | 1-2h |
| 2 | Auth web | 2-3h |
| 3 | Sync drivers | 2-3h |
| 4 | Missions | 2-3h |
| 5 | Attribution | 1-2h |
| 6 | Réception | 1-2h |
| 7 | Cleanup | 1h |
| 8 | Tests | 2-3h |
| **TOTAL** | | **14-21h** |

---

## 📌 Commencer par

1. **Créer firebaseConfig.ts**
2. **Installer firebase npm**
3. **Implémenter Firebase Auth dans AuthContext**
4. **Créer firestoreService.ts**
5. **Tester sync drivers**

Prêt? 🚀
