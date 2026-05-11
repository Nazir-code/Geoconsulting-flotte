import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/driver_profile.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Crée ou met à jour le profil du chauffeur lors de la connexion.
  /// Utilise les mêmes noms de champs que le dashboard web React.
  Future<void> createDriverProfile({
    required String uid,
    required String email,
    String? name,
  }) async {
    try {
      final profileData = {
        'uid': uid,
        'email': email,
        'name': name ?? email.split('@')[0],
        'driver_id': 'DRV-${uid.substring(0, 5).toUpperCase()}',
        'status': 'online',         // ← requis par le filtre web onlineDriversListener
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'createdAt': FieldValue.serverTimestamp(),
      };
      await _db.collection('drivers').doc(uid).set(profileData, SetOptions(merge: true));
      print('✅ [FirestoreService] Profil créé avec données: $profileData');
    } catch (e) {
      print("❌ [FirestoreService] Erreur création profil: $e");
    }
  }

  /// Met à jour la position GPS en temps réel.
  /// Noms de champs alignés sur le schéma attendu par le web :
  ///   latitude / longitude / lastLocationUpdate
  Future<void> updateLocation({
    required String uid,
    required double latitude,
    required double longitude,
  }) async {
    try {
      await _db.collection('drivers').doc(uid).update({
        'latitude': latitude,
        'longitude': longitude,
        'lastLocationUpdate': FieldValue.serverTimestamp(),
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print("Erreur Firestore Update Location: $e");
    }
  }

  /// Met à jour le statut du chauffeur (online / offline).
  Future<void> updateStatus({
    required String uid,
    required String status,
  }) async {
    try {
      await _db.collection('drivers').doc(uid).update({
        'status': status,
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print("Erreur Firestore Update Status: $e");
    }
  }

  /// Récupère le profil du chauffeur
  Future<DriverProfile?> getDriverProfile(String uid) async {
    try {
      DocumentSnapshot doc = await _db.collection('drivers').doc(uid).get();
      if (doc.exists) {
        return DriverProfile.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      print("Erreur Firestore Get Profile: $e");
      return null;
    }
  }

  /// Écoute les missions en attente pour un chauffeur spécifique
  Stream<QuerySnapshot> listenToMissions(String uid) {
    return _db
        .collection('missions')
        .where('assignedTo', isEqualTo: uid) // Changé driverId en assignedTo
        .where('status', isEqualTo: 'pending')
        .snapshots();
  }

  /// Met à jour le statut d'une mission (ex: de 'pending' à 'in_progress')
  Future<void> updateMissionStatus(String missionId, String status) async {
    try {
      await _db.collection('missions').doc(missionId).update({
        'status': status,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print("Erreur Firestore Update Mission Status: $e");
    }
  }
}
