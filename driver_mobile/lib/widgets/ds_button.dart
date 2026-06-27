import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

enum DsButtonVariant { primary, secondary, outline, ghost, danger }
enum DsButtonSize { sm, md, lg }

class DsButton extends StatefulWidget {
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
  })  : variant = DsButtonVariant.outline,
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
  })  : variant = DsButtonVariant.ghost,
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
  })  : variant = DsButtonVariant.danger,
        gradient = false;

  @override
  State<DsButton> createState() => _DsButtonState();
}

class _DsButtonState extends State<DsButton> {
  bool _pressed = false;

  void _onTapDown(TapDownDetails _) {
    if (widget.onPressed == null || widget.isLoading) return;
    HapticFeedback.lightImpact();
    setState(() => _pressed = true);
  }

  void _onTapUp(TapUpDetails _) => setState(() => _pressed = false);
  void _onTapCancel() => setState(() => _pressed = false);

  @override
  Widget build(BuildContext context) {
    const heights = {
      DsButtonSize.sm: AppSpacing.btnHeightSm,
      DsButtonSize.md: AppSpacing.btnHeightMd,
      DsButtonSize.lg: AppSpacing.btnHeightLg,
    };
    const paddings = {
      DsButtonSize.sm: EdgeInsets.symmetric(horizontal: 14),
      DsButtonSize.md: EdgeInsets.symmetric(horizontal: 20),
      DsButtonSize.lg: EdgeInsets.symmetric(horizontal: 28),
    };
    const fontSizes = {
      DsButtonSize.sm: 13.0,
      DsButtonSize.md: 15.0,
      DsButtonSize.lg: 16.0,
    };
    const iconSizes = {
      DsButtonSize.sm: 16.0,
      DsButtonSize.md: 18.0,
      DsButtonSize.lg: 20.0,
    };

    final height = heights[widget.size]!;
    final padding = paddings[widget.size]!;
    final fontSize = fontSizes[widget.size]!;
    final iconSize = iconSizes[widget.size]!;
    final isDisabled = widget.onPressed == null || widget.isLoading;

    // ── Colors per variant ────────────────────────────────────────────────
    Color bgColor;
    Color fgColor;
    Color borderColor;

    switch (widget.variant) {
      case DsButtonVariant.primary:
        bgColor = isDisabled
            ? AppColors.primary.withValues(alpha: 0.5)
            : AppColors.primary;
        fgColor = Colors.white;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.secondary:
        bgColor =
            AppColors.accent.withValues(alpha: isDisabled ? 0.3 : 1);
        fgColor = isDisabled ? Colors.white54 : AppColors.textHeading;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = isDisabled
            ? AppColors.primary.withValues(alpha: 0.4)
            : AppColors.primary;
        borderColor = isDisabled
            ? AppColors.primary.withValues(alpha: 0.3)
            : AppColors.primary;
        break;
      case DsButtonVariant.ghost:
        bgColor = Colors.transparent;
        fgColor = isDisabled
            ? AppColors.textSecondary.withValues(alpha: 0.5)
            : AppColors.primary;
        borderColor = Colors.transparent;
        break;
      case DsButtonVariant.danger:
        bgColor = isDisabled
            ? AppColors.error.withValues(alpha: 0.5)
            : AppColors.error;
        fgColor = Colors.white;
        borderColor = Colors.transparent;
        break;
    }

    // ── Content ───────────────────────────────────────────────────────────
    Widget content;
    if (widget.isLoading) {
      content = SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(color: fgColor, strokeWidth: 2),
      );
    } else {
      final textWidget = Text(
        widget.label,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
          color: fgColor,
        ),
      );
      if (widget.icon != null) {
        final iconWidget =
            Icon(widget.icon, color: fgColor, size: iconSize);
        content = Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: widget.iconTrailing
              ? [textWidget, const SizedBox(width: 8), iconWidget]
              : [iconWidget, const SizedBox(width: 8), textWidget],
        );
      } else {
        content = textWidget;
      }
    }

    final btn = AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      height: height,
      width: widget.fullWidth ? double.infinity : null,
      decoration: BoxDecoration(
        gradient: widget.gradient &&
                widget.variant == DsButtonVariant.primary &&
                !isDisabled
            ? AppTheme.primaryGradient
            : null,
        color: widget.gradient ? null : bgColor,
        borderRadius: AppSpacing.roundedLg,
        border: borderColor != Colors.transparent
            ? Border.all(color: borderColor, width: 1.5)
            : null,
        boxShadow: !isDisabled && widget.variant == DsButtonVariant.primary
            ? AppTheme.shadowColored(AppColors.primary)
            : null,
      ),
      padding: padding,
      child: Center(child: content),
    );

    return GestureDetector(
      onTap: isDisabled ? null : widget.onPressed,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedScale(
        scale: _pressed && !isDisabled ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: btn,
      ),
    );
  }
}

// ── Bouton icône circulaire ───────────────────────────────────────────────────
class DsIconButton extends StatefulWidget {
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
  State<DsIconButton> createState() => _DsIconButtonState();
}

class _DsIconButtonState extends State<DsIconButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final bg = widget.color ?? AppColors.surfaceVariant;
    final fg = widget.iconColor ?? AppColors.textPrimary;

    Widget result = GestureDetector(
      onTap: widget.onTap,
      onTapDown: widget.onTap != null
          ? (_) {
              HapticFeedback.lightImpact();
              setState(() => _pressed = true);
            }
          : null,
      onTapUp: widget.onTap != null
          ? (_) => setState(() => _pressed = false)
          : null,
      onTapCancel: widget.onTap != null
          ? () => setState(() => _pressed = false)
          : null,
      child: AnimatedScale(
        scale: _pressed && widget.onTap != null ? 0.90 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: bg,
            shape: BoxShape.circle,
            border: widget.bordered ? Border.all(color: AppColors.border) : null,
          ),
          child: Icon(widget.icon, color: fg, size: widget.size * 0.5),
        ),
      ),
    );

    if (widget.tooltip != null) {
      return Tooltip(message: widget.tooltip!, child: result);
    }
    return result;
  }
}
