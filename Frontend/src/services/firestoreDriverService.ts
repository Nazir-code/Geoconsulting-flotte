// services/firestoreDriverService.ts
// Service Firestore pour la gestion des drivers

import { where, Timestamp } from 'firebase/firestore';
import FirestoreService from '@/lib/firestoreService';

export interface Driver {
  id: string;
  uid: string;
  name: string;
  email: string;
  role?: 'driver' | 'manager' | 'admin';
  phone?: string;
  status: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
  heading?: number;
  lastLocationUpdate?: Timestamp;
  lastSeen: Timestamp;
  currentMission?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Service Firestore pour les drivers
 * Gère les profils et synchronisation des chauffeurs
 */
export class FirestoreDriverService {
  private static DRIVERS_COLLECTION = 'drivers';

  /**
   * Créer ou mettre à jour le profil du driver
   */
  static async createOrUpdateDriver(
    uid: string,
    data: Partial<Driver>
  ): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    const timestamp = FirestoreService.getServerTimestamp();

    const driverData = {
      ...data,
      uid,
      status: data.status || 'online',
      lastSeen: timestamp,
      updatedAt: timestamp,
      ...(data.createdAt === undefined && { createdAt: timestamp }),
    };

    await FirestoreService.setDocument(driverPath, driverData, true);
  }

  /**
   * Mettre à jour le statut du driver
   */
  static async updateDriverStatus(
    uid: string,
    status: 'online' | 'offline'
  ): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    await FirestoreService.updateDocument(driverPath, {
      status,
      lastSeen: FirestoreService.getServerTimestamp(),
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /**
   * Mettre à jour la position GPS du driver
   */
  static async updateDriverLocation(
    uid: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    await FirestoreService.updateDocument(driverPath, {
      latitude,
      longitude,
      lastLocationUpdate: FirestoreService.getServerTimestamp(),
      lastSeen: FirestoreService.getServerTimestamp(),
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /**
   * Obtenir le profil d'un driver
   */
  static async getDriver(uid: string): Promise<Driver | null> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    return FirestoreService.getDocument<Driver>(driverPath);
  }

  /**
   * Écouter tous les drivers en ligne (temps réel)
   */
  static onlineDriversListener(callback: (drivers: Driver[]) => void) {
    return FirestoreService.onCollectionSnapshot<Driver>(
      this.DRIVERS_COLLECTION,
      [where('status', '==', 'online')],
      callback
    );
  }

  /**
   * Écouter un driver spécifique (temps réel)
   */
  static driverListener(uid: string, callback: (driver: Driver | null) => void) {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    return FirestoreService.onSnapshot<Driver>(driverPath, callback);
  }

  /**
   * Écouter tous les drivers (temps réel)
   */
  static allDriversListener(callback: (drivers: Driver[]) => void) {
    return FirestoreService.onCollectionSnapshot<Driver>(
      this.DRIVERS_COLLECTION,
      [],
      callback
    );
  }

  /**
   * Déconnecter un driver
   */
  static async disconnectDriver(uid: string): Promise<void> {
    await this.updateDriverStatus(uid, 'offline');
  }

  /**
   * Définir la mission actuelle d'un driver
   */
  static async setCurrentMission(uid: string, missionId: string): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    await FirestoreService.updateDocument(driverPath, {
      currentMission: missionId,
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /**
   * Effacer la mission actuelle d'un driver
   */
  static async clearCurrentMission(uid: string): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    await FirestoreService.updateDocument(driverPath, {
      currentMission: null,
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /**
   * Supprimer un driver (document Firestore)
   */
  static async deleteDriver(uid: string): Promise<void> {
    const driverPath = `${this.DRIVERS_COLLECTION}/${uid}`;
    await FirestoreService.deleteDocument(driverPath);
  }
}

export default FirestoreDriverService;
