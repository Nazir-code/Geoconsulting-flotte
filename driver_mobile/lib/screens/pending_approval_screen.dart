import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran affiché tant que l'inscription d'un chauffeur n'est pas validée par un
/// gestionnaire (ou si elle a été refusée). L'app est bloquée ici ; le passage
/// vers l'app réelle se fait automatiquement dès que le statut passe à 'approved'
/// (le verrou _ApprovalGate écoute le doc Firestore en temps réel).
class PendingApprovalScreen extends StatelessWidget {
  final bool rejected;
  const PendingApprovalScreen({super.key, this.rejected = false});

  @override
  Widget build(BuildContext context) {
    final Color accent = rejected ? AppColors.error : AppColors.warning;
    final IconData icon =
        rejected ? Icons.block_rounded : Icons.hourglass_top_rounded;
    final String title =
        rejected ? 'Inscription refusée' : 'Compte en attente de validation';
    final String message = rejected
        ? "Votre inscription a été refusée par un gestionnaire. "
            "Contactez votre responsable de flotte pour plus d'informations."
        : "Votre compte a bien été créé. Un gestionnaire doit valider votre "
            "inscription avant que vous puissiez accéder à l'application. "
            "Cette page se débloquera automatiquement dès validation.";

    return Scaffold(
      backgroundColor: context.palette.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: accent, size: 48),
              ),
              AppSpacing.gapXl,
              Text(
                title,
                textAlign: TextAlign.center,
                style: AppTextStyles.h3,
              ),
              AppSpacing.gapMd,
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTextStyles.bodySm.copyWith(height: 1.6),
              ),
              if (!rejected) ...[
                AppSpacing.gapXl2,
                const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: AppColors.warning,
                    strokeWidth: 2.5,
                  ),
                ),
              ],
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () => AuthService().signOut(),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: Text(
                    'Se déconnecter',
                    style: AppTextStyles.btn.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: BorderSide(color: context.palette.border, width: 1.5),
                    shape: RoundedRectangleBorder(
                        borderRadius: AppSpacing.roundedMd),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
