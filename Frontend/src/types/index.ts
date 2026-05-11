// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'driver' | 'manager' | 'admin';
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  year: number;
  type: 'suv' | 'van' | 'truck' | 'pickup' | 'sedan';
  status: 'available' | 'on_mission' | 'maintenance' | 'unavailable';
  fuelType: 'diesel' | 'gasoline';
  currentDriverId?: string;
  currentDriver?: Driver;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  mileage: number;
  image?: string;
  // Champs ajoutés pour cahier des charges
  consumptionTheoretical?: number; // L/100km
  fuelCapacity?: number; // Litres
  kmAtLastService?: number; // Kilométrage dernier service
  createdAt: string;
  updatedAt: string;
}

// Driver Types
export interface Driver {
  id: string;
  userId: string;
  user: User;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'active' | 'on_mission' | 'off' | 'suspended';
  rating: number;
  totalMissions: number;
  currentVehicleId?: string;
  currentVehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
}

// Mission Types
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Mission {
  id: string;
  driverId: string;
  driver: Driver;
  vehicleId: string;
  vehicle: Vehicle;
  destination: string;
  purpose: string;
  startTime: string;
  endTime?: string;
  status: MissionStatus;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  fuelConsumed?: number;
  notes?: string;
  // Champs GPS et kilométrage
  gpsRoute?: Array<{ lat: number; lng: number; timestamp: string }>; // Historique positions
  actualDistance?: number; // Distance calculée GPS
  actualDuration?: number; // Durée en secondes
  kmStart?: number; // Km départ (manuel optionnel)
  kmEnd?: number; // Km arrivée (manuel optionnel)
  absenceReason?: string; // "compteur HS", "oublié", etc.
  createdAt: string;
  updatedAt: string;
}

// Fuel Types
export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driver: Driver;
  date: string;
  quantity: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  station?: string;
  notes?: string;
  createdAt: string;
}

// Maintenance Types
export type MaintenanceType = 'oil_change' | 'filters' | 'tires' | 'repairs' | 'insurance' | 'technical_inspection' | 'routine' | 'inspection' | 'emergency';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  description: string;
  cost: number;
  serviceProvider?: string; // Atelier, garage
  notes?: string;
  // Champs ajoutés pour cahier des charges
  km?: number; // Kilométrage au moment de l'entretien
  nextDueKm?: number; // Prochain entretien en km
  nextDueDate?: string; // Prochain entretien en date
  attachment?: string; // URL fichier/photo facture
  createdAt: string;
  updatedAt: string;
}

// Alert Types
export type AlertType = 'oil_change' | 'maintenance_overdue' | 'insurance_expired' | 'inspection_due' | 'abnormal_consumption';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  dueDate?: string;
  dueKm?: number;
  isResolved: boolean;
  resolvedAt?: string;
  triggeredAt: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalVehicles: number;
  activeMissions: number;
  totalDrivers: number;
  monthlyFuelCost: number;
  monthlyExpenses: number;
  maintenanceAlerts: number;
  fuelAnomalies: number;
}

export interface ActivityItem {
  id: string;
  type: 'mission' | 'fuel' | 'maintenance' | 'alert';
  title: string;
  description: string;
  timestamp: string;
}

// GPS Types
export interface GpsLocation {
  id: string;
  vehicleId: string;
  missionId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number; // Précision en mètres
  speed?: number; // Vitesse en km/h
  heading?: number; // Direction en degrés
  timestamp: string;
  createdAt: string;
}

// Chart Data Types
export interface ChartDataPoint {
  month: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface VehicleUtilizationData {
  vehicleId: string;
  vehicleName: string;
  utilizationRate: number;
  missionCount: number;
}

// Filter Types
export interface MissionFilter {
  driverId?: string;
  vehicleId?: string;
  status?: MissionStatus;
  startDate?: string;
  endDate?: string;
}

export interface FuelFilter {
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'mission_update' | 'vehicle_update' | 'notification' | 'alert';
  payload: unknown;
  timestamp: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreateMissionFormData {
  destination: string;
  purpose: string;
  driverId: string;
  vehicleId: string;
  startTime?: string;
}

export interface FuelRecordFormData {
  vehicleId: string;
  quantity: number;
  pricePerLiter: number;
  mileage: number;
  station?: string;
  notes?: string;
}

export interface MaintenanceFormData {
  vehicleId: string;
  type: MaintenanceType;
  scheduledDate: string;
  description: string;
  cost: number;
  serviceProvider?: string;
}
