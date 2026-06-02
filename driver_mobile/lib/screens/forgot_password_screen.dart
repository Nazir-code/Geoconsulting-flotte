import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;
  String? _errorMessage;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..forward();
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMessage = "Veuillez entrer votre adresse email.");
      return;
    }
    if (!email.contains('@')) {
      setState(() => _errorMessage = "Adresse email invalide.");
      return;
    }
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    // Transition vers l'état "envoyé" avec fade
    _fadeCtrl.reset();
    setState(() {
      _isLoading = false;
      _emailSent = true;
    });
    _fadeCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
                boxShadow: AppTheme.shadowSm,
              ),
              child: const Icon(Icons.arrow_back_rounded,
                  color: AppColors.textHeading, size: 20),
            ),
          ),
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: _emailSent ? _buildSuccessState() : _buildFormState(),
      ),
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  Widget _buildFormState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),

          // Icon
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
                boxShadow: AppTheme.shadowColored(
                    AppColors.primary, opacity: 0.15),
              ),
              child: const Icon(
                Icons.lock_reset_rounded,
                color: AppColors.primary,
                size: 38,
              ),
            ),
          ),
          const SizedBox(height: 28),

          // Title + subtitle
          Text(
            "Mot de passe oublié ?",
            style: AppTextStyles.h2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            "Entrez l'email associé à votre compte.\nNous vous enverrons un lien de réinitialisation.",
            style: AppTextStyles.bodySm,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),

          // Error
          if (_errorMessage != null) ...[
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius: AppSpacing.roundedMd,
                border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded,
                      color: AppColors.error, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: AppTextStyles.bodySm
                          .copyWith(color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Form card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppSpacing.roundedXl,
              border: Border.all(color: AppColors.borderLight),
              boxShadow: AppTheme.shadowMd,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(
                    "ADRESSE EMAIL",
                    style: AppTextStyles.overline
                        .copyWith(color: AppColors.textSecondary),
                  ),
                ),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  autocorrect: false,
                  onSubmitted: (_) => _handleReset(),
                  style: AppTextStyles.body
                      .copyWith(fontWeight: FontWeight.w500),
                  decoration: const InputDecoration(
                    hintText: "chauffeur@geoconsulting.com",
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.info_outline_rounded,
                        size: 14, color: AppColors.textHint),
                    const SizedBox(width: 6),
                    Text(
                      "Vérifiez aussi vos spams.",
                      style: AppTextStyles.caption
                          .copyWith(color: AppColors.textHint),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit button
          _buildSubmitButton(),
          const SizedBox(height: 20),

          // Back to login
          Center(
            child: TextButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_rounded, size: 16),
              label: const Text("Retour à la connexion"),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.textSecondary,
                textStyle: AppTextStyles.label.copyWith(
                    color: AppColors.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    if (_isLoading) {
      return Container(
        height: 54,
        decoration: BoxDecoration(
          gradient: AppTheme.primaryGradient,
          borderRadius: AppSpacing.roundedLg,
        ),
        child: const Center(
          child: SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
                color: Colors.white, strokeWidth: 2.5),
          ),
        ),
      );
    }
    return Container(
      height: 54,
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: AppSpacing.roundedLg,
        boxShadow: AppTheme.shadowColored(AppColors.primary),
      ),
      child: ElevatedButton(
        onPressed: _handleReset,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
              borderRadius: AppSpacing.roundedLg),
        ),
        child: Text(
          "ENVOYER LE LIEN",
          style: AppTextStyles.btnLg
              .copyWith(color: Colors.white, letterSpacing: 1),
        ),
      ),
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  Widget _buildSuccessState() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 32),

          // Success icon
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mark_email_read_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          Text(
            "Email envoyé !",
            style: AppTextStyles.h2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            "Un lien de réinitialisation a été envoyé à :",
            style: AppTextStyles.bodySm,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Center(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: AppSpacing.roundedMd,
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                _emailController.text.trim(),
                style: AppTextStyles.label.copyWith(
                  color: AppColors.primary,
                  fontFamily: 'JetBrainsMono',
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Vérifiez votre boîte mail et vos spams.\nLe lien expire dans 24 heures.",
            style: AppTextStyles.bodySm,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),

          // Steps hint
          _buildChecklist(),
          const SizedBox(height: 40),

          // Back button
          Container(
            height: 54,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: AppSpacing.roundedLg,
              boxShadow: AppTheme.shadowColored(AppColors.primary),
            ),
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.login_rounded, size: 20),
              label: Text(
                "RETOUR À LA CONNEXION",
                style: AppTextStyles.btnLg
                    .copyWith(color: Colors.white, letterSpacing: 0.8),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                    borderRadius: AppSpacing.roundedLg),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Resend
          Center(
            child: TextButton(
              onPressed: () {
                _fadeCtrl.reset();
                setState(() => _emailSent = false);
                _fadeCtrl.forward();
              },
              child: Text(
                "Renvoyer le lien",
                style: AppTextStyles.label
                    .copyWith(color: AppColors.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChecklist() {
    const steps = [
      (icon: Icons.inbox_rounded,        text: "Ouvrez votre application mail"),
      (icon: Icons.link_rounded,         text: "Cliquez sur le lien reçu"),
      (icon: Icons.lock_open_rounded,    text: "Créez un nouveau mot de passe"),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedLg,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: steps.asMap().entries.map((e) {
          final isLast = e.key == steps.length - 1;
          return Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(e.value.icon,
                        color: AppColors.primary, size: 16),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(e.value.text, style: AppTextStyles.body),
                  ),
                  Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded,
                        color: Colors.white, size: 12),
                  ),
                ],
              ),
              if (!isLast) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 15),
                  child: Container(
                    width: 2,
                    height: 16,
                    color: AppColors.borderLight,
                  ),
                ),
                const SizedBox(height: 4),
              ],
            ],
          );
        }).toList(),
      ),
    );
  }
}
