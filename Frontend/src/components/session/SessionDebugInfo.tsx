/**
 * components/session/SessionDebugInfo.tsx
 * Composant de debug pour monitorer la session en temps réel
 * 
 * Utile pour:
 * - Vérifier l'état de la session
 * - Monitorer le timeout d'inactivité
 * - Tester les rafraîchissements
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { AuthService } from '@/services/authService';
import { SessionManager } from '@/services/sessionManager';

export function SessionDebugInfo() {
  const { isAuthenticated, user, token, sessionTimeoutWarning, timeUntilLogout, refreshToken } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const sessionManager = SessionManager.getInstance();
  const sessionInfo = sessionManager.getSessionInfo();
  const authServiceInfo = AuthService.getSessionInfo();

  if (!isAuthenticated) {
    return null;
  }

  const handleManualRefresh = async () => {
    try {
      await refreshToken();
      console.log('✅ Session manually refreshed');
    } catch (error) {
      console.error('Erreur refresh manuel:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB'];
    const i = Math.floor(Math.log(bytes, k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageUsage = () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return formatBytes(totalSize);
  };

  const getInactivityMinutes = Math.floor(sessionInfo.inactivityDuration / 1000 / 60);
  const getInactivitySeconds = Math.floor((sessionInfo.inactivityDuration / 1000) % 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-50"
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-accent-cyan/30 rounded-lg shadow-lg hover:border-accent-cyan/50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-3 h-3 rounded-full bg-accent-cyan animate-pulse" />
        <span className="text-xs font-mono text-text-secondary">
          {showDetails ? 'Détails' : `${timeUntilLogout}s`}
        </span>
        <ChevronDown
          className="w-4 h-4 text-accent-cyan transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-12 left-0 w-80 bg-background-secondary border border-accent-cyan/30 rounded-lg shadow-2xl p-4 space-y-3 text-xs"
          >
            {/* Info Sections */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">🔐 Session Status</h4>
              <div className="bg-background-primary rounded p-2 space-y-1 font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className={sessionInfo.isActive ? 'text-green-400' : 'text-red-400'}>
                    {sessionInfo.isActive ? '✓ YES' : '✗ NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                    {isAuthenticated ? '✓ YES' : '✗ NO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Token Valid:</span>
                  <span className={authServiceInfo.hasValidToken ? 'text-green-400' : 'text-red-400'}>
                    {authServiceInfo.hasValidToken ? '✓ YES' : '✗ NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inactivity Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">⏱️ Inactivity Monitor</h4>
              <div className="bg-background-primary rounded p-2 space-y-1 font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>Inactive since:</span>
                  <span className="text-accent-cyan">
                    {getInactivityMinutes}m {getInactivitySeconds}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time until logout:</span>
                  <span className={timeUntilLogout < 120 ? 'text-orange-400 font-bold' : 'text-accent-cyan'}>
                    {timeUntilLogout}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Warning active:</span>
                  <span className={sessionTimeoutWarning ? 'text-orange-400 font-bold' : 'text-green-400'}>
                    {sessionTimeoutWarning ? '⚠️ YES' : '✓ NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">👤 User Info</h4>
              <div className="bg-background-primary rounded p-2 space-y-1 font-mono text-text-secondary break-all">
                <div>ID: <span className="text-accent-cyan">{user?.id?.slice(0, 8)}...</span></div>
                <div>Email: <span className="text-accent-cyan">{user?.email}</span></div>
                <div>Role: <span className="text-accent-violet">{user?.role}</span></div>
                <div>Name: <span className="text-accent-cyan">{user?.firstName} {user?.lastName}</span></div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">💾 Storage</h4>
              <div className="bg-background-primary rounded p-2 space-y-1 font-mono text-text-secondary">
                <div className="flex justify-between">
                  <span>LocalStorage:</span>
                  <span className="text-accent-cyan">{getStorageUsage()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="text-accent-cyan">{localStorage.length}</span>
                </div>
              </div>
            </div>

            {/* Persistence Type */}
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">🔒 Persistence</h4>
              <div className="bg-background-primary rounded p-2 space-y-1 font-mono text-text-secondary">
                <div className="text-accent-cyan">
                  browserSessionPersistence
                </div>
                <div className="text-xs text-text-secondary/70 mt-1">
                  ✓ Cleared on browser close<br/>
                  ✓ 30min inactivity timeout<br/>
                  ✓ Current session only
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                onClick={handleManualRefresh}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 text-accent-cyan rounded font-mono text-xs transition-colors"
              >
                <Zap className="w-3 h-3" />
                Manual Refresh
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-background-primary hover:bg-background-primary/80 border border-border text-text-secondary rounded font-mono text-xs transition-colors"
              >
                {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-text-secondary/50 text-center pt-2 border-t border-border/50">
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Export un flag pour l'activer en développement uniquement
 */
export function SessionDebugOverlay() {
  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

  if (!isDev) {
    return null;
  }

  return <SessionDebugInfo />;
}
