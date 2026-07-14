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
    if (_activeDriverUid == driverUid) return;
    _activeDriverUid = driverUid;
    print('🚀 [FCM SERVICE] Démarrage pour driver: $driverUid');
    
    await initialize();
    print('✅ [FCM SERVICE] Permissions FCM initialisées');
    
    await _saveCurrentToken(driverUid);
    print('💾 [FCM SERVICE] Token sauvegardé (1ère fois)');

    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((token) {
      print('🔄 [FCM SERVICE] Token refreshé (nouveau token), sauvegarde...');
      _saveToken(driverUid, token);
    });

    // Écouter les messages au premier plan
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print(
        '✅ [FCM SERVICE] Notification FCM recue au premier plan: '
        '${message.notification?.title ?? message.data['title'] ?? ''}',
      );
      _handleNotification(message);
    });

    // Écouter les messages reçus en arrière-plan (quand l'app a été tuée)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print(
        '📲 [FCM SERVICE] Notification FCM ouvert depuis background: '
        '${message.notification?.title ?? message.data['title'] ?? ''}',
      );
      _handleNotification(message);
    });

    // Gérer les messages reçus quand l'app est complètement fermée
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      print('⏰ [FCM SERVICE] Message initial détecté (app lancée depuis notif)');
      _handleNotification(initialMessage);
    } else {
      print('ℹ️  [FCM SERVICE] Pas de message initial (app lancée normalement)');
    }

    print('✅ [FCM SERVICE] Service de notifications complètement démarré pour: $driverUid');
  }

  void _handleNotification(RemoteMessage message) {
    final title = message.notification?.title ?? message.data['title'] ?? '';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    final type = message.data['type'] ?? '';
    final missionId = message.data['missionId'] ?? '';

    print('🎯 [FCM HANDLER] Traitement notification: type=$type, missionId=$missionId');
    print('📋 [FCM HANDLER] Contenu: $title - $body');
    print('📲 [FCM HANDLER] Données complètes: ${message.data}');

    // CRITICAL: Déclencher les actions selon le type de notification
    if (type == 'mission_assigned' && missionId.isNotEmpty) {
      print('🚗 [FCM HANDLER] ✅ Nouvelle mission assignée détectée: $missionId');
      print('🔄 [FCM HANDLER] Note: Le listener Firestore va aussi déclencher dans quelques secondes');
      // The Firestore listener in driver_home will also trigger
      // This ensures the dialog is shown regardless of timing
    } else {
      print('⚠️ [FCM HANDLER] Type=$type, missionId=$missionId - pas d\'action FCM déclenché');
    }
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
    print('📍 [TOKEN SAVE] Tentative d\'obtenir le token FCM...');
    String? token;
    int retries = 0;
    const maxRetries = 3;
    const retryDelayMs = 500;
    
    // Retry logic si le token n'est pas disponible immédiatement
    while (token == null && retries < maxRetries) {
      token = await _messaging.getToken();
      
      if (token == null && retries < maxRetries - 1) {
        print('   ⏳ [TOKEN SAVE] Tentative ${retries + 1}/$maxRetries échouée, attente ${retryDelayMs}ms avant retry...');
        await Future.delayed(const Duration(milliseconds: retryDelayMs));
        retries++;
      }
    }
    
    if (token != null) {
      print('✅ [TOKEN SAVE] Token FCM obtenu (tentative ${retries + 1}): ${token.substring(0, 20)}...');
      print('🔐 [TOKEN SAVE] Longueur du token: ${token.length} caractères');
      await _saveToken(driverUid, token);
    } else {
      print('⚠️ [TOKEN SAVE] ❌ getToken() a retourné NULL après $maxRetries tentatives!');
      print('💡 [TOKEN SAVE] Raisons possibles:');
      print('    ├─ Permissions de notification pas accordées');
      print('    ├─ Firebase pas initialisé correctement');
      print('    ├─ Problème de configuration FCM');
      print('    └─ APK/Bundle pas configuré dans Firebase Console');
      print('🔧 [TOKEN SAVE] Actions à prendre:');
      print('    1. Vérifier les permissions Android dans AndroidManifest.xml');
      print('    2. Vérifier que l\'app est configurée dans Firebase Console');
      print('    3. Vérifier que google-services.json est présent et correct');
      print('    4. Redémarrer l\'app complètement');
    }
  }

  Future<void> _saveToken(String driverUid, String token) async {
    print('💾 [TOKEN SAVE] Enregistrement du token pour UID: $driverUid');
    print('   └─ Token: ${token.substring(0, 30)}...');
    
    try {
      await _firestore.collection('drivers').doc(driverUid).set({
        'fcmToken': token,
        'fcmTokens': FieldValue.arrayUnion([token]),
        'notificationsEnabled': true,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      
      print('✅ [TOKEN SAVE] Token enregistré avec SUCCÈS dans Firestore!');
      print('   └─ Path: /drivers/$driverUid');
      
      // Vérification: relire le document pour confirmer
      final doc = await _firestore.collection('drivers').doc(driverUid).get();
      if (doc.exists) {
        final savedToken = doc.data()?['fcmToken'];
        if (savedToken == token) {
          print('🎯 [TOKEN SAVE] ✅ VÉRIFICATION RÉUSSIE: Token est bien dans Firestore!');
        } else {
          print('⚠️ [TOKEN SAVE] Token ne correspond pas après sauvegarde!');
        }
      }
    } catch (e) {
      print('❌ [TOKEN SAVE] ERREUR lors de la sauvegarde du token!');
      print('   ├─ Type d\'erreur: ${e.runtimeType}');
      print('   ├─ Message: $e');
      print('   └─ Raisons possibles:');
      print('      ├─ Permissions Firestore insuffisantes');
      print('      ├─ Règles Firestore trop strictes');
      print('      ├─ Connexion Internet manquante');
      print('      └─ Document /drivers/$driverUid n\'existe pas');
    }
  }
}
