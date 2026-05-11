// services/firestoreMissionService.ts
// Service Firestore pour la gestion des missions

import { where, Timestamp } from 'firebase/firestore';
import FirestoreService from '@/lib/firestoreService';

export interface Mission {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  location: string;
  assignedTo: string; // driver uid
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Timestamp;
  createdBy: string; // manager uid
  assignedAt?: Timestamp;
  completedAt?: Timestamp;
  notes?: string[];
  updatedAt: Timestamp;
}

/**
 * Service Firestore pour les missions
 * Gère la création, assignation et suivi des missions
 */
export class FirestoreMissionService {
  private static MISSIONS_COLLECTION = 'missions';

  /**
   * Créer une nouvelle mission
   */
  static async createMission(
    data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const timestamp = FirestoreService.getServerTimestamp();

    const missionData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'pending' as const,
    };

    // Utiliser addDoc pour générer un ID
    const missionPath = `${this.MISSIONS_COLLECTION}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await FirestoreService.setDocument(missionPath, missionData);

    return missionPath.split('/')[1];
  }

  /**
   * Mettre à jour une mission
   */
  static async updateMission(
    missionId: string,
    data: Partial<Mission>
  ): Promise<void> {
    const missionPath = `${this.MISSIONS_COLLECTION}/${missionId}`;
    const updateData = {
      ...data,
      updatedAt: FirestoreService.getServerTimestamp(),
    };

    // Ajouter assignedAt si assignedTo est mis à jour
    if (data.assignedTo) {
      Object.assign(updateData, { assignedAt: FirestoreService.getServerTimestamp() });
    }

    // Ajouter completedAt si status passe à completed
    if (data.status === 'completed') {
      Object.assign(updateData, { completedAt: FirestoreService.getServerTimestamp() });
    }

    await FirestoreService.updateDocument(missionPath, updateData);
  }

  /**
   * Assigner une mission à un driver
   */
  static async assignMission(missionId: string, driverUid: string): Promise<void> {
    await this.updateMission(missionId, {
      assignedTo: driverUid,
      status: 'pending',
    });
  }

  /**
   * Obtenir une mission
   */
  static async getMission(missionId: string): Promise<Mission | null> {
    const missionPath = `${this.MISSIONS_COLLECTION}/${missionId}`;
    return FirestoreService.getDocument<Mission>(missionPath);
  }

  /**
   * Écouter les missions d'un driver (temps réel)
   */
  static driverMissionsListener(
    driverUid: string,
    callback: (missions: Mission[]) => void
  ) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [where('assignedTo', '==', driverUid)],
      callback
    );
  }

  /**
   * Écouter toutes les missions (temps réel)
   */
  static allMissionsListener(callback: (missions: Mission[]) => void) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [],
      callback
    );
  }

  /**
   * Écouter les missions en cours
   */
  static activeMissionsListener(callback: (missions: Mission[]) => void) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [where('status', 'in', ['pending', 'in_progress'])],
      callback
    );
  }

  /**
   * Écouter les missions assignées à un driver
   */
  static assignedToDriverListener(
    driverUid: string,
    callback: (missions: Mission[]) => void
  ) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [
        where('assignedTo', '==', driverUid),
        where('status', 'in', ['pending', 'in_progress']),
      ],
      callback
    );
  }

  /**
   * Accepter une mission (driver)
   */
  static async acceptMission(missionId: string): Promise<void> {
    await this.updateMission(missionId, {
      status: 'in_progress',
    });
  }

  /**
   * Completer une mission
   */
  static async completeMission(missionId: string): Promise<void> {
    await this.updateMission(missionId, {
      status: 'completed',
    });
  }

  /**
   * Ajouter une note à une mission
   */
  static async addMissionNote(missionId: string, note: string): Promise<void> {
    const mission = await this.getMission(missionId);
    const notes = mission?.notes || [];
    notes.push(`${new Date().toISOString()}: ${note}`);

    await this.updateMission(missionId, { notes });
  }

  /**
   * Supprimer une mission
   */
  static async deleteMission(missionId: string): Promise<void> {
    const missionPath = `${this.MISSIONS_COLLECTION}/${missionId}`;
    await FirestoreService.deleteDocument(missionPath);
  }
}

export default FirestoreMissionService;
