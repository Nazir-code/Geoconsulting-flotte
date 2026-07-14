import 'package:flutter/material.dart';

/// Palette de couleurs NEUTRES sensible au thème (clair / sombre).
///
/// Seules les couleurs neutres (fonds, surfaces, textes forts, bordures)
/// vivent ici car ce sont les seules qui changent entre clair et sombre.
/// Les couleurs sémantiques (primary, accent, success, warning, error, info,
/// priorités, statuts) restent dans [AppColors] : elles fonctionnent sur les
/// deux fonds et ne changent pas.
///
/// Accès dans un widget : `context.palette.surface`, `context.palette.textPrimary`…
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color surfaceHover;
  final Color border;
  final Color borderLight;
  final Color textHeading;
  final Color textPrimary;
  final Color textSecondary;
  final Color textHint;
  final Color textDisabled;

  const AppPalette({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.surfaceHover,
    required this.border,
    required this.borderLight,
    required this.textHeading,
    required this.textPrimary,
    required this.textSecondary,
    required this.textHint,
    required this.textDisabled,
  });

  // ─── Thème CLAIR (valeurs historiques de AppColors) ───────────────────────
  static const AppPalette light = AppPalette(
    background: Color(0xFFF8FAFC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF1F5F9),
    surfaceHover: Color(0xFFE2E8F0),
    border: Color(0xFFE2E8F0),
    borderLight: Color(0xFFF1F5F9),
    textHeading: Color(0xFF0F172A),
    textPrimary: Color(0xFF1E293B),
    textSecondary: Color(0xFF64748B),
    textHint: Color(0xFF94A3B8),
    textDisabled: Color(0xFFCBD5E1),
  );

  // ─── Thème SOMBRE (Navy bleu nuit, assorti à la marque cyan) ──────────────
  static const AppPalette dark = AppPalette(
    background: Color(0xFF0F172A),
    surface: Color(0xFF1E293B),
    surfaceVariant: Color(0xFF334155),
    surfaceHover: Color(0xFF475569),
    border: Color(0xFF334155),
    borderLight: Color(0xFF273449),
    textHeading: Color(0xFFF1F5F9),
    textPrimary: Color(0xFFE2E8F0),
    textSecondary: Color(0xFF94A3B8),
    textHint: Color(0xFF64748B),
    textDisabled: Color(0xFF475569),
  );

  @override
  AppPalette copyWith({
    Color? background,
    Color? surface,
    Color? surfaceVariant,
    Color? surfaceHover,
    Color? border,
    Color? borderLight,
    Color? textHeading,
    Color? textPrimary,
    Color? textSecondary,
    Color? textHint,
    Color? textDisabled,
  }) {
    return AppPalette(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      surfaceHover: surfaceHover ?? this.surfaceHover,
      border: border ?? this.border,
      borderLight: borderLight ?? this.borderLight,
      textHeading: textHeading ?? this.textHeading,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textHint: textHint ?? this.textHint,
      textDisabled: textDisabled ?? this.textDisabled,
    );
  }

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    return AppPalette(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      surfaceHover: Color.lerp(surfaceHover, other.surfaceHover, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderLight: Color.lerp(borderLight, other.borderLight, t)!,
      textHeading: Color.lerp(textHeading, other.textHeading, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textHint: Color.lerp(textHint, other.textHint, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
    );
  }
}

/// Raccourci d'accès à la palette neutre depuis n'importe quel widget.
extension PaletteContext on BuildContext {
  AppPalette get palette =>
      Theme.of(this).extension<AppPalette>() ?? AppPalette.light;
}
