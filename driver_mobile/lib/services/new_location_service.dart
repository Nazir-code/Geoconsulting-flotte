import 'dart:async';
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// Service GPS singleton — une seule instance par session.
///
/// Responsabilités :
///   • Lire le GPS hardware via Geolocator
///   • Écrire latitude / longitude / lastLocationUpdate dans Firestore
///   • Diffuser les positions via positionStream aux écrans UI
///
/// Ne gère PAS :
///   • Le champ 'status' → délégué à PresenceService
///   • Le démarrage / arrêt automatique → délégué à GpsLifecycleManager
class NewLocationService {
  static final NewLocationService _instance = NewLocationService._internal();
  factory NewLocationService() => _instance;
  NewLocationService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  StreamSubscription<Position>? _positionStreamSubscription;

  // Stream broadcast : les écrans UI s'y abonnent librement
  final StreamController<Position> _positionController =
      StreamController<Position>.broadcast();

  Stream<Position> get positionStream => _positionController.stream;

  // Dernière position connue — disponible immédiatement pour les nouveaux écrans
  Position? get lastKnownPosition => _lastWrittenPosition;

  // État du debounce intelligent
  DateTime? _lastFirestoreUpdateTime;
  Position? _lastWrittenPosition;
  DateTime? _lastHistoryTime;
  Position? _lastHistoryPosition;

  bool get isTrackingActive => _positionStreamSubscription != null;

  // ── Permissions ───────────────────────────────────────────────────────────────

  Future<bool> checkPermissions() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;
    return true;
  }

  // ── Tracking ──────────────────────────────────────────────────────────────────

  void startRealtimeTracking({required String uid}) {
    // Protection anti double-stream : aucune duplication possible
    if (_positionStreamSubscription != null) {
      debugPrint(
        '[GPS] Stream déjà actif uid=${uid.substring(0, 8)}... — appel ignoré',
      );
      return;
    }

    debugPrint('[GPS] Démarrage tracking uid=${uid.substring(0, 8)}...');

    final LocationSettings locationSettings = Platform.isIOS
        ? AppleSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5,
            activityType: ActivityType.automotiveNavigation,
            pauseLocationUpdatesAutomatically: false,
            showBackgroundLocationIndicator: true,
          )
        : AndroidSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5,
            intervalDuration: const Duration(seconds: 3),
            foregroundNotificationConfig: const ForegroundNotificationConfig(
              notificationText: "Suivi de mission en cours",
              notificationTitle: "FleetNexus",
              enableWakeLock: true,
            ),
          );

    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) => _onPositionReceived(uid, position),
      onError: (e) => debugPrint('[GPS] Erreur stream: $e'),
    );
  }

  void stopTracking() {
    if (_positionStreamSubscription == null) return;
    debugPrint('[GPS] Tracking stoppé');
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    _lastFirestoreUpdateTime = null;
    _lastWrittenPosition = null;
  }

  /// Suspend le stream sans réinitialiser _lastWrittenPosition.
  /// Permet une reprise avec continuité (pas de saut de position).
  void pauseTracking() {
    debugPrint('[GPS] Tracking mis en pause');
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    // _lastWrittenPosition intentionnellement conservé pour continuité à la reprise
  }

  // ── Logique interne ───────────────────────────────────────────────────────────

  void _onPositionReceived(String uid, Position position) {
    // 1. Diffuser immédiatement aux abonnés UI (carte mobile — aucun délai)
    if (!_positionController.isClosed) {
      _positionController.add(position);
    }

    // 2. Écriture Firestore conditionnelle (debounce intelligent)
    final now = DateTime.now();
    if (_shouldWriteToFirestore(position, now)) {
      _lastFirestoreUpdateTime = now;
      _lastWrittenPosition = position;
      _writeGpsToFirestore(uid, position);
      _writeHistoryIfNeeded(uid, position, now);
    }
  }

  /// Algorithme de décision d'écriture Firestore :
  ///   • 1ère position → toujours écrire
  ///   • Déplacement ≥ 10m → écrire (mouvement significatif)
  ///   • Déplacement ≥ 2m ET ≥ 5s écoulées → écrire (mouvement lent)
  ///   • Déplacement < 2m → ignorer (bruit GPS filtré)
  bool _shouldWriteToFirestore(Position position, DateTime now) {
    if (_lastFirestoreUpdateTime == null || _lastWrittenPosition == null) {
      return true;
    }

    final timeDeltaSec = now.difference(_lastFirestoreUpdateTime!).inSeconds;
    final distanceM = Geolocator.distanceBetween(
      _lastWrittenPosition!.latitude,
      _lastWrittenPosition!.longitude,
      position.latitude,
      position.longitude,
    );

    if (distanceM >= 10) return true;
    if (distanceM >= 2 && timeDeltaSec >= 5) return true;
    return false;
  }

  void _writeGpsToFirestore(String uid, Position position) {
    debugPrint(
      '[GPS_WRITE] lat=${position.latitude.toStringAsFixed(6)} '
      'lng=${position.longitude.toStringAsFixed(6)} '
      'acc=${position.accuracy.toStringAsFixed(1)}m',
    );

    // IMPORTANT : champ 'status' intentionnellement absent.
    // La présence est gérée exclusivement par PresenceService.
    _firestore.collection('drivers').doc(uid).update({
      'latitude': position.latitude,
      'longitude': position.longitude,
      'lastLocationUpdate': FieldValue.serverTimestamp(),
      'lastSeen': FieldValue.serverTimestamp(),
    }).catchError((e) => debugPrint('[GPS_WRITE_ERROR] $e'));
  }

  void _writeHistoryIfNeeded(String uid, Position position, DateTime now) {
    bool shouldLog = false;

    if (_lastHistoryTime == null || _lastHistoryPosition == null) {
      shouldLog = true;
    } else {
      final distance = Geolocator.distanceBetween(
        _lastHistoryPosition!.latitude,
        _lastHistoryPosition!.longitude,
        position.latitude,
        position.longitude,
      );
      if (now.difference(_lastHistoryTime!).inMinutes >= 2 || distance >= 200) {
        shouldLog = true;
      }
    }

    if (shouldLog) {
      _lastHistoryTime = now;
      _lastHistoryPosition = position;
      _addHistoryDoc(uid, {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'timestamp': FieldValue.serverTimestamp(),
        'speed': position.speed,
      });
    }
  }

  // Wrapper async pour add() — évite le conflit de type avec catchError
  Future<void> _addHistoryDoc(String uid, Map<String, dynamic> data) async {
    try {
      await _firestore
          .collection('drivers')
          .doc(uid)
          .collection('location_history')
          .add(data);
    } catch (e) {
      debugPrint('[GPS_HISTORY_ERROR] $e');
    }
  }
}
