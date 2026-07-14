import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Carte de base du design system.
/// Remplace les Container(decoration: BoxDecoration...) éparpillés dans les screens.
class DsCard extends StatefulWidget {
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
  State<DsCard> createState() => _DsCardState();
}

class _DsCardState extends State<DsCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveColor = widget.gradient != null
        ? Colors.transparent
        : (widget.color ?? cs.surface);
    final effectiveShadow = widget.shadow ?? AppTheme.shadowCard;
    final effectiveBorder = widget.border ??
        Border.all(color: const Color(0x0E000000), width: 1);

    final card = Container(
      width: widget.width,
      height: widget.height,
      margin: widget.margin,
      padding: widget.padding,
      clipBehavior: widget.clipBehavior,
      decoration: BoxDecoration(
        color: effectiveColor,
        gradient: widget.gradient,
        borderRadius: BorderRadius.circular(widget.radius),
        border: effectiveBorder,
        boxShadow: effectiveShadow,
      ),
      child: widget.child,
    );

    if (widget.onTap != null) {
      return GestureDetector(
        onTap: widget.onTap,
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOut,
          child: card,
        ),
      );
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
