import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/driver_profile.dart';
import 'missions_service.dart';

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
    // Validation mobile avant envoi (Task 13.2)
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      debugPrint("❌ [FirestoreService] Coordonnées GPS invalides ignorées: $latitude, $longitude");
      return;
    }

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
    print('🎯 [FIRESTORE_SERVICE] listenToMissions() appelée avec uid: $uid');
    print('   ├─ Collection: missions');
    print('   ├─ Filtre 1: assignedTo == "$uid"');
    print('   ├─ Filtre 2: status in ["${MissionsService.statusAssignee}", "pending"]');
    print('   └─ Type: Stream realtime (snapshots)');
    
    return _db
        .collection('missions')
        .where('assignedTo', isEqualTo: uid) // Changé driverId en assignedTo
        .where('status', whereIn: [MissionsService.statusAssignee, 'pending'])
        .snapshots();
  }

  /// Met à jour le statut d'une mission (ex: de 'pending' à 'in_progress')
  Future<void> updateMissionStatus(String missionId, String status) async {
    try {
      await _db.collection('missions').doc(missionId).update({
        'status': MissionsService.normalizeStatus(status),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print("Erreur Firestore Update Mission Status: $e");
    }
  }

  Future<void> acceptMission({
    required String uid,
    required String missionId,
  }) async {
    await MissionsService().acceptMission(missionId, uid);
  }

  Future<void> completeMission({
    required String uid,
    required String missionId,
  }) async {
    await MissionsService().completeMission(missionId, uid);
  }

  Future<void> cancelMission({
    required String uid,
    required String missionId,
  }) async {
    await MissionsService().cancelMission(missionId, uid);
  }

  /// Récupère l'historique des positions pour un chauffeur (Task 28)
  Future<List<Map<String, dynamic>>> getLocationHistory(String uid, {int limit = 50}) async {
    try {
      final snapshot = await _db
          .collection('drivers')
          .doc(uid)
          .collection('location_history')
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => doc.data()).toList();
    } catch (e) {
      print("Erreur Firestore Get History: $e");
      return [];
    }
  }

  /// Récupère toutes les missions terminées d'un chauffeur (Task 29)
  Future<List<Map<String, dynamic>>> getMissionHistory(String uid) async {
    try {
      final snapshot = await _db
          .collection('missions')
          .where('assignedTo', isEqualTo: uid)
          .where('status', isEqualTo: 'completed')
          .orderBy('updatedAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
    } catch (e) {
      print("Erreur Firestore Get Mission History: $e");
      return [];
    }
  }

  /// 🔐 SYNCHRONISATION FIREBASE UID
  /// Enregistre le Firebase UID du mobile avec le backend
  /// Cela permet au backend d'utiliser le Firebase UID dans assignedTo des missions
  /// au lieu de l'ID du doc driver Firestore
  Future<void> registerFirebaseUidWithBackend(String firebaseUid) async {
    try {
      print('\n🔐 [FIREBASE_SYNC] Enregistrement du Firebase UID avec le backend');
      print('   ├─ Firebase UID: ${firebaseUid.substring(0, 20)}...');

      // 1. Vérifier que le doc driver existe
      final driverDoc = await _db.collection('drivers').doc(firebaseUid).get();
      if (!driverDoc.exists) {
        print('   ⚠️  Doc driver n\'existe pas encore, création...');
        // Le createDriverProfile l'a déjà créé, mais on met à jour si nécessaire
      }

      // 2. Enregistrer le firebaseUid dans le doc du driver
      // (le doc est déjà créé avec cet ID par createDriverProfile)
      await _db.collection('drivers').doc(firebaseUid).set({
        'firebaseUid': firebaseUid,
        'firebaseUidRegisteredAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      print('   ✅ Firebase UID enregistré dans Firestore!');
      print('   │  └─ Path: /drivers/$firebaseUid');
      print('   │  └─ Field: firebaseUid = $firebaseUid');

      // 3. Optionnel: Appeler l'endpoint du backend pour synchroniser
      // (nécessite une authentification valide avec le backend)
      // Pour maintenant, on le fait seulement dans Firestore
      print('   └─ ✅ Synchronisation Firebase UID complète!\n');

    } catch (e) {
      print('❌ [FIREBASE_SYNC] Erreur lors de l\'enregistrement du Firebase UID: $e');
      // Ne pas throw - c'est non-critique pour le fonctionnement
    }
  }
}
