# 📚 Référence API Complète - Services FleetNexus Driver

## 🔐 AuthService (lib/services/auth_service.dart)

### Singleton Pattern
```dart
final authService = AuthService(); // Accès unique à l'instance
```

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `currentUser` | `User?` | L'utilisateur Firebase actuellement connecté |
| `currentUserId` | `String?` | L'UID unique de l'utilisateur connecté |
| `auth` | `FirebaseAuth` | Accès direct à l'instance FirebaseAuth |

### Méthodes

#### 1. Connexion
```dart
Future<UserCredential> signInWithEmailAndPassword({
  required String email,
  required String password,
})
```
**Description:** Connecte un utilisateur existant  
**Paramètres:**
- `email`: Email du chauffeur
- `password`: Mot de passe

**Retour:** `UserCredential` contenant les infos utilisateur  
**Exceptions:** `FirebaseAuthException` avec message d'erreur localisé

**Exemple:**
```dart
try {
  final userCredential = await authService.signInWithEmailAndPassword(
    email: 'chauffeur@email.com',
    password: 'securePassword123',
  );
  print('Connecté: ${userCredential.user?.email}');
} catch (e) {
  print('Erreur: $e');
}
```

---

#### 2. Inscription
```dart
Future<UserCredential> signUpWithEmailAndPassword({
  required String email,
  required String password,
})
```
**Description:** Crée un nouveau compte utilisateur  
**Paramètres:**
- `email`: Email du nouveau chauffeur
- `password`: Mot de passe (minimum 6 caractères)

**Retour:** `UserCredential` du nouvel utilisateur  
**Exceptions:** `FirebaseAuthException` si email existe déjà ou mot de passe faible

**Exemple:**
```dart
try {
  final userCredential = await authService.signUpWithEmailAndPassword(
    email: 'nouveau@email.com',
    password: 'Password123',
  );
  final uid = userCredential.user!.uid;
} catch (e) {
  print('Erreur inscription: $e');
}
```

---

#### 3. Déconnexion
```dart
Future<void> signOut()
```
**Description:** Déconnecte l'utilisateur actuellement connecté  
**Paramètres:** Aucun  
**Retour:** `void`

**Exemple:**
```dart
await authService.signOut();
// L'utilisateur est déconnecté
```

---

#### 4. Vérifier Connexion
```dart
bool isUserLoggedIn()
```
**Description:** Vérifie si un utilisateur est actuellement connecté  
**Paramètres:** Aucun  
**Retour:** `true` si connecté, `false` sinon

**Exemple:**
```dart
if (authService.isUserLoggedIn()) {
  print('Utilisateur connecté');
} else {
  print('Utilisateur déconnecté');
}
```

---

#### 5. Reset de Mot de Passe
```dart
Future<void> sendPasswordResetEmail(String email)
```
**Description:** Envoie un email de réinitialisation de mot de passe  
**Paramètres:**
- `email`: Email de l'utilisateur

**Retour:** `void`  
**Exceptions:** `FirebaseAuthException` si email n'existe pas

**Exemple:**
```dart
try {
  await authService.sendPasswordResetEmail('chauffeur@email.com');
  print('Email de reset envoyé');
} catch (e) {
  print('Erreur: $e');
}
```

---

#### 6. Mettre à Jour le Mot de Passe
```dart
Future<void> updatePassword(String newPassword)
```
**Description:** Changeе le mot de passe de l'utilisateur connecté  
**Paramètres:**
- `newPassword`: Nouveau mot de passe

**Retour:** `void`  
**Exceptions:** `FirebaseAuthException`

**Exemple:**
```dart
try {
  await authService.updatePassword('NewPassword123');
  print('Mot de passe mis à jour');
} catch (e) {
  print('Erreur: $e');
}
```

---

#### 7. Stream d'Authentification
```dart
Stream<User?> get authStateChanges
```
**Description:** Écoute les changements d'état d'authentification  
**Retour:** `Stream<User?>` où `null` = déconnecté

**Exemple:**
```dart
authService.authStateChanges.listen((user) {
  if (user != null) {
    print('Utilisateur connecté: ${user.uid}');
  } else {
    print('Utilisateur déconnecté');
  }
});
```

---

### Messages d'Erreur Firebase

| Code | Message |
|------|---------|
| `user-not-found` | Aucun utilisateur trouvé avec cet email. |
| `wrong-password` | Mot de passe incorrect. |
| `invalid-email` | Format d'email invalide. |
| `user-disabled` | Ce compte a été désactivé. |
| `too-many-requests` | Trop de tentatives. Réessayez plus tard. |
| `email-already-in-use` | Cet email est déjà utilisé. |
| `weak-password` | Le mot de passe est trop faible (min 6 caractères). |
| `network-request-failed` | Erreur de connexion réseau. |

---

## 👤 FirestoreService (lib/services/firestore_service.dart)

### Structure DriverProfile
```dart
class DriverProfile {
  final String uid;
  final String name;
  final String email;
  final String driverId;
  final DateTime createdAt;
  final double? latitude;
  final double? longitude;
  final DateTime? lastLocationUpdate;
}
```

### Singleton Pattern
```dart
final firestoreService = FirestoreService();
```

### Constantes
```dart
static const String driversCollection = 'drivers';
```

### Méthodes

#### 1. Créer un Profil
```dart
Future<void> createDriverProfile({
  required String uid,
  required String email,
  required String name,
  String? driverId,
})
```
**Description:** Crée un nouveau document chauffeur dans Firestore  
**Paramètres:**
- `uid`: UID Firebase
- `email`: Email du chauffeur
- `name`: Nom complet
- `driverId`: (Optionnel) ID personnalisé, par défaut = uid

**Retour:** `void`  
**Exceptions:** `Exception` si erreur Firestore

**Exemple:**
```dart
await firestoreService.createDriverProfile(
  uid: 'user-uid-123',
  email: 'jean@example.com',
  name: 'Jean Dupont',
  driverId: 'DRIVER-001',
);
```

---

#### 2. Récupérer le Profil
```dart
Future<DriverProfile?> getDriverProfile(String uid)
```
**Description:** Récupère le profil d'un chauffeur par son UID  
**Paramètres:**
- `uid`: UID Firebase

**Retour:** `DriverProfile?` ou `null` si non trouvé  
**Exceptions:** `Exception` si erreur Firestore

**Exemple:**
```dart
final profile = await firestoreService.getDriverProfile('user-uid');
if (profile != null) {
  print('Chauffeur: ${profile.name}');
} else {
  print('Profil non trouvé');
}
```

---

#### 3. Écouter le Profil en Temps Réel
```dart
Stream<DriverProfile?> getDriverProfileStream(String uid)
```
**Description:** Stream pour écouter les changements du profil en temps réel  
**Paramètres:**
- `uid`: UID Firebase

**Retour:** `Stream<DriverProfile?>`

**Exemple:**
```dart
firestoreService.getDriverProfileStream(uid).listen((profile) {
  if (profile != null) {
    print('Profil mis à jour: ${profile.name}');
    print('Position: ${profile.latitude}, ${profile.longitude}');
  }
});
```

---

#### 4. Mettre à Jour la Position GPS
```dart
Future<void> updateDriverLocation({
  required String uid,
  required double latitude,
  required double longitude,
})
```
**Description:** Met à jour la position GPS du chauffeur  
**Paramètres:**
- `uid`: UID Firebase
- `latitude`: Latitude GPS
- `longitude`: Longitude GPS

**Retour:** `void`  
**Exceptions:** `Exception` si erreur

**Exemple:**
```dart
await firestoreService.updateDriverLocation(
  uid: 'user-uid',
  latitude: 48.8566,
  longitude: 2.3522,
);
```

---

#### 5. Mettre à Jour le Nom
```dart
Future<void> updateDriverName({
  required String uid,
  required String name,
})
```
**Description:** Change le nom du chauffeur  
**Paramètres:**
- `uid`: UID Firebase
- `name`: Nouveau nom

**Retour:** `void`

**Exemple:**
```dart
await firestoreService.updateDriverName(
  uid: 'user-uid',
  name: 'Jean-Pierre Dupont',
);
```

---

#### 6. Supprimer le Profil
```dart
Future<void> deleteDriverProfile(String uid)
```
**Description:** Supprime le profil d'un chauffeur  
**Paramètres:**
- `uid`: UID Firebase

**Retour:** `void`

**⚠️ ATTENTION:** Cette opération est irréversible!

---

#### 7. Récupérer Tous les Chauffeurs
```dart
Future<List<DriverProfile>> getAllDrivers()
```
**Description:** Récupère la liste de tous les chauffeurs (pour admin)  
**Paramètres:** Aucun  
**Retour:** `List<DriverProfile>`

**Exemple:**
```dart
final allDrivers = await firestoreService.getAllDrivers();
for (var driver in allDrivers) {
  print('${driver.name}: ${driver.latitude}, ${driver.longitude}');
}
```

---

#### 8. Stream de Tous les Chauffeurs
```dart
Stream<List<DriverProfile>> getAllDriversStream()
```
**Description:** Écoute la liste de tous les chauffeurs en temps réel  
**Retour:** `Stream<List<DriverProfile>>`

**Exemple:**
```dart
firestoreService.getAllDriversStream().listen((drivers) {
  print('${drivers.length} chauffeurs actifs');
});
```

---

#### 9. Vérifier l'Existence du Profil
```dart
Future<bool> driverProfileExists(String uid)
```
**Description:** Vérifie si un profil existe  
**Paramètres:**
- `uid`: UID Firebase

**Retour:** `true` si existe, `false` sinon

**Exemple:**
```dart
final exists = await firestoreService.driverProfileExists(uid);
if (!exists) {
  // Créer le profil
}
```

---

### Structure Firestore

```json
{
  "drivers": {
    "{uid}": {
      "uid": "firebase-uid",
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "driverId": "DRIVER-001",
      "createdAt": "2026-04-29T10:30:00Z",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "lastLocationUpdate": "2026-04-29T14:45:30Z"
    }
  }
}
```

---

## 📡 LocationService (lib/services/location_service.dart)

### Singleton Pattern
```dart
final locationService = LocationService();
```

### Méthodes

#### 1. Demander les Permissions
```dart
Future<bool> requestLocationPermission()
```
**Description:** Demande les permissions de localisation à l'utilisateur  
**Retour:** `true` si acceptées, `false` sinon  
**Exceptions:** `Exception` si erreur

**Exemple:**
```dart
final granted = await locationService.requestLocationPermission();
if (granted) {
  print('Permissions accordées');
} else {
  print('Permissions refusées');
}
```

---

#### 2. Vérifier les Permissions
```dart
Future<bool> hasLocationPermission()
```
**Description:** Vérifie si les permissions sont déjà accordées  
**Retour:** `true` si accordées, `false` sinon

**Exemple:**
```dart
final hasPermission = await locationService.hasLocationPermission();
```

---

#### 3. Vérifier Service de Localisation
```dart
Future<bool> isLocationServiceEnabled()
```
**Description:** Vérifie si le service de localisation est activé sur l'appareil  
**Retour:** `true` si activé, `false` sinon

**Exemple:**
```dart
if (!await locationService.isLocationServiceEnabled()) {
  // Proposer à l'utilisateur d'activer la localisation
}
```

---

#### 4. Position Actuelle
```dart
Future<Position> getCurrentLocation({int timeLimit = 10})
```
**Description:** Récupère la position GPS actuelle  
**Paramètres:**
- `timeLimit`: Temps maximum d'attente en secondes (défaut: 10s)

**Retour:** `Position` avec latitude et longitude  
**Exceptions:** `Exception` si erreur ou permissions refusées

**Exemple:**
```dart
try {
  final position = await locationService.getCurrentLocation();
  print('Latitude: ${position.latitude}');
  print('Longitude: ${position.longitude}');
  print('Précision: ${position.accuracy}m');
} catch (e) {
  print('Erreur: $e');
}
```

---

#### 5. Démarrer le Tracking GPS
```dart
Stream<Position> startLocationTracking({
  required String uid,
  int intervalSeconds = 5,
})
```
**Description:** Lance le streaming continu des positions GPS et met à jour Firestore  
**Paramètres:**
- `uid`: UID Firebase pour mise à jour Firestore
- `intervalSeconds`: Intervalle entre les mises à jour (défaut: 5s)

**Retour:** `Stream<Position>` continu  
**Exceptions:** `Exception` si erreur GPS

**Exemple:**
```dart
final subscription = locationService.startLocationTracking(
  uid: currentUserUid,
  intervalSeconds: 5,
).listen(
  (position) {
    print('Position mise à jour: ${position.latitude}, ${position.longitude}');
    // Firestore est mis à jour automatiquement!
  },
  onError: (error) {
    print('Erreur GPS: $error');
  },
);

// Plus tard, arrêter le tracking:
subscription.cancel();
```

---

#### 6. Arrêter le Tracking
```dart
Future<void> stopLocationTracking()
```
**Description:** Arrête le tracking GPS  
**Note:** Il est préférable d'utiliser `subscription.cancel()`

**Exemple:**
```dart
await locationService.stopLocationTracking();
```

---

#### 7. Calculer Distance
```dart
double calculateDistance(
  double lat1,
  double lon1,
  double lat2,
  double lon2,
)
```
**Description:** Calcule la distance entre deux points GPS en mètres  
**Paramètres:**
- `lat1`, `lon1`: Coordonnées point 1
- `lat2`, `lon2`: Coordonnées point 2

**Retour:** Distance en mètres (double)

**Exemple:**
```dart
final distance = locationService.calculateDistance(
  48.8566, 2.3522,  // Paris
  51.5074, -0.1278, // Londres
);
print('Distance: ${(distance / 1000).toStringAsFixed(1)} km');
```

---

#### 8. Ouvrir Paramètres
```dart
Future<bool> openLocationSettings()
```
**Description:** Ouvre les paramètres de localisation du système  
**Retour:** `true` si ouverture réussie

**Exemple:**
```dart
await locationService.openLocationSettings();
```

---

### Classe Position (geolocator)
```dart
class Position {
  final double latitude;     // Latitude GPS
  final double longitude;    // Longitude GPS
  final double altitude;     // Altitude en mètres
  final double accuracy;     // Précision en mètres
  final double heading;      // Direction (0-360°)
  final double speed;        // Vitesse en m/s
}
```

---

## 📱 DriverProfile (Modèle de Données)

### Propriétés
```dart
final String uid;                    // UID Firebase (unique)
final String name;                   // Nom du chauffeur
final String email;                  // Email
final String driverId;               // ID personnalisé
final DateTime createdAt;            // Date de création
final double? latitude;              // Latitude GPS (nullable)
final double? longitude;             // Longitude GPS (nullable)
final DateTime? lastLocationUpdate;  // Dernière mise à jour GPS
```

### Méthodes

#### Copier avec Modifications
```dart
DriverProfile copyWith({
  String? uid,
  String? name,
  String? email,
  String? driverId,
  DateTime? createdAt,
  double? latitude,
  double? longitude,
  DateTime? lastLocationUpdate,
})
```

**Exemple:**
```dart
final updatedProfile = profile.copyWith(
  latitude: 48.9,
  longitude: 2.4,
);
```

---

#### Convertir en Map (Firestore)
```dart
Map<String, dynamic> toMap()
```

#### Créer depuis Map (Firestore)
```dart
factory DriverProfile.fromMap(Map<String, dynamic> map)
```

---

## 🎯 Patterns Courants

### Pattern 1: Inscription et Création Profil
```dart
// 1. Créer le compte Firebase
final userCredential = await authService.signUpWithEmailAndPassword(
  email: email,
  password: password,
);

// 2. Créer le profil Firestore
await firestoreService.createDriverProfile(
  uid: userCredential.user!.uid,
  email: email,
  name: name,
);
```

### Pattern 2: Connexion et Chargement Profil
```dart
// 1. Connexion
await authService.signInWithEmailAndPassword(
  email: email,
  password: password,
);

// 2. Charger le profil
final profile = await firestoreService.getDriverProfile(
  authService.currentUserId!,
);
```

### Pattern 3: Tracking GPS Continu
```dart
// 1. Vérifier permissions
if (!await locationService.hasLocationPermission()) {
  await locationService.requestLocationPermission();
}

// 2. Lancer le tracking
final subscription = locationService.startLocationTracking(
  uid: authService.currentUserId!,
  intervalSeconds: 5,
).listen(
  (position) => print('Nouvelle position'),
  onError: (error) => print('Erreur: $error'),
);

// 3. Plus tard, arrêter
subscription.cancel();
```

### Pattern 4: Écouter les Changements en Temps Réel
```dart
firestoreService.getDriverProfileStream(uid).listen((profile) {
  setState(() {
    _profile = profile;
  });
});
```

---

## ⚠️ Gestion d'Erreurs

### Try-Catch Recommandé
```dart
try {
  // Code Firebase
} on FirebaseAuthException catch (e) {
  // Erreur authentification
  print(e.message);
} on FirebaseException catch (e) {
  // Erreur Firebase générale
  print(e.message);
} catch (e) {
  // Erreur inconnue
  print(e);
}
```

---

**Version:** 1.0  
**Date:** 2026-04-29  
**Status:** ✅ Complet
