import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'driver_home.dart';
import 'tracking_screen.dart';
import 'missions_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import '../theme/app_theme.dart';
import '../services/network_service.dart';
import '../widgets/animated_bottom_nav.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  final NetworkService _networkService = NetworkService();

  static const int _notifCount = 2;

  // Pages créées à la demande : seul DriverHome est instancié au démarrage.
  // TrackingScreen (GPS + compass) n'est créé que quand l'utilisateur visite
  // l'onglet Carte pour la première fois — supprime le double stream GPS.
  final List<Widget?> _pageCache = List.filled(5, null);

  // Fade-in doux lors du changement d'onglet.
  late final AnimationController _tabFadeCtrl;

  static Widget _buildPage(int index) => switch (index) {
    0 => const DriverHome(),
    1 => const TrackingScreen(),
    2 => const MissionsScreen(),
    3 => const NotificationsScreen(),
    _ => const ProfileScreen(),
  };

  @override
  void initState() {
    super.initState();
    _tabFadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 160),
      value: 1.0,
    );
    _pageCache[0] = _buildPage(0);
  }

  @override
  void dispose() {
    _tabFadeCtrl.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    HapticFeedback.selectionClick();
    _pageCache[index] ??= _buildPage(index);
    _tabFadeCtrl.forward(from: 0.0);
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          ListenableBuilder(
            listenable: _networkService,
            builder: (context, _) {
              if (_networkService.isOnline) return const SizedBox.shrink();
              return _OfflineBanner();
            },
          ),
          Expanded(
            child: FadeTransition(
              opacity: CurvedAnimation(
                parent: _tabFadeCtrl,
                curve: Curves.easeOut,
              ),
              child: IndexedStack(
                index: _selectedIndex,
                children: List.generate(
                  5,
                  (i) => _pageCache[i] ?? const SizedBox.shrink(),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return AnimatedBottomNav.defaults(
      selectedIndex: _selectedIndex,
      onTap: _onItemTapped,
      notifCount: _notifCount,
    );
  }
}

// ── Offline banner ────────────────────────────────────────────────────────────
class _OfflineBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.error,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      child: SafeArea(
        bottom: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, color: Colors.white, size: 15),
            const SizedBox(width: 8),
            Text(
              "Mode hors ligne — Synchronisation en attente",
              style: AppTextStyles.labelSm.copyWith(
                color: Colors.white,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
