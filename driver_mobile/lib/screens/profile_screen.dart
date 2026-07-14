import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/theme_service.dart';
import '../models/driver_profile.dart';
import '../theme/app_theme.dart';
import '../widgets/ds_badge.dart';
import '../widgets/animated_list_item.dart';
import 'splash_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // ── Services — INCHANGÉS ──────────────────────────────────────────────────
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();
  DriverProfile? _profile;
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  // ── Chargement Firestore — INCHANGÉ ───────────────────────────────────────
  Future<void> _loadProfile() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      final p = await _firestoreService.getDriverProfile(uid);
      setState(() => _profile = p);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: context.palette.background,
        body: ListView(
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            // Header violet (remplace AppBar cyan + ProfileCard + StatsRow)
            _buildVioletHeader(),
            const SizedBox(height: 24),
            Padding(
              padding: AppSpacing.pageHorizontal,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedListItem(
                    index: 0,
                    child: _buildSectionLabel('Informations personnelles'),
                  ),
                  const SizedBox(height: 12),
                  AnimatedListItem(index: 1, child: _buildInfoCard()),
                  const SizedBox(height: 24),
                  AnimatedListItem(
                    index: 2,
                    child: _buildSectionLabel('Paramètres'),
                  ),
                  const SizedBox(height: 12),
                  AnimatedListItem(index: 3, child: _buildSettingsCard()),
                  const SizedBox(height: 32),
                  AnimatedListItem(index: 4, child: _buildLogoutButton()),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'FleetNexus v1.0.0 · 2026',
                      style: AppTextStyles.jkVersion.copyWith(
                        color: context.palette.textHint,
                      ),
                    ),
                  ),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Header violet centré (avatar + nom + stats) ───────────────────────────
  Widget _buildVioletHeader() {
    final name = _profile?.name ?? '';
    final initials = name
        .trim()
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0].toUpperCase())
        .join();

    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.violetHeaderGradient,
      ),
      child: Stack(
        children: [
          // Cercles décoratifs
          Positioned(
            top: -20,
            right: -20,
            child: _decorCircle(160),
          ),
          Positioned(
            top: 50,
            right: 70,
            child: _decorCircle(70),
          ),
          Positioned(
            bottom: -30,
            left: -16,
            child: _decorCircle(130),
          ),

          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              child: Column(
                children: [
                  // Avatar initiales centré
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.20),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.30),
                        width: 2,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initials.isEmpty ? '?' : initials,
                      style: AppTextStyles.jkHeroName.copyWith(fontSize: 26),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Nom
                  Text(
                    _profile?.name ?? 'Chargement…',
                    style: AppTextStyles.jkHeroName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),

                  // Rôle + badge statut inline
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Chauffeur', style: AppTextStyles.jkRoleOnDark),
                      const SizedBox(width: 8),
                      DsBadge.status('online'),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Pill entreprise
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.business_rounded,
                            size: 11, color: Colors.white70),
                        const SizedBox(width: 5),
                        Text(
                          'Geoconsulting APP',
                          style: AppTextStyles.jkBadge.copyWith(
                            color: Colors.white70,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats 3 colonnes
                  Row(
                    children: [
                      _buildStatItem('0', 'Missions'),
                      _buildStatDividerV(),
                      _buildStatItem('0 km', 'Parcourus'),
                      _buildStatDividerV(),
                      _buildStatItem('0.0 ★', 'Évaluation'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _decorCircle(double size) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.10),
            width: 1.5,
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: AppTextStyles.jkStatValue.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTextStyles.jkStatLabel.copyWith(
              color: AppColors.violetOnDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDividerV() {
    return Container(
      width: 1,
      height: 28,
      color: Colors.white.withValues(alpha: 0.20),
    );
  }

  // ── Label de section ──────────────────────────────────────────────────────
  Widget _buildSectionLabel(String title) {
    return Text(
      title.toUpperCase(),
      style: AppTextStyles.overline.copyWith(
        color: context.palette.textSecondary,
        letterSpacing: 1.2,
      ),
    );
  }

  // ── Carte informations ────────────────────────────────────────────────────
  Widget _buildInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: context.palette.border),
        boxShadow: AppTheme.shadowCard,
      ),
      child: Column(
        children: [
          _buildInfoRow(
            Icons.badge_outlined,
            'ID Chauffeur',
            _profile?.driverId ?? 'N/A',
            AppColors.violet,
          ),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildInfoRow(
            Icons.phone_outlined,
            'Téléphone',
            '+227 00 00 00 00',
            AppColors.success,
          ),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildInfoRow(
            Icons.email_outlined,
            'Email',
            _profile?.email ?? 'N/A',
            AppColors.info,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.10),
              borderRadius: AppSpacing.roundedSm,
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: AppTextStyles.caption
                        .copyWith(color: context.palette.textSecondary)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTextStyles.jkCardTitle.copyWith(
                    fontWeight: FontWeight.w600,
                    color: context.palette.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Carte paramètres ──────────────────────────────────────────────────────
  Widget _buildSettingsCard() {
    return Container(
      decoration: BoxDecoration(
        color: context.palette.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: context.palette.border),
        boxShadow: AppTheme.shadowCard,
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.notifications_outlined,
            iconColor: AppColors.warning,
            title: 'Notifications push',
            trailing: Switch.adaptive(
              value: _notificationsEnabled,
              activeColor: AppColors.violet,
              onChanged: (v) => setState(() => _notificationsEnabled = v),
            ),
          ),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildAppearanceTile(),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.language_outlined,
            iconColor: AppColors.info,
            title: 'Langue',
            trailingText: 'Français',
          ),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.security_outlined,
            iconColor: AppColors.success,
            title: 'Confidentialité',
          ),
          Divider(height: 1, color: context.palette.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.help_outline_rounded,
            iconColor: AppColors.violet,
            title: 'Aide & Support',
          ),
        ],
      ),
    );
  }

  Widget _buildAppearanceTile() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.violet.withValues(alpha: 0.10),
                  borderRadius: AppSpacing.roundedSm,
                ),
                child: const Icon(Icons.brightness_6_outlined,
                    size: 18, color: AppColors.violet),
              ),
              const SizedBox(width: 14),
              Text('Apparence',
                  style: AppTextStyles.jkCardTitle
                      .copyWith(color: context.palette.textHeading)),
            ],
          ),
          const SizedBox(height: 12),
          ListenableBuilder(
            listenable: ThemeService.instance,
            builder: (_, __) =>
                _buildThemeSegments(ThemeService.instance.mode),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeSegments(ThemeMode current) {
    final options = <({ThemeMode value, IconData icon, String label})>[
      (value: ThemeMode.system, icon: Icons.brightness_auto_rounded, label: 'Auto'),
      (value: ThemeMode.light, icon: Icons.light_mode_rounded, label: 'Clair'),
      (value: ThemeMode.dark, icon: Icons.dark_mode_rounded, label: 'Sombre'),
    ];

    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: context.palette.surfaceVariant,
        borderRadius: AppSpacing.roundedMd,
        border: Border.all(color: context.palette.borderLight),
      ),
      child: Row(
        children: options.map((opt) {
          final selected = current == opt.value;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                ThemeService.instance.setMode(opt.value);
              },
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                margin: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: selected ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          )
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      opt.icon,
                      size: 14,
                      color: selected ? AppColors.violet : AppColors.textHint,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      opt.label,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected ? AppColors.violet : AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? trailingText,
    Widget? trailing,
  }) {
    return GestureDetector(
      onTap: trailing != null ? null : () {},
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.10),
                borderRadius: AppSpacing.roundedSm,
              ),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(title,
                  style: AppTextStyles.jkCardTitle
                      .copyWith(color: context.palette.textHeading)),
            ),
            if (trailing != null)
              trailing
            else ...[
              if (trailingText != null)
                Text(
                  trailingText,
                  style: AppTextStyles.caption
                      .copyWith(color: context.palette.textHint),
                ),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right_rounded,
                  size: 20, color: context.palette.textHint),
            ],
          ],
        ),
      ),
    );
  }

  // ── Bouton déconnexion — INCHANGÉ ─────────────────────────────────────────
  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: GestureDetector(
        onTap: _showLogoutConfirm,
        behavior: HitTestBehavior.opaque,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.error, width: 1.5),
            borderRadius: AppSpacing.roundedLg,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.logout_rounded, size: 18, color: AppColors.error),
              const SizedBox(width: 8),
              Text(
                'SE DÉCONNECTER',
                style: AppTextStyles.jkBtnSm.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Dialogue déconnexion — INCHANGÉ (Firebase signOut + navigation) ───────
  void _showLogoutConfirm() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl),
        title: Text('Déconnexion', style: AppTextStyles.h4),
        content: Text(
          'Êtes-vous sûr de vouloir vous déconnecter ?',
          style: AppTextStyles.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Annuler',
              style: AppTextStyles.btn.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                AppTransitions.fade(const SplashScreen()),
                (route) => false,
              );
              _authService.signOut();
            },
            child: Text(
              'Se déconnecter',
              style: AppTextStyles.btn.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
