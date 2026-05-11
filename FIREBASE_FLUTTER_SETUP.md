# 🔥 Configuration Firebase pour Flutter - Driver Mobile

## Vue d'ensemble

Firebase a été intégré dans l'application Flutter `driver_mobile` avec les fonctionnalités suivantes :

✅ **Firestore** - Base de données temps réel pour les véhicules et missions  
✅ **Firebase Auth** - Authentification des chauffeurs  
✅ **Synchronisation en temps réel** - Position des véhicules et statut des missions  

---

## 🚀 Étapes de Configuration

### Étape 1 : Créer un projet Firebase

1. Allez à [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Créer un projet"**
3. Entrez le nom : `fleetnexus-driver` (ou votre choix)
4. Cliquez sur **Créer**

### Étape 2 : Activer Firestore

1. Dans la console Firebase, allez à **Créer → Firestore Database**
2. Cliquez sur **Créer une base de données**
3. Sélectionnez la région : **europe-west1** (ou la plus proche)
4. Commencez en **mode test** (pour développement)
5. Cliquez sur **Créer**

### Étape 3 : Configurer les plateformes (Android, iOS)

#### Pour Android :

1. Dans Firebase Console, cliquez sur **Paramètres du projet** (⚙️)
2. Allez à l'onglet **Vos apps**
3. Cliquez sur **Ajouter une app** → **Android**
4. Entrez le nom du package : `com.novatech.driver_mobile`
5. Téléchargez le fichier `google-services.json`
6. Placez-le dans : `android/app/google-services.json`

#### Pour iOS :

1. Cliquez sur **Ajouter une app** → **iOS**
2. Entrez l'ID du bundle : `com.novatech.driverMobile`
3. Téléchargez le fichier `GoogleService-Info.plist`
4. Placez-le dans : `ios/Runner/GoogleService-Info.plist`
5. Ouvrez Xcode et ajoutez le fichier au projet

### Étape 4 : Configurer les identifiants Firebase

Mettez à jour `lib/firebase_options.dart` avec vos données Firebase :

```dart
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'YOUR_ANDROID_API_KEY',
  appId: 'YOUR_ANDROID_APP_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'YOUR_PROJECT_ID',
  databaseURL: 'https://YOUR_PROJECT_ID.firebaseio.com',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
);
```

### Étape 5 : Installer les dépendances

```bash
cd driver_mobile
flutter pub get
```

---

## 📱 Utilisation dans l'Application

### Exemple : Obtenir les véhicules en temps réel

```dart
import 'services/firebase_service.dart';

final firebaseService = FirebaseService();

// Écouter les véhicules en temps réel
firebaseService.getVehiclesStream().listen((snapshot) {
  final vehicles = snapshot.docs;
  for (var doc in vehicles) {
    print('Véhicule: ${doc['name']} - Position: ${doc['latitude']}, ${doc['longitude']}');
  }
});
```

### Exemple : Mettre à jour la position du véhicule

```dart
await firebaseService.updateVehiclePosition(
  vehicleId: 'vehicle_123',
  latitude: 48.8566,
  longitude: 2.3522,
);
```

### Exemple : Obtenir les missions du chauffeur

```dart
final driverId = 'driver_456';

firebaseService.getMissionsStream(driverId: driverId).listen((snapshot) {
  final missions = snapshot.docs;
  for (var doc in missions) {
    print('Mission: ${doc['title']} - Statut: ${doc['status']}');
  }
});
```

### Exemple : Mettre à jour le statut d'une mission

```dart
await firebaseService.updateMissionStatus(
  missionId: 'mission_789',
  status: 'in_progress',
);
```

---

## 🔐 Règles de Sécurité Firestore

Pour la production, configurez les règles de sécurité. Allez à **Firestore → Règles** et remplacez par :

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentification requise
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.driverId;
    }
    
    match /missions/{missionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.driverId;
    }
    
    match /drivers/{driverId} {
      allow read: if request.auth != null && request.auth.uid == driverId;
      allow write: if request.auth != null && request.auth.uid == driverId;
    }
  }
}
```

---

## 📂 Structure Firestore

### Collections

```
firestore/
├── vehicles/
│   └── {vehicleId}
│       ├── name: string
│       ├── latitude: double
│       ├── longitude: double
│       ├── status: string
│       └── lastUpdate: timestamp
│
├── missions/
│   └── {missionId}
│       ├── title: string
│       ├── driverId: string
│       ├── status: string (pending|in_progress|completed)
│       ├── startLocation: object
│       ├── endLocation: object
│       └── updatedAt: timestamp
│
└── drivers/
    └── {driverId}
        ├── name: string
        ├── email: string
        ├── phone: string
        ├── status: string
        └── updatedAt: timestamp
```

---

## 🧪 Test de Connexion

Pour vérifier que Firebase fonctionne correctement :

```dart
import 'services/firebase_service.dart';

final firebaseService = FirebaseService();

// Test 1 : Vérifier la connexion
print('Utilisateur connecté: ${firebaseService.isUserLoggedIn()}');

// Test 2 : Obtenir un véhicule
try {
  final doc = await firebaseService.getVehicle('test_vehicle');
  if (doc.exists) {
    print('Véhicule trouvé: ${doc.data()}');
  }
} catch (e) {
  print('Erreur: $e');
}
```

---

## ⚠️ Dépannage

| Problème | Solution |
|----------|----------|
| Erreur "Missing google-services.json" | Téléchargez le fichier depuis Firebase Console et placez-le dans `android/app/` |
| Erreur "Permission denied" | Vérifiez les règles Firestore ou utilisez le mode test |
| Erreur "Project not found" | Vérifiez l'ID du projet dans `firebase_options.dart` |
| Pas de synchronisation temps réel | Vérifiez la connexion internet et les règles Firestore |

---

## 📞 Support

Pour plus d'aide :
- [Documentation Firebase pour Flutter](https://firebase.flutter.dev/)
- [Console Firebase](https://console.firebase.google.com/)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
