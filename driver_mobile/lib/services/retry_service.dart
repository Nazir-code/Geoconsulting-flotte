import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';

class RetryService {
  /// Exécute une fonction avec un backoff exponentiel en cas d'échec
  static Future<T> executeWithRetry<T>(
    Future<T> Function() action, {
    int maxAttempts = 5,
    Duration initialDelay = const Duration(seconds: 1),
    double factor = 2.0,
    bool Function(Object)? retryIf,
  }) async {
    int attempt = 0;
    Duration delay = initialDelay;

    while (true) {
      try {
        attempt++;
        return await action();
      } catch (e) {
        if (attempt >= maxAttempts || (retryIf != null && !retryIf(e))) {
          debugPrint("❌ [RetryService] Échec définitif après $attempt tentatives: $e");
          rethrow;
        }

        // Calcul du délai avec jitter (variation aléatoire pour éviter les pics de charge)
        final double jitter = Random().nextDouble() * 0.2 + 0.9; // 0.9 à 1.1
        final int nextDelayMs = (delay.inMilliseconds * factor * jitter).toInt();

        debugPrint("⚠️ [RetryService] Tentative $attempt échouée. Nouvelle tentative dans ${delay.inSeconds}s...");

        await Future.delayed(delay);
        delay = Duration(milliseconds: nextDelayMs);
      }
    }
  }
}
