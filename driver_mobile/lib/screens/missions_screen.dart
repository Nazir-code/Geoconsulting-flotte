import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/auth_service.dart';
import '../services/missions_service.dart';
import '../theme/app_theme.dart';
import '../widgets/mission_card_pro.dart';
import '../widgets/ds_shimmer.dart';

class MissionsScreen extends StatefulWidget {
  const MissionsScreen({super.key});

  @override
  State<MissionsScreen> createState() => _MissionsScreenState();
}

class _MissionsScreenState extends State<MissionsScreen>
    with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  final MissionsService _missionsService = MissionsService();

  String _selectedFilter = 'all';
  String? _busyMissionId;

  static const _filters = [
    (value: 'all',                              label: 'Toutes'),
    (value: MissionsService.statusAssignee,     label: 'Assignées'),
    (value: MissionsService.statusEnCours,      label: 'En cours'),
    (value: MissionsService.statusTerminee,     label: 'Terminées'),
    (value: MissionsService.statusAnnulee,      label: 'Annulées'),
  ];

  // Couleur de badge par filtre
  Color _filterColor(String value) {
    switch (value) {
      case MissionsService.statusEnCours:   return AppColors.statusActive;
      case MissionsService.statusTerminee:  return AppColors.statusCompleted;
      case MissionsService.statusAnnulee:   return AppColors.statusCancelled;
      case MissionsService.statusAssignee:  return AppColors.statusAssigned;
      default:                              return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final uid = _authService.currentUid;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Mes Missions"),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: const Icon(Icons.filter_list_rounded),
              tooltip: "Filtrer",
              onPressed: () {},
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: _buildFilterBar(),
        ),
      ),
      body: uid == null
          ? _buildNotConnected()
          : StreamBuilder<QuerySnapshot>(
              stream: _getFilteredStream(uid),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return _buildLoading();
                }
                if (snapshot.hasError) {
                  return _buildError(snapshot.error.toString());
                }
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return _buildEmptyState();
                }
                return _buildList(snapshot.data!.docs, uid);
              },
            ),
    );
  }

  // ── Filter bar ────────────────────────────────────────────────────────────
  Widget _buildFilterBar() {
    return Container(
      height: 56,
      color: AppColors.surface,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        itemCount: _filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = _filters[i];
          final isSelected = _selectedFilter == f.value;
          final color = _filterColor(f.value);

          return GestureDetector(
            onTap: () => setState(() => _selectedFilter = f.value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 0),
              decoration: BoxDecoration(
                color: isSelected ? color : AppColors.surfaceVariant,
                borderRadius: AppSpacing.roundedFull,
                border: Border.all(
                  color: isSelected ? color : Colors.transparent,
                ),
              ),
              child: Center(
                child: Text(
                  f.label,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Mission list ──────────────────────────────────────────────────────────
  Widget _buildList(List<QueryDocumentSnapshot> docs, String uid) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final doc = docs[index];
        final data = {
          'id': doc.id,
          ...(doc.data() as Map<String, dynamic>),
        };
        final status = MissionsService.normalizeStatus(data['status'] as String?);
        return MissionCardPro(
          mission: data,
          isBusy: _busyMissionId == doc.id,
          onStart: status == MissionsService.statusAssignee ||
                  status == MissionsService.statusEnAttente
              ? () => _confirmAction(
                    missionId: doc.id,
                    actionType: _ActionType.start,
                    action: () => _missionsService.acceptMission(doc.id, uid),
                  )
              : null,
          onComplete: status == MissionsService.statusEnCours
              ? () => _confirmAction(
                    missionId: doc.id,
                    actionType: _ActionType.complete,
                    action: () => _missionsService.completeMission(doc.id, uid),
                  )
              : null,
          onCancel: status == MissionsService.statusEnCours
              ? () => _confirmAction(
                    missionId: doc.id,
                    actionType: _ActionType.cancel,
                    action: () => _missionsService.cancelMission(doc.id, uid),
                  )
              : null,
        );
      },
    );
  }

  // ── States ────────────────────────────────────────────────────────────────
  Widget _buildLoading() {
    return DsShimmer(
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: 5,
        itemBuilder: (_, __) => const MissionCardSkeleton(),
      ),
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
          Text("Utilisateur non connecté", style: AppTextStyles.h4),
        ],
      ),
    );
  }

  Widget _buildError(String msg) {
    return Center(
      child: Padding(
        padding: AppSpacing.pagePadding,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.wifi_off_rounded,
                  color: AppColors.error, size: 36),
            ),
            AppSpacing.gapLg,
            Text("Erreur de chargement", style: AppTextStyles.h4),
            AppSpacing.gapSm,
            Text(
              msg,
              style: AppTextStyles.bodySm,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final isFiltered = _selectedFilter != 'all';
    return Center(
      child: Padding(
        padding: AppSpacing.pagePadding,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isFiltered
                    ? Icons.filter_alt_off_rounded
                    : Icons.assignment_outlined,
                size: 40,
                color: AppColors.textSecondary,
              ),
            ),
            AppSpacing.gapXl,
            Text(
              isFiltered ? "Aucun résultat" : "Aucune mission",
              style: AppTextStyles.h3,
            ),
            AppSpacing.gapSm,
            Text(
              isFiltered
                  ? "Aucune mission ne correspond au filtre sélectionné."
                  : "Vos missions assignées apparaîtront ici.",
              style: AppTextStyles.bodySm,
              textAlign: TextAlign.center,
            ),
            if (isFiltered) ...[
              AppSpacing.gapXl2,
              GestureDetector(
                onTap: () => setState(() => _selectedFilter = 'all'),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: AppSpacing.roundedFull,
                  ),
                  child: Text(
                    "Voir toutes les missions",
                    style: AppTextStyles.label
                        .copyWith(color: AppColors.primary),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── Firestore query ───────────────────────────────────────────────────────
  Stream<QuerySnapshot> _getFilteredStream(String uid) {
    Query q = FirebaseFirestore.instance
        .collection('missions')
        .where('assignedTo', isEqualTo: uid);

    if (_selectedFilter != 'all') {
      q = q.where('status', isEqualTo: _selectedFilter);
    }

    return q.orderBy('createdAt', descending: true).snapshots();
  }

  // ── Action confirmation dialog ────────────────────────────────────────────
  Future<void> _confirmAction({
    required String missionId,
    required _ActionType actionType,
    required Future<void> Function() action,
  }) async {
    final cfg = _actionConfig(actionType);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: cfg.color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(cfg.icon, color: cfg.color, size: 32),
              ),
              AppSpacing.gapLg,
              Text(cfg.title, style: AppTextStyles.h4),
              AppSpacing.gapSm,
              Text(
                cfg.message,
                style: AppTextStyles.bodySm,
                textAlign: TextAlign.center,
              ),
              AppSpacing.gapXl2,
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textSecondary,
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                              borderRadius: AppSpacing.roundedMd),
                        ),
                        child: Text("Annuler",
                            maxLines: 1,
                            style: AppTextStyles.btn.copyWith(
                                color: AppColors.textSecondary, letterSpacing: 0)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: cfg.color,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: AppSpacing.roundedMd),
                        ),
                        child: Text("Confirmer",
                            maxLines: 1,
                            style: AppTextStyles.btn.copyWith(
                                color: Colors.white, letterSpacing: 0)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _busyMissionId = missionId);
    try {
      await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(cfg.successMessage),
          backgroundColor: cfg.color,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur : $error'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _busyMissionId = null);
    }
  }
}

// ── Action type helpers ───────────────────────────────────────────────────────
enum _ActionType { start, complete, cancel }

({String title, String message, String successMessage, IconData icon, Color color})
    _actionConfig(_ActionType type) {
  switch (type) {
    case _ActionType.start:
      return (
        title: 'Démarrer la mission ?',
        message: 'Le statut passera en cours et la mission sera visible en live.',
        successMessage: 'Mission démarrée.',
        icon: Icons.play_arrow_rounded,
        color: AppColors.primary,
      );
    case _ActionType.complete:
      return (
        title: 'Terminer la mission ?',
        message: 'La mission sera marquée comme terminée.',
        successMessage: 'Mission terminée.',
        icon: Icons.check_circle_outline_rounded,
        color: AppColors.success,
      );
    case _ActionType.cancel:
      return (
        title: 'Arrêter la mission ?',
        message: 'La mission sera annulée et retirée du suivi live.',
        successMessage: 'Mission arrêtée.',
        icon: Icons.stop_circle_outlined,
        color: AppColors.error,
      );
  }
}
