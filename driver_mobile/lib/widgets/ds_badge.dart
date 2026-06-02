import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum DsBadgeStyle { filled, outlined, soft }

/// Badge universel (priorité, statut, compteur, label).
class DsBadge extends StatelessWidget {
  final String label;
  final Color color;
  final DsBadgeStyle style;
  final IconData? icon;
  final double fontSize;

  const DsBadge({
    super.key,
    required this.label,
    required this.color,
    this.style = DsBadgeStyle.soft,
    this.icon,
    this.fontSize = 11,
  });

  // ── Factory constructors ─────────────────────────────────────────────────
  factory DsBadge.status(String status) {
    final map = _statusMap[status.toLowerCase()] ??
        (label: status, color: AppColors.textSecondary);
    return DsBadge(label: map.label, color: map.color);
  }

  factory DsBadge.priority(String priority) {
    final map = _priorityMap[priority.toLowerCase()] ??
        (label: priority, color: AppColors.textSecondary);
    return DsBadge(label: map.label, color: map.color, style: DsBadgeStyle.soft);
  }

  static const _statusMap = <String, ({String label, Color color})>{
    'pending':      (label: 'En attente',  color: AppColors.statusPending),
    'en_attente':   (label: 'En attente',  color: AppColors.statusPending),
    'in_progress':  (label: 'En cours',    color: AppColors.statusActive),
    'en_cours':     (label: 'En cours',    color: AppColors.statusActive),
    'completed':    (label: 'Terminé',     color: AppColors.statusCompleted),
    'termine':      (label: 'Terminé',     color: AppColors.statusCompleted),
    'assigned':     (label: 'Assigné',     color: AppColors.statusAssigned),
    'assigne':      (label: 'Assigné',     color: AppColors.statusAssigned),
    'cancelled':    (label: 'Annulé',      color: AppColors.statusCancelled),
    'annule':       (label: 'Annulé',      color: AppColors.statusCancelled),
    'online':       (label: 'En ligne',    color: AppColors.success),
    'offline':      (label: 'Hors ligne',  color: AppColors.textSecondary),
  };

  static const _priorityMap = <String, ({String label, Color color})>{
    'high':    (label: 'Haute',   color: AppColors.priorityHigh),
    'medium':  (label: 'Moyenne', color: AppColors.priorityMedium),
    'low':     (label: 'Faible',  color: AppColors.priorityLow),
    'urgent':  (label: 'URGENT',  color: AppColors.priorityUrgent),
  };

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Border? border;

    switch (style) {
      case DsBadgeStyle.filled:
        bg = color;
        fg = Colors.white;
        break;
      case DsBadgeStyle.outlined:
        bg = Colors.transparent;
        fg = color;
        border = Border.all(color: color, width: 1);
        break;
      case DsBadgeStyle.soft:
        bg = color.withValues(alpha: 0.12);
        fg = color;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppSpacing.roundedFull,
        border: border,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: fg, size: fontSize + 1),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// Indicateur de point (online/offline)
class DsDot extends StatelessWidget {
  final Color color;
  final double size;
  final bool pulsing;

  const DsDot({
    super.key,
    required this.color,
    this.size = 8,
    this.pulsing = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!pulsing) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
    }

    return _PulsingDot(color: color, size: size);
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  final double size;
  const _PulsingDot({required this.color, required this.size});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
    _scale = Tween<double>(begin: 1.0, end: 2.2).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
    _opacity = Tween<double>(begin: 0.6, end: 0.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size * 2.5,
      height: widget.size * 2.5,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Transform.scale(
              scale: _scale.value,
              child: Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: _opacity.value),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}
