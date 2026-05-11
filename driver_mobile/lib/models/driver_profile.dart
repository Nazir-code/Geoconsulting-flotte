import 'package:cloud_firestore/cloud_firestore.dart';

class DriverProfile {
  final String uid;
  final String email;
  final String name;
  final String driverId;
  final double? latitude;
  final double? longitude;
  final DateTime? lastLocationUpdate;

  DriverProfile({
    required this.uid,
    required this.email,
    required this.name,
    required this.driverId,
    this.latitude,
    this.longitude,
    this.lastLocationUpdate,
  });

  // Compatibilité rétroactive avec les anciens noms.
  double? get lat => latitude;
  double? get lng => longitude;
  DateTime? get lastUpdated => lastLocationUpdate;

  factory DriverProfile.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return DriverProfile(
      uid: data['uid'] ?? '',
      email: data['email'] ?? '',
      name: data['name'] ?? '',
      driverId: data['driver_id'] ?? '',
      // Lit le nouveau schéma d'abord, puis fallback ancien schéma.
      latitude: (data['latitude'] as num?)?.toDouble() ?? (data['lat'] as num?)?.toDouble(),
      longitude: (data['longitude'] as num?)?.toDouble() ?? (data['lng'] as num?)?.toDouble(),
      lastLocationUpdate: (data['lastLocationUpdate'] as Timestamp?)?.toDate() ??
          (data['lastUpdated'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'email': email,
      'name': name,
      'driver_id': driverId,
      'latitude': latitude,
      'longitude': longitude,
      'lastLocationUpdate': lastLocationUpdate != null
          ? Timestamp.fromDate(lastLocationUpdate!)
          : null,
    };
  }
}
