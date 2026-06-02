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

  // Constantes de statut (Valeurs réelles en base de données)
  static const String statusPending = 'pending';
  static const String statusInProgress = 'in_progress';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';

  // Pour compatibilité avec l'ancien code
  static const String statusEnAttente = 'pending';
  static const String statusAssignee = 'pending';
  static const String statusEnCours = 'in_progress';
  static const String statusTerminee = 'completed';
  static const String statusAnnulee = 'cancelled';

  static String normalizeStatus(String? status) {
    switch (status) {
      case 'pending':
      case 'en_attente':
      case 'assignée':
        return 'pending';
      case 'in_progress':
      case 'en_cours':
        return 'in_progress';
      case 'completed':
      case 'terminée':
        return 'completed';
      case 'cancelled':
      case 'annulée':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /// Label pour l'affichage UI
  static String getStatusLabel(String status) {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  /// Écouter les missions assignées à un chauffeur (temps réel)
  ///
  /// Retourne un Stream des missions assignées au chauffeur avec statut pending ou in_progress
  Stream<List<Mission>> listenToMyMissions(String driverUid) {
    return missionsRef
        .where('assignedTo', isEqualTo: driverUid)
        .where('status', whereIn: [statusAssignee, statusEnCours, 'pending', 'in_progress'])
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
  Future<void> acceptMission(String missionId, String driverUid) async {
    try {
      await transitionMissionStatus(
        missionId: missionId,
        driverUid: driverUid,
        nextStatus: statusEnCours,
      );
    } catch (e) {
      print('Erreur lors de l\'acceptation de la mission: $e');
      rethrow;
    }
  }

  /// Refuser une mission (mettre à jour le statut)
  Future<void> rejectMission(String missionId) async {
    try {
      await missionsRef.doc(missionId).update({
        'status': statusEnAttente,
        'assignedTo': '', // Désassigner
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur lors du refus de la mission: $e');
      rethrow;
    }
  }

  /// Compléter une mission
  Future<void> completeMission(String missionId, String driverUid) async {
    try {
      await transitionMissionStatus(
        missionId: missionId,
        driverUid: driverUid,
        nextStatus: statusTerminee,
      );
    } catch (e) {
      print('Erreur lors de la complétion de la mission: $e');
      rethrow;
    }
  }

  /// Ajouter une note à une mission
  /// ArrÃªter/annuler une mission en cours.
  Future<void> cancelMission(String missionId, String driverUid) async {
    try {
      await transitionMissionStatus(
        missionId: missionId,
        driverUid: driverUid,
        nextStatus: statusAnnulee,
      );
    } catch (e) {
      print('Erreur lors de l\'annulation de la mission: $e');
      rethrow;
    }
  }

  /// Transition atomique mission + chauffeur pour Ã©viter les doubles Ã©tats.
  Future<void> transitionMissionStatus({
    required String missionId,
    required String driverUid,
    required String nextStatus,
  }) async {
    final missionRef = missionsRef.doc(missionId);
    final driverRef = _firestore.collection('drivers').doc(driverUid);

    await _firestore.runTransaction((transaction) async {
      final missionSnap = await transaction.get(missionRef);
      if (!missionSnap.exists) {
        throw Exception('Mission introuvable');
      }

      final data = missionSnap.data() as Map<String, dynamic>;

      // Sécurité : seul le chauffeur assigné peut modifier la mission.
      // (En complément des règles Firestore.)
      final assignedTo = data['assignedTo'] as String?;
      if (assignedTo != null && assignedTo.isNotEmpty && assignedTo != driverUid) {
        throw Exception('Cette mission est assignée à un autre chauffeur.');
      }

      // Idempotence : une mission déjà terminée ou annulée n'est pas retransitionnée.
      final currentStatus = normalizeStatus(data['status'] as String?);
      if (currentStatus == statusTerminee || currentStatus == statusAnnulee) {
        return;
      }

      final updateData = <String, dynamic>{
        'status': nextStatus,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (nextStatus == statusEnCours) {
        updateData['startedAt'] = FieldValue.serverTimestamp();
      }
      if (nextStatus == statusTerminee) {
        updateData['completedAt'] = FieldValue.serverTimestamp();
      }
      if (nextStatus == statusAnnulee) {
        updateData['cancelledAt'] = FieldValue.serverTimestamp();
      }

      transaction.update(missionRef, updateData);

      if (nextStatus == statusEnCours) {
        transaction.set(driverRef, {
          'currentMission': missionId,
          'status': 'online',
          'lastSeen': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }

      if (nextStatus == statusTerminee || nextStatus == statusAnnulee) {
        transaction.set(driverRef, {
          'currentMission': null,
          'lastSeen': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }
    });
  }

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
        'status': normalizeStatus(status),
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
