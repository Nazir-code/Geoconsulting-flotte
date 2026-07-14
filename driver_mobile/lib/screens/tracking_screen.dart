import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/new_location_service.dart';
import '../services/gps_lifecycle_manager.dart';
import '../services/missions_service.dart';
import '../theme/app_theme.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  final MissionsService _missionsService = MissionsService();
  final String _uid = FirebaseAuth.instance.currentUser?.uid ?? "";

  LatLng _currentLatLng = const LatLng(13.5137, 2.1098);
  double _headingTurns = 0.0;   // cumulative turns for AnimatedRotation
  double _lastRawHeading = 0.0; // last raw compass value (0–360)
  bool _isUpdatingMission = false;   // protège le bouton Arrêter
  bool _isCompletingMission = false; // protège le bouton Terminer
  bool _followMode = true;
  StreamSubscription<Position>? _gpsSubscription;
  StreamSubscription<CompassEvent>? _compassSubscription;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _driverSubscription;

  bool get _isTracking => GpsLifecycleManager().isGpsActive;

  // Présence d'une VRAIE mission — lit drivers/{uid}.currentMission, la même
  // source de vérité que le bouton "Terminer". Le GPS actif (chauffeur en
  // ligne) n'implique PAS une mission en cours.
  bool _hasActiveMission = false;

  @override
  void initState() {
    super.initState();

    final lastPos = NewLocationService().lastKnownPosition;
    if (lastPos != null) {
      _currentLatLng = LatLng(lastPos.latitude, lastPos.longitude);
    }

    _gpsSubscription = NewLocationService().positionStream.listen(_onNewPosition);

    _compassSubscription = FlutterCompass.events?.listen((event) {
      if (!mounted || event.heading == null || event.heading!.isNaN) return;
      _applyCompassHeading(event.heading!);
    });

    // Suit la mission active réelle pour piloter l'affichage du panneau bas.
    if (_uid.isNotEmpty) {
      _driverSubscription = FirebaseFirestore.instance
          .collection('drivers')
          .doc(_uid)
          .snapshots()
          .listen((doc) {
        if (!mounted) return;
        final mission = doc.data()?['currentMission'] as String?;
        final has = mission != null && mission.isNotEmpty;
        if (has != _hasActiveMission) {
          setState(() => _hasActiveMission = has);
        }
      });
    }

    if (!GpsLifecycleManager().isGpsActive) {
      GpsLifecycleManager().forceStartGps();
    }

    Geolocator.getCurrentPosition()
        .then(_onNewPosition)
        .catchError((e) => debugPrint('[TrackingScreen] getCurrentPosition: $e'));
  }

  @override
  void dispose() {
    _gpsSubscription?.cancel();
    _compassSubscription?.cancel();
    _driverSubscription?.cancel();
    super.dispose();
  }

  void _onNewPosition(Position pos) {
    if (!mounted) return;
    final newLatLng = LatLng(pos.latitude, pos.longitude);
    setState(() => _currentLatLng = newLatLng);
    if (_followMode) {
      _mapController.move(newLatLng, _mapController.camera.zoom);
    }
  }

  // Converts raw compass degrees to cumulative turns, always taking the
  // shortest angular path (handles the 350°→10° wraparound correctly).
  void _applyCompassHeading(double rawHeading) {
    double h = rawHeading % 360;
    if (h < 0) h += 360;

    double delta = h - _lastRawHeading;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    _lastRawHeading = h;
    setState(() => _headingTurns += delta / 360.0);
  }

  Future<void> _toggleTracking() async {
    if (_isTracking) {
      await _confirmStopMission();
    } else {
      await GpsLifecycleManager().forceStartGps();
      setState(() {});
    }
  }

  void _recenter() {
    HapticFeedback.lightImpact();
    setState(() => _followMode = true);
    _mapController.move(_currentLatLng, 15.0);
  }

  void _zoomIn() {
    _mapController.move(
      _mapController.camera.center,
      (_mapController.camera.zoom + 1).clamp(3, 19),
    );
  }

  void _zoomOut() {
    _mapController.move(
      _mapController.camera.center,
      (_mapController.camera.zoom - 1).clamp(3, 19),
    );
  }

  // ── Complete mission ──────────────────────────────────────────────────────
  Future<void> _confirmCompleteMission() async {
    debugPrint('🏁 [TerminerBtn] Bouton "Terminer la mission" pressé — uid=$_uid');

    if (_uid.isEmpty) {
      debugPrint('❌ [TerminerBtn] UID vide — abandon');
      return;
    }

    // Empêcher double-clic si déjà en cours d'opération
    if (_isCompletingMission || _isUpdatingMission) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline_rounded,
                  color: AppColors.success,
                  size: 32,
                ),
              ),
              AppSpacing.gapLg,
              Text("Terminer la mission ?", style: AppTextStyles.h4),
              AppSpacing.gapSm,
              Text(
                "La mission sera marquée comme terminée et le suivi GPS s'arrêtera.",
                style: AppTextStyles.bodySm
                    .copyWith(color: context.palette.textSecondary),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapXl2,
              // Bouton Terminer — pleine largeur
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: AppSpacing.roundedMd),
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    "Confirmer",
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Bouton Annuler
              SizedBox(
                width: double.infinity,
                height: 44,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: Text(
                    "Annuler",
                    style: AppTextStyles.btn
                        .copyWith(color: context.palette.textSecondary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCompletingMission = true);
    try {
      // Lire la mission active depuis le profil du chauffeur
      final doc = await FirebaseFirestore.instance
          .collection('drivers')
          .doc(_uid)
          .get();
      final currentMission = doc.data()?['currentMission'] as String?;

      if (currentMission == null || currentMission.isEmpty) {
        debugPrint('⚠️ [TerminerBtn] Aucune mission active dans drivers/$_uid');
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Aucune mission active trouvée.')),
        );
        return;
      }

      debugPrint('🏁 [TerminerBtn] Terminer mission: $currentMission (driver: $_uid)');

      // Terminer la mission — écrit status=completed, completedAt, met à jour driver
      await _missionsService.completeMission(currentMission, _uid);

      debugPrint('✅ [TerminerBtn] Firestore mis à jour — mission $currentMission terminée');

      // Arrêter le GPS
      GpsLifecycleManager().pauseGps();
      if (!mounted) return;
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Mission terminée avec succès.'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (error) {
      debugPrint('❌ [TerminerBtn] Erreur Firestore: $error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur réseau : $error'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isCompletingMission = false);
    }
  }

  // ── Stop mission dialog ───────────────────────────────────────────────────
  Future<void> _confirmStopMission() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.stop_circle_outlined,
                  color: AppColors.error,
                  size: 32,
                ),
              ),
              AppSpacing.gapLg,
              Text("Arrêter la mission ?", style: AppTextStyles.h4),
              AppSpacing.gapSm,
              Text(
                "La mission sera annulée, retirée du suivi live et votre statut sera libéré.",
                style: AppTextStyles.bodySm
                    .copyWith(color: context.palette.textSecondary),
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapXl2,
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: context.palette.textSecondary,
                          side: BorderSide(color: context.palette.border),
                          shape: RoundedRectangleBorder(
                              borderRadius: AppSpacing.roundedMd),
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text("Retour",
                            style: AppTextStyles.btn
                                .copyWith(color: context.palette.textSecondary)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: AppSpacing.roundedMd),
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text("Arrêter",
                            style: AppTextStyles.btn
                                .copyWith(color: Colors.white)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed != true) return;

    setState(() => _isUpdatingMission = true);
    try {
      final doc = await FirebaseFirestore.instance
          .collection('drivers')
          .doc(_uid)
          .get();
      final currentMission = doc.data()?['currentMission'] as String?;
      if (currentMission != null && currentMission.isNotEmpty) {
        await _missionsService.cancelMission(currentMission, _uid);
      }
      GpsLifecycleManager().pauseGps();
      if (!mounted) return;
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mission arrêtée.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur réseau : $error'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isUpdatingMission = false);
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: _MapFloatButton(
            icon: Icons.arrow_back_rounded,
            onTap: () => Navigator.pop(context),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: _buildLiveBadge(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // ── Map ─────────────────────────────────────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLatLng,
              initialZoom: 15.0,
              onPositionChanged: (_, hasGesture) {
                if (hasGesture && _followMode) {
                  setState(() => _followMode = false);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.novatech.driver_mobile',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentLatLng,
                    width: 64,
                    height: 64,
                    child: _PulseMarker(
                      isActive: _isTracking,
                      turns: _headingTurns,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── Right-side float controls ─────────────────────────────────
          Positioned(
            top: 100,
            right: 16,
            child: _buildMapControls(),
          ),

          // ── Coordinates chip ──────────────────────────────────────────
          Positioned(
            top: 100,
            left: 16,
            child: _buildCoordChip(),
          ),

          // ── Bottom panel ──────────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildControlPanel(),
          ),
        ],
      ),
    );
  }

  // ── Live badge (top right) ────────────────────────────────────────────────
  Widget _buildLiveBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _isTracking ? AppColors.success : AppColors.textSecondary,
        borderRadius: AppSpacing.roundedFull,
        boxShadow: AppTheme.shadowColored(
          _isTracking ? AppColors.success : AppColors.textSecondary,
          opacity: 0.3,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _isTracking ? 'LIVE' : 'PAUSE',
            style: const TextStyle(
              fontFamily: 'Inter',
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Coordinates chip ──────────────────────────────────────────────────────
  Widget _buildCoordChip() {
    final lat = _currentLatLng.latitude.toStringAsFixed(5);
    final lng = _currentLatLng.longitude.toStringAsFixed(5);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: AppSpacing.roundedMd,
        boxShadow: AppTheme.shadowSm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on_rounded,
              size: 13, color: AppColors.primary),
          const SizedBox(width: 5),
          Text(
            '$lat, $lng',
            style: const TextStyle(
              fontFamily: 'JetBrainsMono',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  // ── Map float controls ────────────────────────────────────────────────────
  Widget _buildMapControls() {
    return Column(
      children: [
        // Recentrer
        _MapFloatButton(
          icon: _followMode
              ? Icons.my_location_rounded
              : Icons.location_searching_rounded,
          onTap: _recenter,
          color: _followMode ? AppColors.primary : null,
          iconColor: _followMode ? Colors.white : null,
        ),
        const SizedBox(height: 10),
        // Zoom in
        _MapFloatButton(icon: Icons.add_rounded, onTap: _zoomIn),
        const SizedBox(height: 6),
        // Zoom out
        _MapFloatButton(icon: Icons.remove_rounded, onTap: _zoomOut),
      ],
    );
  }

  // ── Bottom control panel ──────────────────────────────────────────────────
  Widget _buildControlPanel() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: context.palette.border,
              borderRadius: AppSpacing.roundedFull,
            ),
          ),

          // Mission info row
          _buildMissionRow(),

          const SizedBox(height: 20),

          // Action button
          _buildActionButton(),
        ],
      ),
    );
  }

  Widget _buildMissionRow() {
    final hasMission = _hasActiveMission;

    // Libellés selon qu'il y a une vraie mission ou non.
    final caption = hasMission ? "Mission active" : "Suivi GPS";
    final status = hasMission
        ? (_isTracking ? "Suivi GPS en cours" : "En attente de démarrage")
        : "Aucune mission en cours";

    // Pastille : mission active → ACTIF/INACTIF (vert) ; sinon en ligne (bleu).
    final chipLabel = hasMission
        ? (_isTracking ? 'ACTIF' : 'INACTIF')
        : (_isTracking ? 'EN LIGNE' : 'HORS LIGNE');
    final chipColor = hasMission ? AppColors.success : AppColors.primary;
    final chipOn = _isTracking;

    return Row(
      children: [
        // Avatar icône — coloré uniquement s'il y a une vraie mission
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: hasMission
                ? AppTheme.primaryGradient
                : LinearGradient(
                    colors: [context.palette.surfaceVariant, context.palette.surfaceVariant]),
            borderRadius: AppSpacing.roundedMd,
          ),
          child: Icon(
            Icons.directions_car_filled_rounded,
            color: hasMission ? Colors.white : context.palette.textSecondary,
            size: 24,
          ),
        ),
        const SizedBox(width: 14),

        // Labels
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                caption,
                style: AppTextStyles.caption
                    .copyWith(color: context.palette.textSecondary),
              ),
              const SizedBox(height: 2),
              Text(
                status,
                style: AppTextStyles.h5.copyWith(color: context.palette.textHeading),
              ),
            ],
          ),
        ),

        // Status chip
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: chipOn
                ? chipColor.withValues(alpha: 0.1)
                : context.palette.surfaceVariant,
            borderRadius: AppSpacing.roundedFull,
            border: Border.all(
              color: chipOn ? chipColor.withValues(alpha: 0.3) : Colors.transparent,
            ),
          ),
          child: Text(
            chipLabel,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: chipOn ? chipColor : context.palette.textSecondary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton() {
    // ── Chargement (complétion ou annulation en cours) ─────────────────────
    if (_isCompletingMission || _isUpdatingMission) {
      final label = _isCompletingMission ? "Finalisation..." : "Synchronisation...";
      return Container(
        height: 54,
        decoration: BoxDecoration(
          color: context.palette.surfaceVariant,
          borderRadius: AppSpacing.roundedLg,
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                  strokeWidth: 2,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  color: context.palette.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // ── Aucune mission réelle : panneau passif, aucun bouton mission ──────
    if (!_hasActiveMission) {
      return const SizedBox.shrink();
    }

    // ── Mission active : deux boutons ─────────────────────────────────────
    if (_isTracking) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Bouton principal : Terminer la mission (vert)
          Container(
            width: double.infinity,
            height: 54,
            decoration: BoxDecoration(
              gradient: AppTheme.successGradient,
              borderRadius: AppSpacing.roundedLg,
              boxShadow: AppTheme.shadowColored(AppColors.success),
            ),
            child: ElevatedButton.icon(
              onPressed: _confirmCompleteMission,
              icon: const Icon(Icons.check_circle_outline_rounded, size: 20),
              label: const Text(
                "TERMINER LA MISSION",
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: AppSpacing.roundedLg),
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Bouton secondaire : Arrêter / Annuler (rouge outline)
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: _confirmStopMission,
              icon: const Icon(Icons.stop_rounded, size: 16),
              label: const Text(
                "Arrêter la mission",
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error, width: 1.5),
                shape: RoundedRectangleBorder(
                    borderRadius: AppSpacing.roundedLg),
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ),
        ],
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 54,
      child: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.primaryGradient,
          borderRadius: AppSpacing.roundedLg,
          boxShadow: AppTheme.shadowColored(AppColors.primary),
        ),
        child: ElevatedButton.icon(
          onPressed: _toggleTracking,
          icon: const Icon(Icons.play_arrow_rounded, size: 22),
          label: const Text(
            "DÉMARRER LA MISSION",
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 15,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            elevation: 0,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
                borderRadius: AppSpacing.roundedLg),
            padding: EdgeInsets.zero,
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
      ),
    );
  }
}

// ── Floating map button ───────────────────────────────────────────────────────
class _MapFloatButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;
  final Color? iconColor;

  const _MapFloatButton({
    required this.icon,
    required this.onTap,
    this.color,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color ?? Colors.white.withValues(alpha: 0.95),
          shape: BoxShape.circle,
          boxShadow: AppTheme.shadowMd,
        ),
        child: Icon(
          icon,
          color: iconColor ?? AppColors.textHeading,
          size: 22,
        ),
      ),
    );
  }
}

// ── Animated driver marker ────────────────────────────────────────────────────
class _PulseMarker extends StatefulWidget {
  final bool isActive;
  final double turns;
  const _PulseMarker({required this.isActive, this.turns = 0.0});

  @override
  State<_PulseMarker> createState() => _PulseMarkerState();
}

class _PulseMarkerState extends State<_PulseMarker>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _scale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    _opacity = Tween<double>(begin: 0.5, end: 0.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    if (widget.isActive) _ctrl.repeat();
  }

  @override
  void didUpdateWidget(_PulseMarker old) {
    super.didUpdateWidget(old);
    if (widget.isActive && !_ctrl.isAnimating) {
      _ctrl.repeat();
    } else if (!widget.isActive && _ctrl.isAnimating) {
      _ctrl.stop();
      _ctrl.reset();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.isActive ? AppColors.primary : AppColors.textSecondary;

    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Pulse ring
          if (widget.isActive)
            AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) => Transform.scale(
                scale: _scale.value * 1.8,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withValues(alpha: _opacity.value * 0.4),
                  ),
                ),
              ),
            ),
          // Outer ring
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.15),
            ),
          ),
          // Inner dot — smooth animated rotation via cumulative turns
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: AppTheme.shadowMd,
            ),
            child: AnimatedRotation(
              turns: widget.turns,
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              child: Icon(
                Icons.navigation_rounded,
                color: color,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
