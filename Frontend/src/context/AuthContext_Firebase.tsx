// context/AuthContext_Firebase.tsx
// Contexte d'authentification Firebase avec gestion complète des erreurs
// + Session monitoring avec timeout d'inactivité

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { AuthService, SignInData, SignUpData } from '@/services/authService';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import { SessionManager, SessionEvent } from '@/services/sessionManager';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshToken: () => Promise<void>;
  sessionWarning: boolean;
  sessionTimeoutWarning: boolean;
  timeUntilLogout: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convertir un utilisateur Firebase en type User custom
 */
function convertFirebaseUserToUser(firebaseUser: FirebaseUser): User {
  const displayName = firebaseUser.displayName || '';
  const nameParts = displayName.split(' ');
  const email = firebaseUser.email || '';
  const lowerEmail = email.toLowerCase();
  const role: User['role'] = lowerEmail.includes('admin')
    ? 'admin'
    : lowerEmail.includes('driver') || lowerEmail.includes('chauffeur')
      ? 'driver'
      : 'manager';
  
  return {
    id: firebaseUser.uid,
    email,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    role,
    phone: firebaseUser.phoneNumber || '',
    avatar: firebaseUser.photoURL || '',
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Provider d'authentification Firebase avec gestion complète des erreurs
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const [timeUntilLogout, setTimeUntilLogout] = useState(0);
  const sessionManager = SessionManager.getInstance();

  /**
   * Charger les données utilisateur depuis Firestore
   */
  const loadUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      const user = convertFirebaseUserToUser(firebaseUser);
      
      // Tenter de récupérer le profil complet depuis Firestore
      const firestoreProfile = await FirestoreDriverService.getDriver(firebaseUser.uid);
      
      if (firestoreProfile) {
        // Enrichir les données utilisateur avec Firestore
        const nameParts = firestoreProfile.name?.split(' ') || [];
        user.firstName = nameParts[0] || user.firstName;
        user.lastName = nameParts.slice(1).join(' ') || user.lastName;
        user.phone = firestoreProfile.phone || user.phone;
        
        const firestoreRole = (firestoreProfile as any).role;
        if (
          firestoreRole === 'driver' ||
          firestoreRole === 'manager' ||
          firestoreRole === 'admin'
        ) {
          user.role = firestoreRole;
        } else if (firestoreProfile.phone === '+227 90 12 34 56') {
          user.role = 'manager';
        }
      }
      
      return user;
    } catch (error) {
      console.error('Erreur chargement profil utilisateur:', error);
      // Retourner l'utilisateur de base même en cas d'erreur Firestore
      return convertFirebaseUserToUser(firebaseUser);
    }
  }, []);

  /**
   * Listener Firebase Auth - écoute les changements d'authentification
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setError(null);
        
        if (firebaseUser) {
          console.log('🔐 Firebase user authenticated:', firebaseUser.uid);
          
          // Obtenir le token immédiatement
          const idToken = await firebaseUser.getIdToken();
          
          // Convertir l'utilisateur Firebase de base - NE PAS attendre Firestore
          const basicUser = convertFirebaseUserToUser(firebaseUser);
          
          // Mettre à jour immédiatement l'état avec l'utilisateur de base
          setState({
            user: basicUser,
            token: idToken,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('✅ Basic user state updated, displaying dashboard');
          localStorage.setItem('fleetnexus_user', JSON.stringify(basicUser));
          localStorage.setItem('fleetnexus_token', idToken);

          // Charger les données Firestore en arrière-plan (NON-BLOQUANT)
          loadUserProfile(firebaseUser).then(enrichedUser => {
            console.log('📦 Enriched user data loaded from Firestore');
            setState(prev => ({
              ...prev,
              user: enrichedUser,
            }));
            localStorage.setItem('fleetnexus_user', JSON.stringify(enrichedUser));
          }).catch(err => {
            console.warn('⚠️ Erreur chargement profil Firestore (non-bloquant):', err);
            // On continue avec l'utilisateur de base
          });

          // Mettre à jour le statut en ligne (non-bloquant)
          FirestoreDriverService.updateDriverStatus(firebaseUser.uid, 'online').catch(err => {
            console.warn('⚠️ Erreur silencieuse statut Firestore:', err);
          });
        } else {
          // Utilisateur déconnecté
          console.log('🚪 User logged out');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          // Nettoyer localStorage
          AuthService.clearLocalStorage();
        }
      } catch (error) {
        console.error('❌ Erreur dans onAuthStateChanged:', error);
        setError('Erreur lors de l\'initialisation de l\'authentification');
        
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  }, [loadUserProfile]);

  /**
   * Connexion avec gestion d'erreurs
   */
  const signIn = useCallback(async (data: SignInData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      const firebaseUser = await AuthService.signIn(data);
      
      // Mettre à jour le statut en ligne
      try {
        await FirestoreDriverService.updateDriverStatus(firebaseUser.uid, 'online');
      } catch (firestoreError) {
        console.warn('Impossible de mettre à jour le statut:', firestoreError);
      }

      // L'utilisateur sera chargé via onAuthStateChanged
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
      throw error;
    }
  }, []);

  /**
   * Inscription avec création de profil Firestore
   */
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setError(null);

      const firebaseUser = await AuthService.signUp(data);

      // Créer le profil Firestore
      try {
        await FirestoreDriverService.createOrUpdateDriver(firebaseUser.uid, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: 'online',
          uid: firebaseUser.uid,
        });
      } catch (firestoreError) {
        console.error('Erreur création profil Firestore:', firestoreError);
        // Ne pas bloquer l'inscription pour une erreur Firestore
      }

      // L'utilisateur sera chargé via onAuthStateChanged
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      setError(error instanceof Error ? error.message : 'Erreur d\'inscription');
      throw error;
    }
  }, []);

  /**
   * Déconnexion avec mise à jour du statut
   */
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      setError(null);
      
      // Arrêter le monitoring de session
      sessionManager.stop();
      setSessionWarning(false);
      setSessionTimeoutWarning(false);

      // Mettre à jour le statut hors ligne avant déconnexion
      if (state.user?.id) {
        try {
          await FirestoreDriverService.updateDriverStatus(state.user.id, 'offline');
        } catch (firestoreError) {
          console.warn('Impossible de mettre à jour le statut offline:', firestoreError);
        }
      }

      await AuthService.signOut();
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setError('Erreur lors de la déconnexion');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.user?.id, sessionManager]);

  /**
   * Réinitialisation du mot de passe
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await AuthService.resetPassword(email);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de réinitialisation');
      throw error;
    }
  }, []);

  /**
   * Rafraîchir le token JWT
   */
  const refreshToken = useCallback(async () => {
    try {
      const newToken = await AuthService.getCurrentUserToken();
      if (newToken) {
        setState(prev => ({ ...prev, token: newToken }));
        localStorage.setItem('fleetnexus_token', newToken);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      setError('Erreur de rafraîchissement de session');
    }
  }, []);

  /**
   * Mettre à jour l'utilisateur localement
   */
  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      
      const updatedUser = { ...prev.user, ...userData };
      localStorage.setItem('fleetnexus_user', JSON.stringify(updatedUser));
      
      return {
        ...prev,
        user: updatedUser,
      };
    });
  }, []);

  // Rafraîchir le token périodiquement (toutes les 50 minutes)
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(refreshToken, 50 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, refreshToken]);

  /**
   * Gérer le session manager - monitoring d'inactivité
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      // L'utilisateur vient de se connecter, démarrer le monitoring
      console.log('🔐 Démarrage du monitoring de session (inactivité timeout)');
      sessionManager.start();

      // S'abonner aux événements de session
      const unsubscribe = sessionManager.subscribe((event: SessionEvent) => {
        console.log(`📊 Session event: ${event}`);
        
        switch (event) {
          case 'warning':
            // Afficher l'alerte 2 minutes avant expiration
            console.warn('⏱️ Session sera expirée dans 2 minutes');
            setSessionTimeoutWarning(true);
            break;

          case 'timeout':
            // Logout automatique après 30 min d'inactivité
            console.warn('⏱️ Session expirée - logout automatique');
            setSessionTimeoutWarning(false);
            signOut();
            break;

          case 'refresh':
            // Session rafraîchie sur activité
            setSessionTimeoutWarning(false);
            break;

          case 'activity':
            // Activité détectée (mise à jour du compteur optionnel)
            break;
        }
      });

      // Mettre à jour le compteur de temps jusqu'au logout (pour l'UI)
      const countdownInterval = setInterval(() => {
        if (state.isAuthenticated) {
          const timeLeft = sessionManager.getTimeUntilTimeoutSeconds();
          setTimeUntilLogout(timeLeft);
        }
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(countdownInterval);
      };
    } else {
      // L'utilisateur est déconnecté, arrêter le monitoring
      sessionManager.stop();
      setSessionTimeoutWarning(false);
      setTimeUntilLogout(0);
    }
  }, [state.isAuthenticated, sessionManager, signOut]);

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUser,
    refreshToken,
    sessionWarning,
    sessionTimeoutWarning,
    timeUntilLogout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
