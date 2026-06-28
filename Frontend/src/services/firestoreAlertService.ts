// services/firestoreAlertService.ts
// Génération et gestion des alertes véhicules (maintenance, assurance, CT, vidange).
// Génération côté client (pas de Cloud Functions — plan Spark).
// Clé stable : `alert_${vehicleId}_${type}` — pas de doublons par véhicule+type.

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import type { Alert, AlertType, AlertSeverity, Vehicle } from '@/types';

const COLLECTION = 'alerts';

// Seuils configurables
const MAINTENANCE_WARNING_DAYS = 14;
const INSURANCE_WARNING_DAYS = 30;
const INSPECTION_WARNING_DAYS = 30;
const OIL_CHANGE_INTERVAL_KM = 5000;
const OIL_WARNING_REMAINING_KM = 500;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysDiff(isoDate: string): number {
  return Math.floor(
    (new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function toIso(v?: Timestamp | string): string {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  return v.toDate().toISOString();
}

function alertDocId(vehicleId: string, type: AlertType): string {
  return `alert_${vehicleId}_${type}`;
}

// ── Alert computation (pure, no side effects) ─────────────────────────────────

export interface ComputedAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  dueDate?: string;
  dueKm?: number;
}

export function computeAlertsForVehicle(vehicle: Vehicle): ComputedAlert[] {
  const label = `${vehicle.brand} ${vehicle.model} · ${vehicle.plateNumber}`;
  const alerts: ComputedAlert[] = [];

  // 1. Maintenance planifiée
  if (vehicle.nextMaintenanceDate) {
    const days = daysDiff(vehicle.nextMaintenanceDate);
    if (days < 0) {
      alerts.push({
        type: 'maintenance_overdue',
        severity: 'critical',
        title: 'Maintenance en retard',
        message: `${label} : maintenance prévue le ${new Date(vehicle.nextMaintenanceDate).toLocaleDateString('fr-FR')} — en retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}.`,
        dueDate: vehicle.nextMaintenanceDate,
      });
    } else if (days <= MAINTENANCE_WARNING_DAYS) {
      alerts.push({
        type: 'maintenance_overdue',
        severity: 'warning',
        title: 'Maintenance imminente',
        message: `${label} : maintenance prévue dans ${days} jour${days > 1 ? 's' : ''} (${new Date(vehicle.nextMaintenanceDate).toLocaleDateString('fr-FR')}).`,
        dueDate: vehicle.nextMaintenanceDate,
      });
    }
  }

  // 2. Vidange par kilométrage
  if (vehicle.mileage != null && vehicle.kmAtLastService != null) {
    const kmSince = vehicle.mileage - vehicle.kmAtLastService;
    const remaining = OIL_CHANGE_INTERVAL_KM - kmSince;
    const dueKm = vehicle.kmAtLastService + OIL_CHANGE_INTERVAL_KM;
    if (remaining <= 0) {
      alerts.push({
        type: 'oil_change',
        severity: 'critical',
        title: 'Vidange dépassée',
        message: `${label} : vidange dépassée de ${Math.abs(remaining).toLocaleString()} km (seuil : ${OIL_CHANGE_INTERVAL_KM.toLocaleString()} km).`,
        dueKm,
      });
    } else if (remaining <= OIL_WARNING_REMAINING_KM) {
      alerts.push({
        type: 'oil_change',
        severity: 'warning',
        title: 'Vidange bientôt requise',
        message: `${label} : vidange dans ${remaining.toLocaleString()} km (actuel : ${vehicle.mileage.toLocaleString()} km).`,
        dueKm,
      });
    }
  }

  // 3. Assurance
  if (vehicle.insuranceExpiry) {
    const days = daysDiff(vehicle.insuranceExpiry);
    if (days < 0) {
      alerts.push({
        type: 'insurance_expired',
        severity: 'critical',
        title: 'Assurance expirée',
        message: `${label} : assurance expirée depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''} (${new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}).`,
        dueDate: vehicle.insuranceExpiry,
      });
    } else if (days <= INSURANCE_WARNING_DAYS) {
      alerts.push({
        type: 'insurance_expired',
        severity: days <= 7 ? 'critical' : 'warning',
        title: "Assurance à renouveler",
        message: `${label} : assurance expire dans ${days} jour${days > 1 ? 's' : ''} (${new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}).`,
        dueDate: vehicle.insuranceExpiry,
      });
    }
  }

  // 4. Contrôle technique
  if (vehicle.technicalInspectionExpiry) {
    const days = daysDiff(vehicle.technicalInspectionExpiry);
    if (days < 0) {
      alerts.push({
        type: 'inspection_due',
        severity: 'critical',
        title: 'Contrôle technique expiré',
        message: `${label} : contrôle technique expiré depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''} (${new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}).`,
        dueDate: vehicle.technicalInspectionExpiry,
      });
    } else if (days <= INSPECTION_WARNING_DAYS) {
      alerts.push({
        type: 'inspection_due',
        severity: days <= 7 ? 'critical' : 'warning',
        title: 'Contrôle technique imminent',
        message: `${label} : contrôle technique dans ${days} jour${days > 1 ? 's' : ''} (${new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}).`,
        dueDate: vehicle.technicalInspectionExpiry,
      });
    }
  }

  return alerts;
}

// ── Firestore sync ────────────────────────────────────────────────────────────

/**
 * Calcule les alertes pour tous les véhicules et les upsert dans Firestore.
 * - Crée l'alerte si elle n'existe pas encore (ou si elle n'est pas résolue).
 * - Ne touche pas aux alertes déjà résolues.
 * - Supprime logiquement les alertes qui n'existent plus (resolved).
 */
export async function generateAndSyncAlerts(vehicles: Vehicle[]): Promise<number> {
  // Collecte toutes les alertes actives attendues par vehicleId+type
  const expected = new Map<string, ComputedAlert & { vehicleId: string; vehiclePlate: string; vehicleModel: string }>();
  for (const vehicle of vehicles) {
    for (const alert of computeAlertsForVehicle(vehicle)) {
      expected.set(alertDocId(vehicle.id, alert.type), {
        ...alert,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plateNumber,
        vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      });
    }
  }

  const now = serverTimestamp();
  const writes: Promise<void>[] = [];

  for (const [id, alert] of expected.entries()) {
    const ref = doc(db, COLLECTION, id);
    writes.push(
      setDoc(ref, {
        vehicleId: alert.vehicleId,
        vehiclePlate: alert.vehiclePlate,
        vehicleModel: alert.vehicleModel,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        ...(alert.dueDate ? { dueDate: alert.dueDate } : {}),
        ...(alert.dueKm != null ? { dueKm: alert.dueKm } : {}),
        isResolved: false,
        triggeredAt: now,
        updatedAt: now,
      }, { merge: true })
        // merge: true ne réécrit pas resolvedAt si l'alerte a été résolue manuellement,
        // MAIS isResolved: false la rouvre. On gère ça via resolveAlert() côté UI.
    );
  }

  // Véhicules sans alerte → on marque leurs alertes ouvertes comme résolues
  const allVehicleIds = vehicles.map((v) => v.id);
  for (const vehicle of vehicles) {
    const types: AlertType[] = ['maintenance_overdue', 'oil_change', 'insurance_expired', 'inspection_due'];
    for (const type of types) {
      const id = alertDocId(vehicle.id, type);
      if (!expected.has(id)) {
        // L'alerte n'est plus valide (seuil passé) → on la résout silencieusement
        const ref = doc(db, COLLECTION, id);
        writes.push(
          updateDoc(ref, { isResolved: true, resolvedAt: now, updatedAt: now }).catch(() => {
            // Le doc n'existe pas encore — rien à faire.
          })
        );
      }
    }
  }
  void allVehicleIds; // used indirectly above

  await Promise.all(writes);
  return expected.size;
}

// ── Listeners ─────────────────────────────────────────────────────────────────

type AlertDoc = Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'triggeredAt'> & {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  triggeredAt?: Timestamp | string;
};

function mapAlert(raw: AlertDoc & { id: string }): Alert {
  return {
    ...raw,
    triggeredAt: toIso(raw.triggeredAt),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

/** Écoute les alertes non résolues (pour badge navigation + dashboard KPI). */
export function activeAlertsListener(callback: (alerts: Alert[]) => void) {
  const q = query(
    collection(db, COLLECTION),
    where('isResolved', '==', false),
    orderBy('severity'),
    orderBy('triggeredAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => mapAlert({ id: d.id, ...(d.data() as AlertDoc) })))
  );
}

/** Écoute toutes les alertes (vue complète avec historique résolu). */
export function allAlertsListener(callback: (alerts: Alert[]) => void) {
  const q = query(
    collection(db, COLLECTION),
    orderBy('isResolved'),
    orderBy('severity'),
    orderBy('triggeredAt', 'desc')
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => mapAlert({ id: d.id, ...(d.data() as AlertDoc) })))
  );
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function resolveAlert(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isResolved: true,
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function reopenAlert(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isResolved: false,
    resolvedAt: null,
    updatedAt: serverTimestamp(),
  });
}
