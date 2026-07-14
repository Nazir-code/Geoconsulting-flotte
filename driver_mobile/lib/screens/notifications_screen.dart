import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _notificationSubscription;
  final List<_Notif> _notifications = [];
  bool _isLoading = true;

  int get _unreadCount => _notifications.where((n) => !n.isRead).length;

  @override
  void initState() {
    super.initState();
    _subscribeToNotifications();
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  void _subscribeToNotifications() {
    final uid = _authService.currentUid;
    if (uid == null) return;

    _notificationSubscription = _firestoreService
        .listenToNotifications(uid)
        .listen((snapshot) {
      final notifications = snapshot.docs
          .map((doc) => _Notif.fromFirestore(doc.id, doc.data()))
          .toList();
      if (!mounted) return;
      setState(() {
        _notifications
          ..clear()
          ..addAll(notifications);
        _isLoading = false;
      });
    }, onError: (error) {
      debugPrint('❌ [NotificationsScreen] listen error: $error');
      if (!mounted) return;
      setState(() => _isLoading = false);
    });
  }

  Future<void> _markAllRead() async {
    HapticFeedback.lightImpact();
    final batch = FirebaseFirestore.instance.batch();
    for (final notif in _notifications.where((n) => !n.isRead)) {
      final ref = FirebaseFirestore.instance.collection('notifications').doc(notif.id);
      batch.update(ref, {'isRead': true});
    }
    try {
      await batch.commit();
    } catch (error) {
      debugPrint('❌ [NotificationsScreen] mark all read failed: $error');
    }
  }

  Future<void> _markRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index == -1) return;
    final notif = _notifications[index];
    if (notif.isRead) return;

    setState(() {
      _notifications[index] = notif.copyWith(isRead: true);
    });

    try {
      await FirebaseFirestore.instance
          .collection('notifications')
          .doc(id)
          .update({'isRead': true});
    } catch (error) {
      debugPrint('❌ [NotificationsScreen] update notification read failed: $error');
    }
  }

  Future<void> _dismiss(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index == -1) return;
    final notif = _notifications[index];
    setState(() => _notifications.removeAt(index));
    if (!notif.isRead) {
      try {
        await FirebaseFirestore.instance
            .collection('notifications')
            .doc(id)
            .update({'isRead': true});
      } catch (error) {
        debugPrint('❌ [NotificationsScreen] dismiss update failed: $error');
      }
    }
  }

  List<_NotificationGroup> get _groups {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    final today = <_Notif>[];
    final yesterdayList = <_Notif>[];
    final older = <_Notif>[];

    for (final notif in _notifications) {
      if (notif.isSameDay(now)) {
        today.add(notif);
      } else if (notif.isSameDay(yesterday)) {
        yesterdayList.add(notif);
      } else {
        older.add(notif);
      }
    }

    final groups = <_NotificationGroup>[];
    if (today.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Aujourd\'hui', items: today));
    }
    if (yesterdayList.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Hier', items: yesterdayList));
    }
    if (older.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Plus ancien', items: older));
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        backgroundColor: context.palette.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        automaticallyImplyLeading: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: context.palette.borderLight),
        ),
        titleSpacing: 20,
        title: Row(
          children: [
            Text(
              'Notifications',
              style: AppTextStyles.jkScreenTitle.copyWith(
                color: context.palette.textHeading,
              ),
            ),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  borderRadius: AppSpacing.roundedFull,
                ),
                child: Text(
                  '$_unreadCount',
                  style: AppTextStyles.jkBadge.copyWith(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (_unreadCount > 0)
            GestureDetector(
              onTap: _markAllRead,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 4, 16, 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.done_all_rounded,
                        size: 14, color: AppColors.violet),
                    const SizedBox(width: 5),
                    Text(
                      'Tout lire',
                      style: AppTextStyles.jkBtnSm.copyWith(color: AppColors.violet),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: _isLoading
            ? Container(key: const ValueKey('loading'), child: _buildLoadingState())
            : _notifications.isEmpty
                ? Container(key: const ValueKey('empty'), color: context.palette.background, child: _buildEmptyState())
                : Container(key: const ValueKey('list'), color: context.palette.background, child: _buildGroupedList()),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        color: AppColors.violet,
      ),
    );
  }

  Widget _buildGroupedList() {
    final groups = _groups;
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
      itemCount: groups.fold<int>(0, (acc, group) => acc + group.items.length + 1),
      itemBuilder: (context, index) {
        int cursor = 0;
        for (final group in groups) {
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
        style: AppTextStyles.jkBadge.copyWith(
          color: context.palette.textSecondary,
          fontSize: 10,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

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
        child: const Icon(Icons.delete_outline_rounded,
            color: Colors.white, size: 24),
      ),
      onDismissed: (_) => _dismiss(notif.id),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: ClipRRect(
          borderRadius: AppSpacing.roundedLg,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _markRead(notif.id),
              splashColor: AppColors.violet.withValues(alpha: 0.14),
              highlightColor: Colors.transparent,
              child: Stack(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 260),
                    decoration: BoxDecoration(
                      color: context.palette.surface,
                      borderRadius: AppSpacing.roundedLg,
                      border: Border.all(
                        color: notif.isRead
                            ? context.palette.borderLight
                            : AppColors.violet.withValues(alpha: 0.15),
                        width: 1,
                      ),
                      boxShadow: AppTheme.shadowVioletSm,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: EdgeInsets.fromLTRB(
                            notif.isRead ? 14 : 18,
                            14,
                            0,
                            14,
                          ),
                          child: Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: cfg.color.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(cfg.icon, color: cfg.color, size: 20),
                          ),
                        ),
                        const SizedBox(width: 12),
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
                                            ? AppTextStyles.jkCardTitle.copyWith(
                                                color: context.palette.textPrimary,
                                                fontWeight: FontWeight.w600,
                                              )
                                            : AppTextStyles.jkCardTitle.copyWith(
                                                color: context.palette.textHeading,
                                              ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (!notif.isRead)
                                      Container(
                                        width: 7,
                                        height: 7,
                                        margin: const EdgeInsets.only(top: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.violet,
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
                                        ? context.palette.textHint
                                        : context.palette.textSecondary,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Icon(Icons.schedule_rounded,
                                        size: 11, color: context.palette.textHint),
                                    const SizedBox(width: 4),
                                    Text(
                                      notif.time,
                                      style: AppTextStyles.jkCardSub.copyWith(
                                        color: context.palette.textHint,
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: cfg.color.withValues(alpha: 0.08),
                                        borderRadius: AppSpacing.roundedFull,
                                      ),
                                      child: Text(
                                        cfg.label,
                                        style: AppTextStyles.jkBadge.copyWith(
                                          color: cfg.color,
                                          fontSize: 10,
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
                  if (!notif.isRead)
                    Positioned(
                      top: 0,
                      bottom: 0,
                      left: 0,
                      child: Container(
                        width: 3.5,
                        color: AppColors.violet,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.violetLight,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 40,
              color: AppColors.violet,
            ),
          ),
          AppSpacing.gapXl,
          Text(
            'Aucune notification',
            style: AppTextStyles.jkScreenTitle.copyWith(
              color: context.palette.textHeading,
            ),
          ),
          AppSpacing.gapSm,
          Text(
            'Vous êtes à jour !',
            style: AppTextStyles.jkCardSub.copyWith(
              color: context.palette.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationGroup {
  final String label;
  final List<_Notif> items;
  _NotificationGroup({required this.label, required this.items});
}

enum _NotifType { mission, warning, info, success, system }

class _Notif {
  final String id;
  final String title;
  final String body;
  final _NotifType type;
  final bool isRead;
  final DateTime createdAt;

  _Notif({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory _Notif.fromFirestore(String id, Map<String, dynamic> data) {
    final typeValue = (data['type'] as String?)?.toLowerCase();
    final createdAt = (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now();

    return _Notif(
      id: id,
      title: data['title'] as String? ?? 'Notification',
      body: data['message'] as String? ?? data['body'] as String? ?? '',
      type: _parseType(typeValue),
      isRead: data['isRead'] == true,
      createdAt: createdAt,
    );
  }

  _Notif copyWith({bool? isRead}) {
    return _Notif(
      id: id,
      title: title,
      body: body,
      type: type,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }

  String get time {
    final now = DateTime.now();
    final diff = now.difference(createdAt);
    if (diff.inMinutes < 60) {
      return 'Il y a ${diff.inMinutes} min';
    }
    if (diff.inHours < 24) {
      return 'Il y a ${diff.inHours} h';
    }
    if (diff.inDays == 1) {
      return 'Hier';
    }
    return 'Il y a ${diff.inDays} j';
  }

  bool isSameDay(DateTime other) {
    return createdAt.year == other.year &&
        createdAt.month == other.month &&
        createdAt.day == other.day;
  }

  static _NotifType _parseType(String? value) {
    switch (value) {
      case 'mission':
        return _NotifType.mission;
      case 'warning':
      case 'alerte':
        return _NotifType.warning;
      case 'info':
        return _NotifType.info;
      case 'success':
        return _NotifType.success;
      case 'system':
        return _NotifType.system;
      default:
        return _NotifType.info;
    }
  }
}

class _TypeConfig {
  final IconData icon;
  final Color color;
  final String label;

  const _TypeConfig({
    required this.icon,
    required this.color,
    required this.label,
  });
}

_TypeConfig _typeConfig(_NotifType type) {
  switch (type) {
    case _NotifType.mission:
      return const _TypeConfig(
        icon: Icons.local_shipping_rounded,
        color: AppColors.primary,
        label: 'Mission',
      );
    case _NotifType.warning:
      return const _TypeConfig(
        icon: Icons.warning_amber_rounded,
        color: AppColors.warning,
        label: 'Alerte',
      );
    case _NotifType.info:
      return const _TypeConfig(
        icon: Icons.info_outline_rounded,
        color: AppColors.info,
        label: 'Info',
      );
    case _NotifType.success:
      return const _TypeConfig(
        icon: Icons.check_circle_outline_rounded,
        color: AppColors.success,
        label: 'Succès',
      );
    case _NotifType.system:
      return const _TypeConfig(
        icon: Icons.settings_outlined,
        color: AppColors.textSecondary,
        label: 'Système',
      );
  }
}
