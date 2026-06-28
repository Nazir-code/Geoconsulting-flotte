import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/missions_service.dart';
import '../models/mission_model.dart';
import '../theme/app_theme.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final AuthService _authService = AuthService();
  final MissionsService _missionsService = MissionsService();

  // Mois affiché (navigation ← →)
  DateTime _displayedMonth = DateTime(
    DateTime.now().year,
    DateTime.now().month,
  );

  void _prevMonth() => setState(() {
        _displayedMonth =
            DateTime(_displayedMonth.year, _displayedMonth.month - 1);
      });

  void _nextMonth() {
    final now = DateTime.now();
    final next = DateTime(_displayedMonth.year, _displayedMonth.month + 1);
    if (next.isAfter(DateTime(now.year, now.month))) return;
    setState(() => _displayedMonth = next);
  }

  bool get _isCurrentMonth {
    final now = DateTime.now();
    return _displayedMonth.year == now.year &&
        _displayedMonth.month == now.month;
  }

  @override
  Widget build(BuildContext context) {
    final uid = _authService.currentUid;

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        title: const Text('Historique'),
        centerTitle: false,
      ),
      body: uid == null
          ? _buildNotConnected()
          : StreamBuilder<List<Mission>>(
              stream: _missionsService.listenToAllMyMissions(uid),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 2.5,
                    ),
                  );
                }

                final allMissions = snapshot.data ?? [];
                final monthMissions = _filterByMonth(allMissions);
                final stats = _computeStats(monthMissions);
                final pastMissions = allMissions
                    .where((m) =>
                        m.status == MissionsService.statusTerminee ||
                        m.status == MissionsService.statusAnnulee)
                    .toList();

                return CustomScrollView(
                  slivers: [
                    // ── Sélecteur de mois ──────────────────────────────────
                    SliverToBoxAdapter(
                      child: _MonthSelector(
                        displayedMonth: _displayedMonth,
                        isCurrentMonth: _isCurrentMonth,
                        onPrev: _prevMonth,
                        onNext: _nextMonth,
                      ),
                    ),

                    // ── KPI cards ──────────────────────────────────────────
                    SliverToBoxAdapter(
                      child: _StatsGrid(stats: stats),
                    ),

                    // ── Barre de complétion ────────────────────────────────
                    if (stats.total > 0)
                      SliverToBoxAdapter(
                        child: _CompletionBar(stats: stats),
                      ),

                    // ── Liste historique ───────────────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                        child: Text(
                          'Missions passées',
                          style: AppTextStyles.label.copyWith(
                            color: AppColors.textSecondary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),

                    pastMissions.isEmpty
                        ? SliverToBoxAdapter(child: _buildEmptyHistory())
                        : SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _MissionHistoryTile(
                                mission: pastMissions[index],
                              ),
                              childCount: pastMissions.length,
                            ),
                          ),

                    const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  ],
                );
              },
            ),
    );
  }

  List<Mission> _filterByMonth(List<Mission> missions) {
    return missions.where((m) {
      final date = m.createdAt.toDate();
      return date.year == _displayedMonth.year &&
          date.month == _displayedMonth.month;
    }).toList();
  }

  _Stats _computeStats(List<Mission> missions) {
    final completed =
        missions.where((m) => m.status == MissionsService.statusTerminee).length;
    final cancelled =
        missions.where((m) => m.status == MissionsService.statusAnnulee).length;
    final inProgress =
        missions.where((m) => m.status == MissionsService.statusEnCours).length;
    final total = missions.length;
    final rate = total == 0 ? 0.0 : completed / total;
    return _Stats(
      total: total,
      completed: completed,
      cancelled: cancelled,
      inProgress: inProgress,
      completionRate: rate,
    );
  }

  Widget _buildNotConnected() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.account_circle_outlined,
              size: 64, color: AppColors.textSecondary),
          AppSpacing.gapLg,
          Text('Utilisateur non connecté', style: AppTextStyles.h4),
        ],
      ),
    );
  }

  Widget _buildEmptyHistory() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: context.palette.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.history_rounded,
                size: 36, color: AppColors.textSecondary),
          ),
          AppSpacing.gapLg,
          Text('Aucune mission passée', style: AppTextStyles.h4),
          AppSpacing.gapSm,
          Text(
            'Vos missions terminées et annulées apparaîtront ici.',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Données de stats ──────────────────────────────────────────────────────────

class _Stats {
  final int total;
  final int completed;
  final int cancelled;
  final int inProgress;
  final double completionRate;

  const _Stats({
    required this.total,
    required this.completed,
    required this.cancelled,
    required this.inProgress,
    required this.completionRate,
  });
}

// ── Sélecteur de mois ─────────────────────────────────────────────────────────

class _MonthSelector extends StatelessWidget {
  final DateTime displayedMonth;
  final bool isCurrentMonth;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  const _MonthSelector({
    required this.displayedMonth,
    required this.isCurrentMonth,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final label = DateFormat('MMMM yyyy', 'fr_FR').format(displayedMonth);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: context.palette.borderLight),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left_rounded),
            onPressed: onPrev,
            color: AppColors.textSecondary,
            iconSize: 22,
          ),
          Text(
            label[0].toUpperCase() + label.substring(1),
            style: AppTextStyles.label.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right_rounded),
            onPressed: isCurrentMonth ? null : onNext,
            color: isCurrentMonth
                ? context.palette.borderLight
                : AppColors.textSecondary,
            iconSize: 22,
          ),
        ],
      ),
    );
  }
}

// ── Grille KPI ────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final _Stats stats;

  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _KpiTile(
                  label: 'Total',
                  value: '${stats.total}',
                  icon: Icons.assignment_rounded,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _KpiTile(
                  label: 'Terminées',
                  value: '${stats.completed}',
                  icon: Icons.check_circle_rounded,
                  color: AppColors.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _KpiTile(
                  label: 'Annulées',
                  value: '${stats.cancelled}',
                  icon: Icons.cancel_rounded,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _KpiTile(
                  label: 'Taux',
                  value: stats.total == 0
                      ? '—'
                      : '${(stats.completionRate * 100).round()}%',
                  icon: Icons.trending_up_rounded,
                  color: AppColors.accent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: context.palette.borderLight),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: AppSpacing.roundedMd,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTextStyles.h3.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                label,
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.textSecondary,
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Barre de complétion ───────────────────────────────────────────────────────

class _CompletionBar extends StatelessWidget {
  final _Stats stats;

  const _CompletionBar({required this.stats});

  @override
  Widget build(BuildContext context) {
    final completedFrac =
        stats.total == 0 ? 0.0 : stats.completed / stats.total;
    final cancelledFrac =
        stats.total == 0 ? 0.0 : stats.cancelled / stats.total;
    final inProgressFrac =
        stats.total == 0 ? 0.0 : stats.inProgress / stats.total;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: context.palette.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Répartition du mois',
            style: AppTextStyles.label.copyWith(letterSpacing: 0),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: AppSpacing.roundedFull,
            child: SizedBox(
              height: 10,
              child: Row(
                children: [
                  _BarSegment(flex: completedFrac, color: AppColors.success),
                  _BarSegment(flex: inProgressFrac, color: AppColors.primary),
                  _BarSegment(flex: cancelledFrac, color: AppColors.error),
                  if (completedFrac + cancelledFrac + inProgressFrac < 1.0)
                    _BarSegment(
                      flex: 1.0 -
                          completedFrac -
                          cancelledFrac -
                          inProgressFrac,
                      color: context.palette.borderLight,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _Legend(color: AppColors.success, label: 'Terminées'),
              const SizedBox(width: 16),
              _Legend(color: AppColors.primary, label: 'En cours'),
              const SizedBox(width: 16),
              _Legend(color: AppColors.error, label: 'Annulées'),
            ],
          ),
        ],
      ),
    );
  }
}

class _BarSegment extends StatelessWidget {
  final double flex;
  final Color color;

  const _BarSegment({required this.flex, required this.color});

  @override
  Widget build(BuildContext context) {
    if (flex <= 0) return const SizedBox.shrink();
    return Expanded(
      flex: (flex * 1000).round().clamp(1, 1000),
      child: Container(color: color),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;

  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTextStyles.labelSm.copyWith(
            color: AppColors.textSecondary,
            letterSpacing: 0,
          ),
        ),
      ],
    );
  }
}

// ── Tuile mission historique ──────────────────────────────────────────────────

class _MissionHistoryTile extends StatelessWidget {
  final Mission mission;

  const _MissionHistoryTile({required this.mission});

  @override
  Widget build(BuildContext context) {
    final isCompleted = mission.status == MissionsService.statusTerminee;
    final statusColor = isCompleted ? AppColors.success : AppColors.error;
    final statusLabel =
        isCompleted ? 'Terminée' : 'Annulée';
    final statusIcon = isCompleted
        ? Icons.check_circle_rounded
        : Icons.cancel_rounded;

    final date = _formatDate(
        isCompleted ? mission.completedAt : null,
        mission.updatedAt);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: context.palette.borderLight),
      ),
      child: Row(
        children: [
          // Icône statut
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),
          // Contenu
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mission.title.isNotEmpty ? mission.title : 'Mission',
                  style: AppTextStyles.body
                      .copyWith(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(Icons.location_on_rounded,
                        size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        mission.location.isNotEmpty
                            ? mission.location
                            : 'Destination inconnue',
                        style: AppTextStyles.bodySm.copyWith(
                            color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Badge statut + date
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: AppSpacing.roundedFull,
                ),
                child: Text(
                  statusLabel,
                  style: AppTextStyles.labelSm.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                date,
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.textSecondary,
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(Timestamp? preferred, Timestamp fallback) {
    final ts = preferred ?? fallback;
    final dt = ts.toDate();
    return DateFormat('dd MMM', 'fr_FR').format(dt);
  }
}
