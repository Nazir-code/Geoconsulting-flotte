// Alert Service - Génère et gère les alertes selon les seuils du cahier des charges
import type { Vehicle, Alert, AlertType, AlertSeverity } from '../types';

// Seuils d'alerte
const ALERT_THRESHOLDS = {
  OIL_CHANGE_KM: 15000, // Révision tous les 15000 km
  TECHNICAL_INSPECTION_MONTHS: 12, // Visite technique annuelle
  ABNORMAL_CONSUMPTION_THRESHOLD: 1.2, // 20% au-dessus de la consommation théorique
};

class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private listeners: ((alerts: Alert[]) => void)[] = [];

  /**
   * Évalue tous les alertes pour un véhicule
   */
  async evaluateVehicleAlerts(vehicle: Vehicle): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Vérifier l'entretien régulier (huile, filtres, pneus)
    const maintenanceAlerts = this.evaluateMaintenanceAlerts(vehicle);
    alerts.push(...maintenanceAlerts);

    // Vérifier les anomalies de consommation
    const consumptionAlerts = await this.evaluateConsumptionAlerts(vehicle);
    alerts.push(...consumptionAlerts);

    // Stocker et notifier
    alerts.forEach((alert) => {
      this.alerts.set(alert.id, alert);
    });

    this.notifyListeners();

    return alerts;
  }

  /**
   * Évalue les alertes liées à l'entretien régulier
   */
  private evaluateMaintenanceAlerts(vehicle: Vehicle): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Alerte changement d'huile
    if (
      vehicle.kmAtLastService &&
      vehicle.mileage - vehicle.kmAtLastService > ALERT_THRESHOLDS.OIL_CHANGE_KM * 0.8
    ) {
      alerts.push(
        this.createAlert({
          vehicleId: vehicle.id,
          type: 'oil_change',
          severity:
            vehicle.mileage - vehicle.kmAtLastService >
            ALERT_THRESHOLDS.OIL_CHANGE_KM
              ? 'critical'
              : 'warning',
          title: '⚙️ Entretien Huile Moteur',
          message: `Prochain changement d'huile recommandé. Km depuis dernier service : ${
            vehicle.mileage - (vehicle.kmAtLastService || 0)
          } km`,
          dueKm: vehicle.kmAtLastService + ALERT_THRESHOLDS.OIL_CHANGE_KM,
        }),
      );
    }

    // Alerte visite technique (annuelle)
    if (
      vehicle.lastMaintenanceDate &&
      new Date(vehicle.lastMaintenanceDate) < oneYearAgo
    ) {
      alerts.push(
        this.createAlert({
          vehicleId: vehicle.id,
          type: 'inspection_due',
          severity: 'warning',
          title: '🔍 Visite Technique Recommandée',
          message: 'La visite technique annuelle est dépassée ou proche. Planifiez une inspection.',
          dueDate: new Date(vehicle.lastMaintenanceDate).toISOString(),
        }),
      );
    }

    return alerts;
  }

  private async evaluateConsumptionAlerts(vehicle: Vehicle): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!vehicle.consumptionTheoretical || vehicle.consumptionTheoretical === 0) {
      return alerts;
    }

    // Ici on pourrait analyser les FuelRecords pour détecter des anomalies
    // Pour MVP, on simplifie en attendant les données fuel réelles
    // const recentConsumption = await this.calculateRecentConsumption(vehicle.id);
    // if (recentConsumption > vehicle.consumptionTheoretical * ALERT_THRESHOLDS.ABNORMAL_CONSUMPTION_THRESHOLD) {
    //   alerts.push(...)
    // }

    return alerts;
  }

  private createAlert(data: {
    vehicleId: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    dueDate?: string;
    dueKm?: number;
  }): Alert {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      vehicleId: data.vehicleId,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      dueDate: data.dueDate,
      dueKm: data.dueKm,
      isResolved: false,
      triggeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.updatedAt = new Date().toISOString();
      this.notifyListeners();
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.isResolved);
  }

  /**
   * Récupère les alertes pour un véhicule
   */
  getVehicleAlerts(vehicleId: string): Alert[] {
    return this.getActiveAlerts().filter((a) => a.vehicleId === vehicleId);
  }

  /**
   * Récupère les alertes critiques
   */
  getCriticalAlerts(): Alert[] {
    return this.getActiveAlerts().filter((a) => a.severity === 'critical');
  }

  /**
   * S'abonner aux modifications d'alertes
   */
  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    const alerts = this.getActiveAlerts();
    this.listeners.forEach((listener) => listener(alerts));
  }
}

export const alertService = new AlertService();
