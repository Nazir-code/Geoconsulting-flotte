import 'package:flutter/material.dart';
import '../main.dart' show AuthWrapper;
import '../theme/app_colors.dart';

/// Écran de démarrage (Splash) affiché au lancement de l'application.
///
/// Fond dégradé aux couleurs de la marque (le logo Geoconsulting étant blanc,
/// un fond coloré le met en valeur). Logo animé (fade-in + léger zoom),
/// titre, sous-titre et indicateur de chargement discret.
///
/// Après ~2 secondes, redirige vers [AuthWrapper] qui :
///   • vérifie `FirebaseAuth.instance.currentUser`,
///   • route vers l'accueil (si connecté) ou l'écran de connexion,
///   • démarre les services FCM et GPS.
/// Toute l'architecture d'authentification existante est conservée intacte.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();
    _goToNextScreen();
  }

  Future<void> _goToNextScreen() async {
    // Laisse l'animation se jouer (~2 s au total) avant la redirection.
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const AuthWrapper()),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
        ),
        child: Stack(
          children: [
            // ── Bloc central : logo + titres (animés) ──────────────────────
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo Geoconsulting (blanc) — fallback si l'asset est absent.
                      Image.asset(
                        'assets/images/logo_geoconsulting.png',
                        width: 180,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const Icon(
                          Icons.local_shipping_rounded,
                          color: Colors.white,
                          size: 90,
                        ),
                      ),
                      const SizedBox(height: 28),
                      const Text(
                        'GEOCONSULTING FLEET',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Gestion Intelligente de Flotte',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Indicateur de chargement discret en bas ────────────────────
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 48),
                child: SizedBox(
                  width: 26,
                  height: 26,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
