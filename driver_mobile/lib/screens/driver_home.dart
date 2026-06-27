import 'package:flutter/material.dart';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/new_location_service.dart';
import '../theme/app_transitions.dart';
import '../services/gps_lifecycle_manager.dart';
import '../services/firebase_notification_service.dart';
import '../models/driver_profile.dart';
import '../widgets/kpi_card.dart';
import '../widgets/status_switch.dart';
import '../widgets/vehicle_status_card.dart';
import '../widgets/quick_action_button.dart';
import '../widgets/mission_card_pro.dart';
import 'tracking_screen.dart';
import '../theme/app_theme.dart';

class DriverHome extends StatefulWidget {
  const DriverHome({super.key});

  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome> {
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();

  bool _isOnline = false;
  bool _isAcceptingMission = false;
  DriverProfile? _profile;
  StreamSubscription<QuerySnapshot>? _missionSubscription;
  StreamSubscription<Position>? _gpsSubscription;
  StreamSubscription<CompassEvent>? _compassSubscription;
  LatLng _currentLocation = const LatLng(13.5137, 2.1098);
  double _headingTurns = 0.0;
  double _lastRawHeading = 0.0;

  // IDs des missions déjà présentes au démarrage du listener (snapshot initial).
  // Approche par Set plutôt que comparaison de Timestamp — évite le décalage
  // horloge device vs horloge serveur Firestore qui rendait le filtre précédent
  // non fiable (missions créées dans la même seconde étaient silencieusement ignorées).
  final Set<String> _knownMissionIds = {};
  bool _isFirstMissionSnapshot = true;

  late final Stream<QuerySnapshot> _missionsTodayStream;
  late final Stream<QuerySnapshot> _missionsDoneStream;

  @override
  void initState() {
    super.initState();
    _initKpiStreams();
    _loadProfile();
    _startMissionNotifications();
    _initMissionListener();

    GpsLifecycleManager().onPermissionDenied = () {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Permissions GPS requises pour passer en ligne."),
        ),
      );
      setState(() => _isOnline = false);
    };

    _gpsSubscription = NewLocationService().positionStream.listen((pos) {
      if (mounted) {
        setState(() => _currentLocation = LatLng(pos.latitude, pos.longitude));
      }
    });

    _compassSubscription = FlutterCompass.events?.listen((event) {
      if (!mounted || event.heading == null || event.heading!.isNaN) return;
      _applyCompassHeading(event.heading!);
    });

    final lastPos = NewLocationService().lastKnownPosition;
    if (lastPos != null) {
      _currentLocation = LatLng(lastPos.latitude, lastPos.longitude);
    }
  }

  @override
  void dispose() {
    _gpsSubscription?.cancel();
    _compassSubscription?.cancel();
    GpsLifecycleManager().onPermissionDenied = null;
    _missionSubscription?.cancel();
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

  void _initKpiStreams() {
    final uid = _authService.currentUid ?? '';
    final today = DateTime.now();
    final startOfDay = Timestamp.fromDate(
      DateTime(today.year, today.month, today.day),
    );

    _missionsTodayStream = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid)
        .where('createdAt', isGreaterThanOrEqualTo: startOfDay)
        .snapshots();

    _missionsDoneStream = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid)
        .where('status', whereIn: ['completed', 'terminée'])
        .snapshots();
  }

  Future<void> _loadProfile() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      final p = await _firestoreService.getDriverProfile(uid);
      setState(() {
        _profile = p;
        _isOnline = p?.status == 'online';
        if (p != null && p.latitude != null && p.longitude != null) {
          _currentLocation = LatLng(p.latitude!, p.longitude!);
        }
      });
    }
  }

  void _initMissionListener() {
    final uid = _authService.currentUid;
    if (uid == null) return;

    _missionSubscription = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid)
        .snapshots()
        .listen(
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

  void _toggleStatus(bool online) async {
    setState(() => _isOnline = online);
    await GpsLifecycleManager().setDriverOnline(online);
  }

  // ── Greeting ──────────────────────────────────────────────────────────────
  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            _buildTopBar(),
            _buildKpiSection(),
            _buildVehicleSection(),
            _buildQuickActions(),
            _buildMapPreview(),
            _buildRecentMissionsHeader(),
            _buildRecentMissionsList(),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  // ── Top Bar ───────────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Row(
          children: [
            // Avatar
            GestureDetector(
              onTap: () => DefaultTabController.of(context).animateTo(4),
              child: Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  shape: BoxShape.circle,
                ),
                child: const CircleAvatar(
                  radius: 23,
                  backgroundColor: AppColors.primaryLight,
                  child: Icon(Icons.person_rounded, color: AppColors.primary, size: 26),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Greeting
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _greeting,
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    _profile?.name ?? "Chargement...",
                    style: AppTextStyles.h4,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Status switch
            StatusSwitch(isOnline: _isOnline, onChanged: _toggleStatus),
          ],
        ),
      ),
    );
  }

  // ── KPI Grid ──────────────────────────────────────────────────────────────
  Widget _buildKpiSection() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverGrid.count(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.1,
        children: [
          StreamBuilder<QuerySnapshot>(
            stream: _missionsTodayStream,
            builder: (context, snapshot) {
              final count = snapshot.data?.docs.length ?? 0;
              final loaded = snapshot.hasData;
              return KpiCard(
                title: "Missions / Jour",
                value: loaded ? count.toString().padLeft(2, '0') : '--',
                icon: Icons.route_rounded,
                subtitle: loaded ? (count == 0 ? 'Aucune' : 'Aujourd\'hui') : null,
                subtitleColor: count > 0 ? AppColors.primary : AppColors.textSecondary,
              );
            },
          ),
          StreamBuilder<QuerySnapshot>(
            stream: _missionsDoneStream,
            builder: (context, snapshot) {
              final count = snapshot.data?.docs.length ?? 0;
              final loaded = snapshot.hasData;
              return KpiCard(
                title: "Terminées",
                value: loaded ? count.toString() : '--',
                icon: Icons.check_circle_outline_rounded,
                iconColor: AppColors.success,
                subtitle: loaded ? 'Au total' : null,
                subtitleColor: AppColors.success,
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Vehicle Card ──────────────────────────────────────────────────────────
  Widget _buildVehicleSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: VehicleStatusCard(
          plateNumber: "ABC-123-NG",
          model: "Toyota Hilux 4x4",
          fuelLevel: 0.75,
          isGpsActive: _isOnline,
          lastSync: "À l'instant",
        ),
      ),
    );
  }

  // ── Quick Actions ─────────────────────────────────────────────────────────
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
              color: AppColors.primary,
              onTap: () {},
            ),
            QuickActionButton(
              icon: Icons.map_outlined,
              label: "Carte Live",
              color: AppColors.accent,
              onTap: () => Navigator.push(
                context,
                AppTransitions.slideUp(const TrackingScreen()),
              ),
            ),
            QuickActionButton(
              icon: Icons.history_rounded,
              label: "Historique",
              color: const Color(0xFF8B5CF6),
              onTap: () {},
            ),
            QuickActionButton(
              icon: Icons.qr_code_scanner_rounded,
              label: "Scanner",
              color: AppColors.warning,
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }

  // ── Map Preview ───────────────────────────────────────────────────────────
  Widget _buildMapPreview() {
    return SliverToBoxAdapter(
      child: Container(
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
                          gradient: AppTheme.primaryGradient,
                          shape: BoxShape.circle,
                          boxShadow: AppTheme.shadowColored(AppColors.primary),
                        ),
                        child: AnimatedRotation(
                          turns: _headingTurns,
                          duration: const Duration(milliseconds: 150),
                          curve: Curves.easeOut,
                          child: const Icon(Icons.navigation_rounded, color: Colors.white, size: 18),
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
            // Bottom row
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
                          color: _isOnline ? AppColors.success : AppColors.textSecondary,
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
                      AppTransitions.slideUp(const TrackingScreen()),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: AppSpacing.roundedMd,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
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
      ),
    );
  }

  // ── Recent Missions ───────────────────────────────────────────────────────
  Widget _buildRecentMissionsHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
        child: Row(
          children: [
            Text("Missions récentes", style: AppTextStyles.h4),
            const Spacer(),
            GestureDetector(
              onTap: () {},
              child: Text(
                "Voir tout",
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.primary,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentMissionsList() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('missions')
          .where('assignedTo', isEqualTo: _authService.currentUid)
          .limit(3)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                  strokeWidth: 2,
                ),
              ),
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return SliverToBoxAdapter(
            child: _buildEmptyMissions(),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final doc = snapshot.data!.docs[index];
                final data = {
                  'id': doc.id,
                  ...(doc.data() as Map<String, dynamic>),
                };
                return MissionCardPro(mission: data);
              },
              childCount: snapshot.data!.docs.length,
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyMissions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 28),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppSpacing.roundedLg,
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.assignment_outlined,
                color: AppColors.textSecondary,
                size: 28,
              ),
            ),
            const SizedBox(height: 14),
            Text("Aucune mission récente", style: AppTextStyles.h5),
            const SizedBox(height: 6),
            Text(
              "Vos prochaines missions apparaîtront ici",
              style: AppTextStyles.bodySm,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ── New Mission Dialog ────────────────────────────────────────────────────
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
                  color: AppColors.surfaceVariant,
                  borderRadius: AppSpacing.roundedMd,
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.title_rounded, size: 16, color: AppColors.textSecondary),
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
                        const Icon(Icons.location_on_outlined, size: 16, color: AppColors.primary),
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
              // Bouton Accepter — pleine largeur
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isAcceptingMission
                      ? null
                      : () => _acceptMissionFromDialog(missionId),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: AppSpacing.roundedMd),
                  ),
                  child: _isAcceptingMission
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          "Accepter",
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
              // Bouton Ignorer — pleine largeur, discret
              SizedBox(
                width: double.infinity,
                height: 44,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    shape: RoundedRectangleBorder(
                        borderRadius: AppSpacing.roundedMd),
                  ),
                  child: const Text(
                    "Ignorer",
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0,
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

  Future<void> _startMissionNotifications() async {
    final uid = _authService.currentUid;
    if (uid != null) await FirebaseNotificationService.instance.startForDriver(uid);
  }

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
        AppTransitions.slideUp(const TrackingScreen()),
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
