/**
 * components/security/ProtectedRoute.tsx
 * Wrapper pour protéger les routes/contenus privés
 * 
 * Vérifie:
 * - Authentification active
 * - Pas de session expirée
 * - Rôle utilisateur (optionnel)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext_Firebase';
import { LoginPage } from '@/components/auth/LoginPage';
import { AlertCircle, Clock } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rôles autorisés (vérification optionnelle) */
  allowedRoles?: Array<'manager' | 'admin' | 'driver'>;
  /** Fallback si non authentifié */
  fallback?: React.ReactNode;
  /** Message d'erreur personnalisé */
  errorMessage?: string;
}

/**
 * Composant pour protéger les routes/contenus privés
 * 
 * Utilisage:
 * <ProtectedRoute allowedRoles={['manager', 'admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
  errorMessage,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, sessionTimeoutWarning } = useAuth();

  // Afficher le loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <Clock className="w-8 h-8 text-accent-cyan" />
          </motion.div>
          <p className="text-text-secondary">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated || !user) {
    console.warn('🔐 Accès refusé: utilisateur non authentifié');
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background-primary">
        <LoginPage onLogin={() => {}} />
      </div>
    );
  }

  // Vérifier les rôles autorisés
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`🔐 Accès refusé: rôle ${user.role} non autorisé`);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-secondary border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-semibold text-text-primary">Accès Refusé</h2>

          <p className="text-text-secondary text-sm">
            {errorMessage || 'Vous n\'avez pas les permissions pour accéder à cette ressource'}
          </p>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-secondary">
              Votre rôle: <span className="font-mono text-accent-cyan">{user.role}</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Rôles requis: <span className="font-mono text-accent-violet">{allowedRoles?.join(', ')}</span>
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 w-full py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 text-accent-cyan rounded-lg font-medium transition-colors"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  // Avertir avant expiration (optionnel)
  if (sessionTimeoutWarning) {
    console.warn('⚠️ Session expiration warning - protected content still rendered');
  }

  // Authentification valide et permissions OK
  return <>{children}</>;
}

/**
 * Hook pour vérifier l'accès à une ressource
 */
export function useProtectedAccess(requiredRoles?: Array<'manager' | 'admin' | 'driver'>) {
  const { isAuthenticated, user, isLoading } = useAuth();

  const hasAccess = !isLoading && isAuthenticated && user && 
    (!requiredRoles || requiredRoles.includes(user.role));

  return {
    hasAccess,
    isLoading,
    user,
    isAuthenticated,
  };
}
