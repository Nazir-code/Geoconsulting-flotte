import 'package:flutter/material.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran de signalement d'un besoin d'entretien par le chauffeur.
/// Écrit dans la collection Firestore `maintenance_requests`.
class MaintenanceRequestScreen extends StatefulWidget {
  final String? driverName;
  const MaintenanceRequestScreen({super.key, this.driverName});

  @override
  State<MaintenanceRequestScreen> createState() => _MaintenanceRequestScreenState();
}

const _maintenanceTypes = [
  'Vidange',
  'Filtres',
  'Pneus',
  'Freins',
  'Réparation',
  'Assurance',
  'Visite technique',
  'Autre',
];

class _MaintenanceRequestScreenState extends State<MaintenanceRequestScreen> {
  final FirestoreService _firestore = FirestoreService();
  final AuthService _auth = AuthService();

  final _descriptionCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();

  List<Map<String, dynamic>> _vehicles = [];
  String? _selectedVehicleId;
  String _selectedType = _maintenanceTypes.first;
  bool _loadingVehicles = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  @override
  void dispose() {
    _descriptionCtrl.dispose();
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
    if (_selectedVehicleId == null || _descriptionCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Véhicule et description sont obligatoires.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await _firestore.addMaintenanceRequest(
        vehicleId: _selectedVehicleId!,
        vehiclePlate: _plateOf(_selectedVehicleId!),
        type: _selectedType,
        description: _descriptionCtrl.text.trim(),
        mileage: double.tryParse(_mileageCtrl.text.trim().replaceAll(',', '.')),
        driverId: _auth.currentUid,
        driverName: widget.driverName,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Demande d'entretien envoyée au gestionnaire."),
          backgroundColor: AppColors.success,
        ),
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
    return Scaffold(
      backgroundColor: context.palette.background,
      appBar: AppBar(
        title: const Text('Signaler un entretien'),
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
                  _label("Type d'entretien"),
                  DropdownButtonFormField<String>(
                    value: _selectedType,
                    isExpanded: true,
                    decoration: _dec('Type'),
                    items: _maintenanceTypes
                        .map((t) => DropdownMenuItem<String>(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedType = val ?? _selectedType),
                  ),
                  const SizedBox(height: 16),
                  _label('Description du problème'),
                  TextField(
                    controller: _descriptionCtrl,
                    maxLines: 4,
                    decoration: _dec('Ex : bruit anormal au freinage, voyant moteur allumé…'),
                  ),
                  const SizedBox(height: 16),
                  _label('Kilométrage (optionnel)'),
                  TextField(
                    controller: _mileageCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: _dec('125000'),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text('Envoyer la demande',
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
