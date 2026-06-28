import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'firestore_service.dart';

class LocationService {
  final FirestoreService _firestoreService = FirestoreService();
  StreamSubscription<Position>? _positionStreamSubscription;

  /// Demande les permissions et commence le tracking GPS.
  /// Met à jour Firestore toutes les 5 secondes ou tous les 5 mètres.
  /// Champs écrits : latitude, longitude, lastLocationUpdate (alignés sur le web)
  Future<void> startTracking(String uid) async {
    bool serviceEnabled;
    LocationPermission permission;

    // 1. Vérifier si le service GPS est activé
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return Future.error('Le GPS est désactivé.');

    // 2. Gérer les permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Permissions GPS refusées.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error('Permissions GPS refusées définitivement.');
    }

    // 3. Configurer le flux de position
    // distanceFilter = 5 : mise à jour tous les 5 mètres de déplacement
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5,
    );

    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        // Envoyer la position à Firestore avec les bons noms de champs
        _firestoreService.updateLocation(
          uid: uid,
          latitude: position.latitude,
          longitude: position.longitude,
        );
      },
      onError: (e) => print("Erreur Flux GPS: $e"),
    );
  }

  /// Arrête le tracking GPS
  void stopTracking() {
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
  }

  /// Vérifie si le tracking est actif
  bool get isTracking => _positionStreamSubscription != null;
}
