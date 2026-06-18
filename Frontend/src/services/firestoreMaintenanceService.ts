// services/firestoreMaintenanceService.ts
// Demandes d'entretien signalées par les chauffeurs (collection maintenance_requests).

import { Timestamp } from 'firebase/firestore';
import FirestoreService from '@/lib/firestoreService';

export interface MaintenanceRequest {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  type: string;
  description: string;
  mileage?: number;
  driverId?: string;
  driverName?: string;
  status: 'requested' | 'resolved';
  date: string; // ISO
  createdAt: string; // ISO
}

type MaintenanceDoc = Omit<MaintenanceRequest, 'id' | 'createdAt'> & {
  createdAt?: Timestamp | string;
};

function toIso(value?: Timestamp | string): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function mapRequest(doc: MaintenanceDoc & { id: string }): MaintenanceRequest {
  return { ...doc, createdAt: toIso(doc.createdAt) };
}

export class FirestoreMaintenanceService {
  private static COLLECTION = 'maintenance_requests';

  /** Écouter toutes les demandes d'entretien (récent → ancien). */
  static allRequestsListener(callback: (requests: MaintenanceRequest[]) => void) {
    return FirestoreService.onCollectionSnapshot<MaintenanceDoc>(
      this.COLLECTION,
      [],
      (docs) => {
        const list = docs.map(mapRequest);
        list.sort((a, b) => (a.date < b.date ? 1 : -1));
        callback(list);
      }
    );
  }

  /** Marquer une demande comme résolue (manager). */
  static async resolveRequest(id: string): Promise<void> {
    await FirestoreService.updateDocument(`${this.COLLECTION}/${id}`, {
      status: 'resolved',
      resolvedAt: FirestoreService.getServerTimestamp(),
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /** Supprimer une demande (manager). */
  static async deleteRequest(id: string): Promise<void> {
    await FirestoreService.deleteDocument(`${this.COLLECTION}/${id}`);
  }
}

export default FirestoreMaintenanceService;
