import 'package:flutter/material.dart';
import '../main.dart' show AuthWrapper;
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Entrée : fade + scale du logo
  late final AnimationController _entranceCtrl;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  // Glow pulsant sur l'icône (loop)
  late final AnimationController _glowCtrl;
  late final Animation<double> _glow;

  @override
  void initState() {
    super.initState();

    _entranceCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fade  = CurvedAnimation(parent: _entranceCtrl, curve: Curves.easeIn);
    _scale = Tween<double>(begin: 0.75, end: 1.0).animate(
      CurvedAnimation(parent: _entranceCtrl, curve: Curves.easeOutBack),
    );

    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
    _glow = Tween<double>(begin: 0.22, end: 0.52).animate(
      CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut),
    );

    _entranceCtrl.forward();
    _goToNextScreen();
  }

  // ── Navigation — identique à l'original ───────────────────────────────────
  Future<void> _goToNextScreen() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AuthWrapper()),
    );
  }

  @override
  void dispose() {
    _entranceCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // ── Logo + texte (centré) ─────────────────────────────────────────
          Center(
            child: FadeTransition(
              opacity: _fade,
              child: ScaleTransition(
                scale: _scale,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Icône voiture dans carré arrondi violet avec glow pulsant
                    AnimatedBuilder(
                      animation: _glow,
                      builder: (_, __) => Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          gradient: AppTheme.violetButtonGradient,
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.violet.withValues(alpha: _glow.value),
                              blurRadius: 48,
                              spreadRadius: 6,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.directions_car_rounded,
                          color: Colors.white,
                          size: 42,
                          semanticLabel: 'Geoconsulting Fleet',
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // "Geoconsulting"
                    Text(
                      'Geoconsulting',
                      style: AppTextStyles.jkHeroName.copyWith(
                        color: AppColors.textHeadingV2,
                        fontSize: 22,
                      ),
                    ),

                    const SizedBox(height: 5),

                    // "FLEET"
                    Text(
                      'F L O T T E',
                      style: AppTextStyles.jkBadge.copyWith(
                        color: AppColors.violet,
                        fontSize: 11,
                        letterSpacing: 4,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Dots loader en bas ────────────────────────────────────────────
          Positioned(
            bottom: 56,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _fade,
              child: const _StaggeredDots(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dots animés (remplace CircularProgressIndicator) ─────────────────────────
class _StaggeredDots extends StatefulWidget {
  const _StaggeredDots();

  @override
  State<_StaggeredDots> createState() => _StaggeredDotsState();
}

class _StaggeredDotsState extends State<_StaggeredDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (i) {
            return AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) {
                final delay = i * 0.2;
                final t = (_ctrl.value - delay).clamp(0.0, 1.0);
                // Aller-retour d'opacité 0.25 → 1 → 0.25
                final opacity =
                    (t < 0.5 ? t * 2 : 1.0 - (t - 0.5) * 2).clamp(0.25, 1.0);
                return Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: AppColors.violet.withValues(alpha: opacity),
                    shape: BoxShape.circle,
                  ),
                );
              },
            );
          }),
        ),
        const SizedBox(height: 10),
        Text(
          'Chargement…',
          style: AppTextStyles.jkVersion.copyWith(color: AppColors.textHint),
        ),
      ],
    );
  }
}
