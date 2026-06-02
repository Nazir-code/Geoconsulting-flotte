import 'package:flutter/material.dart';

class AppColors {
  // ─── Brand Primary ────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF0E7490); // Cyan pétrole
  static const Color primaryDark  = Color(0xFF0C6280); // Shade foncé
  static const Color primaryLight = Color(0xFFCFFAFE); // Tint clair

  // ─── Brand Accent ─────────────────────────────────────────────────────────
  static const Color accent       = Color(0xFF22D3EE); // Cyan électrique
  static const Color accentDark   = Color(0xFF0891B2);
  static const Color accentLight  = Color(0xFFE0F2FE);

  // ─── Semantic ─────────────────────────────────────────────────────────────
  static const Color success      = Color(0xFF10B981); // Vert émeraude
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color successDark  = Color(0xFF065F46);

  static const Color warning      = Color(0xFFF59E0B); // Ambre
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color warningDark  = Color(0xFF92400E);

  static const Color error        = Color(0xFFEF4444); // Rouge
  static const Color errorLight   = Color(0xFFFEE2E2);
  static const Color errorDark    = Color(0xFF7F1D1D);

  static const Color info         = Color(0xFF3B82F6); // Bleu
  static const Color infoLight    = Color(0xFFDBEAFE);
  static const Color infoDark     = Color(0xFF1E3A8A);

  // ─── Status spécifiques (missions) ───────────────────────────────────────
  static const Color statusPending    = Color(0xFFF59E0B); // En attente
  static const Color statusActive     = Color(0xFF10B981); // En cours
  static const Color statusCompleted  = Color(0xFF6366F1); // Terminé
  static const Color statusCancelled  = Color(0xFFEF4444); // Annulé
  static const Color statusAssigned   = Color(0xFF3B82F6); // Assigné

  // ─── Neutrals ─────────────────────────────────────────────────────────────
  static const Color textHeading   = Color(0xFF0F172A); // Titres - Bleu nuit
  static const Color textPrimary   = Color(0xFF1E293B); // Corps principal
  static const Color textSecondary = Color(0xFF64748B); // Secondaire / sous-titres
  static const Color textHint      = Color(0xFF94A3B8); // Placeholder
  static const Color textDisabled  = Color(0xFFCBD5E1); // Désactivé

  // ─── Surfaces ─────────────────────────────────────────────────────────────
  static const Color background    = Color(0xFFF8FAFC); // Fond global
  static const Color surface       = Color(0xFFFFFFFF); // Cards, inputs
  static const Color surfaceVariant= Color(0xFFF1F5F9); // Surface alternative
  static const Color surfaceHover  = Color(0xFFE2E8F0); // Hover state

  // ─── Borders ──────────────────────────────────────────────────────────────
  static const Color border        = Color(0xFFE2E8F0); // Bordure standard
  static const Color borderLight   = Color(0xFFF1F5F9); // Bordure légère
  static const Color borderFocus   = primary;            // Bordure focus

  // ─── Dark Mode ────────────────────────────────────────────────────────────
  static const Color darkBackground     = Color(0xFF0F172A);
  static const Color darkSurface        = Color(0xFF1E293B);
  static const Color darkSurfaceVariant = Color(0xFF334155);
  static const Color darkBorder         = Color(0xFF475569);
  static const Color darkTextPrimary    = Color(0xFFE2E8F0);
  static const Color darkTextSecondary  = Color(0xFF94A3B8);

  // ─── Priority colors ──────────────────────────────────────────────────────
  static const Color priorityHigh   = Color(0xFFEF4444);
  static const Color priorityMedium = Color(0xFFF59E0B);
  static const Color priorityLow    = Color(0xFF10B981);
  static const Color priorityUrgent = Color(0xFF7C3AED); // Violet / urgent

  // ─── Overlay / Scrim ──────────────────────────────────────────────────────
  static const Color overlayLight = Color(0x0A000000); // 4% black
  static const Color overlayDark  = Color(0x66000000); // 40% black

  // ─── Gradient helpers ─────────────────────────────────────────────────────
  static Color withAlpha(Color color, double opacity) =>
      color.withValues(alpha: opacity);
}
