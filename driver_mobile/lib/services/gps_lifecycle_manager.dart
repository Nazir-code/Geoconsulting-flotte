import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/widgets.dart';
import 'new_location_service.dart';
import 'presence_service.dart';

/// Orchestrateur central du cycle de vie GPS — singleton global.
///
/// Contrôle le démarrage / arrêt de NewLocationService en fonction de :
///   • La présence du chauffeur (online / offline — toggle manuel)
///   • L'existence d'une mission active (pending / in_progress)
///   • Le cycle de vie de l'application (foreground / background)
///
/// Séparation des responsabilités :
///   • Ce service NE fait PAS d'écritures Firestore directes.
///   • PresenceService gère status.
///   • NewLocationService gère latitude / longitude.
class GpsLifecycleManager with WidgetsBindingObserver {
  static final GpsLifecycleManager _instance = GpsLifecycleManager._internal();
  factory GpsLifecycleManager() => _instance;
  GpsLifecycleManager._internal();

  final NewLocationService _gps = NewLocationService();
  final PresenceService _presence = PresenceService();

  String? _uid;
  bool _isOnline = false;
  bool _hasActiveMission = false;
  bool _appInForeground = true;

  StreamSubscription<QuerySnapshot>? _missionSub;
  Timer? _backgroundTimer;

  /// Callback UI — appelé si la permission GPS est refusée.
  /// Permet à DriverHome d'afficher un SnackBar et de réinitialiser le switch.
  void Function()? onPermissionDenied;

  bool get isInitialized => _uid != null;
  bool get isGpsActive => _gps.isTrackingActive;

  // ── Initialisation ───────────────────────────────────────────────────────────

  /// Appelé par AuthWrapper dès qu'un utilisateur est détecté connecté.
  /// Restaure automatiquement le statut GPS de la session précédente.
  Future<void> initialize(String uid) async {
    // Déjà initialisé pour ce même utilisateur → rien à faire
    if (_uid == uid) return;

    // Nouvelle session (changement d'utilisateur) → nettoyer l'ancienne
    if (_uid != null) _cleanup();

    _uid = uid;
    WidgetsBinding.instance.addObserver(this);

    // Lire le statut actuel depuis Firestore pour restaurer la session
    try {
      final doc = await FirebaseFirestore.instance
          .collection('drivers')
          .doc(uid)
          .get();
      if (doc.exists) {
        final status = doc.data()?['status'] as String?;
        _isOnline = status == 'online';
        debugPrint('[GpsLifecycle] Statut restauré → _isOnline=$_isOnline');
      }
    } catch (e) {
      debugPrint('[GpsLifecycle] Lecture statut initial échouée: $e');
    }

    _startMissionListener();
    debugPrint('[GpsLifecycle] Initialisé uid=${uid.substring(0, 8)}...');

    // Évaluer immédiatement : si _isOnline=true déjà lu depuis Firestore,
    // le GPS doit démarrer sans attendre un événement externe.
    await _evaluateGps();
  }

  /// Appelé par AuthWrapper à la déconnexion.
  void dispose() {
    _cleanup();
    debugPrint('[GpsLifecycle] Disposed');
  }

  void _cleanup() {
    WidgetsBinding.instance.removeObserver(this);
    _missionSub?.cancel();
    _missionSub = null;
    _backgroundTimer?.cancel();
    _backgroundTimer = null;
    _gps.stopTracking();
    _uid = null;
    _isOnline = false;
    _hasActiveMission = false;
    onPermissionDenied = null;
  }

  // ── Présence (toggle manuel depuis DriverHome) ──────────────────────────────

  /// Appelé par DriverHome._toggleStatus().
  /// Met à jour la présence Firestore et réévalue le GPS.
  Future<void> setDriverOnline(bool online) async {
    if (_uid == null) return;
    _isOnline = online;

    if (online) {
      await _presence.setOnline(_uid!);
    } else {
      await _presence.setOffline(_uid!);
    }

    await _evaluateGps();
  }

  // ── Cycle de vie application ─────────────────────────────────────────────────

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        _appInForeground = true;
        _backgroundTimer?.cancel();
        _evaluateGps();
        debugPrint('[GpsLifecycle] App → premier plan');
        break;

      case AppLifecycleState.paused:
        _appInForeground = false;
        _onBackground();
        debugPrint('[GpsLifecycle] App → arrière-plan');
        break;

      default:
        break;
    }
  }

  void _onBackground() {
    if (!_hasActiveMission) {
      // Sans mission active : stopper GPS après 60s pour économiser batterie
      _backgroundTimer = Timer(const Duration(seconds: 60), () {
        if (!_appInForeground && !_hasActiveMission && _gps.isTrackingActive) {
          debugPrint('[GpsLifecycle] Timeout arrière-plan → GPS stoppé');
          _gps.stopTracking();
        }
      });
    }
    // Avec mission active : ForegroundNotificationConfig maintient le GPS allumé
  }

  // ── Listener missions ─────────────────────────────────────────────────────────

  void _startMissionListener() {
    final uid = _uid;
    if (uid == null) return;

    _missionSub?.cancel();
    _missionSub = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid)
        .where('status', whereIn: ['pending', 'in_progress'])
        .snapshots()
        .listen(
      (snapshot) {
        final hadMission = _hasActiveMission;
        _hasActiveMission = snapshot.docs.isNotEmpty;

        if (_hasActiveMission != hadMission) {
          debugPrint(
            '[GpsLifecycle] Missions → hasActiveMission=$_hasActiveMission '
            '(${snapshot.docs.length} doc(s))',
          );
          _evaluateGps();
        }
      },
      onError: (e) => debugPrint('[GpsLifecycle] Mission listener error: $e'),
    );
  }

  // ── Logique centrale : décision GPS ──────────────────────────────────────────

  Future<void> _evaluateGps() async {
    final uid = _uid;
    if (uid == null) return;

    // GPS ON si : chauffeur online OU mission active
    final shouldRun = _isOnline || _hasActiveMission;

    if (shouldRun && !_gps.isTrackingActive) {
      final hasPermission = await _gps.checkPermissions();
      if (!hasPermission) {
        debugPrint('[GpsLifecycle] Permission GPS refusée');
        // Notifier l'UI via callback
        onPermissionDenied?.call();
        // Réinitialiser le statut si c'est un toggle manuel qui a déclenché
        if (_isOnline && !_hasActiveMission) {
          _isOnline = false;
          await _presence.setOffline(uid);
        }
        return;
      }
      _gps.startRealtimeTracking(uid: uid);
    } else if (!shouldRun && _gps.isTrackingActive) {
      debugPrint('[GpsLifecycle] Conditions non remplies → GPS stoppé');
      _gps.stopTracking();
    }
  }

  // ── Contrôle manuel optionnel (TrackingScreen) ───────────────────────────────

  Future<void> forceStartGps() async => _evaluateGps();

  void pauseGps() {
    _gps.pauseTracking();
    debugPrint('[GpsLifecycle] GPS mis en pause');
  }

  Future<void> resumeGps() async {
    debugPrint('[GpsLifecycle] GPS repris');
    await _evaluateGps();
  }
}
