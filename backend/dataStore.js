const PASSWORDS = {
  'manager@fleetnexus.ng': 'manager123',
  'driver1@fleetnexus.ng': 'driver123',
  'driver2@fleetnexus.ng': 'driver123',
  'driver3@fleetnexus.ng': 'driver123',
  'driver4@fleetnexus.ng': 'driver123',
};

const users = [
  {
    id: '1',
    email: 'manager@fleetnexus.ng',
    firstName: 'Abdou',
    lastName: 'Issoufou',
    role: 'manager',
    phone: '+227 90 12 34 56',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    email: 'driver1@fleetnexus.ng',
    firstName: 'Mahamadou',
    lastName: 'Ibrahim',
    role: 'driver',
    phone: '+227 92 34 56 78',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    email: 'driver2@fleetnexus.ng',
    firstName: 'Aicha',
    lastName: 'Moussa',
    role: 'driver',
    phone: '+227 93 45 67 89',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    email: 'driver3@fleetnexus.ng',
    firstName: 'Ousmane',
    lastName: 'Dan Mallam',
    role: 'driver',
    phone: '+227 91 23 45 67',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    email: 'driver4@fleetnexus.ng',
    firstName: 'Fatima',
    lastName: 'Zakari',
    role: 'driver',
    phone: '+227 94 56 78 90',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const vehicles = [
  {
    id: 'v1',
    plateNumber: 'V-201',
    model: 'Land Cruiser',
    brand: 'Toyota',
    year: 2022,
    type: 'suv',
    status: 'available',
    fuelType: 'diesel',
    mileage: 45230,
    consumptionTheoretical: 9.5,
    fuelCapacity: 80,
    kmAtLastService: 36000,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-11-15T00:00:00.000Z',
    nextMaintenanceDate: '2025-02-15T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'v2',
    plateNumber: 'V-204',
    model: 'Sprinter',
    brand: 'Mercedes',
    year: 2023,
    type: 'van',
    status: 'on_mission',
    fuelType: 'diesel',
    currentDriverId: 'd2',
    mileage: 28900,
    consumptionTheoretical: 12.3,
    fuelCapacity: 90,
    kmAtLastService: 25000,
    image: 'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-10-20T00:00:00.000Z',
    nextMaintenanceDate: '2025-01-20T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'v3',
    plateNumber: 'V-207',
    model: 'Ranger',
    brand: 'Ford',
    year: 2021,
    type: 'pickup',
    status: 'maintenance',
    fuelType: 'diesel',
    mileage: 67890,
    consumptionTheoretical: 10.8,
    fuelCapacity: 76,
    kmAtLastService: 62000,
    image: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-12-01T00:00:00.000Z',
    nextMaintenanceDate: '2025-03-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'v4',
    plateNumber: 'V-212',
    model: 'N-Series',
    brand: 'Isuzu',
    year: 2020,
    type: 'truck',
    status: 'available',
    fuelType: 'diesel',
    mileage: 89200,
    consumptionTheoretical: 25,
    fuelCapacity: 220,
    kmAtLastService: 86000,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-09-10T00:00:00.000Z',
    nextMaintenanceDate: '2024-12-10T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'v5',
    plateNumber: 'V-215',
    model: 'Hilux',
    brand: 'Toyota',
    year: 2023,
    type: 'pickup',
    status: 'on_mission',
    fuelType: 'diesel',
    currentDriverId: 'd1',
    mileage: 15600,
    consumptionTheoretical: 8.4,
    fuelCapacity: 70,
    kmAtLastService: 15000,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-11-01T00:00:00.000Z',
    nextMaintenanceDate: '2025-02-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'v6',
    plateNumber: 'V-218',
    model: 'Corolla',
    brand: 'Toyota',
    year: 2022,
    type: 'sedan',
    status: 'available',
    fuelType: 'gasoline',
    mileage: 32100,
    consumptionTheoretical: 6.9,
    fuelCapacity: 50,
    kmAtLastService: 30000,
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?w=400&h=300&fit=crop',
    lastMaintenanceDate: '2024-10-15T00:00:00.000Z',
    nextMaintenanceDate: '2025-01-15T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const drivers = [
  {
    id: 'd1',
    userId: '2',
    licenseNumber: 'NE-123456',
    licenseExpiry: '2026-06-15T00:00:00.000Z',
    status: 'on_mission',
    rating: 4.8,
    totalMissions: 156,
    currentVehicleId: 'v5',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'd2',
    userId: '3',
    licenseNumber: 'NE-234567',
    licenseExpiry: '2027-03-20T00:00:00.000Z',
    status: 'on_mission',
    rating: 4.9,
    totalMissions: 203,
    currentVehicleId: 'v2',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'd3',
    userId: '4',
    licenseNumber: 'NE-345678',
    licenseExpiry: '2025-12-10T00:00:00.000Z',
    status: 'off',
    rating: 4.6,
    totalMissions: 89,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'd4',
    userId: '5',
    licenseNumber: 'NE-456789',
    licenseExpiry: '2026-09-05T00:00:00.000Z',
    status: 'active',
    rating: 4.7,
    totalMissions: 124,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const missions = [
  {
    id: 'm1',
    driverId: 'd1',
    vehicleId: 'v5',
    destination: 'Dosso',
    purpose: 'Livraison marchandises',
    startTime: '2025-01-15T08:00:00.000Z',
    status: 'in_progress',
    startLocation: 'Niamey',
    distance: 140,
    createdAt: '2025-01-15T08:00:00.000Z',
    updatedAt: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'm2',
    driverId: 'd2',
    vehicleId: 'v2',
    destination: 'Zinder',
    purpose: 'Transport personnel',
    startTime: '2025-01-15T07:30:00.000Z',
    status: 'in_progress',
    startLocation: 'Maradi',
    distance: 230,
    createdAt: '2025-01-15T07:30:00.000Z',
    updatedAt: '2025-01-15T07:30:00.000Z',
  },
  {
    id: 'm3',
    driverId: 'd3',
    vehicleId: 'v1',
    destination: 'Tillaberi',
    purpose: 'Inspection site',
    startTime: '2025-01-14T09:00:00.000Z',
    endTime: '2025-01-14T16:30:00.000Z',
    status: 'completed',
    startLocation: 'Niamey',
    endLocation: 'Tillaberi',
    distance: 120,
    fuelConsumed: 18,
    createdAt: '2025-01-14T09:00:00.000Z',
    updatedAt: '2025-01-14T16:30:00.000Z',
  },
  {
    id: 'm4',
    driverId: 'd4',
    vehicleId: 'v6',
    destination: 'Maradi',
    purpose: 'Reunion partenaires',
    startTime: '2025-01-16T10:00:00.000Z',
    status: 'pending',
    startLocation: 'Niamey',
    createdAt: '2025-01-15T14:00:00.000Z',
    updatedAt: '2025-01-15T14:00:00.000Z',
  },
  {
    id: 'm5',
    driverId: 'd1',
    vehicleId: 'v4',
    destination: 'Zinder',
    purpose: 'Transport marchandises',
    startTime: '2025-01-13T06:00:00.000Z',
    endTime: '2025-01-13T18:00:00.000Z',
    status: 'completed',
    startLocation: 'Niamey',
    endLocation: 'Zinder',
    distance: 900,
    fuelConsumed: 120,
    createdAt: '2025-01-13T06:00:00.000Z',
    updatedAt: '2025-01-13T18:00:00.000Z',
  },
];

const fuelRecords = [
  {
    id: 'f1',
    vehicleId: 'v1',
    driverId: 'd3',
    date: '2025-01-14T16:45:00.000Z',
    quantity: 45,
    pricePerLiter: 650,
    totalCost: 29250,
    mileage: 45230,
    station: 'Total Niamey',
    createdAt: '2025-01-14T16:45:00.000Z',
  },
  {
    id: 'f2',
    vehicleId: 'v2',
    driverId: 'd2',
    date: '2025-01-15T07:00:00.000Z',
    quantity: 60,
    pricePerLiter: 650,
    totalCost: 39000,
    mileage: 28900,
    station: 'Shell Maradi',
    createdAt: '2025-01-15T07:00:00.000Z',
  },
  {
    id: 'f3',
    vehicleId: 'v5',
    driverId: 'd1',
    date: '2025-01-15T07:30:00.000Z',
    quantity: 40,
    pricePerLiter: 650,
    totalCost: 26000,
    mileage: 15600,
    station: 'Total Niamey',
    createdAt: '2025-01-15T07:30:00.000Z',
  },
];

const notifications = [
  {
    id: 'n4',
    userId: '2',
    title: 'Nouvelle Mission Assignee',
    message: 'Une mission vers Dosso vous a ete assignee',
    type: 'info',
    isRead: false,
    link: '/missions',
    createdAt: '2025-01-15T07:00:00.000Z',
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix) {
  return `${prefix}${Date.now()}`;
}

function sanitizeUser(user) {
  return clone(user);
}

function getUserById(userId) {
  return users.find((user) => user.id === userId);
}

function getDriverById(driverId) {
  return drivers.find((driver) => driver.id === driverId);
}

function getDriverByUserId(userId) {
  return drivers.find((driver) => driver.userId === userId);
}

function getVehicleById(vehicleId) {
  return vehicles.find((vehicle) => vehicle.id === vehicleId);
}

function hydrateVehicle(vehicle) {
  if (!vehicle) return null;
  const currentDriver = vehicle.currentDriverId ? hydrateDriver(getDriverById(vehicle.currentDriverId)) : null;
  return {
    ...clone(vehicle),
    currentDriver: currentDriver || undefined,
  };
}

function hydrateDriver(driver) {
  if (!driver) return null;
  const user = getUserById(driver.userId);
  const currentVehicle = driver.currentVehicleId ? hydrateVehicleShallow(getVehicleById(driver.currentVehicleId)) : null;
  return {
    ...clone(driver),
    user: user ? sanitizeUser(user) : null,
    currentVehicle: currentVehicle || undefined,
  };
}

function hydrateVehicleShallow(vehicle) {
  if (!vehicle) return null;
  return clone(vehicle);
}

function hydrateMission(mission) {
  if (!mission) return null;
  const driver = hydrateDriver(getDriverById(mission.driverId));
  const vehicle = hydrateVehicleShallow(getVehicleById(mission.vehicleId));
  return {
    ...clone(mission),
    driver,
    vehicle,
  };
}

function hydrateFuelRecord(record) {
  if (!record) return null;
  return {
    ...clone(record),
    driver: hydrateDriver(getDriverById(record.driverId)),
    vehicle: hydrateVehicleShallow(getVehicleById(record.vehicleId)),
  };
}

function getDriverForUser(userId) {
  const driver = getDriverByUserId(userId);
  if (!driver) {
    throw new Error('Chauffeur introuvable pour cet utilisateur.');
  }
  return driver;
}

function getDriverMissions(userId) {
  const driver = getDriverForUser(userId);
  return missions
    .filter((mission) => mission.driverId === driver.id)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .map(hydrateMission);
}

function getActiveMissionForUser(userId) {
  return getDriverMissions(userId).find((mission) => mission.status === 'in_progress') || null;
}

function authenticateDriver(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user || PASSWORDS[normalizedEmail] !== password || user.role !== 'driver') {
    return null;
  }

  return {
    token: `driver-token-${user.id}`,
    user: sanitizeUser(user),
    driver: hydrateDriver(getDriverByUserId(user.id)),
  };
}

function getDriverProfile(userId) {
  const driver = getDriverForUser(userId);
  return hydrateDriver(driver);
}

function getAssignedVehicle(userId) {
  const driver = getDriverForUser(userId);
  const vehicleId = driver.currentVehicleId || getActiveMissionForUser(userId)?.vehicleId;
  return vehicleId ? hydrateVehicle(getVehicleById(vehicleId)) : null;
}

function createMissionForUser(userId, payload) {
  const driver = getDriverForUser(userId);
  const activeMission = getActiveMissionForUser(userId);

  if (activeMission) {
    throw new Error('Une mission est deja en cours pour ce chauffeur.');
  }

  if (!driver.currentVehicleId) {
    throw new Error('Aucun vehicule assigne a ce chauffeur.');
  }

  const vehicle = getVehicleById(driver.currentVehicleId);
  if (!vehicle) {
    throw new Error('Vehicule introuvable.');
  }

  const mission = {
    id: randomId('m'),
    driverId: driver.id,
    vehicleId: vehicle.id,
    destination: String(payload.destination || '').trim(),
    purpose: String(payload.purpose || '').trim(),
    startTime: payload.startTime || nowIso(),
    status: 'in_progress',
    startLocation: String(payload.startLocation || 'Niamey').trim(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (!mission.destination || !mission.purpose) {
    throw new Error('La destination et l objectif sont obligatoires.');
  }

  missions.unshift(mission);
  driver.status = 'on_mission';
  driver.updatedAt = nowIso();
  vehicle.status = 'on_mission';
  vehicle.currentDriverId = driver.id;
  vehicle.updatedAt = nowIso();

  notifications.unshift({
    id: randomId('n'),
    userId,
    title: 'Mission demarree',
    message: `Mission vers ${mission.destination} en cours`,
    type: 'success',
    isRead: false,
    link: '/missions',
    createdAt: nowIso(),
  });

  return hydrateMission(mission);
}

function completeMissionForUser(userId, missionId, payload = {}) {
  const driver = getDriverForUser(userId);
  const mission = missions.find((entry) => entry.id === missionId && entry.driverId === driver.id);

  if (!mission) {
    throw new Error('Mission introuvable.');
  }

  if (mission.status !== 'in_progress') {
    throw new Error('Cette mission ne peut plus etre terminee.');
  }

  mission.status = 'completed';
  mission.endTime = nowIso();
  mission.endLocation = mission.destination;
  mission.distance = Number.isFinite(payload.distance) ? Number(payload.distance) : mission.distance;
  mission.fuelConsumed = Number.isFinite(payload.fuelConsumed) ? Number(payload.fuelConsumed) : mission.fuelConsumed;
  mission.notes = payload.notes ? String(payload.notes) : mission.notes;
  mission.updatedAt = nowIso();

  driver.status = 'active';
  driver.totalMissions += 1;
  driver.currentVehicleId = undefined;
  driver.updatedAt = nowIso();

  const vehicle = getVehicleById(mission.vehicleId);
  if (vehicle) {
    vehicle.status = 'available';
    vehicle.currentDriverId = undefined;
    if (Number.isFinite(payload.distance)) {
      vehicle.mileage += Number(payload.distance);
    }
    vehicle.updatedAt = nowIso();
  }

  notifications.unshift({
    id: randomId('n'),
    userId,
    title: 'Mission terminee',
    message: `Mission vers ${mission.destination} terminee avec succes`,
    type: 'success',
    isRead: false,
    link: '/missions',
    createdAt: nowIso(),
  });

  return hydrateMission(mission);
}

function createFuelRecordForUser(userId, payload) {
  const driver = getDriverForUser(userId);
  const vehicleId = payload.vehicleId || driver.currentVehicleId;
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    throw new Error('Vehicule introuvable pour cet enregistrement carburant.');
  }

  const quantity = Number(payload.quantity);
  const pricePerLiter = Number(payload.pricePerLiter);
  const mileage = Number(payload.mileage);

  if (!Number.isFinite(quantity) || !Number.isFinite(pricePerLiter) || !Number.isFinite(mileage)) {
    throw new Error('Les champs quantity, pricePerLiter et mileage sont obligatoires.');
  }

  const record = {
    id: randomId('f'),
    vehicleId: vehicle.id,
    driverId: driver.id,
    date: nowIso(),
    quantity,
    pricePerLiter,
    totalCost: quantity * pricePerLiter,
    mileage,
    station: payload.station ? String(payload.station) : undefined,
    notes: payload.notes ? String(payload.notes) : undefined,
    createdAt: nowIso(),
  };

  fuelRecords.unshift(record);
  vehicle.mileage = Math.max(vehicle.mileage, mileage);
  vehicle.updatedAt = nowIso();

  return hydrateFuelRecord(record);
}

function getFuelRecordsForUser(userId) {
  const driver = getDriverForUser(userId);
  return fuelRecords
    .filter((record) => record.driverId === driver.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(hydrateFuelRecord);
}

function getNotificationsForUser(userId) {
  return notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(clone);
}

function getActiveMissions() {
  return missions.filter((mission) => mission.status === 'in_progress').map(hydrateMission);
}

export function createDataStore() {
  return {
    authenticateDriver,
    getDriverProfile,
    getAssignedVehicle,
    getDriverMissions,
    getActiveMissionForUser,
    createMissionForUser,
    completeMissionForUser,
    createFuelRecordForUser,
    getFuelRecordsForUser,
    getNotificationsForUser,
    getActiveMissions,
  };
}
