import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// ── Inherited scope ────────────────────────────────────────────────────────────
class _ShimmerScope extends InheritedWidget {
  final Animation<double> animation;
  const _ShimmerScope({required this.animation, required super.child});

  @override
  bool updateShouldNotify(_ShimmerScope old) => false;

  static Animation<double>? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_ShimmerScope>()?.animation;
}

/// Wraps a skeleton layout and drives a shared left-to-right shimmer
/// animation for all [DsShimmerBox] descendants. Only one
/// [AnimationController] is created regardless of the number of boxes.
class DsShimmer extends StatefulWidget {
  final Widget child;
  const DsShimmer({super.key, required this.child});

  @override
  State<DsShimmer> createState() => _DsShimmerState();
}

class _DsShimmerState extends State<DsShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      _ShimmerScope(animation: _ctrl, child: widget.child);
}

// ── Shimmer box ────────────────────────────────────────────────────────────────
/// A placeholder rectangle with a left-to-right shimmer sweep.
/// Requires a [DsShimmer] ancestor; falls back to a static gray box otherwise.
class DsShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const DsShimmerBox({
    super.key,
    this.width = double.infinity,
    this.height = 14.0,
    this.radius = 8.0,
  });

  static const Color _base = Color(0xFFEEF0F4);
  static const Color _highlight = Color(0xFFF8FAFC);

  @override
  Widget build(BuildContext context) {
    final anim = _ShimmerScope.of(context);
    if (anim == null) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: _base,
          borderRadius: BorderRadius.circular(radius),
        ),
      );
    }
    return AnimatedBuilder(
      animation: anim,
      builder: (_, __) {
        final t = anim.value;
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(-2.0 + t * 4.0, 0.0),
              end: Alignment(0.0 + t * 4.0, 0.0),
              colors: const [_base, _highlight, _base],
              stops: const [0.0, 0.5, 1.0],
            ),
            borderRadius: BorderRadius.circular(radius),
          ),
        );
      },
    );
  }
}

// ── MissionCard skeleton ────────────────────────────────────────────────────────
/// Placeholder shaped like [MissionCardPro], shown while missions load.
class MissionCardSkeleton extends StatelessWidget {
  const MissionCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status strip
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(AppSpacing.radiusLg),
              topRight: Radius.circular(AppSpacing.radiusLg),
            ),
            child: const DsShimmerBox(height: 3.0, radius: 0.0),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Badge row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    DsShimmerBox(width: 80.0, height: 22.0, radius: 11.0),
                    DsShimmerBox(width: 90.0, height: 22.0, radius: 11.0),
                  ],
                ),
                SizedBox(height: 14),
                // Title lines
                DsShimmerBox(height: 16.0, radius: 8.0),
                SizedBox(height: 6),
                DsShimmerBox(width: 200.0, height: 16.0, radius: 8.0),
                SizedBox(height: 10),
                // Location
                DsShimmerBox(width: 220.0, height: 13.0, radius: 6.0),
                SizedBox(height: 14),
                // Footer
                Row(
                  children: [
                    DsShimmerBox(width: 110.0, height: 12.0, radius: 5.0),
                    Spacer(),
                    DsShimmerBox(width: 56.0, height: 12.0, radius: 5.0),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── KpiCard skeleton ──────────────────────────────────────────────────────────
/// Placeholder shaped like [KpiCard], shown while stream data loads.
class KpiCardSkeleton extends StatelessWidget {
  const KpiCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              DsShimmerBox(width: 38.0, height: 38.0, radius: 10.0),
              DsShimmerBox(width: 50.0, height: 16.0, radius: 8.0),
            ],
          ),
          SizedBox(height: 10),
          DsShimmerBox(width: 56.0, height: 28.0, radius: 8.0),
          SizedBox(height: 6),
          DsShimmerBox(width: 90.0, height: 12.0, radius: 5.0),
        ],
      ),
    );
  }
}
