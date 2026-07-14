import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

// ─── Data ─────────────────────────────────────────────────────────────────────

class AnimatedNavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final int badgeCount;

  const AnimatedNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.badgeCount = 0,
  });
}

// ─── AnimatedBottomNav ────────────────────────────────────────────────────────

/// Barre de navigation inférieure custom avec indicateur pill animé (v2).
///
/// Remplace le [NavigationBar] Material 3 de [MainNavigationScreen].
/// Même API : [selectedIndex] + [onTap].
///
/// Animation : une ligne violette (32×2 px) glisse entre les onglets via
/// [AnimatedPositioned] avec [Curves.elasticOut] — effet spring identique
/// au `layoutId` de Framer Motion de la maquette.
class AnimatedBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final List<AnimatedNavItem> items;

  const AnimatedBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onTap,
    required this.items,
  });

  /// Constructeur avec les 5 items par défaut de l'application.
  factory AnimatedBottomNav.defaults({
    required int selectedIndex,
    required ValueChanged<int> onTap,
    int notifCount = 0,
  }) {
    return AnimatedBottomNav(
      selectedIndex: selectedIndex,
      onTap: onTap,
      items: [
        const AnimatedNavItem(
          icon: Icons.grid_view_outlined,
          selectedIcon: Icons.grid_view_rounded,
          label: 'Accueil',
        ),
        const AnimatedNavItem(
          icon: Icons.satellite_alt_outlined,
          selectedIcon: Icons.satellite_alt_rounded,
          label: 'Carte',
        ),
        const AnimatedNavItem(
          icon: Icons.work_outline_rounded,
          selectedIcon: Icons.work_rounded,
          label: 'Missions',
        ),
        AnimatedNavItem(
          icon: Icons.campaign_outlined,
          selectedIcon: Icons.campaign_rounded,
          label: 'Alertes',
          badgeCount: notifCount,
        ),
        const AnimatedNavItem(
          icon: Icons.badge_outlined,
          selectedIcon: Icons.badge_rounded,
          label: 'Profil',
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.palette.surface.withValues(alpha: 0.97),
        border: Border(
          top: BorderSide(
            color: context.palette.border,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final tabCount = items.length;
            final tabWidth = constraints.maxWidth / tabCount;
            // Centre l'indicateur (32 px de large) dans l'onglet actif
            final indicatorLeft =
                tabWidth * selectedIndex + (tabWidth / 2) - 16;

            return SizedBox(
              height: 62,
              child: Stack(
                children: [
                  // ── Indicateur pill animé ────────────────────────────────
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 340),
                    curve: Curves.elasticOut,
                    top: 0,
                    left: indicatorLeft,
                    child: Container(
                      width: 32,
                      height: 2.5,
                      decoration: BoxDecoration(
                        color: AppColors.violet,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),

                  // ── Onglets ──────────────────────────────────────────────
                  Row(
                    children: List.generate(tabCount, (i) {
                      return Expanded(
                        child: _NavTab(
                          item: items[i],
                          isActive: i == selectedIndex,
                          onTap: () {
                            if (selectedIndex != i) {
                              HapticFeedback.selectionClick();
                            }
                            onTap(i);
                          },
                        ),
                      );
                    }),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─── _NavTab ──────────────────────────────────────────────────────────────────

class _NavTab extends StatefulWidget {
  final AnimatedNavItem item;
  final bool isActive;
  final VoidCallback onTap;

  const _NavTab({
    required this.item,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_NavTab> createState() => _NavTabState();
}

class _NavTabState extends State<_NavTab>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleCtrl;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _scaleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.0,
      upperBound: 1.0,
      value: 1.0,
    );
    _scaleAnim = Tween<double>(begin: 0.86, end: 1.0).animate(
      CurvedAnimation(parent: _scaleCtrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) => _scaleCtrl.reverse();
  void _onTapUp(TapUpDetails _) {
    _scaleCtrl.forward();
    widget.onTap();
  }
  void _onTapCancel() => _scaleCtrl.forward();

  @override
  Widget build(BuildContext context) {
    final isActive = widget.isActive;
    final iconColor = isActive ? AppColors.violet : context.palette.textSecondary;
    final labelColor = isActive ? AppColors.violet : context.palette.textSecondary;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: SizedBox(
          height: 62,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Décalage léger vers le haut quand actif (comme la maquette)
              AnimatedSlide(
                offset: isActive ? const Offset(0, -0.06) : Offset.zero,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 180),
                      child: Icon(
                        isActive
                            ? widget.item.selectedIcon
                            : widget.item.icon,
                        key: ValueKey(isActive),
                        color: iconColor,
                        size: 22,
                      ),
                    ),
                    // Badge de notification
                    if (widget.item.badgeCount > 0)
                      Positioned(
                        top: -4,
                        right: -8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '${widget.item.badgeCount}',
                            style: AppTextStyles.jkBadge.copyWith(
                              color: Colors.white,
                              fontSize: 9,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 180),
                style: AppTextStyles.jkBadge.copyWith(
                  color: labelColor,
                  fontSize: 9,
                  fontWeight:
                      isActive ? FontWeight.w700 : FontWeight.w500,
                ),
                child: Text(widget.item.label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
