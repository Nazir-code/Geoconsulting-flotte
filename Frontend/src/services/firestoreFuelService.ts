// services/firestoreFuelService.ts
// Service Firestore pour la gestion (persistante) des pleins de carburant.
// Collection `fuel_records/` + écoute temps réel. Modèle aligné sur les
// autres services Firestore (driver / vehicle).

import { Timestamp } from 'firebase/firestore';
import FirestoreService from '@/lib/firestoreService';

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string; // ISO
  quantity: number; // litres
  pricePerLiter: number; // FCFA / litre
  totalCost: number; // FCFA
  station?: string;
  mileage?: number; // km au moment du plein
  createdAt: string;
}

export type FuelRecordInput = Omit<FuelRecord, 'id' | 'createdAt'>;

type FuelRecordDoc = Omit<FuelRecord, 'id' | 'createdAt'> & {
  createdAt?: Timestamp | string;
};

function toIso(value?: Timestamp | string): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function mapRecord(doc: FuelRecordDoc & { id: string }): FuelRecord {
  return { ...doc, createdAt: toIso(doc.createdAt) };
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class FirestoreFuelService {
  private static COLLECTION = 'fuel_records';

  /** Créer un plein (id généré + timestamp serveur). */
  static async createFuelRecord(data: FuelRecordInput): Promise<string> {
    const id = `fuel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await FirestoreService.setDocument(`${this.COLLECTION}/${id}`, {
      ...stripUndefined(data as Record<string, unknown>),
      createdAt: FirestoreService.getServerTimestamp(),
    });
    return id;
  }

  /** Écouter tous les pleins en temps réel (triés récent → ancien côté UI). */
  static allFuelRecordsListener(callback: (records: FuelRecord[]) => void) {
    return FirestoreService.onCollectionSnapshot<FuelRecordDoc>(
      this.COLLECTION,
      [],
      (docs) => {
        const records = docs.map(mapRecord);
        records.sort((a, b) => (a.date < b.date ? 1 : -1));
        callback(records);
      }
    );
  }
}

export default FirestoreFuelService;
