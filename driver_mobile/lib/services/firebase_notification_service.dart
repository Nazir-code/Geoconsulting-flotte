import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class FirebaseNotificationService {
  FirebaseNotificationService._();

  static final FirebaseNotificationService instance =
      FirebaseNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  StreamSubscription<String>? _tokenRefreshSubscription;
  String? _activeDriverUid;

  Future<void> initialize() async {
    await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> startForDriver(String driverUid) async {
    _activeDriverUid = driverUid;
    await initialize();
    await _saveCurrentToken(driverUid);

    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((token) {
      _saveToken(driverUid, token);
    });

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print(
        'Notification FCM recue au premier plan: '
        '${message.notification?.title ?? message.data['title'] ?? ''}',
      );
    });
  }

  Future<void> stopForDriver() async {
    final uid = _activeDriverUid;
    final token = await _messaging.getToken();

    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
    _activeDriverUid = null;

    if (uid != null && token != null) {
      await _firestore.collection('drivers').doc(uid).set({
        'fcmTokens': FieldValue.arrayRemove([token]),
        'fcmToken': FieldValue.delete(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    }
  }

  Future<void> _saveCurrentToken(String driverUid) async {
    final token = await _messaging.getToken();
    if (token != null) {
      await _saveToken(driverUid, token);
    }
  }

  Future<void> _saveToken(String driverUid, String token) async {
    await _firestore.collection('drivers').doc(driverUid).set({
      'fcmToken': token,
      'fcmTokens': FieldValue.arrayUnion([token]),
      'notificationsEnabled': true,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
