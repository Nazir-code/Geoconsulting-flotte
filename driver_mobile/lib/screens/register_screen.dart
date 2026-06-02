import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _acceptedTerms = false;
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
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_acceptedTerms) {
      setState(() =>
          _errorMessage = "Veuillez accepter les conditions d'utilisation.");
      return;
    }
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              "Demande envoyée. En attente de validation par l'administrateur."),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildTopBar(),
                          const SizedBox(height: 28),
                          _buildHeader(),
                          const SizedBox(height: 32),
                          if (_errorMessage != null) ...[
                            _buildErrorBanner(),
                            const SizedBox(height: 20),
                          ],
                          Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _buildSection(
                                  icon: Icons.person_outline_rounded,
                                  label: "Informations personnelles",
                                  children: [
                                    _buildField(
                                      label: "NOM COMPLET",
                                      hint: "Ex : Jean Dupont",
                                      icon: Icons.badge_outlined,
                                      controller: _nameController,
                                      textCapitalization:
                                          TextCapitalization.words,
                                      validator: (v) => (v ?? '').isEmpty
                                          ? "Entrez votre nom"
                                          : null,
                                    ),
                                    const SizedBox(height: 16),
                                    _buildField(
                                      label: "TÉLÉPHONE",
                                      hint: "+227 00 00 00 00",
                                      icon: Icons.phone_outlined,
                                      controller: _phoneController,
                                      keyboardType: TextInputType.phone,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.allow(
                                            RegExp(r'[0-9+\s]')),
                                      ],
                                      validator: (v) => (v ?? '').isEmpty
                                          ? "Entrez votre numéro"
                                          : null,
                                    ),
                                    const SizedBox(height: 16),
                                    _buildField(
                                      label: "ADRESSE EMAIL",
                                      hint: "votre@email.com",
                                      icon: Icons.email_outlined,
                                      controller: _emailController,
                                      keyboardType:
                                          TextInputType.emailAddress,
                                      validator: (v) {
                                        if ((v ?? '').isEmpty) {
                                          return "Entrez votre email";
                                        }
                                        if (!v!.contains('@')) {
                                          return "Email invalide";
                                        }
                                        return null;
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                _buildSection(
                                  icon: Icons.lock_outline_rounded,
                                  label: "Sécurité",
                                  children: [
                                    _buildPasswordField(
                                      label: "MOT DE PASSE",
                                      hint: "••••••••",
                                      controller: _passwordController,
                                      obscure: _obscurePassword,
                                      onToggle: () => setState(() =>
                                          _obscurePassword =
                                              !_obscurePassword),
                                      validator: (v) =>
                                          (v ?? '').length < 6
                                              ? "Minimum 6 caractères"
                                              : null,
                                    ),
                                    const SizedBox(height: 16),
                                    _buildPasswordField(
                                      label: "CONFIRMATION",
                                      hint: "••••••••",
                                      controller: _confirmPasswordController,
                                      obscure: _obscureConfirm,
                                      onToggle: () => setState(() =>
                                          _obscureConfirm = !_obscureConfirm),
                                      validator: (v) =>
                                          v != _passwordController.text
                                              ? "Les mots de passe ne correspondent pas"
                                              : null,
                                    ),
                                    const SizedBox(height: 16),
                                    _buildPasswordStrength(),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                _buildTermsRow(),
                                const SizedBox(height: 28),
                                _buildSubmitButton(),
                                const SizedBox(height: 20),
                                _buildLoginLink(),
                                const SizedBox(height: 40),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Background ────────────────────────────────────────────────────────────
  Widget _buildBackground() {
    return Stack(
      children: [
        Positioned(
          top: -100,
          right: -80,
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.accent.withValues(alpha: 0.06),
            ),
          ),
        ),
        Positioned(
          bottom: -60,
          left: -60,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.05),
            ),
          ),
        ),
      ],
    );
  }

  // ── Top bar ───────────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return Row(
      children: [
        GestureDetector(
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
        const Spacer(),
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: AppSpacing.roundedFull,
          ),
          child: Text(
            "Inscription",
            style: AppTextStyles.labelSm.copyWith(
              color: AppColors.primary,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ],
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: AppSpacing.roundedMd,
            boxShadow: AppTheme.shadowColored(AppColors.primary, opacity: 0.25),
          ),
          child: const Icon(Icons.person_add_rounded,
              color: Colors.white, size: 26),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Créer un compte", style: AppTextStyles.h2),
            const SizedBox(height: 2),
            Text("Rejoignez la flotte Geoconsulting",
                style: AppTextStyles.bodySm),
          ],
        ),
      ],
    );
  }

  // ── Error banner ──────────────────────────────────────────────────────────
  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.errorLight,
        borderRadius: AppSpacing.roundedMd,
        border:
            Border.all(color: AppColors.error.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppColors.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _errorMessage!,
              style: AppTextStyles.bodySm.copyWith(color: AppColors.error),
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _errorMessage = null),
            child: const Icon(Icons.close_rounded,
                color: AppColors.error, size: 18),
          ),
        ],
      ),
    );
  }

  // ── Section wrapper ───────────────────────────────────────────────────────
  Widget _buildSection({
    required IconData icon,
    required String label,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: AppSpacing.roundedSm,
                ),
                child: Icon(icon, color: AppColors.primary, size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                label.toUpperCase(),
                style: AppTextStyles.overline.copyWith(
                  color: AppColors.textSecondary,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(height: 1, color: AppColors.borderLight),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  // ── Text field helper ─────────────────────────────────────────────────────
  Widget _buildField({
    required String label,
    required String hint,
    required IconData icon,
    required TextEditingController controller,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          inputFormatters: inputFormatters,
          textInputAction: TextInputAction.next,
          style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon),
          ),
          validator: validator,
        ),
      ],
    );
  }

  // ── Password field helper ─────────────────────────────────────────────────
  Widget _buildPasswordField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          textInputAction: TextInputAction.next,
          style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: const Icon(Icons.lock_outline_rounded),
            suffixIcon: IconButton(
              icon: Icon(obscure
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
                  size: 20),
              color: AppColors.textSecondary,
              onPressed: onToggle,
            ),
          ),
          validator: validator,
        ),
      ],
    );
  }

  // ── Password strength indicator ───────────────────────────────────────────
  Widget _buildPasswordStrength() {
    final pwd = _passwordController.text;
    if (pwd.isEmpty) return const SizedBox.shrink();

    final hasLength = pwd.length >= 8;
    final hasUpper = pwd.contains(RegExp(r'[A-Z]'));
    final hasDigit = pwd.contains(RegExp(r'[0-9]'));
    final strength = [hasLength, hasUpper, hasDigit]
        .where((v) => v)
        .length; // 0-3

    final colors = [AppColors.error, AppColors.warning, AppColors.success];
    final labels = ["Faible", "Moyen", "Fort"];
    final barColor = strength == 0 ? AppColors.border : colors[strength - 1];
    final label = strength == 0 ? "" : labels[strength - 1];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(3, (i) {
            final filled = i < strength;
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                decoration: BoxDecoration(
                  color: filled ? barColor : AppColors.borderLight,
                  borderRadius: AppSpacing.roundedFull,
                ),
              ),
            );
          }),
        ),
        if (label.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            "Sécurité : $label",
            style: AppTextStyles.caption.copyWith(color: barColor),
          ),
        ],
      ],
    );
  }

  // ── Terms checkbox ────────────────────────────────────────────────────────
  Widget _buildTermsRow() {
    return GestureDetector(
      onTap: () => setState(() => _acceptedTerms = !_acceptedTerms),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: _acceptedTerms ? AppColors.primary : AppColors.surface,
              borderRadius: AppSpacing.roundedXs,
              border: Border.all(
                color: _acceptedTerms
                    ? AppColors.primary
                    : AppColors.border,
                width: 1.5,
              ),
            ),
            child: _acceptedTerms
                ? const Icon(Icons.check_rounded,
                    color: Colors.white, size: 14)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text.rich(
              TextSpan(
                style: AppTextStyles.bodySm,
                children: [
                  const TextSpan(text: "J'accepte les "),
                  TextSpan(
                    text: "conditions d'utilisation",
                    style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600),
                  ),
                  const TextSpan(text: " et la "),
                  TextSpan(
                    text: "politique de confidentialité",
                    style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600),
                  ),
                  const TextSpan(text: " de NOVATECH."),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Submit button ─────────────────────────────────────────────────────────
  Widget _buildSubmitButton() {
    final isEnabled = _acceptedTerms && !_isLoading;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 54,
      decoration: BoxDecoration(
        gradient: isEnabled
            ? AppTheme.primaryGradient
            : const LinearGradient(
                colors: [AppColors.textDisabled, AppColors.textDisabled]),
        borderRadius: AppSpacing.roundedLg,
        boxShadow: isEnabled
            ? AppTheme.shadowColored(AppColors.primary)
            : null,
      ),
      child: ElevatedButton(
        onPressed: isEnabled ? _handleRegister : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          disabledBackgroundColor: Colors.transparent,
          shape:
              RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2.5),
              )
            : Text(
                "CRÉER MON COMPTE",
                style: AppTextStyles.btnLg
                    .copyWith(color: Colors.white, letterSpacing: 1),
              ),
      ),
    );
  }

  // ── Login link ────────────────────────────────────────────────────────────
  Widget _buildLoginLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text("Déjà inscrit ?", style: AppTextStyles.body),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            "Se connecter",
            style: AppTextStyles.label.copyWith(color: AppColors.primary),
          ),
        ),
      ],
    );
  }

  // ── Field label ───────────────────────────────────────────────────────────
  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: AppTextStyles.overline
            .copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}
