// Firebase Firestore Real-time Database Store
// Replaces the in-memory dataStore.js with persistent Firestore storage

import admin from 'firebase-admin';

const db = admin.firestore();

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  MISSIONS: 'missions',
  FUEL_RECORDS: 'fuelRecords',
  NOTIFICATIONS: 'notifications',
  DRIVER_POSITIONS: 'driverPositions',
};

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix) {
  return `${prefix}${Date.now()}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeUser(user) {
  const sanitized = clone(user);
  // Remove sensitive fields if needed
  return sanitized;
}

// ==================== USER OPERATIONS ====================

async function getUserById(userId) {
  try {
    const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function getUserByEmail(email) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();
    return snapshot.empty ? null : snapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

// ==================== DRIVER OPERATIONS ====================

async function getDriverById(driverId) {
  try {
    const doc = await db.collection(COLLECTIONS.DRIVERS).doc(driverId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error fetching driver:', error);
    return null;
  }
}

async function getDriverByUserId(userId) {
  try {
    const snapshot = await db.collection(COLLECTIONS.DRIVERS)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching driver by userId:', error);
    return null;
  }
}

async function hydrateDriver(driver) {
  if (!driver) return null;
  
  const [user, currentVehicle] = await Promise.all([
    driver.userId ? getUserById(driver.userId) : Promise.resolve(null),
    driver.currentVehicleId ? getVehicleById(driver.currentVehicleId) : Promise.resolve(null),
  ]);

  return {
    ...clone(driver),
    user: user ? sanitizeUser(user) : null,
    currentVehicle: currentVehicle || undefined,
  };
}

async function getDriverForUser(userId) {
  const driver = await getDriverByUserId(userId);
  if (!driver) {
    throw new Error('Chauffeur introuvable pour cet utilisateur.');
  }
  return driver;
}

async function getDriverProfile(userId) {
  const driver = await getDriverForUser(userId);
  return hydrateDriver(driver);
}

// ==================== VEHICLE OPERATIONS ====================

async function getVehicleById(vehicleId) {
  try {
    const doc = await db.collection(COLLECTIONS.VEHICLES).doc(vehicleId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }
}

async function hydrateVehicle(vehicle) {
  if (!vehicle) return null;

  let currentDriver = null;
  if (vehicle.currentDriverId) {
    currentDriver = await getDriverById(vehicle.currentDriverId);
    if (currentDriver) {
      currentDriver = await hydrateDriver(currentDriver);
    }
  }

  return {
    ...clone(vehicle),
    currentDriver: currentDriver || undefined,
  };
}

async function getAssignedVehicle(userId) {
  const driver = await getDriverForUser(userId);
  const vehicleId = driver.currentVehicleId || 
    (await getActiveMissionForUser(userId))?.vehicleId;
  
  return vehicleId ? hydrateVehicle(await getVehicleById(vehicleId)) : null;
}

// ==================== MISSION OPERATIONS ====================

async function getMissionById(missionId) {
  try {
    const doc = await db.collection(COLLECTIONS.MISSIONS).doc(missionId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error fetching mission:', error);
    return null;
  }
}

async function hydrateMission(mission) {
  if (!mission) return null;

  const [driver, vehicle] = await Promise.all([
    mission.driverId ? getDriverById(mission.driverId) : Promise.resolve(null),
    mission.vehicleId ? getVehicleById(mission.vehicleId) : Promise.resolve(null),
  ]);

  return {
    ...clone(mission),
    driver: driver ? await hydrateDriver(driver) : null,
    vehicle: vehicle || undefined,
  };
}

async function getDriverMissions(userId) {
  const driver = await getDriverForUser(userId);
  
  try {
    const snapshot = await db.collection(COLLECTIONS.MISSIONS)
      .where('driverId', '==', driver.id)
      .orderBy('startTime', 'desc')
      .get();

    const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return Promise.all(missions.map(mission => hydrateMission(mission)));
  } catch (error) {
    console.error('Error fetching driver missions:', error);
    return [];
  }
}

async function getActiveMissionForUser(userId) {
  const driver = await getDriverForUser(userId);

  try {
    const snapshot = await db.collection(COLLECTIONS.MISSIONS)
      .where('driverId', '==', driver.id)
      .where('status', '==', 'in_progress')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const mission = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    return hydrateMission(mission);
  } catch (error) {
    console.error('Error fetching active mission:', error);
    return null;
  }
}

async function createMissionForUser(userId, payload) {
  const driver = await getDriverForUser(userId);
  
  // Check for active mission
  const activeMission = await getActiveMissionForUser(userId);
  if (activeMission) {
    throw new Error('Une mission est déjà en cours pour ce chauffeur.');
  }

  if (!driver.currentVehicleId) {
    throw new Error('Aucun véhicule assigné à ce chauffeur.');
  }

  const vehicle = await getVehicleById(driver.currentVehicleId);
  if (!vehicle) {
    throw new Error('Véhicule introuvable.');
  }

  const mission = {
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
    throw new Error('La destination et l\'objectif sont obligatoires.');
  }

  try {
    // Add mission to Firestore
    const missionRef = await db.collection(COLLECTIONS.MISSIONS).add(mission);
    
    // Update driver status
    await db.collection(COLLECTIONS.DRIVERS).doc(driver.id).update({
      status: 'on_mission',
      updatedAt: nowIso(),
    });

    // Update vehicle status
    await db.collection(COLLECTIONS.VEHICLES).doc(vehicle.id).update({
      status: 'on_mission',
      currentDriverId: driver.id,
      updatedAt: nowIso(),
    });

    // Create notification
    await db.collection(COLLECTIONS.NOTIFICATIONS).add({
      userId: driver.userId,
      title: 'Mission démarrée',
      message: `Mission vers ${mission.destination} en cours`,
      type: 'success',
      isRead: false,
      link: '/missions',
      createdAt: nowIso(),
    });

    // Fetch and hydrate the created mission
    const createdMission = { id: missionRef.id, ...mission };
    return hydrateMission(createdMission);
  } catch (error) {
    console.error('Error creating mission:', error);
    throw error;
  }
}

async function completeMissionForUser(userId, missionId, payload = {}) {
  const driver = await getDriverForUser(userId);

  try {
    const mission = await getMissionById(missionId);
    if (!mission || mission.driverId !== driver.id) {
      throw new Error('Mission introuvable.');
    }

    if (mission.status !== 'in_progress') {
      throw new Error('Cette mission ne peut plus être terminée.');
    }

    const updates = {
      status: 'completed',
      endTime: nowIso(),
      endLocation: mission.destination,
      distance: Number.isFinite(payload.distance) ? Number(payload.distance) : mission.distance,
      fuelConsumed: Number.isFinite(payload.fuelConsumed) ? Number(payload.fuelConsumed) : mission.fuelConsumed,
      notes: payload.notes ? String(payload.notes) : mission.notes,
      updatedAt: nowIso(),
    };

    // Update mission
    await db.collection(COLLECTIONS.MISSIONS).doc(missionId).update(updates);

    // Update driver
    await db.collection(COLLECTIONS.DRIVERS).doc(driver.id).update({
      status: 'active',
      totalMissions: (driver.totalMissions || 0) + 1,
      currentVehicleId: admin.firestore.FieldValue.delete(),
      updatedAt: nowIso(),
    });

    // Update vehicle
    const vehicle = await getVehicleById(mission.vehicleId);
    if (vehicle) {
      const mileageUpdate = Number.isFinite(payload.distance) ? vehicle.mileage + Number(payload.distance) : vehicle.mileage;
      await db.collection(COLLECTIONS.VEHICLES).doc(vehicle.id).update({
        status: 'available',
        currentDriverId: admin.firestore.FieldValue.delete(),
        mileage: mileageUpdate,
        updatedAt: nowIso(),
      });
    }

    // Create notification
    await db.collection(COLLECTIONS.NOTIFICATIONS).add({
      userId: driver.userId,
      title: 'Mission terminée',
      message: `Mission vers ${mission.destination} terminée avec succès`,
      type: 'success',
      isRead: false,
      link: '/missions',
      createdAt: nowIso(),
    });

    return hydrateMission({ ...mission, ...updates });
  } catch (error) {
    console.error('Error completing mission:', error);
    throw error;
  }
}

async function getActiveMissions() {
  try {
    const snapshot = await db.collection(COLLECTIONS.MISSIONS)
      .where('status', '==', 'in_progress')
      .get();

    const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return Promise.all(missions.map(mission => hydrateMission(mission)));
  } catch (error) {
    console.error('Error fetching active missions:', error);
    return [];
  }
}

// ==================== FUEL OPERATIONS ====================

async function getFuelRecordById(recordId) {
  try {
    const doc = await db.collection(COLLECTIONS.FUEL_RECORDS).doc(recordId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error fetching fuel record:', error);
    return null;
  }
}

async function hydrateFuelRecord(record) {
  if (!record) return null;

  const [driver, vehicle] = await Promise.all([
    record.driverId ? getDriverById(record.driverId) : Promise.resolve(null),
    record.vehicleId ? getVehicleById(record.vehicleId) : Promise.resolve(null),
  ]);

  return {
    ...clone(record),
    driver: driver ? await hydrateDriver(driver) : null,
    vehicle: vehicle || undefined,
  };
}

async function createFuelRecordForUser(userId, payload) {
  const driver = await getDriverForUser(userId);
  const vehicleId = payload.vehicleId || driver.currentVehicleId;
  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    throw new Error('Véhicule introuvable pour cet enregistrement carburant.');
  }

  const quantity = Number(payload.quantity);
  const pricePerLiter = Number(payload.pricePerLiter);
  const mileage = Number(payload.mileage);

  if (!Number.isFinite(quantity) || !Number.isFinite(pricePerLiter) || !Number.isFinite(mileage)) {
    throw new Error('Les champs quantity, pricePerLiter et mileage sont obligatoires.');
  }

  const record = {
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

  try {
    // Add record
    const recordRef = await db.collection(COLLECTIONS.FUEL_RECORDS).add(record);

    // Update vehicle mileage
    await db.collection(COLLECTIONS.VEHICLES).doc(vehicle.id).update({
      mileage: Math.max(vehicle.mileage || 0, mileage),
      updatedAt: nowIso(),
    });

    return hydrateFuelRecord({ id: recordRef.id, ...record });
  } catch (error) {
    console.error('Error creating fuel record:', error);
    throw error;
  }
}

async function getFuelRecordsForUser(userId) {
  const driver = await getDriverForUser(userId);

  try {
    const snapshot = await db.collection(COLLECTIONS.FUEL_RECORDS)
      .where('driverId', '==', driver.id)
      .orderBy('date', 'desc')
      .get();

    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return Promise.all(records.map(record => hydrateFuelRecord(record)));
  } catch (error) {
    console.error('Error fetching fuel records:', error);
    return [];
  }
}

// ==================== NOTIFICATION OPERATIONS ====================

async function getNotificationsForUser(userId) {
  try {
    const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// ==================== DRIVER POSITION TRACKING ====================

async function updateDriverPosition(driverId, position) {
  try {
    await db.collection(COLLECTIONS.DRIVER_POSITIONS).doc(driverId).set({
      ...position,
      updatedAt: nowIso(),
    });
  } catch (error) {
    console.error('Error updating driver position:', error);
  }
}

async function getDriverPosition(driverId) {
  try {
    const doc = await db.collection(COLLECTIONS.DRIVER_POSITIONS).doc(driverId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching driver position:', error);
    return null;
  }
}

async function getActiveDriverPositions() {
  try {
    const snapshot = await db.collection(COLLECTIONS.DRIVER_POSITIONS).get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching active driver positions:', error);
    return [];
  }
}

// ==================== AUTHENTICATION ====================

async function authenticateDriver(email, password) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    if (!user || user.role !== 'driver') {
      return null;
    }

    // TODO: In production, use proper password hashing (bcrypt)
    // For now, we'll check against a password field in Firestore
    if (user.password !== password) {
      return null;
    }

    const driver = await getDriverByUserId(user.id);
    
    return {
      token: `driver-token-${user.id}`,
      user: sanitizeUser(user),
      driver: driver ? await hydrateDriver(driver) : null,
    };
  } catch (error) {
    console.error('Error authenticating driver:', error);
    return null;
  }
}

// ==================== INITIALIZATION ====================

async function initializeFirestore() {
  try {
    console.log('🔥 Initializing Firestore database...');
    
    // Check if data exists
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).limit(1).get();
    
    if (!usersSnapshot.empty) {
      console.log('✅ Firestore already initialized with data.');
      return;
    }

    console.log('📝 Creating initial data...');

    // Create users
    const usersData = [
      {
        id: '1',
        email: 'manager@fleetnexus.ng',
        password: 'manager123',
        firstName: 'Abdou',
        lastName: 'Issoufou',
        role: 'manager',
        phone: '+227 90 12 34 56',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: '2',
        email: 'driver1@fleetnexus.ng',
        password: 'driver123',
        firstName: 'Mahamadou',
        lastName: 'Ibrahim',
        role: 'driver',
        phone: '+227 92 34 56 78',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: '3',
        email: 'driver2@fleetnexus.ng',
        password: 'driver123',
        firstName: 'Aicha',
        lastName: 'Moussa',
        role: 'driver',
        phone: '+227 93 45 67 89',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: '4',
        email: 'driver3@fleetnexus.ng',
        password: 'driver123',
        firstName: 'Ousmane',
        lastName: 'Dan Mallam',
        role: 'driver',
        phone: '+227 91 23 45 67',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: '5',
        email: 'driver4@fleetnexus.ng',
        password: 'driver123',
        firstName: 'Fatima',
        lastName: 'Zakari',
        role: 'driver',
        phone: '+227 94 56 78 90',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];

    for (const userData of usersData) {
      await db.collection(COLLECTIONS.USERS).doc(userData.id).set(userData);
    }

    // Create vehicles
    const vehiclesData = [
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
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
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];

    for (let i = 0; i < vehiclesData.length; i++) {
      await db.collection(COLLECTIONS.VEHICLES).doc(`v${i + 1}`).set(vehiclesData[i]);
    }

    // Create drivers
    const driversData = [
      {
        userId: '2',
        licenseNumber: 'NE-123456',
        licenseExpiry: '2026-06-15T00:00:00.000Z',
        status: 'on_mission',
        rating: 4.8,
        totalMissions: 156,
        currentVehicleId: 'v5',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        userId: '3',
        licenseNumber: 'NE-234567',
        licenseExpiry: '2027-03-20T00:00:00.000Z',
        status: 'on_mission',
        rating: 4.9,
        totalMissions: 203,
        currentVehicleId: 'v2',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        userId: '4',
        licenseNumber: 'NE-345678',
        licenseExpiry: '2025-12-10T00:00:00.000Z',
        status: 'off',
        rating: 4.6,
        totalMissions: 89,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        userId: '5',
        licenseNumber: 'NE-456789',
        licenseExpiry: '2026-09-05T00:00:00.000Z',
        status: 'active',
        rating: 4.7,
        totalMissions: 124,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];

    for (let i = 0; i < driversData.length; i++) {
      await db.collection(COLLECTIONS.DRIVERS).doc(`d${i + 1}`).set(driversData[i]);
    }

    // Create missions
    const missionsData = [
      {
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

    for (let i = 0; i < missionsData.length; i++) {
      await db.collection(COLLECTIONS.MISSIONS).doc(`m${i + 1}`).set(missionsData[i]);
    }

    // Create fuel records
    const fuelRecordsData = [
      {
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

    for (let i = 0; i < fuelRecordsData.length; i++) {
      await db.collection(COLLECTIONS.FUEL_RECORDS).doc(`f${i + 1}`).set(fuelRecordsData[i]);
    }

    console.log('✅ Firestore initialized successfully with seed data!');
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
  }
}

// Export the store
export function createFirebaseStore() {
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
    updateDriverPosition,
    getDriverPosition,
    getActiveDriverPositions,
    initializeFirestore,
  };
}

export { COLLECTIONS };
