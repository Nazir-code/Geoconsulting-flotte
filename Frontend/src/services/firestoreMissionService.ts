// services/firestoreMissionService.ts
// Service Firestore pour la gestion des missions

import { doc, runTransaction, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import FirestoreService from '@/lib/firestoreService';

export const MISSION_STATUSES = [
  'en_attente',
  'assignée',
  'en_cours',
  'terminée',
  'annulée',
] as const;

export type MissionStatus = typeof MISSION_STATUSES[number];

export const ACTIVE_MISSION_STATUSES: MissionStatus[] = ['assignée', 'en_cours'];
export const LEGACY_ACTIVE_MISSION_STATUSES = ['pending', 'in_progress'];

export function normalizeMissionStatus(status?: string): MissionStatus {
  switch (status) {
    case 'pending':
      return 'en_attente';
    case 'in_progress':
      return 'en_cours';
    case 'completed':
      return 'terminée';
    case 'cancelled':
      return 'annulée';
    case 'assignée':
    case 'en_cours':
    case 'terminée':
    case 'annulée':
    case 'en_attente':
      return status;
    default:
      return 'en_attente';
  }
}

/**
 * Convertit un statut (français OU anglais) vers la valeur canonique ANGLAISE
 * stockée dans Firestore.
 *
 * C'est la convention attendue par :
 *  - les Cloud Functions FCM (functions/index.js : `['pending', 'in_progress']`)
 *  - les requêtes de l'app mobile (whereIn ['pending', 'in_progress'], etc.)
 *
 * La couche d'affichage web reste en français : elle passe par
 * `normalizeMissionStatus` à la lecture. On ne touche donc qu'à l'écriture.
 */
export type StorageMissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export function toStorageStatus(status?: string): StorageMissionStatus {
  switch (status) {
    case 'en_attente':
    case 'assignée':
    case 'pending':
      return 'pending';
    case 'en_cours':
    case 'in_progress':
      return 'in_progress';
    case 'terminée':
    case 'completed':
      return 'completed';
    case 'annulée':
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  location: string;
  assignedTo: string; // driver uid
  status: MissionStatus | 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
    data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> {
    const timestamp = FirestoreService.getServerTimestamp();

    const missionData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
      // Statut canonique ANGLAIS écrit en Firestore (déclenche le FCM + visible mobile).
      // Une mission assignée reste 'pending' tant que le chauffeur ne l'a pas acceptée.
      status: toStorageStatus(data.assignedTo ? 'assignée' : 'en_attente'),
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

    // Normaliser tout statut écrit vers la valeur canonique anglaise Firestore.
    if (data.status) {
      Object.assign(updateData, { status: toStorageStatus(data.status) });
    }

    // Ajouter assignedAt si assignedTo est mis à jour
    if (data.assignedTo) {
      Object.assign(updateData, { assignedAt: FirestoreService.getServerTimestamp() });
    }

    // Ajouter completedAt si status passe à completed
    if (normalizeMissionStatus(data.status) === 'terminée') {
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
      status: 'assignée',
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
      (missions) => callback(missions.map(this.normalizeMission))
    );
  }

  /**
   * Écouter toutes les missions (temps réel)
   */
  static allMissionsListener(callback: (missions: Mission[]) => void) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [],
      (missions) => callback(missions.map(this.normalizeMission))
    );
  }

  /**
   * Écouter les missions en cours
   */
  static activeMissionsListener(callback: (missions: Mission[]) => void) {
    return FirestoreService.onCollectionSnapshot<Mission>(
      this.MISSIONS_COLLECTION,
      [where('status', 'in', [...ACTIVE_MISSION_STATUSES, ...LEGACY_ACTIVE_MISSION_STATUSES])],
      (missions) => callback(missions.map(this.normalizeMission))
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
        where('status', 'in', [...ACTIVE_MISSION_STATUSES, ...LEGACY_ACTIVE_MISSION_STATUSES]),
      ],
      (missions) => callback(missions.map(this.normalizeMission))
    );
  }

  /**
   * Accepter une mission (driver)
   */
  static async acceptMission(missionId: string, driverUid?: string): Promise<void> {
    await this.transitionMissionStatus(missionId, 'en_cours', driverUid);
  }

  /**
   * Completer une mission
   */
  static async completeMission(missionId: string): Promise<void> {
    await this.transitionMissionStatus(missionId, 'terminée');
  }

  /**
   * Annuler/arreter une mission sans supprimer le document Firestore.
   */
  static async cancelMission(missionId: string): Promise<void> {
    await this.transitionMissionStatus(missionId, 'annulée');
  }

  /**
   * Transition atomique mission + driver.currentMission.
   */
  static async transitionMissionStatus(
    missionId: string,
    nextStatus: MissionStatus,
    driverUid?: string
  ): Promise<void> {
    const missionRef = doc(db, this.MISSIONS_COLLECTION, missionId);
    const now = serverTimestamp();

    await runTransaction(db, async (transaction) => {
      const missionSnap = await transaction.get(missionRef);
      if (!missionSnap.exists()) {
        throw new Error('Mission introuvable');
      }

      const mission = missionSnap.data() as Mission;
      const currentStatus = normalizeMissionStatus(mission.status);
      if (currentStatus === 'terminée' || currentStatus === 'annulée') {
        return;
      }

      const assignedTo = driverUid || mission.assignedTo;
      const updateData: Record<string, unknown> = {
        // Écriture en anglais canonique ; les conditions ci-dessous comparent
        // le paramètre français nextStatus (inchangé).
        status: toStorageStatus(nextStatus),
        updatedAt: now,
      };

      if (nextStatus === 'en_cours') {
        updateData.startedAt = now;
      }

      if (nextStatus === 'terminée') {
        updateData.completedAt = now;
      }

      if (nextStatus === 'annulée') {
        updateData.cancelledAt = now;
      }

      transaction.update(missionRef, updateData);

      if (!assignedTo) return;

      const driverRef = doc(db, 'drivers', assignedTo);
      if (nextStatus === 'en_cours') {
        transaction.set(driverRef, {
          currentMission: missionId,
          status: 'online',
          lastSeen: now,
          updatedAt: now,
        }, { merge: true });
      }

      if (nextStatus === 'terminée' || nextStatus === 'annulée') {
        transaction.set(driverRef, {
          currentMission: null,
          lastSeen: now,
          updatedAt: now,
        }, { merge: true });
      }
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

  private static normalizeMission<T extends Mission>(mission: T): T {
    return {
      ...mission,
      status: normalizeMissionStatus(mission.status),
    };
  }
}

export default FirestoreMissionService;
