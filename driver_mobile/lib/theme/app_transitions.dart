import 'package:flutter/material.dart';

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
