import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import 'ds_badge.dart';

class MissionCardPro extends StatefulWidget {
  final Map<String, dynamic> mission;
  final VoidCallback? onTap;
  final VoidCallback? onStart;
  final VoidCallback? onComplete;
  final VoidCallback? onCancel;
  final bool isBusy;

  const MissionCardPro({
    super.key,
    required this.mission,
    this.onTap,
    this.onStart,
    this.onComplete,
    this.onCancel,
    this.isBusy = false,
  });

  @override
  State<MissionCardPro> createState() => _MissionCardProState();
}

class _MissionCardProState extends State<MissionCardPro> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final String status = _normalizeStatus(widget.mission['status'] as String?);
    final String priority = widget.mission['priority'] ?? 'medium';
    final bool hasActions =
        widget.onStart != null || widget.onComplete != null || widget.onCancel != null;
    final Color statusColor = _statusColor(status);

    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: widget.onTap != null
          ? (_) => setState(() => _pressed = true)
          : null,
      onTapUp: widget.onTap != null
          ? (_) => setState(() => _pressed = false)
          : null,
      onTapCancel: widget.onTap != null
          ? () => setState(() => _pressed = false)
          : null,
      child: AnimatedScale(
        scale: _pressed && widget.onTap != null ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: AppSpacing.roundedLg,
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Status bar (couleur en haut) ─────────────────────────────
              Container(
                height: 3,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppSpacing.radiusLg),
                    topRight: Radius.circular(AppSpacing.radiusLg),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Header: badges ───────────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        DsBadge.priority(priority),
                        DsBadge.status(status),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // ── Title ────────────────────────────────────────────────
                    Text(
                      widget.mission['title'] ?? 'Mission sans titre',
                      style: AppTextStyles.h5,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 8),

                    // ── Location ─────────────────────────────────────────────
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 15,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            widget.mission['location'] ?? 'Destination non définie',
                            style: AppTextStyles.bodySm,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),

                    // ── Description (si présente) ─────────────────────────────
                    if (widget.mission['description'] != null &&
                        (widget.mission['description'] as String).isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        widget.mission['description'] as String,
                        style: AppTextStyles.caption,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],

                    const SizedBox(height: 14),

                    // ── Footer ────────────────────────────────────────────────
                    Row(
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          size: 13,
                          color: AppColors.textHint,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _formatDate(widget.mission['createdAt']),
                          style: AppTextStyles.caption.copyWith(fontSize: 12),
                        ),
                        const Spacer(),
                        Text(
                          _shortId(widget.mission['id']?.toString()),
                          style: AppTextStyles.caption.copyWith(
                            fontFamily: 'Inter',
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),

                    // ── Actions ───────────────────────────────────────────────
                    if (hasActions) ...[
                      const SizedBox(height: 14),
                      const Divider(height: 1, color: AppColors.borderLight),
                      const SizedBox(height: 14),
                      _buildActionRow(status),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(dynamic raw) {
    DateTime? dt;
    if (raw is Timestamp) {
      dt = raw.toDate();
    } else if (raw is DateTime) {
      dt = raw;
    }
    if (dt == null) return 'Date inconnue';

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final day = DateTime(dt.year, dt.month, dt.day);

    final timeStr = DateFormat('HH:mm').format(dt);
    if (day == today) return 'Aujourd\'hui, $timeStr';
    if (day == yesterday) return 'Hier, $timeStr';
    return DateFormat('dd MMM yyyy', 'fr_FR').format(dt);
  }

  String _shortId(String? id) {
    if (id == null || id.isEmpty) return '';
    final part = id.split('_').last;
    return '#${part.length >= 6 ? part.substring(0, 6) : part}';
  }

  String _normalizeStatus(String? status) {
    switch (status) {
      case 'pending':     return 'en_attente';
      case 'in_progress': return 'en_cours';
      case 'completed':   return 'terminée';
      case 'cancelled':   return 'annulée';
      case 'assigned':    return 'assignée';
      default:            return status ?? 'en_attente';
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'en_cours':  return AppColors.statusActive;
      case 'terminée':  return AppColors.statusCompleted;
      case 'annulée':   return AppColors.statusCancelled;
      case 'assignée':  return AppColors.statusAssigned;
      default:          return AppColors.statusPending;
    }
  }

  Widget _buildActionRow(String status) {
    if (widget.isBusy) {
      return const SizedBox(
        height: 44,
        child: Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (status == 'assignée' || status == 'en_attente') {
      return SizedBox(
        width: double.infinity,
        height: 46,
        child: ElevatedButton.icon(
          onPressed: widget.onStart,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: AppSpacing.roundedMd,
            ),
          ),
          icon: const Icon(Icons.play_arrow_rounded, size: 20),
          label: const Text(
            'Démarrer la mission',
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    if (status == 'en_cours') {
      return Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 46,
              child: ElevatedButton.icon(
                onPressed: widget.onComplete,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: AppSpacing.roundedMd,
                  ),
                ),
                icon: const Icon(Icons.check_rounded, size: 18),
                label: const Text(
                  'Terminer',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: SizedBox(
              height: 46,
              child: OutlinedButton.icon(
                onPressed: widget.onCancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppSpacing.roundedMd,
                  ),
                ),
                icon: const Icon(Icons.stop_rounded, size: 18),
                label: const Text(
                  'Arrêter',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}
