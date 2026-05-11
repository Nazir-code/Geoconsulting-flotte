import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart';

class NewLocationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  StreamSubscription<Position>? _positionStreamSubscription;

  /// Vérifie et demande les permissions GPS
  Future<bool> checkPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Teste si les services de localisation sont activés.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Démarre le tracking et met à jour Firestore
  /// onPositionChanged est appelé à chaque nouvelle position pour mettre à jour la carte
  void startRealtimeTracking({
    required String uid, 
    required Function(Position) onPositionChanged
  }) {
    // Annuler l'ancien stream s'il existe
    _positionStreamSubscription?.cancel();

    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Mise à jour tous les 10 mètres
    );

    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position position) {
      // 1. Mise à jour Firestore (update pour préserver les autres champs)
      _firestore.collection('drivers').doc(uid).update({
        'latitude': position.latitude,
        'longitude': position.longitude,
        'lastLocationUpdate': FieldValue.serverTimestamp(),
      }).catchError((e) => print("Erreur Sync Firestore: $e"));

      // 2. Callback pour l'UI
      onPositionChanged(position);
    });
  }

  /// Arrête le tracking
  void stopTracking() {
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
  }

  bool get isTrackingActive => _positionStreamSubscription != null;
}
