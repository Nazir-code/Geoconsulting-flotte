// context/AuthContext.tsx
// Authentification Firebase pour le dashboard web
// Remplace le système mock par Firebase Auth réel

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import type { User, AuthState, LoginFormData } from '@/types';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: LoginFormData & { firstName: string; lastName: string; phone: string; role: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convertir un utilisateur Firebase en type User custom
 */
function convertFirebaseUserToUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    firstName: firebaseUser.displayName?.split(' ')[0] || '',
    lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
    role: 'driver', // Default, sera mis à jour depuis Firestore
    phone: firebaseUser.phoneNumber || '',
    avatar: firebaseUser.photoURL || '',
    createdAt: (firebaseUser.metadata.creationTime as string) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Provider d'authentification Firebase
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Listener Firebase Auth — écoute les changements d'authentification
   * Synchronise automatiquement avec Firestore
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Utilisateur connecté
          const user = convertFirebaseUserToUser(firebaseUser);
          const idToken = await firebaseUser.getIdToken();

          // Obtenir le profil complet depuis Firestore pour récupérer le rôle
          try {
            const firestoreDriver = await FirestoreDriverService.getDriver(firebaseUser.uid);
            if (firestoreDriver) {
              // Détecter le rôle : manager si numéro de téléphone spécifique ou champ role
              const isManager =
                (firestoreDriver as any).role === 'manager' ||
                firestoreDriver.phone === '+227 90 12 34 56';
              user.role = isManager ? 'manager' : 'driver';
              user.firstName = firestoreDriver.name?.split(' ')[0] || user.firstName;
              user.lastName = firestoreDriver.name?.split(' ').slice(1).join(' ') || user.lastName;
              user.phone = firestoreDriver.phone || user.phone;
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du profil Firestore:', error);
          }

          setState({
            user,
            token: idToken,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('fleetnexus_user', JSON.stringify(user));
          localStorage.setItem('fleetnexus_token', idToken);
        } else {
          // Utilisateur déconnecté
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          localStorage.removeItem('fleetnexus_user');
          localStorage.removeItem('fleetnexus_token');
        }
      } catch (error) {
        console.error('Erreur authentification:', error);
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Connexion avec email et mot de passe
   */
  const login = useCallback(async (data: LoginFormData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );

      // Mettre à jour le statut du driver/manager en ligne
      await FirestoreDriverService.updateDriverStatus(userCredential.user.uid, 'online');

      // L'utilisateur sera chargé via onAuthStateChanged
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));

      if (error.code === 'auth/user-not-found') {
        throw new Error("Cet email n'existe pas.");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Mot de passe incorrect.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("Format d'email invalide.");
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives. Réessayez plus tard.');
      } else {
        throw new Error(error.message || 'Erreur lors de la connexion.');
      }
    }
  }, []);

  /**
   * Inscription avec création de profil Firestore
   */
  const signup = useCallback(
    async (data: LoginFormData & { firstName: string; lastName: string; phone: string; role: string }) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email.trim(),
          data.password
        );

        const uid = userCredential.user.uid;

        // Créer le profil Firestore
        await FirestoreDriverService.createOrUpdateDriver(uid, {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          status: 'online',
          uid,
        });

        // L'utilisateur sera chargé via onAuthStateChanged
      } catch (error: any) {
        setState(prev => ({ ...prev, isLoading: false }));

        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Cet email est déjà utilisé.');
        } else if (error.code === 'auth/weak-password') {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
        } else if (error.code === 'auth/invalid-email') {
          throw new Error("Format d'email invalide.");
        } else {
          throw new Error(error.message || "Erreur lors de l'inscription.");
        }
      }
    },
    []
  );

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Mettre à jour le statut hors ligne avant de déconnecter
      if (state.user?.id) {
        await FirestoreDriverService.updateDriverStatus(state.user.id, 'offline');
      }

      await signOut(auth);

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.user?.id]);

  /**
   * Mettre à jour l'utilisateur localement
   */
  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
