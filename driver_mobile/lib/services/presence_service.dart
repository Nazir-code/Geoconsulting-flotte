import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Source de vérité unique pour le champ 'status' du driver.
/// Seul service autorisé à écrire drivers/{uid}.status.
/// NewLocationService n'écrit plus ce champ.
class PresenceService {
  static final PresenceService _instance = PresenceService._internal();
  factory PresenceService() => _instance;
  PresenceService._internal();

  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> setOnline(String uid) async {
    try {
      await _db.collection('drivers').doc(uid).update({
        'status': 'online',
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      debugPrint('[Presence] ${uid.substring(0, 8)}... → online');
    } catch (e) {
      debugPrint('[Presence] setOnline error: $e');
    }
  }

  Future<void> setOffline(String uid) async {
    try {
      await _db.collection('drivers').doc(uid).update({
        'status': 'offline',
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      debugPrint('[Presence] ${uid.substring(0, 8)}... → offline');
    } catch (e) {
      debugPrint('[Presence] setOffline error: $e');
    }
  }
}
