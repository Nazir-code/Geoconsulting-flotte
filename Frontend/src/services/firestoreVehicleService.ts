// services/firestoreVehicleService.ts
// Service Firestore pour la gestion (persistante) des véhicules.
// Modèle calqué sur firestoreDriverService : collection `vehicles/`,
// CRUD + écoute temps réel. Source de vérité partagée web ↔ mobile.

import { Timestamp } from 'firebase/firestore';
import FirestoreService from '@/lib/firestoreService';
import type { Vehicle } from '@/types';

// Données acceptées en entrée (l'id et les timestamps sont gérés par le service).
export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

// Forme brute telle que stockée/relue dans Firestore (dates = Timestamp).
type VehicleDoc = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
};

function toIso(value?: Timestamp | string): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function mapVehicle(doc: VehicleDoc & { id: string }): Vehicle {
  return {
    ...doc,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

// Firestore refuse les valeurs `undefined` : on les retire avant écriture.
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class FirestoreVehicleService {
  private static COLLECTION = 'vehicles';

  /**
   * Créer un véhicule (id généré, timestamps serveur).
   */
  static async createVehicle(data: VehicleInput): Promise<string> {
    const id = `veh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const ts = FirestoreService.getServerTimestamp();
    await FirestoreService.setDocument(`${this.COLLECTION}/${id}`, {
      ...stripUndefined(data as Record<string, unknown>),
      createdAt: ts,
      updatedAt: ts,
    });
    return id;
  }

  /**
   * Mettre à jour un véhicule existant.
   */
  static async updateVehicle(id: string, data: Partial<VehicleInput>): Promise<void> {
    await FirestoreService.updateDocument(`${this.COLLECTION}/${id}`, {
      ...stripUndefined(data as Record<string, unknown>),
      updatedAt: FirestoreService.getServerTimestamp(),
    });
  }

  /**
   * Supprimer un véhicule.
   */
  static async deleteVehicle(id: string): Promise<void> {
    await FirestoreService.deleteDocument(`${this.COLLECTION}/${id}`);
  }

  /**
   * Lire un véhicule unique.
   */
  static async getVehicle(id: string): Promise<Vehicle | null> {
    const doc = await FirestoreService.getDocument<VehicleDoc>(`${this.COLLECTION}/${id}`);
    return doc ? mapVehicle({ ...doc, id }) : null;
  }

  /**
   * Écouter tous les véhicules en temps réel.
   */
  static allVehiclesListener(callback: (vehicles: Vehicle[]) => void) {
    return FirestoreService.onCollectionSnapshot<VehicleDoc>(
      this.COLLECTION,
      [],
      (docs) => callback(docs.map(mapVehicle))
    );
  }
}

export default FirestoreVehicleService;
