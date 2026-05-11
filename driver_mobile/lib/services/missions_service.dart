// lib/services/missions_service.dart
// Service Firestore pour la gestion des missions

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/mission_model.dart';

/// Service pour gérer les missions
class MissionsService {
  static final MissionsService _instance = MissionsService._internal();
  late final FirebaseFirestore _firestore;

  factory MissionsService() {
    return _instance;
  }

  MissionsService._internal() {
    _firestore = FirebaseFirestore.instance;
  }

  /// Référence à la collection missions
  CollectionReference get missionsRef => _firestore.collection('missions');

  /// Écouter les missions assignées à un chauffeur (temps réel)
  ///
  /// Retourne un Stream des missions assignées au chauffeur avec statut pending ou in_progress
  Stream<List<Mission>> listenToMyMissions(String driverUid) {
    return missionsRef
        .where('assignedTo', isEqualTo: driverUid)
        .where('status', whereIn: ['pending', 'in_progress'])
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Mission.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    });
  }

  /// Obtenir une mission spécifique
  Future<Mission?> getMission(String missionId) async {
    try {
      final doc = await missionsRef.doc(missionId).get();
      if (doc.exists) {
        return Mission.fromJson({
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        });
      }
      return null;
    } catch (e) {
      print('Erreur lors de la récupération de la mission: $e');
      return null;
    }
  }

  /// Accepter une mission (mettre à jour le statut)
  Future<void> acceptMission(String missionId) async {
    try {
      await missionsRef.doc(missionId).update({
        'status': 'in_progress',
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors de l\'acceptation de la mission: $e');
      rethrow;
    }
  }

  /// Refuser une mission (mettre à jour le statut)
  Future<void> rejectMission(String missionId) async {
    try {
      await missionsRef.doc(missionId).update({
        'status': 'pending',
        'assignedTo': '', // Désassigner
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors du refus de la mission: $e');
      rethrow;
    }
  }

  /// Compléter une mission
  Future<void> completeMission(String missionId) async {
    try {
      await missionsRef.doc(missionId).update({
        'status': 'completed',
        'completedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors de la complétion de la mission: $e');
      rethrow;
    }
  }

  /// Ajouter une note à une mission
  Future<void> addMissionNote(String missionId, String note) async {
    try {
      final timestamp = DateTime.now().toIso8601String();
      await missionsRef.doc(missionId).update({
        'notes': FieldValue.arrayUnion(['$timestamp: $note']),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors de l\'ajout de note: $e');
      rethrow;
    }
  }

  /// Mettre à jour le statut d'une mission
  Future<void> updateMissionStatus(String missionId, String status) async {
    try {
      await missionsRef.doc(missionId).update({
        'status': status,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors de la mise à jour du statut: $e');
      rethrow;
    }
  }

  /// Écouter une mission spécifique (temps réel)
  Stream<Mission?> listenToMission(String missionId) {
    return missionsRef.doc(missionId).snapshots().map((snapshot) {
      if (snapshot.exists) {
        return Mission.fromJson({
          'id': snapshot.id,
          ...snapshot.data() as Map<String, dynamic>,
        });
      }
      return null;
    });
  }

  /// Écouter toutes les missions du chauffeur (acceptées, en cours, complétées)
  Stream<List<Mission>> listenToAllMyMissions(String driverUid) {
    return missionsRef
        .where('assignedTo', isEqualTo: driverUid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Mission.fromJson({
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              }))
          .toList();
    });
  }
}
