import { io, Socket } from 'socket.io-client';

export interface LivePosition {
  vehicleId: string;
  missionId: string;
  lat: number;
  lng: number;
  speed: number;       // km/h
  heading: number;     // degrés (0 = Nord)
  progress: number;    // 0–100 %
  distanceDone: number;  // km parcourus
  distanceTotal: number; // km total
  eta: number;           // minutes restantes
  timestamp: string;
}

type PositionListener = (positions: LivePosition[]) => void;

class GpsSimulatorClient {
  private socket: Socket;
  private listeners: PositionListener[] = [];
  private currentPositions: LivePosition[] = [];
  private currentTrails: Record<string, Array<{ lat: number; lng: number }>> = {};
  private isPaused = false;

  constructor() {
    // Connexion au backend Socket.IO
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    this.socket = io(socketUrl);

    // Écouteurs globaux
    this.socket.on('gps_positions', (positions: LivePosition[]) => {
      this.currentPositions = positions;
      this.listeners.forEach((l) => l(positions));
    });

    this.socket.on('gps_trails', (trails: Record<string, Array<{ lat: number; lng: number }>>) => {
      this.currentTrails = trails;
    });

    this.socket.on('simulator_paused_state', (pausedState: boolean) => {
      this.isPaused = pausedState;
    });
    
    // Demander l'état de pause initial
    this.socket.emit('get_paused_state');
  }

  // Les méthodes de registration sont désormais gérées côté serveur ou via API.
  // Pour la compatibilité sans casser l'UI, on garde des stubs qui ne font rien,
  // vu que le serveur a déjà les 2 missions enregistrées.
  registerVehicle() {
    // Géré par le serveur
  }

  unregisterVehicle() {
    // Géré par le serveur
  }

  subscribe(listener: PositionListener) {
    this.listeners.push(listener);
    // On envoie les données actuelles si on en a déjà
    if (this.currentPositions.length > 0) {
      listener(this.currentPositions);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  start() {
    // Le serveur tourne déjà en continu, rien à faire ici
  }

  stop() {
    // Rien à faire
  }

  togglePause() {
    // Envoyer la commande au serveur
    this.socket.emit('toggle_pause');
    // On présume le changement immédiat pour l'UI, le serveur confirmera
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  get paused() {
    return this.isPaused;
  }

  reset() {
    // Géré côté serveur
  }

  getCurrentPositions(): LivePosition[] {
    return this.currentPositions;
  }

  getTrail(vehicleId: string): Array<{ lat: number; lng: number }> {
    return this.currentTrails[vehicleId] || [];
  }
}

export const gpsSimulator = new GpsSimulatorClient();

