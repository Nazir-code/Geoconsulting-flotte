import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final AuthService _authService = AuthService();

  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await _authService.signIn(
        _emailController.text.trim().toLowerCase(),
        _passwordController.text.trim(),
      );
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildHero(),
                      const SizedBox(height: 40),
                      if (_errorMessage != null) ...[
                        _buildErrorBanner(),
                        const SizedBox(height: 20),
                      ],
                      _buildFormCard(),
                      const SizedBox(height: 28),
                      _buildSubmitButton(),
                      const SizedBox(height: 32),
                      _buildFooter(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Background décoration ─────────────────────────────────────────────────
  Widget _buildBackground() {
    return Stack(
      children: [
        Positioned(
          top: -80,
          left: -80,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.06),
            ),
          ),
        ),
        Positioned(
          top: 80,
          right: -60,
          child: Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.accent.withValues(alpha: 0.07),
            ),
          ),
        ),
        Positioned(
          bottom: -60,
          right: -40,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.04),
            ),
          ),
        ),
      ],
    );
  }

  // ── Hero section ──────────────────────────────────────────────────────────
  Widget _buildHero() {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: AppSpacing.roundedXl,
            boxShadow: AppTheme.shadowColored(AppColors.primary),
          ),
          child: Center(
            child: Image.asset(
              'assets/images/logo_geoconsulting.png',
              width: 40,
              height: 40,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.local_shipping_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text("Geoconsulting", style: AppTextStyles.h1),
        const SizedBox(height: 6),
        Text(
          "Espace Chauffeur",
          style: AppTextStyles.bodySm.copyWith(
            letterSpacing: 1.5,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
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
        border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
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

  // ── Form card ─────────────────────────────────────────────────────────────
  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppSpacing.roundedXl,
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppTheme.shadowMd,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Se connecter", style: AppTextStyles.h4),
          const SizedBox(height: 4),
          Text("Entrez vos identifiants pour continuer",
              style: AppTextStyles.bodySm),
          const SizedBox(height: 28),

          // Email
          _fieldLabel("ADRESSE EMAIL"),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
            decoration: const InputDecoration(
              hintText: "chauffeur@geoconsulting.com",
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (v) =>
                (v ?? '').isEmpty ? "Veuillez entrer votre email" : null,
          ),
          const SizedBox(height: 20),

          // Password
          _fieldLabel("MOT DE PASSE"),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _handleLogin(),
            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: "••••••••",
              prefixIcon: const Icon(Icons.lock_outline_rounded),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  size: 20,
                ),
                color: AppColors.textSecondary,
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (v) =>
                (v ?? '').length < 6 ? "Minimum 6 caractères" : null,
          ),
          const SizedBox(height: 4),

          // Forgot password
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const ForgotPasswordScreen()),
              ),
              style: TextButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              ),
              child: Text(
                "Mot de passe oublié ?",
                style: AppTextStyles.labelSm.copyWith(
                  color: AppColors.primary,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Submit button ─────────────────────────────────────────────────────────
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
              color: Colors.white,
              strokeWidth: 2.5,
            ),
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
        onPressed: _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
        ),
        child: Text(
          "SE CONNECTER",
          style: AppTextStyles.btnLg.copyWith(
            color: Colors.white,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  Widget _buildFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Nouveau chauffeur ?", style: AppTextStyles.body),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RegisterScreen()),
              ),
              child: Text(
                "Créer un compte",
                style: AppTextStyles.label
                    .copyWith(color: AppColors.primary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          "FleetNexus · NOVATECH © 2026",
          style: AppTextStyles.caption.copyWith(color: AppColors.textHint),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ── Field label helper ────────────────────────────────────────────────────
  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: AppTextStyles.overline.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}
