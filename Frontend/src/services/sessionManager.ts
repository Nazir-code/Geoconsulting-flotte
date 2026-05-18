/**
 * services/sessionManager.ts
 * Gestionnaire de session utilisateur avec timeout d'inactivité
 * 
 * Responsabilités:
 * - Monitorer l'inactivité de l'utilisateur
 * - Déclencher des événements de timeout
 * - Gérer les alertes avant expiration
 * - Rafraîchir la session sur activité
 */

export interface SessionConfig {
  /** Durée d'inactivité avant logout (en millisecondes) */
  inactivityTimeout: number;
  /** Durée avant timeout pour afficher l'alerte (en millisecondes) */
  warningTime: number;
  /** Événements souris/clavier à écouter */
  activityEvents: string[];
}

export type SessionEvent = 'timeout' | 'warning' | 'refresh' | 'activity';

interface SessionListener {
  (event: SessionEvent, data?: any): void;
}

/**
 * Gestionnaire de session avec monitoring d'inactivité
 */
export class SessionManager {
  private static instance: SessionManager | null = null;
  
  private config: SessionConfig;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private isActive: boolean = true;
  private listeners: SessionListener[] = [];

  private constructor(config?: Partial<SessionConfig>) {
    this.config = {
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes par défaut
      warningTime: 2 * 60 * 1000, // Alerte 2 minutes avant timeout
      activityEvents: [
        'mousedown',
        'keydown',
        'touchstart',
        'click',
        'scroll',
        'focus',
      ],
      ...config,
    };

    this.setupActivityListeners();
  }

  /**
   * Obtenir l'instance singleton
   */
  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  /**
   * Initialiser les écouteurs d'activité
   */
  private setupActivityListeners(): void {
    this.config.activityEvents.forEach(eventName => {
      document.addEventListener(eventName, () => this.onActivity(), { passive: true });
    });

    // Aussi écouter les changements de focus
    window.addEventListener('focus', () => this.onActivity());
  }

  /**
   * Appelé lors d'une activité utilisateur
   */
  private onActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    // Ignorer les activités trop rapprochées (débounce)
    if (timeSinceLastActivity < 1000) {
      return;
    }

    this.lastActivityTime = now;
    this.resetTimers();
    this.emit('activity');
  }

  /**
   * Réinitialiser les timers d'inactivité
   */
  private resetTimers(): void {
    // Nettoyer les timers existants
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Configurer le timer d'avertissement
    const warningDelay = this.config.inactivityTimeout - this.config.warningTime;
    this.warningTimer = setTimeout(() => {
      if (this.isActive) {
        console.warn('⏱️ Session warning: inactivity detected, timeout in 2 minutes');
        this.emit('warning');
      }
    }, warningDelay);

    // Configurer le timer de timeout
    this.inactivityTimer = setTimeout(() => {
      if (this.isActive) {
        console.warn('⏱️ Session timeout: user inactive for 30 minutes');
        this.emit('timeout');
      }
    }, this.config.inactivityTimeout);
  }

  /**
   * Émettre un événement aux listeners
   */
  private emit(event: SessionEvent, data?: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Erreur dans session listener:', error);
      }
    });
  }

  /**
   * S'abonner aux événements de session
   */
  subscribe(listener: SessionListener): () => void {
    this.listeners.push(listener);
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Démarrer le monitoring de session
   */
  start(): void {
    if (this.isActive) {
      console.log('📊 SessionManager: already started');
      return;
    }

    console.log('📊 SessionManager: starting session monitoring');
    this.isActive = true;
    this.lastActivityTime = Date.now();
    this.resetTimers();
  }

  /**
   * Arrêter le monitoring de session
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log('📊 SessionManager: stopping session monitoring');
    this.isActive = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Rafraîchir la session (réinitialiser les timers)
   */
  refresh(): void {
    if (!this.isActive) {
      return;
    }

    console.log('🔄 Session refreshed - inactivity timer reset');
    this.lastActivityTime = Date.now();
    this.resetTimers();
    this.emit('refresh');
  }

  /**
   * Obtenir les informations de session
   */
  getSessionInfo() {
    const now = Date.now();
    const inactivityDuration = now - this.lastActivityTime;
    const timeUntilTimeout = Math.max(0, this.config.inactivityTimeout - inactivityDuration);
    const timeUntilWarning = Math.max(0, (this.config.inactivityTimeout - this.config.warningTime) - inactivityDuration);

    return {
      isActive: this.isActive,
      lastActivityTime: this.lastActivityTime,
      inactivityDuration,
      timeUntilTimeout,
      timeUntilWarning,
      willTimeoutSoon: timeUntilWarning === 0 && timeUntilTimeout > 0,
    };
  }

  /**
   * Obtenir la durée jusqu'au timeout en secondes (pour affichage)
   */
  getTimeUntilTimeoutSeconds(): number {
    return Math.ceil(this.getSessionInfo().timeUntilTimeout / 1000);
  }

  /**
   * Configurer la durée d'inactivité
   */
  setInactivityTimeout(ms: number): void {
    this.config.inactivityTimeout = ms;
    if (this.isActive) {
      this.resetTimers();
    }
  }

  /**
   * Réinitialiser l'instance singleton (pour tests/logout)
   */
  static reset(): void {
    if (SessionManager.instance) {
      SessionManager.instance.stop();
      SessionManager.instance = null;
    }
  }

  /**
   * Nettoyer tous les listeners et timers
   */
  destroy(): void {
    this.stop();
    this.listeners = [];
  }
}

/**
 * Hook de session pour les composants React
 */
export function useSessionManager(config?: Partial<SessionConfig>) {
  const manager = SessionManager.getInstance(config);
  return manager;
}
