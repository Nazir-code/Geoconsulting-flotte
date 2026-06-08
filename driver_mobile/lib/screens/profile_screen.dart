import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../models/driver_profile.dart';
import '../theme/app_theme.dart';
import '../widgets/ds_badge.dart';
import 'splash_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();
  DriverProfile? _profile;
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      final p = await _firestoreService.getDriverProfile(uid);
      setState(() => _profile = p);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        surfaceTintColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        title: const Text(
          "Mon Profil",
          style: TextStyle(
            fontFamily: 'Inter',
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: ListView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.zero,
        children: [
          _buildProfileCard(),
          const SizedBox(height: 8),
          _buildStatsRow(),
          const SizedBox(height: 24),
          Padding(
            padding: AppSpacing.pageHorizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionLabel("Informations personnelles"),
                const SizedBox(height: 12),
                _buildInfoCard(),
                const SizedBox(height: 24),
                _buildSectionLabel("Paramètres"),
                const SizedBox(height: 12),
                _buildSettingsCard(),
                const SizedBox(height: 32),
                _buildLogoutButton(),
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    "FleetNexus v1.0.0 · 2026",
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.textHint,
                    ),
                  ),
                ),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Card profil (avatar + nom + badge statut) ─────────────────────────────
  Widget _buildProfileCard() {
    return Transform.translate(
      offset: const Offset(0, 0),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppSpacing.roundedXl,
            border: Border.all(color: AppColors.borderLight),
            boxShadow: AppTheme.shadowMd,
          ),
          child: Row(
            children: [
              // Avatar
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      shape: BoxShape.circle,
                    ),
                    child: const CircleAvatar(
                      radius: 36,
                      backgroundColor: AppColors.primaryLight,
                      child: Icon(
                        Icons.person_rounded,
                        size: 40,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: const Icon(
                        Icons.edit_rounded,
                        size: 14,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Infos
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _profile?.name ?? "Chargement...",
                      style: AppTextStyles.h4,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _profile?.email ?? "",
                      style: AppTextStyles.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    DsBadge.status('online'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Stats row ─────────────────────────────────────────────────────────────
  Widget _buildStatsRow() {
    return Transform.translate(
      offset: const Offset(0, 0),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: AppSpacing.roundedLg,
            border: Border.all(color: AppColors.borderLight),
            boxShadow: AppTheme.shadowSm,
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                _buildStat("142", "Missions", Icons.route_rounded, AppColors.primary),
                _buildStatDivider(),
                _buildStat("8 240 km", "Parcourus", Icons.speed_rounded, AppColors.warning),
                _buildStatDivider(),
                _buildStat("4.9 ★", "Évaluation", Icons.star_rounded, AppColors.success),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStat(String value, String label, IconData icon, Color color) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 8),
          Text(value, style: AppTextStyles.statSm.copyWith(fontSize: 16)),
          const SizedBox(height: 2),
          Text(label, style: AppTextStyles.caption),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(
      width: 1,
      margin: const EdgeInsets.symmetric(vertical: 4),
      color: AppColors.borderLight,
    );
  }

  // ── Section label ─────────────────────────────────────────────────────────
  Widget _buildSectionLabel(String title) {
    return Text(
      title.toUpperCase(),
      style: AppTextStyles.overline.copyWith(
        color: AppColors.textSecondary,
        letterSpacing: 1.2,
      ),
    );
  }

  // ── Info Card ─────────────────────────────────────────────────────────────
  Widget _buildInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: [
          _buildInfoRow(
            Icons.badge_outlined,
            "ID Chauffeur",
            _profile?.driverId ?? "N/A",
            AppColors.primary,
          ),
          const Divider(height: 1, color: AppColors.borderLight, indent: 56),
          _buildInfoRow(
            Icons.phone_outlined,
            "Téléphone",
            "+227 00 00 00 00",
            AppColors.success,
          ),
          const Divider(height: 1, color: AppColors.borderLight, indent: 56),
          _buildInfoRow(
            Icons.email_outlined,
            "Email",
            _profile?.email ?? "N/A",
            AppColors.accent,
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
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: AppSpacing.roundedSm,
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppTextStyles.caption),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTextStyles.h6,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Settings Card ─────────────────────────────────────────────────────────
  Widget _buildSettingsCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.notifications_outlined,
            iconColor: AppColors.warning,
            title: "Notifications push",
            trailing: Switch.adaptive(
              value: _notificationsEnabled,
              activeColor: AppColors.primary,
              onChanged: (v) => setState(() => _notificationsEnabled = v),
            ),
          ),
          const Divider(height: 1, color: AppColors.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.language_outlined,
            iconColor: AppColors.info,
            title: "Langue",
            trailingText: "Français",
          ),
          const Divider(height: 1, color: AppColors.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.security_outlined,
            iconColor: AppColors.success,
            title: "Confidentialité",
          ),
          const Divider(height: 1, color: AppColors.borderLight, indent: 56),
          _buildSettingsTile(
            icon: Icons.help_outline_rounded,
            iconColor: AppColors.primary,
            title: "Aide & Support",
          ),
        ],
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
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: AppSpacing.roundedSm,
        ),
        child: Icon(icon, size: 18, color: iconColor),
      ),
      title: Text(title, style: AppTextStyles.h6),
      trailing: trailing ??
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (trailingText != null)
                Text(
                  trailingText,
                  style: AppTextStyles.caption.copyWith(color: AppColors.textHint),
                ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, size: 20, color: AppColors.textHint),
            ],
          ),
      onTap: trailing != null ? null : () {},
    );
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: () => _showLogoutConfirm(),
        icon: const Icon(Icons.logout_rounded, size: 18),
        label: const Text(
          "SE DÉCONNECTER",
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
            fontSize: 14,
          ),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: const BorderSide(color: AppColors.error, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
        ),
      ),
    );
  }

  void _showLogoutConfirm() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedXl),
        title: Text("Déconnexion", style: AppTextStyles.h4),
        content: Text(
          "Êtes-vous sûr de vouloir vous déconnecter ?",
          style: AppTextStyles.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              "Annuler",
              style: AppTextStyles.btn.copyWith(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Réafficher le splash (logo) AVANT de revenir à la connexion.
              // On remplace toute la pile : l'ancien AuthWrapper est retiré,
              // le splash relance ensuite le flux (utilisateur déconnecté → login).
              Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const SplashScreen()),
                (route) => false,
              );
              _authService.signOut();
            },
            child: Text(
              "Se déconnecter",
              style: AppTextStyles.btn.copyWith(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
