import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Carte de base du design system.
/// Remplace les Container(decoration: BoxDecoration...) éparpillés dans les screens.
class DsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final double radius;
  final List<BoxShadow>? shadow;
  final Border? border;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final double? width;
  final double? height;
  final Clip clipBehavior;

  const DsCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.color,
    this.radius = AppSpacing.radiusLg,
    this.shadow,
    this.border,
    this.onTap,
    this.gradient,
    this.width,
    this.height,
    this.clipBehavior = Clip.antiAlias,
  });

  const DsCard.flat({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.color,
    this.radius = AppSpacing.radiusLg,
    this.border,
    this.onTap,
    this.gradient,
    this.width,
    this.height,
    this.clipBehavior = Clip.antiAlias,
  }) : shadow = const [];

  @override
  Widget build(BuildContext context) {
    final effectiveColor = gradient != null ? Colors.transparent : (color ?? AppColors.surface);
    final effectiveShadow = shadow ?? AppTheme.shadowSm;
    final effectiveBorder = border ??
        Border.all(color: AppColors.borderLight, width: 1);

    Widget card = Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding,
      clipBehavior: clipBehavior,
      decoration: BoxDecoration(
        color: effectiveColor,
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        border: effectiveBorder,
        boxShadow: effectiveShadow,
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: card);
    }
    return card;
  }
}

/// Variante de card avec header coloré (pour les statuts, KPI, etc.)
class DsColoredCard extends StatelessWidget {
  final Widget child;
  final Color color;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double radius;
  final double opacity;

  const DsColoredCard({
    super.key,
    required this.child,
    required this.color,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.radius = AppSpacing.radiusLg,
    this.opacity = 0.08,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: color.withValues(alpha: opacity),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: child,
    );
  }
}
