import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran de saisie d'un plein de carburant par le chauffeur.
/// Écrit dans la collection Firestore `fuel_records`.
class FuelEntryScreen extends StatefulWidget {
  final String? driverName;
  const FuelEntryScreen({super.key, this.driverName});

  @override
  State<FuelEntryScreen> createState() => _FuelEntryScreenState();
}

class _FuelEntryScreenState extends State<FuelEntryScreen> with TickerProviderStateMixin {
  // ── Services + contrôleurs ────────────────────────────────────────────────
  final FirestoreService _firestore = FirestoreService();
  final AuthService _auth = AuthService();

  final _quantityCtrl = TextEditingController();
  final _priceCtrl = TextEditingController(text: '650');
  final _stationCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();

  List<Map<String, dynamic>> _vehicles = [];
  String? _selectedVehicleId;
  bool _loadingVehicles = true;
  bool _submitting = false;
  bool _hasError = false;

  // ── États & Contrôleurs d'animation ───────────────────────────────────────
  bool _showSplash = true;
  bool _splashTimerDone = false;
  late AnimationController _splashController;
  late Animation<double> _splashFade;
  late Animation<double> _splashScale;

  late AnimationController _formController;
  final List<Animation<double>> _fadeAnimations = [];
  final List<Animation<Offset>> _slideAnimations = [];

  @override
  void initState() {
    super.initState();

    // Configuration de l'animation du Splash Screen
    _splashController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _splashFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _splashController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
      ),
    );

    _splashScale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(
        parent: _splashController,
        curve: const Interval(0.0, 0.7, curve: Curves.elasticOut),
      ),
    );

    // Configuration des animations Staggered pour le formulaire
    _formController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    for (int i = 0; i < 7; i++) {
      final double start = i * 0.08;
      final double end = (start + 0.45).clamp(0.0, 1.0);
      _fadeAnimations.add(
        Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _formController,
            curve: Interval(start, end, curve: Curves.easeOut),
          ),
        ),
      );
      _slideAnimations.add(
        Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _formController,
            curve: Interval(start, end, curve: Curves.easeOutCubic),
          ),
        ),
      );
    }

    _splashController.forward();
    _loadVehicles().then((_) {
      _checkFormReady();
    });

    // Délai minimal de 2 secondes pour le splash screen
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _splashTimerDone = true;
        });
        _checkFormReady();
      }
    });
  }

  void _checkFormReady() {
    if (_splashTimerDone && !_loadingVehicles) {
      if (mounted && _showSplash) {
        setState(() {
          _showSplash = false;
        });
        _formController.forward();
      }
    }
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    _priceCtrl.dispose();
    _stationCtrl.dispose();
    _mileageCtrl.dispose();
    _splashController.dispose();
    _formController.dispose();
    super.dispose();
  }

  // ── Firestore ─────────────────────────────────────────────────────────────
  Future<void> _loadVehicles() async {
    try {
      final list = await _firestore.getVehicles();
      if (!mounted) return;
      setState(() {
        _vehicles = list;
        _loadingVehicles = false;
        _hasError = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingVehicles = false;
        _hasError = true;
      });
    }
  }

  String _plateOf(String id) {
    final v = _vehicles.firstWhere((e) => e['id'] == id, orElse: () => {});
    return (v['plateNumber'] ?? 'N/A').toString();
  }

  Future<void> _submit() async {
    final quantity = double.tryParse(
        _quantityCtrl.text.trim().replaceAll(',', '.'));
    final price = double.tryParse(
        _priceCtrl.text.trim().replaceAll(',', '.'));

    if (_selectedVehicleId == null ||
        quantity == null ||
        quantity <= 0 ||
        price == null ||
        price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Véhicule, quantité et prix/litre sont obligatoires.',
            style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await _firestore.addFuelRecord(
        vehicleId: _selectedVehicleId!,
        vehiclePlate: _plateOf(_selectedVehicleId!),
        quantity: quantity,
        pricePerLiter: price,
        station: _stationCtrl.text.trim(),
        mileage: double.tryParse(
            _mileageCtrl.text.trim().replaceAll(',', '.')),
        driverId: _auth.currentUid,
        driverName: widget.driverName,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Plein enregistré avec succès.',
            style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Erreur : $e',
            style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w600),
          ),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Widgets Helpers ───────────────────────────────────────────────────────
  Widget _animatedItem(int index, Widget child) {
    if (index >= _fadeAnimations.length) return child;
    return FadeTransition(
      opacity: _fadeAnimations[index],
      child: SlideTransition(
        position: _slideAnimations[index],
        child: child,
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.plusJakartaSans(
          color: context.palette.textSecondary,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  InputDecoration _dec({required String hint, required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.plusJakartaSans(
        color: AppColors.textHint,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      prefixIcon: Icon(icon, color: AppColors.violet.withValues(alpha: 0.7), size: 20),
      filled: true,
      fillColor: context.palette.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: context.palette.border, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: context.palette.border, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.violet, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.error, width: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.appBgV2,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 500),
        switchInCurve: Curves.easeIn,
        switchOutCurve: Curves.easeOut,
        child: _showSplash ? _buildSplashScreen() : _buildFormScreen(),
      ),
    );
  }

  // ── Étape 1 : Splash Screen ───────────────────────────────────────────────
  Widget _buildSplashScreen() {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Container(
        key: const ValueKey('splash_screen'),
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF1E1B4B), // Indigo très sombre
              Color(0xFF311042), // Aubergine
              Color(0xFF4C1D95), // Violet profond
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _splashFade,
            child: ScaleTransition(
              scale: _splashScale,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildSplashIllustration(),
                    const SizedBox(height: 32),
                    Text(
                      "Carburant",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Préparation du plein...",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                    ),
                    const SizedBox(height: 48),
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white70,
                        strokeWidth: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSplashIllustration() {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Pulsing outer ring 1
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 1.0, end: 1.2),
          duration: const Duration(seconds: 2),
          curve: Curves.easeInOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.violet.withValues(alpha: 0.08),
                ),
              ),
            );
          },
        ),
        // Pulsing outer ring 2
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.9, end: 1.1),
          duration: const Duration(milliseconds: 1500),
          curve: Curves.easeInOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.violet.withValues(alpha: 0.12),
                ),
              ),
            );
          },
        ),
        // Central icon circle
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.25),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(
                  Icons.directions_car_rounded,
                  size: 40,
                  color: AppColors.violet,
                ),
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.local_gas_station_rounded,
                      size: 18,
                      color: AppColors.success,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── Étape 2 : Page Principale de Formulaire ────────────────────────────────
  Widget _buildFormScreen() {
    if (_loadingVehicles) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.violet,
          strokeWidth: 3,
        ),
      );
    }

    if (_hasError) {
      return _buildErrorState();
    }

    if (_vehicles.isEmpty) {
      return _buildEmptyState();
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Container(
        key: const ValueKey('form_screen'),
        color: AppColors.appBgV2,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              _buildHeader(),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _animatedItem(0, _buildVehicleSelector()),
                    const SizedBox(height: 16),
                    _animatedItem(1, _buildQuantityField()),
                    const SizedBox(height: 16),
                    _animatedItem(2, _buildPriceField()),
                    const SizedBox(height: 16),
                    _animatedItem(3, _buildStationField()),
                    const SizedBox(height: 16),
                    _animatedItem(4, _buildMileageField()),
                    const SizedBox(height: 24),
                    _animatedItem(5, _buildTotalCostCard()),
                    const SizedBox(height: 28),
                    _animatedItem(6, _buildSubmitButton()),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 230,
      width: double.infinity,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
        child: Stack(
          children: [
            // Image / Fallback
            Positioned.fill(
              child: Image.asset(
                'assets/images/fuel_car.jpg',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  // Beautiful gradient fallback
                  return Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.violet,
                          AppColors.violetDark,
                          AppColors.violetDeep,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          right: -30,
                          bottom: -30,
                          child: Icon(
                            Icons.local_gas_station_rounded,
                            size: 180,
                            color: Colors.white.withValues(alpha: 0.08),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Dark Overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.55),
                      Colors.black.withValues(alpha: 0.2),
                    ],
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                  ),
                ),
              ),
            ),
            // Content
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top controls
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.arrow_back_ios_new_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.2),
                            padding: const EdgeInsets.all(10),
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.local_gas_station_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                "Carburant",
                                style: GoogleFonts.plusJakartaSans(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    // Texts
                    Padding(
                      padding: const EdgeInsets.only(left: 8, bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Nouveau plein",
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Renseignez les informations du carburant",
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                          ),
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
    );
  }

  Widget _buildVehicleSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('VÉHICULE'),
        DropdownButtonFormField<String>(
          value: _selectedVehicleId,
          isExpanded: true,
          dropdownColor: context.palette.surface,
          style: GoogleFonts.plusJakartaSans(
            color: context.palette.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          decoration: _dec(
            hint: 'Sélectionner un véhicule',
            icon: Icons.directions_car_rounded,
          ),
          items: _vehicles
              .map((v) => DropdownMenuItem<String>(
                    value: v['id'] as String,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.violetLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${v['plateNumber'] ?? '—'}',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.violet,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '${v['brand'] ?? ''} ${v['model'] ?? ''}',
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              color: context.palette.textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ))
              .toList(),
          onChanged: (val) => setState(() => _selectedVehicleId = val),
        ),
      ],
    );
  }

  Widget _buildQuantityField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('QUANTITÉ (LITRES)'),
        TextField(
          controller: _quantityCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: GoogleFonts.plusJakartaSans(
            color: context.palette.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          onChanged: (_) => setState(() {}),
          decoration: _dec(
            hint: 'Ex: 40',
            icon: Icons.local_gas_station_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildPriceField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('PRIX PAR LITRE (FCFA)'),
        TextField(
          controller: _priceCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: GoogleFonts.plusJakartaSans(
            color: context.palette.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          onChanged: (_) => setState(() {}),
          decoration: _dec(
            hint: 'Ex: 650',
            icon: Icons.price_change_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildStationField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('STATION-SERVICE (OPTIONNELLE)'),
        TextField(
          controller: _stationCtrl,
          style: GoogleFonts.plusJakartaSans(
            color: context.palette.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          decoration: _dec(
            hint: 'Ex: Total Niamey',
            icon: Icons.store_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildMileageField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('KILOMÉTRAGE (OPTIONNEL)'),
        TextField(
          controller: _mileageCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: GoogleFonts.plusJakartaSans(
            color: context.palette.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          decoration: _dec(
            hint: 'Ex: 125000',
            icon: Icons.speed_rounded,
          ),
        ),
      ],
    );
  }

  Widget _buildTotalCostCard() {
    final quantity = double.tryParse(_quantityCtrl.text.trim().replaceAll(',', '.')) ?? 0.0;
    final price = double.tryParse(_priceCtrl.text.trim().replaceAll(',', '.')) ?? 0.0;
    final total = quantity * price;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.violetLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.violetSoft, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.receipt_long_rounded,
                    size: 20,
                    color: AppColors.violet,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Coût total estimé',
                        style: GoogleFonts.plusJakartaSans(
                          color: AppColors.violetDark,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Calculé automatiquement',
                        style: GoogleFonts.plusJakartaSans(
                          color: AppColors.violet.withValues(alpha: 0.7),
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0, end: total),
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
            builder: (context, value, child) {
              return Text(
                '${value.toStringAsFixed(0)} FCFA',
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.violetDeep,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      height: 56,
      child: Container(
        decoration: BoxDecoration(
          gradient: _submitting ? null : AppTheme.violetButtonGradient,
          color: _submitting ? Colors.grey.shade400 : null,
          borderRadius: BorderRadius.circular(16),
          boxShadow: _submitting ? null : AppTheme.shadowViolet,
        ),
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            disabledBackgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: _submitting
              ? const Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.5,
                    ),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.local_gas_station_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Text(
                      'Enregistrer le plein',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.violetLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.directions_car_rounded,
                color: AppColors.violet,
                size: 64,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Aucun véhicule disponible",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: context.palette.textHeading,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Veuillez contacter votre administrateur de flotte pour obtenir l'attribution d'un véhicule.",
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: context.palette.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  "Retour au tableau de bord",
                  style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.errorLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                color: AppColors.error,
                size: 64,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Erreur de chargement",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: context.palette.textHeading,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Impossible de récupérer la liste des véhicules. Veuillez vérifier votre connexion Internet.",
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: context.palette.textSecondary,
              ),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      side: BorderSide(color: context.palette.border, width: 1.5),
                      minimumSize: const Size.fromHeight(52),
                    ),
                    child: Text(
                      "Retour",
                      style: GoogleFonts.plusJakartaSans(
                        color: context.palette.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _loadingVehicles = true;
                      });
                      _loadVehicles();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.violet,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      minimumSize: const Size.fromHeight(52),
                    ),
                    child: Text(
                      "Réessayer",
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
