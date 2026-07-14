import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Header violet dégradé réutilisable — Dashboard + Profil.
/// Remplace progressivement les AppBars/TopBars sur les écrans v2.
///
/// Structure :
///   ┌──────────────────────────────────┐
///   │  [greeting]    [trailing]        │  ← ligne salutation + actions
///   │  [name]                          │
///   │  [subtitle?]                     │
///   │  [bottom?]                       │  ← VehiclePill ou autre
///   └──────────────────────────────────┘
///
/// Les cercles décoratifs sont rendus en Overlay interne (pointer-events: none).
class VioletGradientHeader extends StatelessWidget {
  final String greeting;
  final String name;
  final String? subtitle;
  final Widget? trailing;
  final Widget? bottom;
  final EdgeInsetsGeometry contentPadding;

  const VioletGradientHeader({
    super.key,
    required this.greeting,
    required this.name,
    this.subtitle,
    this.trailing,
    this.bottom,
    this.contentPadding = const EdgeInsets.fromLTRB(20, 8, 20, 20),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.violetHeaderGradient,
      ),
      child: Stack(
        children: [
          // ── Cercles décoratifs (opacity 10%) ──────────────────────────────
          Positioned(
            top: -20,
            right: -20,
            child: _DecorCircle(size: 160),
          ),
          Positioned(
            top: 40,
            right: 70,
            child: _DecorCircle(size: 70),
          ),
          Positioned(
            bottom: -30,
            left: -16,
            child: _DecorCircle(size: 130),
          ),

          // ── Contenu ───────────────────────────────────────────────────────
          SafeArea(
            bottom: false,
            child: Padding(
              padding: contentPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Ligne salutation + actions
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(greeting, style: AppTextStyles.jkGreeting),
                            const SizedBox(height: 2),
                            Text(
                              name,
                              style: AppTextStyles.jkHeroName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (subtitle != null) ...[
                              const SizedBox(height: 2),
                              Text(subtitle!, style: AppTextStyles.jkRoleOnDark),
                            ],
                          ],
                        ),
                      ),
                      if (trailing != null) ...[
                        const SizedBox(width: 12),
                        trailing!,
                      ],
                    ],
                  ),

                  // Contenu optionnel sous la salutation (VehiclePill, stats…)
                  if (bottom != null) ...[
                    const SizedBox(height: 16),
                    bottom!,
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Cercle décoratif translucide — utilisé dans le header violet.
class _DecorCircle extends StatelessWidget {
  final double size;
  const _DecorCircle({required this.size});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.10),
            width: 1.5,
          ),
        ),
      ),
    );
  }
}

// ─── VehiclePill ─────────────────────────────────────────────────────────────

/// Pill véhicule affiché dans le header du Dashboard.
/// Montre le modèle, la plaque, le kilométrage et l'état de service.
///
/// Le [StatusSwitch] actuel peut être intégré en [trailing] pour conserver
/// la logique online/offline sans la modifier.
class VehiclePill extends StatelessWidget {
  final String vehicleModel;
  final String plateNumber;

  /// Kilométrage affiché (ex: 48234 → "48 234 km").
  /// Passez `null` pour masquer le kilométrage.
  final int? kmTotal;

  /// `true` = dot vert pulsant + label "En service".
  final bool isOnService;

  /// Action au tap (ex: ouvrir les détails du véhicule).
  final VoidCallback? onTap;

  const VehiclePill({
    super.key,
    required this.vehicleModel,
    required this.plateNumber,
    this.kmTotal,
    this.isOnService = false,
    this.onTap,
  });

  String get _details {
    final plate = plateNumber;
    if (kmTotal == null) return plate;
    return '$plate · ${_formatKm(kmTotal!)} km';
  }

  static String _formatKm(int km) {
    // Format "48 234" avec espace comme séparateur milliers
    final s = km.toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.15),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            // Icône véhicule
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.20),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.directions_car_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),

            // Modèle + plaque
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vehicleModel,
                    style: AppTextStyles.jkCardTitle.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _details,
                    style: AppTextStyles.jkRoleOnDark,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Badge statut de service
            _ServiceBadge(isOnService: isOnService),
          ],
        ),
      ),
    );
  }
}

/// Badge "En service" / "Hors service" avec dot pulsant.
class _ServiceBadge extends StatelessWidget {
  final bool isOnService;
  const _ServiceBadge({required this.isOnService});

  @override
  Widget build(BuildContext context) {
    final dotColor =
        isOnService ? const Color(0xFF34D399) : Colors.white54; // emerald-400 ou gris
    final label = isOnService ? 'En service' : 'Hors ligne';
    final bgColor = isOnService
        ? const Color(0xFF34D399).withValues(alpha: 0.20)
        : Colors.white.withValues(alpha: 0.10);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          isOnService
              ? RepaintBoundary(child: _PulsingDot(color: dotColor, size: 6))
              : Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
          const SizedBox(width: 5),
          Text(
            label,
            style: AppTextStyles.jkBadge.copyWith(
              color: isOnService ? const Color(0xFF6EE7B7) : Colors.white60,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

/// Dot animé pulsant (réplique de DsDot.pulsing sans dépendance circulaire).
class _PulsingDot extends StatefulWidget {
  final Color color;
  final double size;
  const _PulsingDot({required this.color, required this.size});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _scale = Tween<double>(begin: 1.0, end: 2.4).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    _opacity = Tween<double>(begin: 0.5, end: 0.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size * 2.4,
      height: widget.size * 2.4,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Transform.scale(
              scale: _scale.value,
              child: Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: _opacity.value),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── HeaderActionButton ───────────────────────────────────────────────────────

/// Bouton d'action compact pour le trailing du header violet.
/// Exemple : cloche notifications, avatar profil.
class HeaderActionButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final int badgeCount;

  const HeaderActionButton({
    super.key,
    required this.icon,
    this.onTap,
    this.badgeCount = 0,
  });

  @override
  State<HeaderActionButton> createState() => _HeaderActionButtonState();
}

class _HeaderActionButtonState extends State<HeaderActionButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.88 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.15),
              width: 1,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(widget.icon, color: Colors.white, size: 18),
              if (widget.badgeCount > 0)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppColors.warning,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.violetDark,
                        width: 1.5,
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
}

/// Avatar initiales pour le header (ex: "TL" pour Thomas Laurent).
class HeaderAvatar extends StatelessWidget {
  final String initials;
  final VoidCallback? onTap;

  const HeaderAvatar({
    super.key,
    required this.initials,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.20),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.25),
            width: 1.5,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          initials.toUpperCase(),
          style: AppTextStyles.jkBtnSm.copyWith(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
