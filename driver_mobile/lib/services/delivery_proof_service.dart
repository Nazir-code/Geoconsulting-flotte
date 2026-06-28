import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../utils/app_log.dart';

class DeliveryProofService {
  static final _storage = FirebaseStorage.instance;
  static final _db = FirebaseFirestore.instance;

  /// Upload la photo dans Storage et retourne le download URL.
  /// [onProgress] reçoit une valeur entre 0.0 et 1.0.
  static Future<String> uploadPhoto({
    required String missionId,
    required File photoFile,
    void Function(double)? onProgress,
  }) async {
    final path = 'delivery_proofs/${missionId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final ref = _storage.ref(path);
    final task = ref.putFile(
      photoFile,
      SettableMetadata(contentType: 'image/jpeg'),
    );

    task.snapshotEvents.listen((snap) {
      if (snap.totalBytes > 0) {
        onProgress?.call(snap.bytesTransferred / snap.totalBytes);
      }
    });

    await task;
    final url = await ref.getDownloadURL();
    AppLog.d('📸 [DeliveryProof] Upload OK — $path');
    return url;
  }

  /// Enregistre l'URL de la photo dans le document mission.
  static Future<void> saveProofToMission({
    required String missionId,
    required String photoUrl,
  }) async {
    await _db.collection('missions').doc(missionId).update({
      'deliveryPhotoUrl': photoUrl,
      'deliveryPhotoAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    AppLog.d('📸 [DeliveryProof] URL enregistrée sur mission $missionId');
  }
}
