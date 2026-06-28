# 🔧 GUIDE DE DÉPANNAGE AVANCÉ - Firebase Sync Issues

---

## ⚡ Guide Rapide des Erreurs Courantes

### Erreur: "Cannot find module 'firebase'"

**Symptôme:**
```
error: Cannot find module 'firebase'
```

**Cause:**
Firebase SDK non installé ou mal installé.

**Solution:**
```bash
# 1. Naviguer au répertoire Frontend
cd Frontend

# 2. Réinstaller complètement
rm -rf node_modules package-lock.json
npm install
npm install firebase

# 3. Vérifier
npm list firebase
# Doit afficher: firebase@10.7.1 ou supérieur

# 4. Relancer dev
npm run dev
```

---

### Erreur: "auth/invalid-api-key"

**Symptôme:**
```
Error: Cannot read property 'getAuth' of undefined
FirebaseError: [auth/configuration-not-found]
```

**Cause:**
Credentials Firebase incorrects dans `firebaseConfig.ts`.

**Solution:**
```bash
# 1. Vérifier firebaseConfig.ts existe
ls -la Frontend/src/lib/firebaseConfig.ts

# 2. Vérifier le contenu
# Doit avoir tous les credentials:
# - apiKey
# - projectId
# - authDomain
# - storageBucket
# - messagingSenderId
# - appId

# 3. Si vide, recréer le fichier avec les bonnes credentials
# Aller à: https://console.firebase.google.com
# Projet: geoconsulting-fleet
# Settings → Project Settings → copier config

# 4. Coller dans firebaseConfig.ts
```

---

### Erreur: "AuthContext_Firebase not found"

**Symptôme:**
```
error: Module not found: ./AuthContext_Firebase
```

**Cause:**
AuthContext n'a pas été remplacé correctement.

**Solution:**
```bash
# 1. Vérifier que les deux fichiers existent
ls -la Frontend/src/context/AuthContext*

# 2. Si AuthContext_Firebase.tsx n'existe pas:
# - C'est qu'il n'a pas été créé. À créer manuellement.

# 3. Si les deux existent:
# Renommer le Mock
mv Frontend/src/context/AuthContext.tsx \
   Frontend/src/context/AuthContext_Mock.tsx

# Renommer le Firebase en principal
mv Frontend/src/context/AuthContext_Firebase.tsx \
   Frontend/src/context/AuthContext.tsx

# 4. Vérifier main.tsx importe du bon fichier
grep "AuthContext" Frontend/src/main.tsx
# Doit être juste: ../context/AuthContext (pas _Firebase)
```

---

### Erreur: "No driver data in Firestore"

**Symptôme:**
Dashboard live affiche aucun driver même après connexion.

**Cause:**
Driver document non créé dans Firestore lors de l'inscription.

**Solution:**
```bash
# 1. Vérifier que AuthContext appelle createOrUpdateDriver
# Dans src/context/AuthContext.tsx:
# Chercher: firestoreDriverService.createOrUpdateDriver(uid, {
# S'il manque, ajouter dans la fonction signup

# 2. Vérifier Firestore Console
# https://console.firebase.google.com
# Projet: geoconsulting-fleet
# Firestore → Collection drivers
# Doit avoir au minimum une doc

# 3. Si vide, créer manuellement:
# Cliquer "Start Collection"
# Collection ID: drivers
# Document ID: <un uid utilisateur>
# Ajouter champs:
{
  "name": "Test User",
  "email": "test@example.com",
  "status": "online",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "lastLocationUpdate": timestamp,
  "createdAt": timestamp
}
```

---

### Erreur: "Missions not syncing between web and mobile"

**Symptôme:**
Créer mission sur web, ne pas recevoir sur mobile.

**Cause:**
Listeners Firestore non actifs ou permission insuffisante.

**Solution:**

```bash
# 1. Vérifier que missions_service.dart est créé (mobile)
ls -la "Flotte de vehicule/driver_mobile/lib/services/missions_service.dart"

# 2. Vérifier que le listener est appelé
# Dans missions_screen.dart:
# Chercher: StreamBuilder(
#   stream: MissionsService.instance.listenToMyMissions(uid)

# 3. Vérifier UID est correct
# Imprimer l'UID pour débugger:
print('Current UID: ${FirebaseAuth.instance.currentUser?.uid}');

# 4. Vérifier collection missions existe
# Firebase Console → Firestore → Collection missions
# Doit avoir au moins un document

# 5. Vérifier assignedTo correct
# Mission.assignedTo doit égaler le UID du chauffeur

# 6. Si mobile ne voit pas:
# Relancer flutter run
flutter run --verbose
```

---

### Erreur: "Permission denied reading drivers"

**Symptôme:**
```
Error: Missing or insufficient permissions
[permission-denied]
```

**Cause:**
Security Rules Firestore trop restrictives.

**Solution:**
```bash
# 1. Aller à Firebase Console
# https://console.firebase.google.com/u/0/project/geoconsulting-fleet/firestore/rules

# 2. Remplacer les règles par:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /drivers/{uid} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == uid;
    }
    
    match /missions/{missionId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role == 'manager';
      allow update: if request.auth.uid == resource.data.assignedTo;
    }
  }
}

# 3. Cliquer "Publish"

# 4. Attendre 30 secondes pour la propagation
```

---

### Erreur: "GPS permissions not granted"

**Symptôme:**
Mobile ne met pas à jour position GPS.

**Cause:**
Permissions Android/iOS non configurées.

**Solution:**

#### Android:
```bash
# 1. Ouvrir android/app/src/main/AndroidManifest.xml

# 2. Ajouter après </application>:
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

# 3. En app, demander permissions:
# location_service.dart appelle:
# await Geolocator.requestPermission()

# 4. Relancer
flutter run
```

#### iOS:
```bash
# 1. Ouvrir ios/Runner/Info.plist

# 2. Ajouter:
<key>NSLocationWhenInUseUsageDescription</key>
<string>Cette app a besoin de votre localisation</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Cette app a besoin de votre localisation en arrière-plan</string>

# 3. Relancer
flutter run
```

---

## 🔍 Debugging Avancé

### Web Debugging

#### Console Browser (F12)
```javascript
// Vérifier Firebase initialisé
console.log(firebase)
// Doit afficher objet Firebase

// Vérifier Auth
console.log(firebase.auth().currentUser)
// Doit afficher utilisateur connecté

// Vérifier Firestore
console.log(firebase.firestore())
// Doit afficher Firestore instance

// Écouter les changements
db.collection('drivers').onSnapshot(
  (snapshot) => console.log('Drivers:', snapshot.docs)
);
```

#### Network Tab
```
1. Ouvrir DevTools
2. Onglet Network
3. Chercher requêtes "firestore"
4. Vérifier 200 OK
5. Regarder la réponse JSON
```

### Mobile Debugging

#### Flutter Logs
```bash
# Lancer avec verbose
flutter run -v

# Filtrer logs Firebase
flutter logs | grep -i firebase
```

#### Logcat (Android)
```bash
# Afficher tous les logs
adb logcat

# Filtrer Firebase
adb logcat | grep -i firebase

# Filtrer app spécifique
adb logcat *:S | grep -i myapp
```

#### Console.log Mobile
```dart
// Dans Dart
print('User UID: ${user.uid}');
print('Location: ${latitude}, ${longitude}');

// Via debugger
debugPrint('Message de debug');
```

---

## 🧪 Troubleshooting Systematique

### 1. Vérifier Configuration Firebase

```bash
# Checklist:
- [ ] Credentials dans firebaseConfig.ts
- [ ] Authentication activée (Firebase Console)
- [ ] Firestore activée (Firebase Console)
- [ ] Collections créées (drivers, missions)
- [ ] Security Rules appliquées
```

### 2. Vérifier Web Application

```bash
# Checklist:
- [ ] npm install firebase exécuté
- [ ] npm run dev démarre
- [ ] Aucune erreur F12
- [ ] AuthContext utilise Firebase
- [ ] Services créés et importés
- [ ] Écrans créés et routés
```

### 3. Vérifier Mobile Application

```bash
# Checklist:
- [ ] flutter pub get exécuté
- [ ] flutter run démarre
- [ ] Aucune erreur compilation
- [ ] Services Firestore créés
- [ ] MissionsScreen créé
- [ ] Permissions configurées
```

### 4. Vérifier Synchronisation

```bash
# Test Simple:
1. Web: Créer utilisateur (Vérifier Firestore Console)
2. Web: Voir utilisateur dans Dashboard
3. Mobile: Se connecter → Voir utilisateur actif
4. Mobile: Créer mission → Vérifier Firestore
5. Web: Voir mission créée (sans refresh)
6. Mobile: Accepter mission
7. Web: Voir acceptation (sans refresh)
```

---

## 🚨 Problèmes Critiques

### Problème: Web et Mobile Complètement Désynchronisés

**Symptôme:**
- Web voit un état
- Mobile voit un autre état différent

**Diagnostic:**
```bash
# 1. Vérifier que MÊME Firestore utilisée
# Web: vérifier firebaseConfig.ts projectId
# Mobile: vérifier google-services.json projectId
# Doivent être identiques: "geoconsulting-fleet"

# 2. Vérifier que MÊME collections
# Web: use firestoreMissionService (missions/)
# Mobile: use MissionsService (missions/)
# Doivent être IDENTIQUES

# 3. Vérifier UID utilisateur
# Web: console.log(auth.currentUser.uid)
# Mobile: print(FirebaseAuth.instance.currentUser.uid)
# Doivent être IDENTIQUES
```

**Solution:**
```bash
# Vérifier firebaseConfig.ts et google-services.json
# Assurez-vous qu'ils pointent EXACTEMENT au même projet

# Si différents:
# 1. Décider du projet canonique
# 2. Mettre à jour l'autre
# 3. Relancer les deux applications
```

### Problème: Firestore Vide (Aucune Donnée)

**Symptôme:**
- Inscription/création mission réussit en app
- Mais Firestore est vide

**Diagnostic:**
```bash
# 1. Vérifier que Security Rules ne bloquent pas
# Firebase Console → Firestore → Rules
# Basculer temporairement à:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if true;
  }
}
# Si ça marche maintenant = Rules trop strictes

# 2. Vérifier que createDocument est appelé
# Web: vérifier firestoreService.setDocument()
# Mobile: vérifier MissionsService

# 3. Vérifier les erreurs silencieuses
# Web: ajouter .catch(err => console.error(err))
# Mobile: ajouter .catchError((err) => print(err))
```

---

## 📞 Checklist Avant de Demander Support

- [ ] Vérifier tous les fichiers créés existent
- [ ] Vérifier npm install firebase exécuté
- [ ] Vérifier flutter pub get exécuté
- [ ] Vérifier AuthContext remplacé
- [ ] Vérifier Firebase Console accessible
- [ ] Vérifier logs (F12 web, logcat mobile)
- [ ] Vérifier Firestore Console
- [ ] Vérifier Security Rules
- [ ] Vérifier internet connection
- [ ] Relancer app/browser complètement

---

## 🎯 Solutions Rapides

| Problème | Rapide Fix |
|----------|-----------|
| App ne démarre | npm install / flutter pub get |
| Pas de Firebase | Vérifier firebaseConfig.ts |
| Pas d'utilisateur | Vérifier AuthContext actif |
| Pas de synchronisation | Vérifier listeners actifs |
| Permission denied | Vérifier Security Rules |
| GPS non mis à jour | Vérifier permissions |
| UI gelée | Vérifier pas d'erreur async |

---

## 📊 Logs Utiles à Collecter

Avant de contacter support, collecter:

```
1. Web:
   - DevTools Console (F12)
   - Network tab (Firestore requests)
   - Screenshot de l'erreur

2. Mobile:
   - flutter run -v output (copier 50 dernières lignes)
   - logcat output si Android
   - Console logs si iOS

3. Firebase:
   - Screenshot Firestore Collections
   - Screenshot Security Rules
   - Logs des Activity de la console

4. Informations:
   - npm list firebase
   - flutter --version
   - Dates/heures des erreurs
   - Steps to reproduce
```

---

## 🚀 Recovery Strategies

### Si Tout Est Cassé

```bash
# 1. Nettoyer web
cd Frontend
rm -rf node_modules package-lock.json .next
npm install
npm install firebase

# 2. Nettoyer mobile
cd "Flotte de vehicule/driver_mobile"
flutter clean
flutter pub get

# 3. Vérifier fichiers principaux
# Web: src/lib/firebaseConfig.ts
# Web: src/context/AuthContext.tsx
# Mobile: lib/services/missions_service.dart

# 4. Relancer
# Web: npm run dev
# Mobile: flutter run

# 5. Tester inscription simple
```

### Si Firestore Cassée

```bash
# 1. Aller Firebase Console
# Firestore → Onglet Collections
# Pour chaque collection:
#   - Supprimer (Delete Collection)
#   - Recréer manuellement avec bonne structure

# 2. Re-tester inscription (crée collections automatiquement)

# 3. Si trop cassé:
#   - Supprimer tout le projet
#   - Recréer nouveau projet
#   - Mettre à jour credentials everywhere
```

---

## 📝 Notes Supplémentaires

```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Besoin d'aide immédiate?**
1. Relire cette page
2. Vérifier COMPLETE_INTEGRATION_GUIDE.md
3. Vérifier Firebase Console
4. Relancer complètement l'app

**Bon courage!** 🚀
