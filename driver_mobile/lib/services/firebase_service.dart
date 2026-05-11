import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  
  late final FirebaseFirestore _firestore;
  late final FirebaseAuth _auth;

  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._internal() {
    _firestore = FirebaseFirestore.instance;
    _auth = FirebaseAuth.instance;
  }

  // Getters
  FirebaseFirestore get firestore => _firestore;
  FirebaseAuth get auth => _auth;
  User? get currentUser => _auth.currentUser;

  /// Stream des véhicules en temps réel
  Stream<QuerySnapshot> getVehiclesStream() {
    return _firestore
        .collection('vehicles')
        .snapshots();
  }

  /// Récupère un véhicule spécifique par ID
  Future<DocumentSnapshot> getVehicle(String vehicleId) {
    return _firestore
        .collection('vehicles')
        .doc(vehicleId)
        .get();
  }

  /// Met à jour la position du véhicule en temps réel
  Future<void> updateVehiclePosition(
    String vehicleId,
    double latitude,
    double longitude,
  ) {
    return _firestore
        .collection('vehicles')
        .doc(vehicleId)
        .update({
      'latitude': latitude,
      'longitude': longitude,
      'lastUpdate': FieldValue.serverTimestamp(),
    });
  }

  /// Stream des missions en temps réel
  Stream<QuerySnapshot> getMissionsStream({String? driverId}) {
    Query query = _firestore.collection('missions');
    
    if (driverId != null) {
      query = query.where('driverId', isEqualTo: driverId);
    }
    
    return query.snapshots();
  }

  /// Récupère une mission spécifique
  Future<DocumentSnapshot> getMission(String missionId) {
    return _firestore
        .collection('missions')
        .doc(missionId)
        .get();
  }

  /// Met à jour le statut d'une mission
  Future<void> updateMissionStatus(
    String missionId,
    String status,
  ) {
    return _firestore
        .collection('missions')
        .doc(missionId)
        .update({
      'status': status,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Stream des données du chauffeur
  Stream<DocumentSnapshot> getDriverStream(String driverId) {
    return _firestore
        .collection('drivers')
        .doc(driverId)
        .snapshots();
  }

  /// Met à jour les données du chauffeur
  Future<void> updateDriver(String driverId, Map<String, dynamic> data) {
    return _firestore
        .collection('drivers')
        .doc(driverId)
        .update({
      ...data,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Crée un document avec un ID automatique
  Future<DocumentReference> addDocument(
    String collection,
    Map<String, dynamic> data,
  ) {
    return _firestore.collection(collection).add({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  /// Récupère un document par ID
  Future<DocumentSnapshot> getDocument(String collection, String docId) {
    return _firestore.collection(collection).doc(docId).get();
  }

  /// Supprime un document
  Future<void> deleteDocument(String collection, String docId) {
    return _firestore.collection(collection).doc(docId).delete();
  }

  /// Exécute une transaction
  Future<T> runTransaction<T>(
    Future<T> Function(Transaction) transactionHandler,
  ) {
    return _firestore.runTransaction(transactionHandler);
  }

  /// Authentification avec email et mot de passe
  Future<UserCredential> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) {
    return _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  /// Déconnexion
  Future<void> signOut() {
    return _auth.signOut();
  }

  /// Vérifie si l'utilisateur est connecté
  bool isUserLoggedIn() {
    return _auth.currentUser != null;
  }

  /// Récupère l'ID de l'utilisateur actuel
  String? getCurrentUserId() {
    return _auth.currentUser?.uid;
  }
}
