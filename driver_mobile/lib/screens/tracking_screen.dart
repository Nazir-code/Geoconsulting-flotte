import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/new_location_service.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final MapController _mapController = MapController();
  final NewLocationService _locationService = NewLocationService();
  final String _uid = FirebaseAuth.instance.currentUser?.uid ?? "";
  
  LatLng _currentLatLng = const LatLng(13.5137, 2.1098); // Niamey
  bool _isTracking = false;

  @override
  void dispose() {
    _locationService.stopTracking();
    super.dispose();
  }

  Future<void> _toggleTracking() async {
    if (_isTracking) {
      _locationService.stopTracking();
      setState(() => _isTracking = false);
    } else {
      bool hasPermission = await _locationService.checkPermissions();
      if (hasPermission) {
        // Obtenir position initiale
        Position startPos = await Geolocator.getCurrentPosition();
        _updateUI(startPos);

        _locationService.startRealtimeTracking(
          uid: _uid,
          onPositionChanged: (Position pos) {
            _updateUI(pos);
          },
        );
        setState(() => _isTracking = true);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Permissions GPS requises.")),
          );
        }
      }
    }
  }

  void _updateUI(Position pos) {
    if (!mounted) return;
    LatLng newLatLng = LatLng(pos.latitude, pos.longitude);
    
    setState(() {
      _currentLatLng = newLatLng;
    });

    // Centrer la carte sur le chauffeur
    _mapController.move(newLatLng, 15.0);
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF0E7490);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Suivi Mission (OpenSource Map)"),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLatLng,
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.novatech.driver_mobile',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentLatLng,
                    width: 80,
                    height: 80,
                    child: const Icon(
                      Icons.local_shipping,
                      color: primaryColor,
                      size: 45,
                    ),
                  ),
                ],
              ),
            ],
          ),
          
          // HUD de statut
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: _isTracking ? Colors.green : Colors.red,
                      radius: 8,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _isTracking ? "MISSION EN COURS - GPS ACTIF" : "TRACKING ARRÊTÉ",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bouton flottant
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: SizedBox(
              height: 60,
              child: ElevatedButton.icon(
                onPressed: _toggleTracking,
                icon: Icon(_isTracking ? Icons.stop_circle : Icons.play_circle_fill, size: 30),
                label: Text(
                  _isTracking ? "ARRÊTER LA MISSION" : "DÉMARRER LA MISSION",
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isTracking ? Colors.red : primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  elevation: 8,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
