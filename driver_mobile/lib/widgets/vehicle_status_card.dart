import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class VehicleStatusCard extends StatelessWidget {
  final String plateNumber;
  final String model;
  final double fuelLevel; // 0.0 to 1.0
  final bool isGpsActive;
  final String lastSync;

  const VehicleStatusCard({
    super.key,
    required this.plateNumber,
    required this.model,
    required this.fuelLevel,
    required this.isGpsActive,
    required this.lastSync,
  });

  @override
  Widget build(BuildContext context) {
    final fuelColor = fuelLevel > 0.5
        ? AppColors.success
        : fuelLevel > 0.25
            ? AppColors.warning
            : AppColors.error;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkHeaderGradient,
        borderRadius: AppSpacing.roundedXl2,
        boxShadow: AppTheme.shadowLg,
      ),
      child: Column(
        children: [
          // ── Header ──────────────────────────────────────────────────────
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: AppSpacing.roundedLg,
                ),
                child: const Icon(
                  Icons.directions_car_filled_rounded,
                  color: AppColors.accent,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plateNumber,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      model,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              _buildLiveBadge(),
            ],
          ),

          const SizedBox(height: 20),

          // ── Fuel bar ────────────────────────────────────────────────────
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.local_gas_station_rounded,
                          color: Colors.white.withValues(alpha: 0.7), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        "Carburant",
                        style: TextStyle(
                          fontFamily: 'Inter',
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    "${(fuelLevel * 100).toInt()}%",
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: fuelColor,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: AppSpacing.roundedFull,
                child: LinearProgressIndicator(
                  value: fuelLevel,
                  minHeight: 6,
                  backgroundColor: Colors.white.withValues(alpha: 0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(fuelColor),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // ── Metrics ─────────────────────────────────────────────────────
          Row(
            children: [
              _buildMetric(
                Icons.location_searching_rounded,
                isGpsActive ? "ACTIF" : "INACTIF",
                "GPS",
                isGpsActive ? AppColors.success : AppColors.error,
              ),
              _buildDivider(),
              _buildMetric(
                Icons.sync_rounded,
                lastSync,
                "Synchro",
                Colors.white,
              ),
              _buildDivider(),
              _buildMetric(
                Icons.speed_rounded,
                "OK",
                "Statut",
                AppColors.success,
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Contenu 100% statique — extrait pour éviter la recréation à chaque build.
  static Widget _buildLiveBadge() => _LiveBadge._instance;

  Widget _buildMetric(IconData icon, String value, String label, Color valueColor) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.5), size: 18),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Inter',
              color: valueColor,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Inter',
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      height: 40,
      color: Colors.white.withValues(alpha: 0.1),
    );
  }
}

// Badge "LIVE" — contenu purement statique, singleton réutilisé à chaque build.
class _LiveBadge extends StatelessWidget {
  const _LiveBadge();

  static const _LiveBadge _instance = _LiveBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.2),
        borderRadius: AppSpacing.roundedFull,
        border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, color: AppColors.success, size: 7),
          SizedBox(width: 5),
          Text(
            'LIVE',
            style: TextStyle(
              fontFamily: 'Inter',
              color: AppColors.success,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
