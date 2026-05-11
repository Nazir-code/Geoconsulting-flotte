import type {
  Vehicle,
  Driver,
  Mission,
  FuelRecord,
  MaintenanceRecord,
  Notification,
  DashboardStats,
  ActivityItem,
  ChartDataPoint,
  CreateMissionFormData,
  FuelRecordFormData,
  MissionFilter,
} from '@/types';
import {
  mockVehicles,
  mockDrivers,
  mockMissions,
  mockFuelRecords,
  mockMaintenanceRecords,
  mockNotifications,
  mockDashboardStats,
  mockActivityItems,
  mockChartData,
} from '@/data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DataService {
  private vehicles: Vehicle[] = [...mockVehicles];
  private drivers: Driver[] = [...mockDrivers];
  private missions: Mission[] = [...mockMissions];
  private fuelRecords: FuelRecord[] = [...mockFuelRecords];
  private maintenanceRecords: MaintenanceRecord[] = [...mockMaintenanceRecords];
  private notifications: Notification[] = [...mockNotifications];
  private listeners: Map<string, ((data?: unknown) => void)[]> = new Map();

  // Event system for real-time updates
  subscribe(event: string, callback: (data?: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: string, callback: (data?: unknown) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    await delay(10);
    return { ...mockDashboardStats };
  }

  async getActivityItems(limit: number = 10): Promise<ActivityItem[]> {
    await delay(10);
    return mockActivityItems.slice(0, limit);
  }

  async getChartData(): Promise<ChartDataPoint[]> {
    await delay(10);
    return [...mockChartData];
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    await delay(10);
    return [...this.vehicles];
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    await delay(10);
    return this.vehicles.find(v => v.id === id) || null;
  }

  async updateVehicleStatus(id: string, status: Vehicle['status']): Promise<Vehicle> {
    await delay(10);
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) {
      throw new Error('Véhicule non trouvé');
    }
    vehicle.status = status;
    vehicle.updatedAt = new Date().toISOString();
    this.emit('vehicle_update', vehicle);
    return { ...vehicle };
  }

  async createVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    await delay(10);
    
    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.vehicles.push(newVehicle);
    this.emit('vehicle_update', newVehicle);
    return { ...newVehicle };
  }

  async updateVehicle(id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vehicle> {
    await delay(10);
    
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) {
      throw new Error('Véhicule non trouvé');
    }

    Object.assign(vehicle, data);
    vehicle.updatedAt = new Date().toISOString();
    this.emit('vehicle_update', vehicle);
    return { ...vehicle };
  }

  async deleteVehicle(id: string): Promise<void> {
    await delay(10);
    
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error('Véhicule non trouvé');
    }

    this.vehicles.splice(index, 1);
    this.emit('vehicle_deleted', id);
  }
  async getDrivers(): Promise<Driver[]> {
    await delay(10);
    return [...this.drivers];
  }

  async getDriverById(id: string): Promise<Driver | null> {
    await delay(10);
    return this.drivers.find(d => d.id === id) || null;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    await delay(10);
    return this.drivers.filter(d => d.status === 'active');
  }

  async updateDriverStatus(id: string, status: Driver['status']): Promise<Driver> {
    await delay(10);
    const driver = this.drivers.find(d => d.id === id);
    if (!driver) {
      throw new Error('Chauffeur non trouvé');
    }
    driver.status = status;
    driver.updatedAt = new Date().toISOString();
    this.emit('driver_update', driver);
    return { ...driver };
  }

  // Missions
  async getMissions(filter?: MissionFilter): Promise<Mission[]> {
    await delay(10);
    let filtered = [...this.missions];
    
    if (filter) {
      if (filter.driverId) {
        filtered = filtered.filter(m => m.driverId === filter.driverId);
      }
      if (filter.vehicleId) {
        filtered = filtered.filter(m => m.vehicleId === filter.vehicleId);
      }
      if (filter.status) {
        filtered = filtered.filter(m => m.status === filter.status);
      }
      if (filter.startDate) {
        filtered = filtered.filter(m => m.startTime >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(m => m.startTime <= filter.endDate!);
      }
    }
    
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getMissionById(id: string): Promise<Mission | null> {
    await delay(10);
    return this.missions.find(m => m.id === id) || null;
  }

  async getActiveMissions(): Promise<Mission[]> {
    await delay(10);
    return this.missions.filter(m => m.status === 'in_progress');
  }

  async createMission(data: CreateMissionFormData): Promise<Mission> {
    await delay(10);
    
    const driver = this.drivers.find(d => d.id === data.driverId);
    const vehicle = this.vehicles.find(v => v.id === data.vehicleId);
    
    if (!driver || !vehicle) {
      throw new Error('Chauffeur ou véhicule non trouvé');
    }

    const newMission: Mission = {
      id: `m${Date.now()}`,
      driverId: data.driverId,
      driver,
      vehicleId: data.vehicleId,
      vehicle,
      destination: data.destination,
      purpose: data.purpose,
      startTime: data.startTime || new Date().toISOString(),
      status: 'in_progress',
      startLocation: 'Niamey',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.missions.unshift(newMission);
    
    // Update driver and vehicle status
    driver.status = 'on_mission';
    driver.currentVehicleId = data.vehicleId;
    vehicle.status = 'on_mission';
    vehicle.currentDriverId = data.driverId;
    
    // Update stats
    mockDashboardStats.activeMissions++;
    
    // Add activity
    mockActivityItems.unshift({
      id: `a${Date.now()}`,
      type: 'mission',
      title: 'Mission Démarrée',
      description: `${driver.user.firstName} ${driver.user.lastName.charAt(0)}. a commencé la mission vers ${data.destination}`,
      timestamp: new Date().toISOString(),
    });

    this.emit('mission_update', newMission);
    this.emit('stats_update', mockDashboardStats);
    
    return { ...newMission };
  }

  async completeMission(id: string, data?: { distance?: number; fuelConsumed?: number; notes?: string }): Promise<Mission> {
    await delay(10);
    
    const mission = this.missions.find(m => m.id === id);
    if (!mission) {
      throw new Error('Mission non trouvée');
    }

    mission.status = 'completed';
    mission.endTime = new Date().toISOString();
    mission.endLocation = mission.destination;
    if (data) {
      mission.distance = data.distance;
      mission.fuelConsumed = data.fuelConsumed;
      mission.notes = data.notes;
    }
    mission.updatedAt = new Date().toISOString();

    // Update driver and vehicle status
    const driver = this.drivers.find(d => d.id === mission.driverId);
    const vehicle = this.vehicles.find(v => v.id === mission.vehicleId);
    
    if (driver) {
      driver.status = 'active';
      driver.currentVehicleId = undefined;
      driver.totalMissions++;
    }
    if (vehicle) {
      vehicle.status = 'available';
      vehicle.currentDriverId = undefined;
      if (data?.distance) {
        vehicle.mileage += data.distance;
      }
    }

    // Update stats
    mockDashboardStats.activeMissions = Math.max(0, mockDashboardStats.activeMissions - 1);

    // Add activity
    mockActivityItems.unshift({
      id: `a${Date.now()}`,
      type: 'mission',
      title: 'Mission Terminée',
      description: `Mission vers ${mission.destination} terminée avec succès`,
      timestamp: new Date().toISOString(),
    });

    this.emit('mission_update', mission);
    this.emit('stats_update', mockDashboardStats);

    return { ...mission };
  }

  async cancelMission(id: string): Promise<Mission> {
    await delay(10);
    
    const mission = this.missions.find(m => m.id === id);
    if (!mission) {
      throw new Error('Mission non trouvée');
    }

    mission.status = 'cancelled';
    mission.updatedAt = new Date().toISOString();

    // Update driver and vehicle status
    const driver = this.drivers.find(d => d.id === mission.driverId);
    const vehicle = this.vehicles.find(v => v.id === mission.vehicleId);
    
    if (driver) {
      driver.status = 'active';
      driver.currentVehicleId = undefined;
    }
    if (vehicle) {
      vehicle.status = 'available';
      vehicle.currentDriverId = undefined;
    }

    // Update stats
    mockDashboardStats.activeMissions = Math.max(0, mockDashboardStats.activeMissions - 1);

    this.emit('mission_update', mission);
    this.emit('stats_update', mockDashboardStats);

    return { ...mission };
  }

  // Fuel Records
  async getFuelRecords(): Promise<FuelRecord[]> {
    await delay(10);
    return [...this.fuelRecords];
  }

  async createFuelRecord(data: FuelRecordFormData): Promise<FuelRecord> {
    await delay(10);
    
    const vehicle = this.vehicles.find(v => v.id === data.vehicleId);
    const driver = this.drivers.find(d => d.userId === vehicle?.currentDriverId);
    
    if (!vehicle) {
      throw new Error('Véhicule non trouvé');
    }

    const newRecord: FuelRecord = {
      id: `f${Date.now()}`,
      vehicleId: data.vehicleId,
      vehicle,
      driverId: driver?.id || '',
      driver: driver!,
      date: new Date().toISOString(),
      quantity: data.quantity,
      pricePerLiter: data.pricePerLiter,
      totalCost: data.quantity * data.pricePerLiter,
      mileage: data.mileage,
      station: data.station,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    this.fuelRecords.unshift(newRecord);
    
    // Update stats
    mockDashboardStats.monthlyFuelCost += newRecord.totalCost;

    // Add activity
    mockActivityItems.unshift({
      id: `a${Date.now()}`,
      type: 'fuel',
      title: 'Fuel Logged',
      description: `${vehicle.plateNumber} refueled (${data.quantity}L)`,
      timestamp: new Date().toISOString(),
    });

    this.emit('fuel_update', newRecord);
    this.emit('stats_update', mockDashboardStats);

    return { ...newRecord };
  }

  // Maintenance Records
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    await delay(10);
    return [...this.maintenanceRecords];
  }

  async createMaintenanceRecord(data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceRecord> {
    await delay(10);
    
    const newRecord: MaintenanceRecord = {
      ...data,
      id: `mt${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.maintenanceRecords.unshift(newRecord);
    
    // Update vehicle status
    const vehicle = this.vehicles.find(v => v.id === data.vehicleId);
    if (vehicle && data.status === 'in_progress') {
      vehicle.status = 'maintenance';
    }

    // Update stats
    if (data.status === 'scheduled') {
      mockDashboardStats.maintenanceAlerts++;
    }

    this.emit('maintenance_update', newRecord);
    this.emit('stats_update', mockDashboardStats);

    return { ...newRecord };
  }

  async completeMaintenance(id: string): Promise<MaintenanceRecord> {
    await delay(10);
    
    const record = this.maintenanceRecords.find(m => m.id === id);
    if (!record) {
      throw new Error('Enregistrement de maintenance non trouvé');
    }

    record.status = 'completed';
    record.completedDate = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    // Update vehicle status
    const vehicle = this.vehicles.find(v => v.id === record.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
      vehicle.lastMaintenanceDate = record.completedDate;
    }

    // Update stats
    mockDashboardStats.maintenanceAlerts = Math.max(0, mockDashboardStats.maintenanceAlerts - 1);

    this.emit('maintenance_update', record);
    this.emit('stats_update', mockDashboardStats);

    return { ...record };
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    await delay(10);
    return this.notifications.filter(n => n.userId === userId);
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    await delay(10);
    
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) {
      throw new Error('Notification non trouvée');
    }
    
    notification.isRead = true;
    return { ...notification };
  }

  async createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...data,
      id: `n${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    this.emit('notification', newNotification);
    
    return { ...newNotification };
  }

  // Real-time simulation
  simulateRealTimeUpdates() {
    // Simulate random updates every 30 seconds
    setInterval(() => {
      const random = Math.random();
      
      if (random < 0.3) {
        // Simulate mission progress update
        const activeMissions = this.missions.filter(m => m.status === 'in_progress');
        if (activeMissions.length > 0) {
          const mission = activeMissions[Math.floor(Math.random() * activeMissions.length)];
          this.emit('mission_progress', {
            missionId: mission.id,
            progress: Math.floor(Math.random() * 100),
          });
        }
      } else if (random < 0.5) {
        // Simulate vehicle location update
        const activeVehicles = this.vehicles.filter(v => v.status === 'on_mission');
        if (activeVehicles.length > 0) {
          const vehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
          this.emit('vehicle_location', {
            vehicleId: vehicle.id,
            location: {
              lat: 13.5116 + (Math.random() - 0.5) * 0.1,
              lng: 2.1254 + (Math.random() - 0.5) * 0.1,
            },
          });
        }
      }
    }, 30000);
  }
}

export const dataService = new DataService();
