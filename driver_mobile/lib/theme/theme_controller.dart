import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Contrôleur global du thème (clair / sombre / système).
///
/// Persiste le choix de l'utilisateur via [SharedPreferences]. Singleton simple
/// exposé en global ([themeController]) — pas de package d'état requis.
class ThemeController extends ChangeNotifier {
  static const String _prefsKey = 'theme_mode';

  ThemeMode _mode = ThemeMode.light;
  ThemeMode get mode => _mode;

  /// `true` si l'app est actuellement en sombre forcé.
  bool get isDark => _mode == ThemeMode.dark;

  /// Charge le choix sauvegardé au démarrage.
  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefsKey);
      _mode = _decode(saved);
      notifyListeners();
    } catch (_) {
      // En cas d'échec de lecture, on reste sur le défaut (système).
    }
  }

  /// Bascule clair ↔ sombre (utilisé par le switch des réglages).
  Future<void> toggleDark(bool dark) async {
    await setMode(dark ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> setMode(ThemeMode mode) async {
    if (_mode == mode) return;
    _mode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, _encode(mode));
    } catch (_) {
      // Persistance best-effort : l'UI a déjà été mise à jour.
    }
  }

  static String _encode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.dark:
        return 'dark';
      case ThemeMode.light:
        return 'light';
      case ThemeMode.system:
        return 'system';
    }
  }

  static ThemeMode _decode(String? value) {
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.light;
    }
  }
}

/// Instance globale partagée par `main.dart` et l'écran de réglages.
final ThemeController themeController = ThemeController();
