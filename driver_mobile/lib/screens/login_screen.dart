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

  // ── Firebase auth — INCHANGÉ ──────────────────────────────────────────────
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
      backgroundColor: Colors.white,
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

  // ── Cercles décoratifs violet ─────────────────────────────────────────────
  Widget _buildBackground() {
    return Stack(
      children: [
        Positioned(
          top: -80,
          right: -80,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.violetLight.withValues(alpha: 0.60),
            ),
          ),
        ),
        Positioned(
          top: 80,
          right: 20,
          child: Container(
            width: 110,
            height: 110,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.violetSoft.withValues(alpha: 0.40),
            ),
          ),
        ),
        Positioned(
          bottom: -60,
          right: -40,
          child: Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.violetLight.withValues(alpha: 0.30),
            ),
          ),
        ),
      ],
    );
  }

  // ── Icône voiture + titre ─────────────────────────────────────────────────
  Widget _buildHero() {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppTheme.violetButtonGradient,
            borderRadius: BorderRadius.circular(22),
            boxShadow: AppTheme.shadowViolet,
          ),
          child: const Icon(
            Icons.directions_car_rounded,
            color: Colors.white,
            size: 32,
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'Geoconsulting Fleet',
          style: AppTextStyles.jkHeroName.copyWith(
            color: AppColors.textHeadingV2,
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Bienvenue, connectez-vous pour continuer',
          style: AppTextStyles.jkCardSub,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ── Bannière erreur (inchangée) ───────────────────────────────────────────
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

  // ── Champs (sans carte) ───────────────────────────────────────────────────
  Widget _buildFormCard() {
    const inputRadius = BorderRadius.all(Radius.circular(14));
    const inputFill = Color(0xFFF9FAFB);
    final focusBorder = OutlineInputBorder(
      borderRadius: inputRadius,
      borderSide: BorderSide(color: AppColors.violet, width: 1.5),
    );
    final errBorder = OutlineInputBorder(
      borderRadius: inputRadius,
      borderSide: BorderSide(color: AppColors.error, width: 1.5),
    );
    const noBorder = OutlineInputBorder(
      borderRadius: inputRadius,
      borderSide: BorderSide.none,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Email
        _fieldLabel('ADRESSE EMAIL'),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          autocorrect: false,
          style: AppTextStyles.jkCardTitle.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            filled: true,
            fillColor: inputFill,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hintText: 'chauffeur@geoconsulting.com',
            hintStyle:
                AppTextStyles.jkCardSub.copyWith(color: AppColors.textHint),
            prefixIcon: const Icon(Icons.email_outlined,
                size: 18, color: AppColors.textSecondary),
            border: noBorder,
            enabledBorder: noBorder,
            focusedBorder: focusBorder,
            errorBorder: errBorder,
            focusedErrorBorder: errBorder,
          ),
          validator: (v) =>
              (v ?? '').isEmpty ? 'Veuillez entrer votre email' : null,
        ),
        const SizedBox(height: 20),

        // Mot de passe
        _fieldLabel('MOT DE PASSE'),
        TextFormField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _handleLogin(),
          style: AppTextStyles.jkCardTitle.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            filled: true,
            fillColor: inputFill,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hintText: '••••••••',
            hintStyle:
                AppTextStyles.jkCardSub.copyWith(color: AppColors.textHint),
            prefixIcon: const Icon(Icons.lock_outline_rounded,
                size: 18, color: AppColors.textSecondary),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 18,
              ),
              color: AppColors.textSecondary,
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
            ),
            border: noBorder,
            enabledBorder: noBorder,
            focusedBorder: focusBorder,
            errorBorder: errBorder,
            focusedErrorBorder: errBorder,
          ),
          validator: (v) =>
              (v ?? '').length < 6 ? 'Minimum 6 caractères' : null,
        ),
        const SizedBox(height: 4),

        // Mot de passe oublié
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const ForgotPasswordScreen()),
            ),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            ),
            child: Text('Mot de passe oublié ?', style: AppTextStyles.jkLink),
          ),
        ),
      ],
    );
  }

  // ── Bouton connexion violet ───────────────────────────────────────────────
  Widget _buildSubmitButton() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 54,
      decoration: BoxDecoration(
        gradient: _isLoading
            ? LinearGradient(colors: [
                AppColors.violet.withValues(alpha: 0.70),
                AppColors.violetDark.withValues(alpha: 0.70),
              ])
            : AppTheme.violetButtonGradient,
        borderRadius: AppSpacing.roundedLg,
        boxShadow: _isLoading ? [] : AppTheme.shadowViolet,
      ),
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          disabledBackgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : Text(
                'SE CONNECTER',
                style: AppTextStyles.jkBtnPrimary.copyWith(letterSpacing: 0.8),
              ),
      ),
    );
  }

  // ── Footer (liens navigation) ─────────────────────────────────────────────
  Widget _buildFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Nouveau chauffeur ?', style: AppTextStyles.bodySm),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RegisterScreen()),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
              child: Text('Créer un compte', style: AppTextStyles.jkLink),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'FleetNexus · NOVATECH © 2026',
          style: AppTextStyles.jkVersion.copyWith(color: AppColors.textHint),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ── Label de champ ────────────────────────────────────────────────────────
  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: AppTextStyles.jkBadge.copyWith(
          color: AppColors.textSecondary,
          fontSize: 10,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
