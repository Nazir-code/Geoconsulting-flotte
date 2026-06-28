import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GpsSimulatorService } from './simulator.js';
import firebaseAdmin from './firebaseAdmin.js';  // Initialize Firebase Admin
import { createFirebaseStore } from './firebaseStore.js';
import { MissionStatusController } from './controllers/missionStatusController.js';
import { RealtimeEventManager } from './services/realtimeEventManager.js';
import { sendMissionAssignedPush } from './services/missionNotificationService.js';

dotenv.config();

const app = express();
const store = createFirebaseStore();
const simulator = new GpsSimulatorService();
const missionStatusController = new MissionStatusController();

// Initialize Firestore on startup
(async () => {
  try {
    await store.initializeFirestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error.message);
  }
})();

function getAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
  }
  return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
}

const allowedOrigins = getAllowedOrigins();

app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  secure: process.env.NODE_ENV === 'production',
});

// Initialize RealtimeEventManager
const eventManager = new RealtimeEventManager(io);


async function syncSimulatorWithStore() {
  try {
    const activeMissions = await store.getActiveMissions();
    const activeVehicleIds = new Set(activeMissions.map((mission) => mission.vehicleId));

    Array.from(simulator.vehicles.keys()).forEach((vehicleId) => {
      if (!activeVehicleIds.has(vehicleId)) {
        simulator.unregisterVehicle(vehicleId);
      }
    });

    activeMissions.forEach((mission, index) => {
      simulator.registerVehicle(
        mission.vehicleId,
        mission.id,
        mission.startLocation || 'Niamey',
        mission.destination,
        15 + (index * 20),
      );
    });

    console.log(`✅ Simulator synced: ${activeMissions.length} active missions`);
  } catch (error) {
    console.error('❌ Error syncing simulator:', error);
  }
}

// Initial sync and start simulator
(async () => {
  await syncSimulatorWithStore();
  simulator.start();
  console.log('🚀 GPS Simulator started');
})();


function buildApiResponse(data, message) {
  return {
    success: true,
    data,
    message,
  };
}

function getUserIdFromAuthHeader(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !token.startsWith('driver-token-')) {
    return null;
  }

  return token.replace('driver-token-', '');
}

function requireDriverAuth(req, res, next) {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentification requise.',
    });
    return;
  }

  req.userId = userId;
  next();
}

function handleRouteError(res, error, statusCode = 400) {
  res.status(statusCode).json({
    success: false,
    error: error instanceof Error ? error.message : 'Une erreur est survenue.',
  });
}

app.get('/api/status', (req, res) => {
  res.json(buildApiResponse({
    status: 'ok',
    server: 'Node.js + Socket.IO + Driver API',
  }));
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const authResult = await store.authenticateDriver(email, password);

    if (!authResult) {
      res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect.',
      });
      return;
    }

    res.json(buildApiResponse(authResult, 'Connexion réussie.'));
  } catch (error) {
    handleRouteError(res, error, 401);
  }
});

app.get('/api/driver/me', requireDriverAuth, async (req, res) => {
  try {
    const profile = await store.getDriverProfile(req.userId);
    res.json(buildApiResponse(profile));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.get('/api/driver/me/vehicle', requireDriverAuth, async (req, res) => {
  try {
    const vehicle = await store.getAssignedVehicle(req.userId);
    res.json(buildApiResponse(vehicle));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.get('/api/driver/me/missions', requireDriverAuth, async (req, res) => {
  try {
    const missions = await store.getDriverMissions(req.userId);
    res.json(buildApiResponse(missions));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.get('/api/driver/me/missions/active', requireDriverAuth, async (req, res) => {
  try {
    const mission = await store.getActiveMissionForUser(req.userId);
    res.json(buildApiResponse(mission));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.post('/api/driver/me/missions', requireDriverAuth, async (req, res) => {
  try {
    const mission = await store.createMissionForUser(req.userId, req.body || {});
    await syncSimulatorWithStore();
    
    // Emit mission update using RealtimeEventManager
    eventManager.emitMissionUpdate(mission);
    
    res.status(201).json(buildApiResponse(mission, 'Mission créée.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

// ✅ NEW ENDPOINT: Register Firebase UID with backend
// Called by mobile app after Firebase Auth login
app.post('/api/driver/me/register-firebase-uid', requireDriverAuth, async (req, res) => {
  try {
    const userId = req.userId; // From token 'driver-token-1'
    const { firebaseUid } = req.body || {};

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        error: 'firebaseUid est requis dans le body',
      });
    }

    console.log(`\n🔐 [FIREBASE_SYNC] Enregistrement Firebase UID`);
    console.log(`   ├─ Backend userId: ${userId}`);
    console.log(`   ├─ Firebase UID reçu: ${firebaseUid.substring(0, 25)}...`);

    // Get the driver by userId
    const driver = await store.getDriverForUser(userId);
    if (!driver) {
      console.log(`   ❌ Driver non trouvé pour userId: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Driver non trouvé',
      });
    }

    console.log(`   ├─ Driver ID (Firestore doc ID): ${driver.id}`);
    console.log(`   ├─ Driver Name: ${driver.name || 'N/A'}`);

    // Update the driver document with the Firebase UID
    const db = firebaseAdmin.firestore();
    await db.collection('drivers').doc(driver.id).update({
      firebaseUid: firebaseUid,
      updatedAt: new Date().toISOString(),
    });

    console.log(`   └─ ✅ Firebase UID enregistré avec succès!\n`);

    res.status(200).json({
      success: true,
      data: {
        driverId: driver.id,
        firebaseUid: firebaseUid,
        message: 'Firebase UID enregistré avec succès',
      },
      message: 'Synchronisation Firebase UID réussie',
    });

  } catch (error) {
    console.error('❌ [FIREBASE_SYNC] Erreur:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/driver/me/missions/:missionId/complete', requireDriverAuth, async (req, res) => {
  try {
    // Enhanced validation for mission completion parameters
    const { distance, fuelConsumed, notes } = req.body || {};
    
    // Validate distance parameter if provided
    if (distance !== undefined && distance !== null) {
      if (!Number.isFinite(Number(distance)) || Number(distance) < 0) {
        return handleRouteError(res, new Error('La distance doit être un nombre positif.'), 400);
      }
    }
    
    // Validate fuel consumed parameter if provided
    if (fuelConsumed !== undefined && fuelConsumed !== null) {
      if (!Number.isFinite(Number(fuelConsumed)) || Number(fuelConsumed) < 0) {
        return handleRouteError(res, new Error('La consommation de carburant doit être un nombre positif.'), 400);
      }
    }
    
    // Validate notes parameter if provided
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return handleRouteError(res, new Error('Les notes doivent être du texte.'), 400);
      }
      if (notes.length > 1000) {
        return handleRouteError(res, new Error('Les notes ne peuvent pas dépasser 1000 caractères.'), 400);
      }
    }
    
    // Enhanced payload with audit trail information
    const enhancedPayload = {
      distance: distance !== undefined ? Number(distance) : undefined,
      fuelConsumed: fuelConsumed !== undefined ? Number(fuelConsumed) : undefined,
      notes: notes ? String(notes).trim() : undefined,
      // Audit trail information
      completedBy: req.userId,
      completedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
    };
    
    // Use the enhanced mission status controller for better transaction support
    const mission = await missionStatusController.completeMission(req.userId, req.params.missionId, enhancedPayload);
    
    // Sync GPS simulator
    await syncSimulatorWithStore();
    
    // Emit enhanced real-time events with audit information using RealtimeEventManager
    eventManager.emitMissionUpdate({
      ...mission,
      previousStatus: 'in_progress',
      auditInfo: {
        action: 'complete',
        userAgent: enhancedPayload.userAgent,
        ipAddress: enhancedPayload.ipAddress,
        completedBy: req.userId,
        completedAt: enhancedPayload.completedAt
      }
    });
    
    // Emit driver status update event using RealtimeEventManager
    eventManager.emitDriverStatusUpdate(
      mission.driver.id,
      'active',
      'on_mission',
      mission.vehicle?.id
    );
    
    // Log successful completion for monitoring
    console.log(`✅ Mission ${req.params.missionId} completed by user ${req.userId}`, {
      distance: enhancedPayload.distance,
      fuelConsumed: enhancedPayload.fuelConsumed,
      hasNotes: !!enhancedPayload.notes,
      timestamp: enhancedPayload.completedAt
    });
    
    res.json(buildApiResponse(mission, 'Mission terminée avec succès.'));
  } catch (error) {
    // Enhanced error logging with context
    console.error(`❌ Error completing mission ${req.params.missionId} for user ${req.userId}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    handleRouteError(res, error);
  }
});

// New mission status endpoints with transaction support
app.post('/api/driver/me/missions/:missionId/complete-v2', requireDriverAuth, async (req, res) => {
  try {
    const mission = await missionStatusController.completeMission(req.userId, req.params.missionId, req.body || {});
    await syncSimulatorWithStore();
    
    // Emit real-time events using RealtimeEventManager
    eventManager.emitMissionUpdate({
      ...mission,
      previousStatus: 'in_progress'
    });
    
    eventManager.emitDriverStatusUpdate(
      mission.driver.id,
      'active',
      'on_mission',
      mission.vehicle.id
    );
    
    res.json(buildApiResponse(mission, 'Mission terminée avec succès.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.post('/api/driver/me/missions/:missionId/cancel', requireDriverAuth, async (req, res) => {
  try {
    const mission = await missionStatusController.cancelMission(req.userId, req.params.missionId, req.body || {});
    await syncSimulatorWithStore();
    
    // Emit real-time events using RealtimeEventManager
    eventManager.emitMissionUpdate({
      ...mission,
      previousStatus: 'in_progress'
    });
    
    eventManager.emitDriverStatusUpdate(
      mission.driver.id,
      'active',
      'on_mission',
      mission.vehicle.id
    );
    
    res.json(buildApiResponse(mission, 'Mission annulée avec succès.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.get('/api/driver/me/missions/:missionId/status', requireDriverAuth, async (req, res) => {
  try {
    const mission = await missionStatusController.getMissionStatus(req.userId, req.params.missionId);
    res.json(buildApiResponse(mission));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.get('/api/driver/me/fuel-records', requireDriverAuth, async (req, res) => {
  try {
    const records = await store.getFuelRecordsForUser(req.userId);
    res.json(buildApiResponse(records));
  } catch (error) {
    handleRouteError(res, error, 404);
  }
});

app.post('/api/driver/me/fuel-records', requireDriverAuth, async (req, res) => {
  try {
    const record = await store.createFuelRecordForUser(req.userId, req.body || {});
    res.status(201).json(buildApiResponse(record, 'Plein enregistré.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.get('/api/driver/me/notifications', requireDriverAuth, async (req, res) => {
  try {
    const notifications = await store.getNotificationsForUser(req.userId);
    res.json(buildApiResponse(notifications));
  } catch (error) {
    handleRouteError(res, error);
  }
});

// Vérifie un Firebase ID token (managers/admins web). À la différence de
// requireDriverAuth (token maison "driver-token-*"), on valide ici un vrai
// ID token Firebase via l'Admin SDK.
async function requireFirebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentification requise.' });
    return;
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'ID token Firebase invalide.' });
  }
}

// Déclenche le push FCM "mission assignée". Appelé par le frontend web juste
// après l'écriture Firestore de la mission (création ou (ré)assignation).
// Remplace la Cloud Function notifyDriverOnMissionCreated sans exiger Blaze.
app.post('/api/notifications/mission-assigned', requireFirebaseAuth, async (req, res) => {
  try {
    const { missionId } = req.body || {};
    if (!missionId || typeof missionId !== 'string') {
      res.status(400).json({ success: false, error: 'missionId requis.' });
      return;
    }

    const db = firebaseAdmin.firestore();
    const missionDoc = await db.collection('missions').doc(missionId).get();
    if (!missionDoc.exists) {
      res.status(404).json({ success: false, error: 'Mission introuvable.' });
      return;
    }

    const result = await sendMissionAssignedPush(db, missionId, missionDoc.data());
    res.json(buildApiResponse(result, result.sent ? 'Notification envoyée.' : 'Notification non envoyée.'));
  } catch (error) {
    handleRouteError(res, error, 500);
  }
});

app.get('/api/gps/positions', (req, res) => {
  res.json(buildApiResponse(simulator.getCurrentPositions()));
});

app.get('/api/gps/vehicles/:vehicleId/trail', (req, res) => {
  res.json(buildApiResponse(simulator.getTrail(req.params.vehicleId)));
});

// Real-time event system monitoring endpoints
app.get('/api/realtime/stats', (req, res) => {
  try {
    const stats = eventManager.getClientStats();
    res.json(buildApiResponse(stats));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.get('/api/realtime/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = eventManager.getEventLogs(limit);
    res.json(buildApiResponse(logs));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.post('/api/realtime/logs/clear', (req, res) => {
  try {
    eventManager.clearEventLogs();
    res.json(buildApiResponse(null, 'Event logs cleared successfully.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle client registration for targeted events
  socket.on('register_client', (clientInfo) => {
    const { clientType, userId } = clientInfo || {};
    if (clientType && userId) {
      eventManager.registerClient(socket.id, clientType, userId);
      console.log(`✅ Client registered: ${clientType} user ${userId} (${socket.id})`);
      
      // Send current client stats to admin clients
      if (clientType === 'admin' || clientType === 'web') {
        socket.emit('client_stats', eventManager.getClientStats());
      }
    }
  });

  // Send initial GPS data
  socket.emit('gps_positions', simulator.getCurrentPositions());

  const positions = simulator.getCurrentPositions();
  const trails = {};
  positions.forEach((position) => {
    trails[position.vehicleId] = simulator.getTrail(position.vehicleId);
  });
  socket.emit('gps_trails', trails);

  // Subscribe to GPS updates
  const unsubscribe = simulator.subscribe((nextPositions) => {
    socket.emit('gps_positions', nextPositions);
    const nextTrails = {};
    nextPositions.forEach((position) => {
      nextTrails[position.vehicleId] = simulator.getTrail(position.vehicleId);
    });
    socket.emit('gps_trails', nextTrails);
  });

  // Handle simulator controls
  socket.on('toggle_pause', () => {
    const isPaused = simulator.togglePause();
    io.emit('simulator_paused_state', isPaused);
    
    // Log simulator state change
    eventManager.logEvent('simulator_state_change', {
      isPaused,
      triggeredBy: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('get_paused_state', () => {
    socket.emit('simulator_paused_state', simulator.paused);
  });

  // Handle event log requests (for debugging/monitoring)
  socket.on('get_event_logs', (limit = 50) => {
    const logs = eventManager.getEventLogs(limit);
    socket.emit('event_logs', logs);
  });

  // Handle client stats requests
  socket.on('get_client_stats', () => {
    const stats = eventManager.getClientStats();
    socket.emit('client_stats', stats);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Unregister client from event manager
    eventManager.unregisterClient(socket.id);
    
    // Unsubscribe from GPS updates
    unsubscribe();
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
