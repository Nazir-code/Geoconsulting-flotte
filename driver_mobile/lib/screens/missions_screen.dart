// lib/screens/missions_screen.dart
// Écran affichant les missions du chauffeur

import 'package:flutter/material.dart';
import '../models/mission_model.dart';
import '../services/missions_service.dart';
import '../services/auth_service.dart';

/// Écran affichant les missions assignées au chauffeur
class MissionsScreen extends StatefulWidget {
  const MissionsScreen({super.key});

  @override
  State<MissionsScreen> createState() => _MissionsScreenState();
}

class _MissionsScreenState extends State<MissionsScreen>
    with SingleTickerProviderStateMixin {
  late final MissionsService _missionsService = MissionsService();
  late final AuthService _authService = AuthService();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Formater le statut de mission
  String _formatStatus(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Complétée';
      default:
        return status;
    }
  }

  /// Formater la priorité
  String _formatPriority(String priority) {
    switch (priority) {
      case 'low':
        return 'Basse';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Haute';
      default:
        return priority;
    }
  }

  /// Couleur de priorité
  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'low':
        return Colors.blue;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  /// Couleur de statut
  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'in_progress':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  /// Widget pour une carte de mission
  Widget _buildMissionCard(Mission mission) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: InkWell(
        onTap: () => _showMissionDetails(mission),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Titre et statut
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          mission.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          mission.location,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(mission.status).withOpacity(0.2),
                      border: Border.all(
                        color: _getStatusColor(mission.status),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _formatStatus(mission.status),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _getStatusColor(mission.status),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Description
              Text(
                mission.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 12),

              // Priorité et actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getPriorityColor(mission.priority)
                          .withOpacity(0.1),
                      border: Border.all(
                        color: _getPriorityColor(mission.priority),
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Priorité: ${_formatPriority(mission.priority)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: _getPriorityColor(mission.priority),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (mission.status == 'pending')
                    ElevatedButton.icon(
                      onPressed: () => _acceptMission(mission),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Accepter'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                      ),
                    )
                  else if (mission.status == 'in_progress')
                    ElevatedButton.icon(
                      onPressed: () => _completeMission(mission),
                      icon: const Icon(Icons.done, size: 16),
                      label: const Text('Complété'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Afficher les détails d'une mission
  void _showMissionDetails(Mission mission) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Titre
              Text(
                mission.title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              // Description
              Text(
                'Description',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                mission.description,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 16),

              // Localisation
              Text(
                'Localisation',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(mission.location),
              const SizedBox(height: 16),

              // Priorité et Statut
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Priorité',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(_formatPriority(mission.priority)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Statut',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(_formatStatus(mission.status)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Notes
              if (mission.notes != null && mission.notes!.isNotEmpty) ...[
                Text(
                  'Notes',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ...mission.notes!.map(
                  (note) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text('• $note'),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Actions
              if (mission.status == 'pending')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _acceptMission(mission);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Accepter la Mission'),
                  ),
                )
              else if (mission.status == 'in_progress')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _completeMission(mission);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Marquer comme Complétée'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Accepter une mission
  Future<void> _acceptMission(Mission mission) async {
    try {
      await _missionsService.acceptMission(mission.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mission acceptée!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  /// Compléter une mission
  Future<void> _completeMission(Mission mission) async {
    try {
      await _missionsService.completeMission(mission.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mission complétée!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = _authService.currentUid;

    if (currentUserId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Missions')),
        body: const Center(
          child: Text('Veuillez vous connecter'),
        ),
      );
    }

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Mes Missions'),
          elevation: 0,
          bottom: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'En Attente'),
              Tab(text: 'En Cours'),
              Tab(text: 'Complétées'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [
            // En attente
            StreamBuilder<List<Mission>>(
              stream: _missionsService.listenToAllMyMissions(currentUserId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Erreur: ${snapshot.error}'));
                }

                final missions = snapshot.data ?? [];
                final pendingMissions =
                    missions.where((m) => m.status == 'pending').toList();

                if (pendingMissions.isEmpty) {
                  return const Center(
                    child: Text('Aucune mission en attente'),
                  );
                }

                return ListView(
                  children: pendingMissions
                      .map((mission) => _buildMissionCard(mission))
                      .toList(),
                );
              },
            ),

            // En cours
            StreamBuilder<List<Mission>>(
              stream: _missionsService.listenToAllMyMissions(currentUserId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Erreur: ${snapshot.error}'));
                }

                final missions = snapshot.data ?? [];
                final inProgressMissions =
                    missions.where((m) => m.status == 'in_progress').toList();

                if (inProgressMissions.isEmpty) {
                  return const Center(
                    child: Text('Aucune mission en cours'),
                  );
                }

                return ListView(
                  children: inProgressMissions
                      .map((mission) => _buildMissionCard(mission))
                      .toList(),
                );
              },
            ),

            // Complétées
            StreamBuilder<List<Mission>>(
              stream: _missionsService.listenToAllMyMissions(currentUserId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Erreur: ${snapshot.error}'));
                }

                final missions = snapshot.data ?? [];
                final completedMissions =
                    missions.where((m) => m.status == 'completed').toList();

                if (completedMissions.isEmpty) {
                  return const Center(
                    child: Text('Aucune mission complétée'),
                  );
                }

                return ListView(
                  children: completedMissions
                      .map((mission) => _buildMissionCard(mission))
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
