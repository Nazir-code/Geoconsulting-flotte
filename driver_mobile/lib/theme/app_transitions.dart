import 'package:flutter/material.dart';

/// Transition "smooth mou" — fondu + léger glissement vers le haut (4 %).
/// Utilisée via [pageTransitionsTheme] dans les deux thèmes de l'app,
/// s'applique automatiquement à tout [MaterialPageRoute].
class SoftFadeUpTransitionsBuilder extends PageTransitionsBuilder {
  const SoftFadeUpTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Page entrante : fondu + léger drift vers le haut
    final fadeIn = CurvedAnimation(parent: animation, curve: Curves.easeOut);
    final slideIn = Tween<Offset>(
      begin: const Offset(0.0, 0.04),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));

    // Page sortante (en arrière-plan) : léger recul + assombrissement
    final fadeOut = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeIn),
    );

    return FadeTransition(
      opacity: fadeOut,
      child: FadeTransition(
        opacity: fadeIn,
        child: SlideTransition(position: slideIn, child: child),
      ),
    );
  }
}

abstract class AppTransitions {
  // Slide depuis la droite + fade — navigation standard (sous-pages)
  static PageRoute<T> slideRight<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, animation, __) => page,
      transitionDuration: const Duration(milliseconds: 300),
      reverseTransitionDuration: const Duration(milliseconds: 250),
      transitionsBuilder: (_, animation, __, child) {
        final slide = Tween(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic));

        final fade = Tween<double>(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: const Interval(0.0, 0.6)));

        return SlideTransition(
          position: animation.drive(slide),
          child: FadeTransition(opacity: animation.drive(fade), child: child),
        );
      },
    );
  }

  // Slide depuis le bas — écrans plein écran (carte, tracking)
  static PageRoute<T> slideUp<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, animation, __) => page,
      transitionDuration: const Duration(milliseconds: 350),
      reverseTransitionDuration: const Duration(milliseconds: 280),
      transitionsBuilder: (_, animation, __, child) {
        final slide = Tween(
          begin: const Offset(0.0, 1.0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic));

        return SlideTransition(
          position: animation.drive(slide),
          child: child,
        );
      },
    );
  }

  // Fondu enchaîné — transitions auth (splash → login/home, déconnexion)
  static PageRoute<T> fade<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, animation, __) => page,
      transitionDuration: const Duration(milliseconds: 400),
      reverseTransitionDuration: const Duration(milliseconds: 300),
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(
          opacity: animation.drive(
            Tween<double>(begin: 0.0, end: 1.0)
                .chain(CurveTween(curve: Curves.easeInOut)),
          ),
          child: child,
        );
      },
    );
  }
}
