import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // Données de démo — à remplacer par un stream Firestore
  final List<_Notif> _notifications = [
    _Notif(
      id: '1',
      title: 'Nouvelle Mission Assignée',
      body: 'Une livraison vers Maradi vous a été attribuée. Consultez vos missions.',
      type: _NotifType.mission,
      time: 'Il y a 10 min',
      isRead: false,
    ),
    _Notif(
      id: '2',
      title: 'Rappel de Maintenance',
      body: 'Le véhicule TRK-202 nécessite une révision technique d\'ici 48h.',
      type: _NotifType.warning,
      time: 'Il y a 2h',
      isRead: false,
    ),
    _Notif(
      id: '3',
      title: 'Alerte Météo',
      body: 'Vents de sable signalés sur l\'axe Niamey-Tahoua. Prudence recommandée.',
      type: _NotifType.info,
      time: 'Hier',
      isRead: true,
    ),
    _Notif(
      id: '4',
      title: 'Mission Terminée',
      body: 'Votre mission #MC-00412 a été complétée avec succès.',
      type: _NotifType.success,
      time: 'Hier',
      isRead: true,
    ),
  ];

  int get _unreadCount => _notifications.where((n) => !n.isRead).length;

  void _markAllRead() {
    HapticFeedback.lightImpact();
    setState(() {
      for (final n in _notifications) {
        n.isRead = true;
      }
    });
  }

  void _markRead(String id) {
    setState(() {
      final notif = _notifications.firstWhere((n) => n.id == id);
      notif.isRead = true;
    });
  }

  void _dismiss(String id) {
    HapticFeedback.mediumImpact();
    setState(() => _notifications.removeWhere((n) => n.id == id));
  }

  // Groupement : "Aujourd'hui" = contient "min" ou "h", "Hier" = contient "Hier"
  List<({String label, List<_Notif> items})> get _grouped {
    final today = _notifications.where((n) => n.time.contains('min') || n.time.contains('h')).toList();
    final yesterday = _notifications.where((n) => n.time == 'Hier').toList();
    final older = _notifications.where((n) => !today.contains(n) && !yesterday.contains(n)).toList();
    return [
      if (today.isNotEmpty) (label: "Aujourd'hui", items: today),
      if (yesterday.isNotEmpty) (label: 'Hier', items: yesterday),
      if (older.isNotEmpty) (label: 'Plus ancien', items: older),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Text("Notifications"),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: AppSpacing.roundedFull,
                ),
                child: Text(
                  '$_unreadCount',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all_rounded, size: 16),
              label: const Text("Tout lire"),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                textStyle: AppTextStyles.labelSm.copyWith(letterSpacing: 0.2),
              ),
            ),
        ],
      ),
      body: _notifications.isEmpty
          ? _buildEmptyState()
          : _buildGroupedList(),
    );
  }

  // ── Grouped list ──────────────────────────────────────────────────────────
  Widget _buildGroupedList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
      itemCount: _grouped.fold<int>(0, (acc, g) => acc + g.items.length + 1),
      itemBuilder: (context, index) {
        // Flatten groups with section headers
        int cursor = 0;
        for (final group in _grouped) {
          if (index == cursor) {
            return _buildSectionHeader(group.label);
          }
          cursor++;
          if (index < cursor + group.items.length) {
            return _buildNotifCard(group.items[index - cursor]);
          }
          cursor += group.items.length;
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildSectionHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: AppTextStyles.overline.copyWith(letterSpacing: 1.2),
      ),
    );
  }

  // ── Notification card ─────────────────────────────────────────────────────
  Widget _buildNotifCard(_Notif notif) {
    final cfg = _typeConfig(notif.type);

    return Dismissible(
      key: ValueKey(notif.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: AppSpacing.roundedLg,
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
      ),
      onDismissed: (_) => _dismiss(notif.id),
      child: GestureDetector(
        onTap: () => _markRead(notif.id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: notif.isRead
                ? AppColors.surface
                : AppColors.surface,
            borderRadius: AppSpacing.roundedLg,
            border: Border.all(
              color: notif.isRead
                  ? AppColors.borderLight
                  : cfg.color.withValues(alpha: 0.25),
              width: notif.isRead ? 1 : 1.5,
            ),
            boxShadow: notif.isRead
                ? AppTheme.shadowSm
                : AppTheme.shadowColored(cfg.color, opacity: 0.06),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Icône ────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 0, 14),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: cfg.color.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(cfg.icon, color: cfg.color, size: 22),
                ),
              ),
              const SizedBox(width: 12),
              // ── Contenu ───────────────────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(0, 14, 14, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              notif.title,
                              style: notif.isRead
                                  ? AppTextStyles.h6.copyWith(
                                      color: AppColors.textPrimary)
                                  : AppTextStyles.h6,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (!notif.isRead)
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(top: 4),
                              decoration: BoxDecoration(
                                color: cfg.color,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        notif.body,
                        style: AppTextStyles.bodySm.copyWith(
                          color: notif.isRead
                              ? AppColors.textHint
                              : AppColors.textSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.schedule_rounded,
                            size: 12,
                            color: AppColors.textHint,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            notif.time,
                            style: AppTextStyles.caption.copyWith(
                              fontSize: 11,
                              color: AppColors.textHint,
                            ),
                          ),
                          const Spacer(),
                          // Label type
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: cfg.color.withValues(alpha: 0.08),
                              borderRadius: AppSpacing.roundedFull,
                            ),
                            child: Text(
                              cfg.label,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: cfg.color,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
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
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 44,
              color: AppColors.textSecondary,
            ),
          ),
          AppSpacing.gapXl,
          Text("Aucune notification", style: AppTextStyles.h3),
          AppSpacing.gapSm,
          Text(
            "Vous êtes à jour !",
            style: AppTextStyles.bodySm,
          ),
        ],
      ),
    );
  }
}

// ── Data model ────────────────────────────────────────────────────────────────
enum _NotifType { mission, warning, info, success, system }

class _Notif {
  final String id;
  final String title;
  final String body;
  final _NotifType type;
  final String time;
  bool isRead;

  _Notif({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.time,
    required this.isRead,
  });
}

// ── Type config ───────────────────────────────────────────────────────────────
({IconData icon, Color color, String label}) _typeConfig(_NotifType type) {
  switch (type) {
    case _NotifType.mission:
      return (
        icon: Icons.local_shipping_rounded,
        color: AppColors.primary,
        label: 'Mission',
      );
    case _NotifType.warning:
      return (
        icon: Icons.warning_amber_rounded,
        color: AppColors.warning,
        label: 'Alerte',
      );
    case _NotifType.info:
      return (
        icon: Icons.info_outline_rounded,
        color: AppColors.info,
        label: 'Info',
      );
    case _NotifType.success:
      return (
        icon: Icons.check_circle_outline_rounded,
        color: AppColors.success,
        label: 'Succès',
      );
    case _NotifType.system:
      return (
        icon: Icons.settings_outlined,
        color: AppColors.textSecondary,
        label: 'Système',
      );
  }
}
