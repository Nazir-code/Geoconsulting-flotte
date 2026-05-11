import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GpsSimulatorService } from './simulator.js';
import './firebaseAdmin.js';  // Initialize Firebase Admin
import { createFirebaseStore } from './firebaseStore.js';

dotenv.config();

const app = express();
const store = createFirebaseStore();
const simulator = new GpsSimulatorService();

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
    io.emit('mission_update', mission);
    res.status(201).json(buildApiResponse(mission, 'Mission créée.'));
  } catch (error) {
    handleRouteError(res, error);
  }
});

app.post('/api/driver/me/missions/:missionId/complete', requireDriverAuth, async (req, res) => {
  try {
    const mission = await store.completeMissionForUser(req.userId, req.params.missionId, req.body || {});
    await syncSimulatorWithStore();
    io.emit('mission_update', mission);
    res.json(buildApiResponse(mission, 'Mission terminée.'));
  } catch (error) {
    handleRouteError(res, error);
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

app.get('/api/gps/positions', (req, res) => {
  res.json(buildApiResponse(simulator.getCurrentPositions()));
});

app.get('/api/gps/vehicles/:vehicleId/trail', (req, res) => {
  res.json(buildApiResponse(simulator.getTrail(req.params.vehicleId)));
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('gps_positions', simulator.getCurrentPositions());

  const positions = simulator.getCurrentPositions();
  const trails = {};
  positions.forEach((position) => {
    trails[position.vehicleId] = simulator.getTrail(position.vehicleId);
  });
  socket.emit('gps_trails', trails);

  const unsubscribe = simulator.subscribe((nextPositions) => {
    socket.emit('gps_positions', nextPositions);
    const nextTrails = {};
    nextPositions.forEach((position) => {
      nextTrails[position.vehicleId] = simulator.getTrail(position.vehicleId);
    });
    socket.emit('gps_trails', nextTrails);
  });

  socket.on('toggle_pause', () => {
    const isPaused = simulator.togglePause();
    io.emit('simulator_paused_state', isPaused);
  });

  socket.on('get_paused_state', () => {
    socket.emit('simulator_paused_state', simulator.paused);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    unsubscribe();
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
