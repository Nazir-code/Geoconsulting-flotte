// lib/services/mission_status_service.dart
// Service for managing mission status updates with offline support

import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/app_models.dart';
import 'api_service.dart';
import 'session_store.dart';

/// Service for managing mission status updates with offline support
class MissionStatusService {
  static final MissionStatusService _instance = MissionStatusService._internal();
  late final ApiService _apiService;
  late final SessionStore _sessionStore;
  late final FirebaseFirestore _firestore;
  
  // Offline queue management
  static const String _queueKey = 'mission_status_queue';
  static const String _networkStatusKey = 'network_status';
  
  // Stream controllers for real-time updates
  final StreamController<bool> _networkStatusController = StreamController<bool>.broadcast();
  final StreamController<Mission> _missionUpdateController = StreamController<Mission>.broadcast();
  
  factory MissionStatusService() {
    return _instance;
  }

  MissionStatusService._internal() {
    _firestore = FirebaseFirestore.instance;
  }

  /// Initialize the service with dependencies
  void initialize({
    required ApiService apiService,
    required SessionStore sessionStore,
  }) {
    _apiService = apiService;
    _sessionStore = sessionStore;
    _startNetworkMonitoring();
  }

  /// Stream of network connectivity status
  Stream<bool> get networkStatus => _networkStatusController.stream;

  /// Stream of mission updates
  Stream<Mission> get missionUpdates => _missionUpdateController.stream;

  /// Complete a mission with distance, fuel consumption, and notes
  Future<Mission> completeMission(
    String missionId, {
    double? distance,
    double? fuelConsumed,
    String? notes,
  }) async {
    try {
      // Attempt to complete mission via API
      final mission = await _apiService.completeMission(
        missionId: missionId,
        distance: distance ?? 0,
        fuelConsumed: fuelConsumed ?? 0,
        notes: notes,
      );

      // Emit real-time update
      _missionUpdateController.add(mission);
      
      return mission;
    } catch (e) {
      // If network request fails, queue for offline processing
      await _queueOfflineUpdate(MissionUpdate(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        missionId: missionId,
        action: MissionAction.complete,
        distance: distance,
        fuelConsumed: fuelConsumed,
        notes: notes,
        timestamp: DateTime.now(),
      ));
      
      // Update network status
      _networkStatusController.add(false);
      
      rethrow;
    }
  }

  /// Cancel a mission with a reason
  Future<Mission> cancelMission(String missionId, String reason) async {
    try {
      // Create a custom API call for mission cancellation
      final response = await _apiService._post(
        '/api/driver/me/missions/$missionId/cancel',
        body: {
          'reason': reason,
        },
      );
      
      final mission = Mission.fromJson(response as Map<String, dynamic>);
      
      // Emit real-time update
      _missionUpdateController.add(mission);
      
      return mission;
    } catch (e) {
      // If network request fails, queue for offline processing
      await _queueOfflineUpdate(MissionUpdate(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        missionId: missionId,
        action: MissionAction.cancel,
        reason: reason,
        timestamp: DateTime.now(),
      ));
      
      // Update network status
      _networkStatusController.add(false);
      
      rethrow;
    }
  }

  /// Watch mission updates in real-time
  Stream<Mission?> watchMissionUpdates(String missionId) {
    return _firestore
        .collection('missions')
        .doc(missionId)
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        final data = snapshot.data() as Map<String, dynamic>;
        // Convert Firestore mission to API mission format
        return _convertFirestoreMissionToApiMission(data, missionId);
      }
      return null;
    });
  }

  /// Sync pending offline updates when connectivity is restored
  Future<void> syncPendingUpdates() async {
    try {
      final updates = await getPendingUpdates();
      
      for (final update in updates) {
        try {
          switch (update.action) {
            case MissionAction.complete:
              await _apiService.completeMission(
                missionId: update.missionId,
                distance: update.distance ?? 0,
                fuelConsumed: update.fuelConsumed ?? 0,
                notes: update.notes,
              );
              break;
            case MissionAction.cancel:
              await _apiService._post(
                '/api/driver/me/missions/${update.missionId}/cancel',
                body: {
                  'reason': update.reason ?? 'Cancelled offline',
                },
              );
              break;
          }
          
          // Remove successfully synced update from queue
          await _removeFromQueue(update.id);
        } catch (e) {
          // If sync fails, keep the update in queue for next attempt
          print('Failed to sync update ${update.id}: $e');
        }
      }
      
      // Update network status to online
      _networkStatusController.add(true);
    } catch (e) {
      print('Error syncing pending updates: $e');
    }
  }

  /// Queue an update for offline processing
  Future<void> _queueOfflineUpdate(MissionUpdate update) async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString(_queueKey) ?? '[]';
    final queue = List<Map<String, dynamic>>.from(jsonDecode(queueJson));
    
    queue.add(update.toJson());
    
    await prefs.setString(_queueKey, jsonEncode(queue));
  }

  /// Get all pending updates from the offline queue
  Future<List<MissionUpdate>> getPendingUpdates() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString(_queueKey) ?? '[]';
    final queue = List<Map<String, dynamic>>.from(jsonDecode(queueJson));
    
    return queue.map((json) => MissionUpdate.fromJson(json)).toList();
  }

  /// Remove an update from the offline queue
  Future<void> _removeFromQueue(String updateId) async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString(_queueKey) ?? '[]';
    final queue = List<Map<String, dynamic>>.from(jsonDecode(queueJson));
    
    queue.removeWhere((item) => item['id'] == updateId);
    
    await prefs.setString(_queueKey, jsonEncode(queue));
  }

  /// Clear all pending updates (use with caution)
  Future<void> clearQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
  }

  /// Check if there are pending updates
  Future<bool> hasPendingUpdates() async {
    final updates = await getPendingUpdates();
    return updates.isNotEmpty;
  }

  /// Get the count of pending updates
  Future<int> getPendingUpdateCount() async {
    final updates = await getPendingUpdates();
    return updates.length;
  }

  /// Start monitoring network connectivity
  void _startNetworkMonitoring() {
    // Simple network monitoring - in a real app, you might use connectivity_plus package
    Timer.periodic(const Duration(seconds: 30), (timer) async {
      try {
        // Try to sync pending updates as a connectivity test
        if (await hasPendingUpdates()) {
          await syncPendingUpdates();
        }
      } catch (e) {
        // Network is likely down
        _networkStatusController.add(false);
      }
    });
  }

  /// Convert Firestore mission format to API mission format
  Mission? _convertFirestoreMissionToApiMission(Map<String, dynamic> data, String id) {
    try {
      // This is a simplified conversion - you may need to adjust based on actual data structure
      return Mission(
        id: id,
        destination: data['location'] ?? data['destination'] ?? '',
        purpose: data['description'] ?? data['purpose'] ?? '',
        startTime: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
        status: _normalizeStatus(data['status'] as String?),
        vehicle: Vehicle(
          id: data['vehicleId'] ?? '',
          plateNumber: 'Unknown',
          model: 'Unknown',
          brand: 'Unknown',
          year: 2020,
          type: 'Unknown',
          status: 'active',
          fuelType: 'gasoline',
          mileage: 0,
        ),
        driver: Driver(
          id: data['assignedTo'] ?? '',
          userId: data['assignedTo'] ?? '',
          licenseNumber: 'Unknown',
          licenseExpiry: DateTime.now().add(const Duration(days: 365)),
          status: 'active',
          rating: 5.0,
          totalMissions: 0,
          user: User(
            id: data['assignedTo'] ?? '',
            email: 'unknown@example.com',
            firstName: 'Unknown',
            lastName: 'Driver',
            role: 'driver',
          ),
        ),
        startLocation: data['startLocation'] as String?,
        endLocation: data['endLocation'] as String?,
        endTime: (data['completedAt'] as Timestamp?)?.toDate(),
        distance: data['distance'] as num?,
        fuelConsumed: data['fuelConsumed'] as num?,
        notes: data['notes'] as String?,
      );
    } catch (e) {
      print('Error converting Firestore mission to API mission: $e');
      return null;
    }
  }

  /// Normalize mission status
  String _normalizeStatus(String? status) {
    switch (status) {
      case 'en_attente':
        return 'pending';
      case 'assignée':
        return 'assigned';
      case 'en_cours':
        return 'in_progress';
      case 'terminée':
        return 'completed';
      case 'annulée':
        return 'cancelled';
      default:
        return status ?? 'pending';
    }
  }

  /// Dispose resources
  void dispose() {
    _networkStatusController.close();
    _missionUpdateController.close();
  }
}

/// Enumeration for mission actions
enum MissionAction {
  complete,
  cancel,
}

/// Model for offline mission updates
class MissionUpdate {
  final String id;
  final String missionId;
  final MissionAction action;
  final double? distance;
  final double? fuelConsumed;
  final String? notes;
  final String? reason;
  final DateTime timestamp;

  MissionUpdate({
    required this.id,
    required this.missionId,
    required this.action,
    this.distance,
    this.fuelConsumed,
    this.notes,
    this.reason,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'missionId': missionId,
      'action': action.name,
      'distance': distance,
      'fuelConsumed': fuelConsumed,
      'notes': notes,
      'reason': reason,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory MissionUpdate.fromJson(Map<String, dynamic> json) {
    return MissionUpdate(
      id: json['id'] as String,
      missionId: json['missionId'] as String,
      action: MissionAction.values.firstWhere(
        (e) => e.name == json['action'],
        orElse: () => MissionAction.complete,
      ),
      distance: json['distance'] as double?,
      fuelConsumed: json['fuelConsumed'] as double?,
      notes: json['notes'] as String?,
      reason: json['reason'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}