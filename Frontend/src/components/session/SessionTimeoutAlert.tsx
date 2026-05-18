/**
 * components/session/SessionTimeoutAlert.tsx
 * Alerte modale affichée 2 minutes avant l'expiration de la session
 * 
 * Permet à l'utilisateur de:
 * - Rester connecté (rafraîchit la session)
 * - Se déconnecter maintenant
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, RotateCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';

export function SessionTimeoutAlert() {
  const { sessionTimeoutWarning, timeUntilLogout, signOut, refreshToken } = useAuth();
  const [displayTime, setDisplayTime] = useState(timeUntilLogout);

  useEffect(() => {
    setDisplayTime(timeUntilLogout);
  }, [timeUntilLogout]);

  const handleStayConnected = async () => {
    try {
      await refreshToken();
      console.log('✅ Session rafraîchie - utilisateur reste connecté');
    } catch (error) {
      console.error('Erreur rafraîchissement session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('👋 Déconnexion volontaire');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  return (
    <AnimatePresence>
      {sessionTimeoutWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="bg-background-secondary border border-accent-cyan/30 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-accent-cyan/10 to-accent-violet/10 border-b border-accent-cyan/20 p-6 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 bg-accent-cyan/20 rounded-lg"
                  >
                    <AlertTriangle className="w-6 h-6 text-accent-cyan" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Votre session expire bientôt
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Vous n'avez pas eu d'activité depuis un moment
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Timer */}
                <div className="bg-background-primary border border-border rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-accent-cyan" />
                    <p className="text-sm font-medium text-text-secondary">
                      Temps restant
                    </p>
                  </div>
                  <motion.div
                    key={displayTime}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-mono font-bold text-accent-cyan"
                  >
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </motion.div>
                </div>

                {/* Message */}
                <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    Cliquez sur <span className="font-semibold text-accent-cyan">"Rester connecté"</span> pour rafraîchir votre session et continuer à travailler.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 p-6 border-t border-border">
                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnecter</span>
                </motion.button>

                {/* Stay Connected Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStayConnected}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 text-accent-cyan rounded-lg font-medium transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Rester connecté</span>
                </motion.button>
              </div>

              {/* Footer Info */}
              <div className="px-6 py-3 bg-background-primary/50 border-t border-border text-center">
                <p className="text-xs text-text-secondary">
                  💡 Tip: Restez actif pour garder votre session active
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
