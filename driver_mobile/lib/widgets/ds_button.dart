import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum DsButtonVariant { primary, secondary, outline, ghost, danger }
enum DsButtonSize { sm, md, lg }

class DsButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final DsButtonVariant variant;
  final DsButtonSize size;
  final IconData? icon;
  final bool iconTrailing;
  final bool isLoading;
  final bool fullWidth;
  final bool gradient;

  const DsButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = DsButtonVariant.primary,
    this.size = DsButtonSize.md,
    this.icon,
    this.iconTrailing = false,
    this.isLoading = false,
    this.fullWidth = true,
    this.gradient = false,
  });

  const DsButton.outline({
    super.key,
    required this.label,
    this.onPressed,
    this.size = DsButtonSize.md,
    this.icon,
    this.iconTrailing = false,
    this.isLoading = false,
    this.fullWidth = true,
  }) : variant = DsButtonVariant.outline,
       gradient = false;

  const DsButton.ghost({
    super.key,
    required this.label,
    this.onPressed,
    this.size = DsButtonSize.md,
    this.icon,
    this.iconTrailing = false,
    this.isLoading = false,
    this.fullWidth = false,
  }) : variant = DsButtonVariant.ghost,
       gradient = false;

  const DsButton.danger({
    super.key,
    required this.label,
    this.onPressed,
    this.size = DsButtonSize.md,
    this.icon,
    this.iconTrailing = false,
    this.isLoading = false,
    this.fullWidth = true,
  }) : variant = DsButtonVariant.danger,
       gradient = false;

  @override
  Widget build(BuildContext context) {
    final _heights = {
      DsButtonSize.sm: AppSpacing.btnHeightSm,
      DsButtonSize.md: AppSpacing.btnHeightMd,
      DsButtonSize.lg: AppSpacing.btnHeightLg,
    };

    final _paddings = {
      DsButtonSize.sm: const EdgeInsets.symmetric(horizontal: 14),
      DsButtonSize.md: const EdgeInsets.symmetric(horizontal: 20),
      DsButtonSize.lg: const EdgeInsets.symmetric(horizontal: 28),
    };

    final _fontSizes = {
      DsButtonSize.sm: 13.0,
      DsButtonSize.md: 15.0,
      DsButtonSize.lg: 16.0,
    };

    final _iconSizes = {
      DsButtonSize.sm: 16.0,
      DsButtonSize.md: 18.0,
      DsButtonSize.lg: 20.0,
    };

    final height = _heights[size]!;
    final padding = _paddings[size]!;
    final fontSize = _fontSizes[size]!;
    final iconSize = _iconSizes[size]!;

    final isDisabled = onPressed == null || isLoading;

    // ── Colors per variant ────────────────────────────────────────────────
    Color bgColor;
    Color fgColor;
    Color borderColor;

    switch (variant) {
      case DsButtonVariant.primary:
        bgColor = isDisabled ? AppColors.primary.withValues(alpha: 0.5) : AppColors.primary;
        fgColor = Colors.white;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.secondary:
        bgColor = AppColors.accent.withValues(alpha: isDisabled ? 0.3 : 1);
        fgColor = isDisabled ? Colors.white54 : AppColors.textHeading;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = isDisabled ? AppColors.primary.withValues(alpha: 0.4) : AppColors.primary;
        borderColor = isDisabled ? AppColors.primary.withValues(alpha: 0.3) : AppColors.primary;
        break;
      case DsButtonVariant.ghost:
        bgColor = Colors.transparent;
        fgColor = isDisabled ? AppColors.textSecondary.withValues(alpha: 0.5) : AppColors.primary;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.danger:
        bgColor = isDisabled ? AppColors.error.withValues(alpha: 0.5) : AppColors.error;
        fgColor = Colors.white;
        borderColor = Colors.transparent;
        break;
    }

    Widget child;
    if (isLoading) {
      child = SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          color: fgColor,
          strokeWidth: 2,
        ),
      );
    } else {
      final textWidget = Text(
        label,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
          color: fgColor,
        ),
      );

      if (icon != null) {
        final iconWidget = Icon(icon, color: fgColor, size: iconSize);
        child = Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: iconTrailing
              ? [textWidget, const SizedBox(width: 8), iconWidget]
              : [iconWidget, const SizedBox(width: 8), textWidget],
        );
      } else {
        child = textWidget;
      }
    }

    Widget btn = AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      height: height,
      width: fullWidth ? double.infinity : null,
      decoration: BoxDecoration(
        gradient: gradient && variant == DsButtonVariant.primary && !isDisabled
            ? AppTheme.primaryGradient
            : null,
        color: gradient ? null : bgColor,
        borderRadius: AppSpacing.roundedLg,
        border: borderColor != Colors.transparent
            ? Border.all(color: borderColor, width: 1.5)
            : null,
        boxShadow: !isDisabled && variant == DsButtonVariant.primary
            ? AppTheme.shadowColored(AppColors.primary)
            : null,
      ),
      padding: padding,
      child: Center(child: child),
    );

    return GestureDetector(
      onTap: isDisabled ? null : onPressed,
      child: btn,
    );
  }
}

/// Bouton icône circulaire
class DsIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final Color? color;
  final Color? iconColor;
  final double size;
  final String? tooltip;
  final bool bordered;

  const DsIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.color,
    this.iconColor,
    this.size = 40,
    this.tooltip,
    this.bordered = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = color ?? AppColors.surfaceVariant;
    final fg = iconColor ?? AppColors.textPrimary;

    Widget btn = GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          border: bordered
              ? Border.all(color: AppColors.border)
              : null,
        ),
        child: Icon(icon, color: fg, size: size * 0.5),
      ),
    );

    if (tooltip != null) {
      return Tooltip(message: tooltip!, child: btn);
    }
    return btn;
  }
}
