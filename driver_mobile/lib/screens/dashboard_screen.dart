import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/app_models.dart';
import '../services/api_service.dart';
import '../services/session_store.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.apiService,
    required this.sessionStore,
  });

  final ApiService apiService;
  final SessionStore sessionStore;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _missionDestinationController = TextEditingController();
  final _missionPurposeController = TextEditingController();
  final _fuelQuantityController = TextEditingController();
  final _fuelPriceController = TextEditingController(text: '650');
  final _fuelMileageController = TextEditingController();
  final _fuelStationController = TextEditingController();

  DriverDashboardData? _dashboard;
  bool _isLoading = true;
  bool _isSubmittingMission = false;
  bool _isSubmittingFuel = false;
  bool _isCompletingMission = false;
  String? _message;
  String? _error;

  final _currencyFormat = NumberFormat.decimalPattern('fr_FR');
  final _dateFormat = DateFormat('dd MMM yyyy, HH:mm', 'fr_FR');

  @override
  void initState() {
    super.initState();
    _reload();
  }

  @override
  void dispose() {
    _missionDestinationController.dispose();
    _missionPurposeController.dispose();
    _fuelQuantityController.dispose();
    _fuelPriceController.dispose();
    _fuelMileageController.dispose();
    _fuelStationController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dashboard = await widget.apiService.loadDashboard();
      await widget.sessionStore.updateDriver(dashboard.driver);

      setState(() {
        _dashboard = dashboard;
        _fuelMileageController.text = dashboard.vehicle?.mileage.toString() ?? '';
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _logout() async {
    await widget.sessionStore.clear();
  }

  Future<void> _startMission() async {
    if (_missionDestinationController.text.trim().isEmpty ||
        _missionPurposeController.text.trim().isEmpty) {
      setState(() {
        _error = 'Veuillez renseigner la destination et l objectif.';
      });
      return;
    }

    setState(() {
      _isSubmittingMission = true;
      _error = null;
      _message = null;
    });

    try {
      await widget.apiService.startMission(
        destination: _missionDestinationController.text.trim(),
        purpose: _missionPurposeController.text.trim(),
      );
      _missionDestinationController.clear();
      _missionPurposeController.clear();
      _message = 'Mission demarree.';
      await _reload();
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingMission = false;
        });
      }
    }
  }

  Future<void> _completeMission(Mission mission) async {
    setState(() {
      _isCompletingMission = true;
      _error = null;
      _message = null;
    });

    try {
      final distance = mission.distance ?? 120;
      final fuelConsumed = mission.fuelConsumed ?? 18;
      await widget.apiService.completeMission(
        missionId: mission.id,
        distance: distance,
        fuelConsumed: fuelConsumed,
      );
      _message = 'Mission terminee.';
      await _reload();
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isCompletingMission = false;
        });
      }
    }
  }

  Future<void> _saveFuelRecord() async {
    final quantity = num.tryParse(_fuelQuantityController.text.trim());
    final price = num.tryParse(_fuelPriceController.text.trim());
    final mileage = num.tryParse(_fuelMileageController.text.trim());

    if (quantity == null || price == null || mileage == null) {
      setState(() {
        _error = 'Veuillez renseigner des valeurs valides pour le carburant.';
      });
      return;
    }

    setState(() {
      _isSubmittingFuel = true;
      _error = null;
      _message = null;
    });

    try {
      await widget.apiService.createFuelRecord(
        quantity: quantity,
        pricePerLiter: price,
        mileage: mileage,
        station: _fuelStationController.text.trim().isEmpty
            ? null
            : _fuelStationController.text.trim(),
      );
      _fuelQuantityController.clear();
      _fuelStationController.clear();
      _message = 'Plein enregistre.';
      await _reload();
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingFuel = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _dashboard == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final dashboard = _dashboard;
    if (dashboard == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Driver Mobile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error ?? 'Impossible de charger les donnees.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _reload,
                  child: const Text('Reessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final activeMission = dashboard.activeMission;
    final recentMissions = dashboard.missions.take(5).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Mobile'),
        actions: [
          IconButton(
            tooltip: 'Actualiser',
            onPressed: _reload,
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Deconnexion',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _HeaderCard(
              dashboard: dashboard,
              message: _message,
              error: _error,
            ),
            const SizedBox(height: 16),
            if (activeMission != null)
              _ActiveMissionCard(
                mission: activeMission,
                gpsPosition: dashboard.gpsPosition,
                dateFormat: _dateFormat,
                isCompleting: _isCompletingMission,
                onComplete: () => _completeMission(activeMission),
              )
            else
              _StartMissionCard(
                destinationController: _missionDestinationController,
                purposeController: _missionPurposeController,
                isSubmitting: _isSubmittingMission,
                onStart: _startMission,
              ),
            const SizedBox(height: 16),
            _VehicleCard(vehicle: dashboard.vehicle),
            const SizedBox(height: 16),
            _FuelFormCard(
              quantityController: _fuelQuantityController,
              priceController: _fuelPriceController,
              mileageController: _fuelMileageController,
              stationController: _fuelStationController,
              isSubmitting: _isSubmittingFuel,
              onSubmit: _saveFuelRecord,
            ),
            const SizedBox(height: 16),
            _HistoryCard(
              missions: recentMissions,
              dateFormat: _dateFormat,
            ),
            const SizedBox(height: 16),
            _FuelHistoryCard(
              records: dashboard.fuelRecords.take(4).toList(),
              currencyFormat: _currencyFormat,
              dateFormat: _dateFormat,
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.dashboard,
    this.message,
    this.error,
  });

  final DriverDashboardData dashboard;
  final String? message;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final user = dashboard.driver.user;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF0E7490)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bonjour ${user.firstName}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Permis ${dashboard.driver.licenseNumber} - ${dashboard.driver.totalMissions} missions',
            style: const TextStyle(color: Color(0xFFD7F1F7)),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            _Banner(
              text: message!,
              backgroundColor: const Color(0xFFDCFCE7),
              textColor: const Color(0xFF166534),
            ),
          ],
          if (error != null) ...[
            const SizedBox(height: 12),
            _Banner(
              text: error!,
              backgroundColor: const Color(0xFFFEE2E2),
              textColor: const Color(0xFF991B1B),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActiveMissionCard extends StatelessWidget {
  const _ActiveMissionCard({
    required this.mission,
    required this.gpsPosition,
    required this.dateFormat,
    required this.isCompleting,
    required this.onComplete,
  });

  final Mission mission;
  final GpsPosition? gpsPosition;
  final DateFormat dateFormat;
  final bool isCompleting;
  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.play_circle_fill_rounded, color: Color(0xFF0E7490)),
                SizedBox(width: 8),
                Text(
                  'Mission en cours',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(mission.destination, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(mission.purpose),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _InfoChip(icon: Icons.route_outlined, label: mission.startLocation ?? 'Niamey'),
                _InfoChip(icon: Icons.schedule, label: dateFormat.format(mission.startTime.toLocal())),
                if (gpsPosition != null)
                  _InfoChip(icon: Icons.speed, label: '${gpsPosition!.speed} km/h'),
                if (gpsPosition != null)
                  _InfoChip(icon: Icons.my_location_outlined, label: '${gpsPosition!.progress.toStringAsFixed(0)} %'),
                if (gpsPosition != null)
                  _InfoChip(icon: Icons.timer_outlined, label: 'ETA ${gpsPosition!.eta} min'),
              ],
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: isCompleting ? null : onComplete,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                icon: isCompleting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.stop_circle_outlined),
                label: Text(isCompleting ? 'Cloture...' : 'Terminer la mission'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StartMissionCard extends StatelessWidget {
  const _StartMissionCard({
    required this.destinationController,
    required this.purposeController,
    required this.isSubmitting,
    required this.onStart,
  });

  final TextEditingController destinationController;
  final TextEditingController purposeController;
  final bool isSubmitting;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Demarrer une mission',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: destinationController,
              decoration: const InputDecoration(
                labelText: 'Destination',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: purposeController,
              decoration: const InputDecoration(
                labelText: 'Objectif',
                prefixIcon: Icon(Icons.assignment_outlined),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isSubmitting ? null : onStart,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF0E7490),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(isSubmitting ? 'Demarrage...' : 'Lancer la mission'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleCard extends StatelessWidget {
  const _VehicleCard({required this.vehicle});

  final Vehicle? vehicle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: vehicle == null
            ? const Text('Aucun vehicule assigne actuellement.')
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Vehicule',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    vehicle!.displayName,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _InfoChip(icon: Icons.confirmation_number_outlined, label: vehicle!.plateNumber),
                      _InfoChip(icon: Icons.local_gas_station_outlined, label: vehicle!.fuelType),
                      _InfoChip(icon: Icons.speed_outlined, label: '${vehicle!.mileage} km'),
                      _InfoChip(icon: Icons.category_outlined, label: vehicle!.type),
                    ],
                  ),
                ],
              ),
      ),
    );
  }
}

class _FuelFormCard extends StatelessWidget {
  const _FuelFormCard({
    required this.quantityController,
    required this.priceController,
    required this.mileageController,
    required this.stationController,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final TextEditingController quantityController;
  final TextEditingController priceController;
  final TextEditingController mileageController;
  final TextEditingController stationController;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Signaler un plein',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: quantityController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Quantite (L)',
                prefixIcon: Icon(Icons.water_drop_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: priceController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Prix par litre',
                prefixIcon: Icon(Icons.payments_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: mileageController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Kilometrage',
                prefixIcon: Icon(Icons.pin_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: stationController,
              decoration: const InputDecoration(
                labelText: 'Station',
                prefixIcon: Icon(Icons.local_gas_station_outlined),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isSubmitting ? null : onSubmit,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF0F766E),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(isSubmitting ? 'Enregistrement...' : 'Enregistrer le plein'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.missions,
    required this.dateFormat,
  });

  final List<Mission> missions;
  final DateFormat dateFormat;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Historique des missions',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            if (missions.isEmpty)
              const Text('Aucune mission pour le moment.')
            else
              ...missions.map(
                (mission) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: mission.isActive
                            ? const Color(0xFFCFFAFE)
                            : const Color(0xFFE2E8F0),
                        foregroundColor: mission.isActive
                            ? const Color(0xFF0E7490)
                            : const Color(0xFF334155),
                        child: Icon(
                          mission.isActive ? Icons.alt_route : Icons.history,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              mission.destination,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 4),
                            Text(mission.purpose),
                            const SizedBox(height: 4),
                            Text(
                              dateFormat.format(mission.startTime.toLocal()),
                              style: const TextStyle(color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      _StatusBadge(status: mission.status),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _FuelHistoryCard extends StatelessWidget {
  const _FuelHistoryCard({
    required this.records,
    required this.currencyFormat,
    required this.dateFormat,
  });

  final List<FuelRecord> records;
  final NumberFormat currencyFormat;
  final DateFormat dateFormat;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Derniers pleins',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            if (records.isEmpty)
              const Text('Aucun plein enregistre.')
            else
              ...records.map(
                (record) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFFEDD5),
                    foregroundColor: Color(0xFFEA580C),
                    child: Icon(Icons.local_gas_station_outlined),
                  ),
                  title: Text('${record.quantity} L - ${record.station ?? record.vehicle.plateNumber}'),
                  subtitle: Text(dateFormat.format(record.date.toLocal())),
                  trailing: Text('${currencyFormat.format(record.totalCost)} FCFA'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF475569)),
          const SizedBox(width: 6),
          Text(label),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;
    String label;

    switch (status) {
      case 'in_progress':
        backgroundColor = const Color(0xFFCFFAFE);
        textColor = const Color(0xFF0E7490);
        label = 'En cours';
        break;
      case 'completed':
        backgroundColor = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF166534);
        label = 'Terminee';
        break;
      case 'pending':
        backgroundColor = const Color(0xFFFEF3C7);
        textColor = const Color(0xFF92400E);
        label = 'Planifiee';
        break;
      default:
        backgroundColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFF991B1B);
        label = 'Annulee';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({
    required this.text,
    required this.backgroundColor,
    required this.textColor,
  });

  final String text;
  final Color backgroundColor;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        text,
        style: TextStyle(color: textColor),
      ),
    );
  }
}
