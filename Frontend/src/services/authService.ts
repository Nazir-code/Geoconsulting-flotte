// services/authService.ts
// Service d'authentification Firebase pour le web
// Gestion complète des erreurs et persistance de session

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

export interface UserData {
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'admin';
}

export interface SignUpData extends UserData {
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Service d'authentification Firebase avec gestion complète des erreurs
 */
export class AuthService {
  /**
   * Gestion des erreurs Firebase Auth avec messages en français
   */
  private static handleAuthError(error: AuthError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cet email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/invalid-email':
        return 'Format d\'email invalide';
      case 'auth/email-already-in-use':
        return 'Un compte existe déjà avec cet email';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre réseau';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé';
      case 'auth/invalid-credential':
        return 'Identifiants invalides';
      case 'auth/operation-not-allowed':
        return 'Opération non autorisée';
      case 'auth/requires-recent-login':
        return 'Veuillez vous reconnecter pour effectuer cette action';
      default:
        console.error('Firebase Auth Error:', error);
        return `Erreur d'authentification: ${error.message}`;
    }
  }

  /**
   * Configurer la persistance de session
   * 
   * IMPORTANT: TOUJOURS utiliser browserSessionPersistence pour la sécurité
   * - Les données sont effacées à la fermeture complète du navigateur
   * - L'utilisateur doit se reconnecter après redémarrage du navigateur
   * - Le paramètre rememberMe est ignoré (comportement sécurisé par défaut)
   * 
   * @param rememberMe IGNORÉ pour des raisons de sécurité
   */
  static async configurePersistence(rememberMe?: boolean): Promise<void> {
    try {
      // Toujours utiliser browserSessionPersistence (plus sécurisé)
      // rememberMe est ignoré intentionnellement
      await setPersistence(auth, browserSessionPersistence);
    } catch (error) {
      console.error('Erreur configuration persistance:', error);
      throw new Error('Impossible de configurer la persistance de session');
    }
  }

  /**
   * Inscription avec email et mot de passe
   */
  static async signUp(data: SignUpData): Promise<FirebaseUser> {
    try {
      // Configurer la persistance avant l'inscription (toujours sécurisée)
      await this.configurePersistence();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      // Mettre à jour le profil utilisateur
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      return userCredential.user;
    } catch (error) {
      throw new Error(this.handleAuthError(error as AuthError));
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  static async signIn(data: SignInData): Promise<FirebaseUser> {
    try {
      // Configurer la persistance avant la connexion (toujours sécurisée)
      // rememberMe est ignoré et browserSessionPersistence est utilisée
      await this.configurePersistence();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      return userCredential.user;
    } catch (error) {
      throw new Error(this.handleAuthError(error as AuthError));
    }
  }

  /**
   * Déconnexion
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(this.handleAuthError(error as AuthError));
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Obtenir le token JWT de l'utilisateur actuel
   */
  static async getCurrentUserToken(): Promise<string | null> {
    const user = this.getCurrentUser();
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error('Erreur récupération token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Attendre que l'état d'authentification soit initialisé
   */
  static waitForAuthInit(): Promise<FirebaseUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  /**
   * Valider le format email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider la force du mot de passe
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (password.length < 8) {
      errors.push('Recommandé: au moins 8 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Recommandé: au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Recommandé: au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Recommandé: au moins un chiffre');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Recommandé: au moins un caractère spécial');
    }

    return {
      isValid: password.length >= 6,
      errors,
    };
  }

  /**
   * Nettoyer les données utilisateur du localStorage
   * IMPORTANT: Appelé lors du logout
   */
  static clearLocalStorage(): void {
    localStorage.removeItem('fleetnexus_user');
    localStorage.removeItem('fleetnexus_token');
    // Nettoyer aussi sessionStorage par sécurité
    sessionStorage.removeItem('fleetnexus_user');
    sessionStorage.removeItem('fleetnexus_token');
  }

  /**
   * Obtenir les informations de session actuelles
   */
  static getSessionInfo() {
    const user = localStorage.getItem('fleetnexus_user');
    const token = localStorage.getItem('fleetnexus_token');
    
    return {
      hasSession: !!(user && token),
      user: user ? JSON.parse(user) : null,
      hasValidToken: !!token,
    };
  }
}

export default AuthService;