import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'firebase_options.dart';
import 'screens/splash_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/firebase_notification_service.dart';
import 'services/gps_lifecycle_manager.dart';
import 'services/theme_service.dart';
import 'theme/app_theme.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Traiter les notifications reçues en arrière-plan
  final title = message.notification?.title ?? message.data['title'] ?? '';
  final body = message.notification?.body ?? message.data['body'] ?? '';
  final type = message.data['type'] ?? '';
  final missionId = message.data['missionId'] ?? '';
  
  print('🔔 [BACKGROUND] Notification reçue en arrière-plan');
  print('   Type: $type');
  print('   Mission ID: $missionId');
  print('   Titre: $title');
  print('   Message: $body');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisation de Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  // Initialisation des données locales (français)
  await initializeDateFormatting('fr_FR', null);
  await FirebaseNotificationService.instance.initialize();
  await ThemeService.instance.load();

  runApp(const DriverMobileApp());
}

class DriverMobileApp extends StatelessWidget {
  const DriverMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeService.instance,
      builder: (_, __) => MaterialApp(
        title: 'FleetNexus - Driver',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeService.instance.mode,
        home: const SplashScreen(),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/home': (_) => const MainNavigationScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final AuthService _authService = AuthService();
  String? _currentUid;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: _authService.authStateChanges,
      builder: (context, snapshot) {
        // En attente de vérification de l'authentification
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _SplashScreen();
        }

        // Si l'utilisateur est connecté
        if (snapshot.hasData && snapshot.data != null) {
          final user = snapshot.data!;
          
          // 🔥 CORRECTION: Démarrer FCM dès que l'utilisateur se connecte (PAS d'attendre le DriverHome)
          if (_currentUid != user.uid) {
            _currentUid = user.uid;
            print('🔔 [AUTH_WRAPPER] Utilisateur connecté: ${user.uid}');
            print('   ├─ Email: ${user.email}');
            print('   └─ Démarrage du service de notification FCM...');
            
            // Appel IMMÉDIAT au service de notifications et GPS lifecycle
            WidgetsBinding.instance.addPostFrameCallback((_) async {
              await FirebaseNotificationService.instance.startForDriver(user.uid);
              await GpsLifecycleManager().initialize(user.uid);
            });
          }
          
          return const MainNavigationScreen();
        }

        // Utilisateur déconnecté
        if (_currentUid != null) {
          _currentUid = null;
          GpsLifecycleManager().dispose();
          print('🔴 [AUTH_WRAPPER] Utilisateur déconnecté — GPS lifecycle disposed');
        }
        
        return const LoginScreen();
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: AppTheme.shadowColored(AppColors.primary),
              ),
              child: const Icon(
                Icons.local_shipping_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'FleetNexus',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.textHeading,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Espace Chauffeur',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 2.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
