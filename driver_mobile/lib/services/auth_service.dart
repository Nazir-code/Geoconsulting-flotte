import 'package:firebase_auth/firebase_auth.dart';
import 'firebase_notification_service.dart';
import 'firestore_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirestoreService _firestoreService = FirestoreService();

  /// Stream qui permet de savoir en temps réel si l'utilisateur est connecté
  Stream<User?> get userStream => _auth.authStateChanges();

  /// Alias pour la compatibilité avec main.dart
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Connexion avec Email / Mot de passe
  /// Met automatiquement le statut à "online" dans Firestore
  /// Enregistre également le Firebase UID pour la synchronisation avec le backend
  Future<User?> signIn(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      User? user = result.user;

      if (user != null) {
        print('✅ [AuthService] Utilisateur connecté: ${user.uid}');
        // Créer/mettre à jour le profil Firestore avec status "online"
        await _firestoreService.createDriverProfile(
          uid: user.uid,
          email: user.email!,
          name: user.displayName,
        );
        print('✅ [AuthService] Profil créé dans Firestore');

        // Mettre à jour explicitement le statut
        await _firestoreService.updateStatus(
          uid: user.uid,
          status: 'online',
        );
        print('✅ [AuthService] Statut "online" défini dans Firestore');

        // 🔐 SYNCHRONISATION FIREBASE UID: Enregistrer le Firebase UID pour le backend
        await _firestoreService.registerFirebaseUidWithBackend(user.uid);
      }
      return user;
    } on FirebaseAuthException catch (e) {
      print("DEBUG FIREBASE ERROR: ${e.code} - ${e.message}");
      String message = "Erreur de connexion (${e.code})";
      if (e.code == 'user-not-found') message = "Utilisateur non trouvé";
      if (e.code == 'wrong-password') message = "Mot de passe incorrect";
      if (e.code == 'invalid-credential') message = "Identifiants invalides ou expirés";
      throw message;
    }
  }

  /// Déconnexion
  /// Met le statut à "offline" et retire le token FCM avant de déconnecter.
  ///
  /// IMPORTANT : ces opérations de nettoyage sont "best-effort" et bornées
  /// dans le temps. Sur certains téléphones (MIUI/Xiaomi notamment),
  /// `getToken()` peut se bloquer indéfiniment ; sans timeout, la
  /// déconnexion réelle (`_auth.signOut()`) ne serait jamais atteinte.
  Future<void> signOut() async {
    final uid = _auth.currentUser?.uid;

    if (uid != null) {
      // Marquer hors ligne dans Firestore (tant qu'on est encore authentifié)
      try {
        await _firestoreService
            .updateStatus(uid: uid, status: 'offline')
            .timeout(const Duration(seconds: 2));
      } catch (e) {
        print("Statut offline ignoré (timeout/erreur): $e");
      }

      // Retirer le token FCM
      try {
        await FirebaseNotificationService.instance
            .stopForDriver()
            .timeout(const Duration(seconds: 2));
      } catch (e) {
        print("Retrait token FCM ignoré (timeout/erreur): $e");
      }
    }

    // Action critique : TOUJOURS exécutée, quoi qu'il arrive ci-dessus.
    await _auth.signOut();
  }

  /// Obtenir l'UID de l'utilisateur actuel
  String? get currentUid => _auth.currentUser?.uid;
}
