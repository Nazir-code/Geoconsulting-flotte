import 'package:flutter/material.dart';
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

class _FuelEntryScreenState extends State<FuelEntryScreen> {
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

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    _priceCtrl.dispose();
    _stationCtrl.dispose();
    _mileageCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadVehicles() async {
    final list = await _firestore.getVehicles();
    if (!mounted) return;
    setState(() {
      _vehicles = list;
      _loadingVehicles = false;
    });
  }

  String _plateOf(String id) {
    final v = _vehicles.firstWhere((e) => e['id'] == id, orElse: () => {});
    return (v['plateNumber'] ?? 'N/A').toString();
  }

  Future<void> _submit() async {
    final quantity = double.tryParse(_quantityCtrl.text.trim().replaceAll(',', '.'));
    final price = double.tryParse(_priceCtrl.text.trim().replaceAll(',', '.'));

    if (_selectedVehicleId == null || quantity == null || quantity <= 0 || price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Véhicule, quantité et prix/litre sont obligatoires.')),
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
        mileage: double.tryParse(_mileageCtrl.text.trim().replaceAll(',', '.')),
        driverId: _auth.currentUid,
        driverName: widget.driverName,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Plein enregistré avec succès.'), backgroundColor: AppColors.success),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = (double.tryParse(_quantityCtrl.text.trim().replaceAll(',', '.')) ?? 0) *
        (double.tryParse(_priceCtrl.text.trim().replaceAll(',', '.')) ?? 0);

    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        title: const Text('Ajouter un plein'),
        backgroundColor: context.palette.surface,
        foregroundColor: context.palette.textHeading,
        elevation: 0,
      ),
      body: _loadingVehicles
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _label('Véhicule'),
                  DropdownButtonFormField<String>(
                    value: _selectedVehicleId,
                    isExpanded: true,
                    decoration: _dec('Sélectionner un véhicule'),
                    items: _vehicles
                        .map((v) => DropdownMenuItem<String>(
                              value: v['id'] as String,
                              child: Text(
                                '${v['plateNumber'] ?? '—'} · ${v['brand'] ?? ''} ${v['model'] ?? ''}',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedVehicleId = val),
                  ),
                  if (_vehicles.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text('Aucun véhicule disponible.',
                          style: AppTextStyles.caption.copyWith(color: AppColors.error)),
                    ),
                  const SizedBox(height: 16),
                  _label('Quantité (litres)'),
                  TextField(
                    controller: _quantityCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setState(() {}),
                    decoration: _dec('40'),
                  ),
                  const SizedBox(height: 16),
                  _label('Prix / litre (FCFA)'),
                  TextField(
                    controller: _priceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setState(() {}),
                    decoration: _dec('650'),
                  ),
                  const SizedBox(height: 16),
                  _label('Station (optionnel)'),
                  TextField(
                    controller: _stationCtrl,
                    decoration: _dec('Total Niamey'),
                  ),
                  const SizedBox(height: 16),
                  _label('Kilométrage (optionnel)'),
                  TextField(
                    controller: _mileageCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: _dec('125000'),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: AppSpacing.roundedMd,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Coût total', style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
                        Text('${total.toStringAsFixed(0)} FCFA',
                            style: AppTextStyles.h5.copyWith(
                                color: AppColors.primary, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text('Enregistrer le plein',
                              style: AppTextStyles.btnLg.copyWith(fontSize: 15, letterSpacing: 0)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
      );

  InputDecoration _dec(String hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: context.palette.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: AppSpacing.roundedMd,
          borderSide: BorderSide(color: context.palette.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.roundedMd,
          borderSide: BorderSide(color: context.palette.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.roundedMd,
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      );
}
