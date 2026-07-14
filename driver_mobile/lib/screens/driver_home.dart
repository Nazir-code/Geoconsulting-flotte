import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/new_location_service.dart';
import '../services/gps_lifecycle_manager.dart';
import '../models/driver_profile.dart';
import '../widgets/status_switch.dart';
import '../widgets/vehicle_status_card.dart';
import '../widgets/quick_action_button.dart';
import '../widgets/mission_card_pro.dart';
import '../widgets/violet_gradient_header.dart';
import 'tracking_screen.dart';
import 'fuel_entry_screen.dart';
import 'maintenance_request_screen.dart';
import 'notifications_screen.dart';
import '../theme/app_theme.dart';

class DriverHome extends StatefulWidget {
  const DriverHome({super.key});

  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome> {
  // ── Services — INCHANGÉS ──────────────────────────────────────────────────
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();

  bool _isOnline = false;
  bool _isAcceptingMission = false;
  DriverProfile? _profile;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _missionSubscription;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _notificationSubscription;

  final Set<String> _knownMissionIds = {};
  bool _isFirstMissionSnapshot = true;
  int _unreadNotificationCount = 0;

  // Stream partagé entre le listener de missions et le StreamBuilder.
  // Une seule connexion Firestore au lieu de deux.
  Stream<QuerySnapshot<Map<String, dynamic>>>? _missionsStream;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _initMissionListener();
    _initNotificationListener();

    GpsLifecycleManager().onPermissionDenied = () {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Permissions GPS requises pour passer en ligne."),
        ),
      );
      setState(() => _isOnline = false);
    };
  }

  @override
  void dispose() {
    GpsLifecycleManager().onPermissionDenied = null;
    _missionSubscription?.cancel();
    _notificationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      final p = await _firestoreService.getDriverProfile(uid);
      setState(() {
        _profile = p;
        _isOnline = p?.status == 'online';
      });
    }
  }

  // ── Listener missions ─────────────────────────────────────────────────────
  void _initMissionListener() {
    final uid = _authService.currentUid;
    if (uid == null) return;

    // Le stream Firestore est broadcast par nature — on peut y brancher
    // à la fois _missionSubscription (notifications) et le StreamBuilder
    // (affichage) sans ouvrir deux connexions réseau.
    _missionsStream = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid)
        .snapshots();

    _missionSubscription = _missionsStream!.listen(
      (snapshot) {
        // ── Premier snapshot : inventaire des missions existantes ─────────────
        // Firestore renvoie TOUJOURS tous les documents correspondants en
        // DocumentChangeType.added lors du premier snapshot. On les enregistre
        // dans _knownMissionIds pour ne pas les confondre avec de nouvelles
        // missions. Aucune notification n'est envoyée pour ce snapshot initial.
        if (_isFirstMissionSnapshot) {
          _isFirstMissionSnapshot = false;
          for (final change in snapshot.docChanges) {
            _knownMissionIds.add(change.doc.id);
          }
          debugPrint(
            '🔍 [MissionListener] Snapshot initial: '
            '${_knownMissionIds.length} missions existantes enregistrées, aucune notif.',
          );
          return;
        }

        // ── Snapshots suivants : uniquement les vraies nouveautés ─────────────
        for (final change in snapshot.docChanges) {
          if (change.type != DocumentChangeType.added) continue;

          final docId = change.doc.id;

          // Anti-doublon : ignorer si déjà connu
          if (_knownMissionIds.contains(docId)) continue;
          _knownMissionIds.add(docId);

          final data = change.doc.data();

          // Ignorer les missions déjà terminées ou annulées
          final status = data?['status'] as String?;
          if (status == 'completed' ||
              status == 'terminée'  ||
              status == 'cancelled' ||
              status == 'annulée') {
            debugPrint('🔍 [MissionListener] Mission $docId ignorée (statut: $status)');
            continue;
          }

          debugPrint('🔔 [MissionListener] Nouvelle mission reçue: $docId (statut: $status)');

          if (!mounted) return;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _showNewMissionDialog(docId, data ?? const {});
          });
        }
      },
      onError: (e) => debugPrint("❌ [MISSION ERROR] $e"),
    );
  }

  void _initNotificationListener() {
    final uid = _authService.currentUid;
    if (uid == null) return;

    _notificationSubscription = _firestoreService
        .listenToNotifications(uid)
        .listen(
      (snapshot) {
        final unreadCount = snapshot.docs.where((doc) {
          final data = doc.data();
          final isRead = data['isRead'];
          return isRead != true;
        }).length;

        if (!mounted) return;
        if (unreadCount != _unreadNotificationCount) {
          setState(() {
            _unreadNotificationCount = unreadCount;
          });
        }
      },
      onError: (e) => debugPrint('❌ [NOTIF LISTENER ERROR] $e'),
    );
  }

  // ── Toggle statut — INCHANGÉ ──────────────────────────────────────────────
  void _toggleStatus(bool online) async {
    setState(() => _isOnline = online);
    await GpsLifecycleManager().setDriverOnline(online);
  }

  // ── Greeting — INCHANGÉ ───────────────────────────────────────────────────
  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return "Bonjour👋";
    if (h < 18) return "Bon après-midi👋";
    return "Bonsoir👋";
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: context.palette.background,
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            _buildVioletHeader(),
            _buildKpiSection(),
            _buildVehicleSection(),
            _buildQuickActions(),
            SliverToBoxAdapter(
              child: RepaintBoundary(
                child: _HomeMapPreview(isOnline: _isOnline),
              ),
            ),
            _buildRecentMissionsHeader(),
            _buildRecentMissionsList(),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  // ── Header violet — remplace l'ancien TopBar cyan ─────────────────────────
  Widget _buildVioletHeader() {
    return SliverToBoxAdapter(
      child: VioletGradientHeader(
        greeting: '$_greeting,',
        name: _profile?.name ?? 'Chargement…',
        subtitle: 'Chauffeur · Geoconsulting',
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildNotificationBell(),
            const SizedBox(width: 12),
            StatusSwitch(isOnline: _isOnline, onChanged: _toggleStatus),
          ],
        ),
        bottom: VehiclePill(
          vehicleModel: 'Toyota Hilux 4×4',
          plateNumber: 'ABC-123-NG',
          kmTotal: 48234,
          isOnService: _isOnline,
        ),
      ),
    );
  }

  Widget _buildNotificationBell() {
    return GestureDetector(
      onTap: _onNotificationBellTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_none_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          if (_unreadNotificationCount > 0)
            Positioned(
              right: -2,
              top: -2,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Text(
                  _unreadNotificationCount > 9 ? '9+' : '$_unreadNotificationCount',
                  style: AppTextStyles.jkBadge.copyWith(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _onNotificationBellTap() {
    HapticFeedback.selectionClick();
    Navigator.push(
      context,
      AppTransitions.slideRight(const NotificationsScreen()),
    );
  }

  // ── 3 KPI cards horizontales (v2) ─────────────────────────────────────────
  Widget _buildKpiSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: Row(
          children: [
            _kpiCard(
              value: '0',
              label: 'Missions\ndu jour',
              icon: Icons.route_rounded,
              color: AppColors.violet,
              trend: '+12%',
            ),
            const SizedBox(width: 12),
            _kpiCard(
              value: '0',
              label: 'KM\nparcourus',
              icon: Icons.speed_rounded,
              color: AppColors.warning,
              trend: '+5%',
            ),
            const SizedBox(width: 12),
            _kpiCard(
              value: '0.0 ★',
              label: 'Évaluation\nchauffeur',
              icon: Icons.star_rounded,
              color: AppColors.success,
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiCard({
    required String value,
    required String label,
    required IconData icon,
    required Color color,
    String? trend,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: context.palette.surface,
          borderRadius: AppSpacing.roundedLg,
          border: Border.all(color: context.palette.border),
          boxShadow: AppTheme.shadowCard,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 15),
                ),
                if (trend != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.10),
                      borderRadius: AppSpacing.roundedFull,
                    ),
                    child: Text(
                      trend,
                      style: AppTextStyles.jkBadge.copyWith(
                        color: AppColors.success,
                        fontSize: 8,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: AppTextStyles.jkStatValue.copyWith(
                color: context.palette.textHeading,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTextStyles.jkStatLabel.copyWith(
                color: context.palette.textSecondary,
                fontSize: 8.5,
              ),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }

  // ── Vehicle Section — INCHANGÉE ───────────────────────────────────────────
  Widget _buildVehicleSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: RepaintBoundary(
          child: VehicleStatusCard(
            plateNumber: "ABC-123-NG",
            model: "Toyota Hilux 4x4",
            fuelLevel: 0.75,
            isGpsActive: _isOnline,
            lastSync: "À l'instant",
          ),
        ),
      ),
    );
  }

  // ── Actions rapides — Missions passe en violet ────────────────────────────
  Widget _buildQuickActions() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            QuickActionButton(
              icon: Icons.assignment_outlined,
              label: "Missions",
              color: AppColors.violet,
              onTap: () {},
            ),
            QuickActionButton(
              icon: Icons.map_outlined,
              label: "Carte Live",
              color: AppColors.accent,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TrackingScreen()),
              ),
            ),
            QuickActionButton(
              icon: Icons.local_gas_station_rounded,
              label: "Carburant",
              color: AppColors.violet,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => FuelEntryScreen(driverName: _profile?.name),
                ),
              ),
            ),
            QuickActionButton(
              icon: Icons.build_rounded,
              label: "Entretien",
              color: AppColors.warning,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MaintenanceRequestScreen(
                      driverName: _profile?.name),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── En-tête missions récentes ─────────────────────────────────────────────
  Widget _buildRecentMissionsHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
        child: Row(
          children: [
            Text(
              'Missions récentes',
              style: AppTextStyles.jkSectionTitle.copyWith(
                color: context.palette.textHeading,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () {},
              child: Text(
                'Voir tout',
                style: AppTextStyles.jkLink,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentMissionsList() {
    if (_missionsStream == null) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Center(
            child: CircularProgressIndicator(
              color: AppColors.violet,
              strokeWidth: 2,
            ),
          ),
        ),
      );
    }

    return StreamBuilder<QuerySnapshot>(
      stream: _missionsStream,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Text(
                'Erreur de chargement : ${snapshot.error}',
                style: const TextStyle(color: AppColors.error),
              ),
            ),
          );
        }

        if (!snapshot.hasData) {
          return const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: CircularProgressIndicator(
                  color: AppColors.violet,
                  strokeWidth: 2,
                ),
              ),
            ),
          );
        }

        // Tri côté client par createdAt décroissant, puis 3 plus récentes.
        // Gère les docs sans createdAt (placés en fin) — évite l'exclusion
        // silencieuse qu'aurait provoquée un orderBy('createdAt') serveur.
        final docs = snapshot.data!.docs.toList()
          ..sort((a, b) {
            final ta = (a.data() as Map<String, dynamic>)['createdAt'];
            final tb = (b.data() as Map<String, dynamic>)['createdAt'];
            if (ta is Timestamp && tb is Timestamp) return tb.compareTo(ta);
            if (ta is Timestamp) return -1;
            if (tb is Timestamp) return 1;
            return 0;
          });
        final recent = docs.take(3).toList();

        if (recent.isEmpty) {
          return SliverToBoxAdapter(child: _buildEmptyMissions());
        }

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final doc = recent[index];
                final data = {
                  'id': doc.id,
                  ...(doc.data() as Map<String, dynamic>),
                };
                return MissionCardPro(mission: data);
              },
              childCount: recent.length,
            ),
          ),
        );
      },
    );
  }

  // ── État vide missions v2 ─────────────────────────────────────────────────
  Widget _buildEmptyMissions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 28),
        decoration: BoxDecoration(
          color: context.palette.surface,
          borderRadius: AppSpacing.roundedLg,
          border: Border.all(color: context.palette.border),
          boxShadow: AppTheme.shadowCard,
        ),
        child: Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppColors.violetLight,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(
                Icons.assignment_outlined,
                color: AppColors.violet,
                size: 28,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Aucune mission récente',
              style: AppTextStyles.jkSectionTitle.copyWith(
                color: context.palette.textHeading,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Vos prochaines missions apparaîtront ici',
              style: AppTextStyles.jkCardSub
                  .copyWith(color: context.palette.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ── Dialog nouvelle mission — INCHANGÉ ────────────────────────────────────
  void _showNewMissionDialog(String missionId, Map<String, dynamic> data) {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl2),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_active_rounded,
                  color: AppColors.warning,
                  size: 36,
                ),
              ),
              AppSpacing.gapLg,
              Text("Nouvelle Mission !", style: AppTextStyles.h3),
              AppSpacing.gapMd,
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: context.palette.surfaceVariant,
                  borderRadius: AppSpacing.roundedMd,
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.title_rounded,
                            size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            data['title'] ?? 'Sans titre',
                            style: AppTextStyles.label,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 16, color: AppColors.violet),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            data['location'] ?? 'N/A',
                            style: AppTextStyles.bodySm,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              AppSpacing.gapXl2,
              // Bouton Accepter — pleine largeur, violet
              SizedBox(
                width: double.infinity,
                height: 48,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: AppTheme.violetButtonGradient,
                    borderRadius: AppSpacing.roundedMd,
                    boxShadow: AppTheme.shadowVioletSm,
                  ),
                  child: ElevatedButton(
                    onPressed: _isAcceptingMission
                        ? null
                        : () => _acceptMissionFromDialog(missionId),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      disabledBackgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: AppSpacing.roundedMd),
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: _isAcceptingMission
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : Text(
                            'Accepter',
                            style: AppTextStyles.jkBtnPrimary,
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Bouton Ignorer
              SizedBox(
                width: double.infinity,
                height: 44,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    foregroundColor: context.palette.textSecondary,
                    shape: RoundedRectangleBorder(
                        borderRadius: AppSpacing.roundedMd),
                  ),
                  child: Text(
                    'Ignorer',
                    style: AppTextStyles.jkBtnSm.copyWith(
                      color: context.palette.textSecondary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Accepter mission — INCHANGÉ ───────────────────────────────────────────
  Future<void> _acceptMissionFromDialog(String missionId) async {
    final uid = _authService.currentUid;
    if (uid == null) return;

    setState(() => _isAcceptingMission = true);
    try {
      await _firestoreService.acceptMission(uid: uid, missionId: missionId);
      if (!mounted) return;
      Navigator.pop(context);
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const TrackingScreen()),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur réseau: $error'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isAcceptingMission = false);
    }
  }
}

// ── Mini-map isolée — GPS + Boussole dans leur propre widget ─────────────────
// Ce widget gère ses propres subscriptions GPS/compass. Seule cette zone
// se reconstruit à chaque tick GPS — le reste du Dashboard (KPI, missions…)
// est totalement épargné.
class _HomeMapPreview extends StatefulWidget {
  final bool isOnline;
  const _HomeMapPreview({required this.isOnline});

  @override
  State<_HomeMapPreview> createState() => _HomeMapPreviewState();
}

class _HomeMapPreviewState extends State<_HomeMapPreview> {
  final MapController _mapController = MapController();
  LatLng _currentLocation = const LatLng(13.5137, 2.1098);
  double _headingTurns = 0.0;
  double _lastRawHeading = 0.0;
  StreamSubscription<Position>? _gpsSubscription;
  StreamSubscription<CompassEvent>? _compassSubscription;

  @override
  void initState() {
    super.initState();
    final lastPos = NewLocationService().lastKnownPosition;
    if (lastPos != null) {
      _currentLocation = LatLng(lastPos.latitude, lastPos.longitude);
    }

    _gpsSubscription = NewLocationService().positionStream.listen((pos) {
      if (!mounted) return;
      final newLatLng = LatLng(pos.latitude, pos.longitude);
      setState(() => _currentLocation = newLatLng);
      try {
        _mapController.move(newLatLng, _mapController.camera.zoom);
      } catch (_) {}
      if (pos.speed > 0.5 && pos.heading >= 0) {
        _applyCompassHeading(pos.heading);
      }
    });

    _compassSubscription = FlutterCompass.events?.listen((event) {
      if (!mounted || event.heading == null || event.heading!.isNaN) return;
      _applyCompassHeading(event.heading!);
    });
  }

  @override
  void dispose() {
    _gpsSubscription?.cancel();
    _compassSubscription?.cancel();
    super.dispose();
  }

  void _applyCompassHeading(double rawHeading) {
    double h = rawHeading % 360;
    if (h < 0) h += 360;
    double delta = h - _lastRawHeading;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    _lastRawHeading = h;
    setState(() => _headingTurns += delta / 360.0);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: AppSpacing.roundedXl2,
        boxShadow: AppTheme.shadowMd,
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation,
              initialZoom: 13.0,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.none,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.novatech.driver_mobile',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentLocation,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        gradient: AppTheme.violetButtonGradient,
                        shape: BoxShape.circle,
                        boxShadow: AppTheme.shadowVioletSm,
                      ),
                      child: AnimatedRotation(
                        turns: _headingTurns,
                        duration: const Duration(milliseconds: 150),
                        curve: Curves.easeOut,
                        child: const Icon(Icons.navigation_rounded,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          // Gradient overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.45),
                  Colors.transparent,
                ],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
            ),
          ),
          // Barre inférieure
          Positioned(
            bottom: 12,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: widget.isOnline
                            ? AppColors.success
                            : AppColors.textSecondary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      "Position en temps réel",
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TrackingScreen()),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: AppSpacing.roundedMd,
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.3)),
                    ),
                    child: const Text(
                      "Plein écran",
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
