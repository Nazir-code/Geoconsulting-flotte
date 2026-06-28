import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';

/// Résultat retourné par le bottom sheet.
class DeliveryProofResult {
  final bool confirmed;
  final File? photoFile;
  const DeliveryProofResult({required this.confirmed, this.photoFile});
}

/// Bottom sheet « Terminer la mission » avec photo de preuve optionnelle.
/// Retourne [DeliveryProofResult] ou null si l'utilisateur ferme sans confirmer.
Future<DeliveryProofResult?> showDeliveryProofSheet(BuildContext context) {
  return showModalBottomSheet<DeliveryProofResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _DeliveryProofSheet(),
  );
}

class _DeliveryProofSheet extends StatefulWidget {
  const _DeliveryProofSheet();

  @override
  State<_DeliveryProofSheet> createState() => _DeliveryProofSheetState();
}

class _DeliveryProofSheetState extends State<_DeliveryProofSheet> {
  final _picker = ImagePicker();
  File? _photo;
  bool _isPickerBusy = false;

  Future<void> _pickImage(ImageSource source) async {
    if (_isPickerBusy) return;
    setState(() => _isPickerBusy = true);
    try {
      final xfile = await _picker.pickImage(
        source: source,
        imageQuality: 75,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (xfile != null) setState(() => _photo = File(xfile.path));
    } finally {
      if (mounted) setState(() => _isPickerBusy = false);
    }
  }

  void _confirm() => Navigator.pop(
        context,
        DeliveryProofResult(confirmed: true, photoFile: _photo),
      );

  void _confirmWithoutPhoto() => Navigator.pop(
        context,
        const DeliveryProofResult(confirmed: true, photoFile: null),
      );

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        24, 12, 24,
        24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36, height: 4,
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.outlineVariant,
              borderRadius: AppSpacing.roundedFull,
            ),
          ),

          // Header
          Container(
            width: 64, height: 64,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_outline_rounded,
              color: AppColors.success,
              size: 32,
            ),
          ),
          Text('Terminer la mission ?', style: AppTextStyles.h4),
          const SizedBox(height: 6),
          Text(
            'Ajoutez une photo de preuve de livraison (optionnel).',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 24),

          // Photo area
          _photo == null ? _buildPhotoButtons() : _buildPreview(),

          const SizedBox(height: 24),

          // Confirmer
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _confirm,
              icon: const Icon(Icons.check_rounded, size: 20),
              label: Text(
                _photo == null
                    ? 'Terminer sans photo'
                    : 'Terminer avec la photo',
                style: AppTextStyles.btnLg.copyWith(
                  color: Colors.white,
                  fontSize: 15,
                  letterSpacing: 0,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: AppSpacing.roundedLg),
              ),
            ),
          ),

          if (_photo != null) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: TextButton(
                onPressed: _confirmWithoutPhoto,
                child: Text(
                  'Terminer sans photo',
                  style: AppTextStyles.btn.copyWith(
                    color: AppColors.textSecondary,
                    letterSpacing: 0,
                  ),
                ),
              ),
            ),
          ],

          const SizedBox(height: 4),
        ],
      ),
    );
  }

  Widget _buildPhotoButtons() {
    return Row(
      children: [
        Expanded(
          child: _PhotoSourceButton(
            icon: Icons.camera_alt_rounded,
            label: 'Appareil photo',
            onTap: _isPickerBusy ? null : () => _pickImage(ImageSource.camera),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _PhotoSourceButton(
            icon: Icons.photo_library_rounded,
            label: 'Galerie',
            onTap: _isPickerBusy ? null : () => _pickImage(ImageSource.gallery),
          ),
        ),
      ],
    );
  }

  Widget _buildPreview() {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: AppSpacing.roundedLg,
          child: Image.file(
            _photo!,
            width: double.infinity,
            height: 200,
            fit: BoxFit.cover,
          ),
        ),
        // Bouton changer
        Positioned(
          top: 8, right: 8,
          child: GestureDetector(
            onTap: () => setState(() => _photo = null),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Photo source button ───────────────────────────────────────────────────────

class _PhotoSourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const _PhotoSourceButton({
    required this.icon,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 90,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: AppSpacing.roundedLg,
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 28, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTextStyles.bodySm.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
