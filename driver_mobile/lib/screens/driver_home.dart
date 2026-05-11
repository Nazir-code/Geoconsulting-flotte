import 'package:flutter/material.dart';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/location_service.dart';
import '../services/firebase_notification_service.dart';
import '../models/driver_profile.dart';
import 'tracking_screen.dart';

class DriverHome extends StatefulWidget {
  const DriverHome({super.key});

  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome> {
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();
  final LocationService _locationService = LocationService();

  bool _isTracking = false;
  DriverProfile? _profile;
  StreamSubscription<QuerySnapshot>? _missionSubscription;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _startMissionNotifications();
    _initMissionListener();
  }

  @override
  void dispose() {
    _locationService.stopTracking();
    _missionSubscription?.cancel();
    super.dispose();
  }

  void _initMissionListener() {
    final uid = _authService.currentUid;
    debugPrint("DEBUG: Initialisation de l'écouteur de missions pour UID: $uid");

    if (uid == null) {
      debugPrint("DEBUG: UID est null. L'écouteur ne démarrera pas.");
      return;
    }

    // Écoute les missions en temps réel
    _missionSubscription = _firestoreService.listenToMissions(uid).listen((snapshot) {
      debugPrint("DEBUG: Snapshot reçu. Nombre de documents: ${snapshot.docs.length}");

      if (snapshot.docs.isNotEmpty) {
        // On prend la mission la plus récente (en supposant qu'il n'y en a qu'une en pending)
        final missionDoc = snapshot.docs.first;
        final missionData = missionDoc.data() as Map<String, dynamic>;

        debugPrint("DEBUG: Nouvelle mission détectée: ID=${missionDoc.id}, Titre=${missionData['title']}");

        // Éviter d'afficher plusieurs fois la même alerte si possible
        _showNewMissionDialog(missionDoc.id, missionData);
      } else {
        debugPrint("DEBUG: Aucune mission en attente trouvée pour cet UID.");
      }
    }, onError: (error) {
      debugPrint("DEBUG: Erreur dans l'écouteur de missions: $error");
    });
  }

  void _showNewMissionDialog(String missionId, Map<String, dynamic> data) {
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false, // Force l'utilisateur à répondre
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 30),
            SizedBox(width: 10),
            Text("NOUVELLE MISSION !"),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("📍 Lieu: ${data['location'] ?? 'Non spécifiée'}",
                 style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text("📝 Mission: ${data['title'] ?? 'Non spécifiée'}"),
            if (data['description'] != null) ...[
              const SizedBox(height: 5),
              Text("ℹ️ ${data['description']}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ]
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("PLUS TARD"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0E7490), foregroundColor: Colors.white),
            onPressed: () {
              // Optionnel: Passer la mission en 'in_progress' dans Firestore
              _firestoreService.updateMissionStatus(missionId, 'in_progress');
              Navigator.pop(context);
              // Rediriger vers la carte de tracking
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TrackingScreen()),
              );
            },
            child: const Text("ACCEPTER & ALLER À LA CARTE"),
          ),
        ],
      ),
    );
  }

  Future<void> _startMissionNotifications() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      await FirebaseNotificationService.instance.startForDriver(uid);
    }
  }

  Future<void> _loadProfile() async {
    final uid = _authService.currentUid;
    if (uid != null) {
      final p = await _firestoreService.getDriverProfile(uid);
      setState(() {
        _profile = p;
      });
    }
  }

  void _toggleTracking() async {
    final uid = _authService.currentUid;
    if (uid == null) return;

    if (_isTracking) {
      _locationService.stopTracking();
      setState(() => _isTracking = false);
    } else {
      try {
        await _locationService.startTracking(uid);
        setState(() => _isTracking = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Tracking GPS activé")),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF0E7490);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Tableau de Bord Chauffeur"),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _authService.signOut(),
          )
        ],
      ),
      body: _profile == null
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 40,
                            backgroundColor: primaryColor,
                            child: Icon(Icons.person, size: 50, color: Colors.white),
                          ),
                          const SizedBox(height: 15),
                          Text(
                            _profile!.name,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            _profile!.email,
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 10),
                          Chip(
                            label: Text("ID: ${_profile!.driverId}"),
                            backgroundColor: primaryColor.withOpacity(0.1),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    "STATUT DU TRACKING GPS",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 15),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: _isTracking ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: _isTracking ? Colors.green : Colors.red),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isTracking ? Icons.location_on : Icons.location_off,
                          color: _isTracking ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          _isTracking ? "EN LIGNE - TRACKING ACTIF" : "HORS LIGNE - TRACKING ARRÊTÉ",
                          style: TextStyle(
                            color: _isTracking ? Colors.green : Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const TrackingScreen()),
                      );
                    },
                    icon: const Icon(Icons.map),
                    label: const Text("VOIR LA CARTE DE TRACKING"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _toggleTracking,
                    icon: Icon(_isTracking ? Icons.stop : Icons.play_arrow),
                    label: Text(_isTracking ? "ARRÊTER LE SERVICE" : "DÉMARRER LE SERVICE"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isTracking ? Colors.red : primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }


}
