import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../theme/app_transitions.dart';
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

  late final AnimationController _ctrl;
  late final Animation<double> _headerAnim;
  late final Animation<double> _sheetFadeAnim;
  late final Animation<Offset> _sheetSlideAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();

    _headerAnim = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.0, 0.65, curve: Curves.easeOut),
    );
    _sheetFadeAnim = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.15, 0.8, curve: Curves.easeOut),
    );
    _sheetSlideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
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
    final topPad = MediaQuery.of(context).padding.top;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.primaryDark,
        body: Column(
          children: [
            // ── Header gradient ───────────────────────────────────────────────
            FadeTransition(
              opacity: _headerAnim,
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
                padding: EdgeInsets.fromLTRB(28, topPad + 44, 28, 52),
                child: _buildHero(),
              ),
            ),
            // ── Sheet blanc ───────────────────────────────────────────────────
            Expanded(
              child: SlideTransition(
                position: _sheetSlideAnim,
                child: FadeTransition(
                  opacity: _sheetFadeAnim,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                    ),
                    child: SingleChildScrollView(
                      padding: EdgeInsets.fromLTRB(24, 32, 24, bottomPad + 24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text("Connectez-vous", style: AppTextStyles.h3),
                            const SizedBox(height: 4),
                            Text(
                              "Entrez vos identifiants pour continuer",
                              style: AppTextStyles.bodySm,
                            ),
                            const SizedBox(height: 28),
                            if (_errorMessage != null) ...[
                              _buildErrorBanner(),
                              const SizedBox(height: 20),
                            ],
                            _fieldLabel("ADRESSE EMAIL"),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              autocorrect: false,
                              style: AppTextStyles.body
                                  .copyWith(fontWeight: FontWeight.w500),
                              decoration: const InputDecoration(
                                hintText: "chauffeur@geoconsulting.com",
                                prefixIcon: Icon(Icons.email_outlined),
                              ),
                              validator: (v) => (v ?? '').isEmpty
                                  ? "Veuillez entrer votre email"
                                  : null,
                            ),
                            const SizedBox(height: 20),
                            _fieldLabel("MOT DE PASSE"),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              textInputAction: TextInputAction.done,
                              onFieldSubmitted: (_) => _handleLogin(),
                              style: AppTextStyles.body
                                  .copyWith(fontWeight: FontWeight.w500),
                              decoration: InputDecoration(
                                hintText: "••••••••",
                                prefixIcon:
                                    const Icon(Icons.lock_outline_rounded),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 20,
                                  ),
                                  color: AppColors.textSecondary,
                                  onPressed: () => setState(
                                      () => _obscurePassword = !_obscurePassword),
                                ),
                              ),
                              validator: (v) => (v ?? '').length < 6
                                  ? "Minimum 6 caractères"
                                  : null,
                            ),
                            const SizedBox(height: 4),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () => Navigator.push(
                                  context,
                                  AppTransitions.slideRight(
                                      const ForgotPasswordScreen()),
                                ),
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 4, vertical: 4),
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
                            const SizedBox(height: 20),
                            _buildSubmitButton(),
                            const SizedBox(height: 28),
                            _buildFooter(),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Hero (sur le header gradient) ─────────────────────────────────────────
  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.3),
              width: 1.5,
            ),
          ),
          child: Center(
            child: Image.asset(
              'assets/images/logo_geoconsulting.png',
              width: 36,
              height: 36,
              fit: BoxFit.contain,
              errorBuilder: (context, error, _) => const Icon(
                Icons.local_shipping_rounded,
                color: Colors.white,
                size: 34,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          "Geoconsulting",
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          "Espace Chauffeur",
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.75),
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }

  // ── Bannière d'erreur ──────────────────────────────────────────────────────
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
            child:
                const Icon(Icons.close_rounded, color: AppColors.error, size: 18),
          ),
        ],
      ),
    );
  }

  // ── Bouton de connexion ────────────────────────────────────────────────────
  Widget _buildSubmitButton() {
    return Container(
      height: 54,
      decoration: BoxDecoration(
        gradient: _isLoading ? null : AppTheme.primaryGradient,
        color: _isLoading ? AppColors.primary : null,
        borderRadius: AppSpacing.roundedLg,
        boxShadow: _isLoading ? null : AppTheme.shadowColored(AppColors.primary),
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
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2.5),
              )
            : Text(
                "SE CONNECTER",
                style: AppTextStyles.btnLg.copyWith(
                  color: Colors.white,
                  letterSpacing: 1,
                ),
              ),
      ),
    );
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
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
                AppTransitions.slideRight(const RegisterScreen()),
              ),
              child: Text(
                "Créer un compte",
                style: AppTextStyles.label.copyWith(color: AppColors.primary),
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

  // ── Label de champ ─────────────────────────────────────────────────────────
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
