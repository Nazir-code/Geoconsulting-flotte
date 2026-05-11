# 🔥 Firebase Firestore Integration Guide

## Overview

Your FleetNexus backend now uses **Firebase Firestore** as the real-time database, replacing the in-memory `dataStore.js`. This enables:

- ✅ **Persistent data storage** across server restarts
- ✅ **Real-time synchronization** of vehicle positions and missions
- ✅ **Scalability** for production deployments
- ✅ **Multi-instance support** (multiple backend servers)
- ✅ **Automatic backups** via Google Cloud

---

## Quick Start (5 minutes)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `fleetnexus` (or your choice)
4. Enable Google Analytics (optional)
5. Click **Create**

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create database**
3. Select region: **us-central1** (or closest to you)
4. Start in **Test mode** (for development)
5. Click **Create**

**Important:** Test mode expires in 30 days. For production, use security rules.

### Step 3: Get Service Account Key

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate new private key**
4. Save the JSON file as `serviceAccountKey.json`
5. Place it in the `backend/` folder

**⚠️ IMPORTANT:** 
- Never commit `serviceAccountKey.json` to Git
- Add to `.gitignore`: `serviceAccountKey.json`
- Keep this file secure

### Step 4: Set Environment Variables

Create/update `backend/.env`:

```ini
# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Or use individual env vars (recommended for CI/CD):
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
# FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

### Step 5: Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### Step 6: Update server.js (Already Done ✅)

The `server.js` already imports and uses the Firebase store:

```javascript
import { createFirebaseStore } from './firebaseStore.js';

// ... Later in code:
const store = createFirebaseStore();
await store.initializeFirestore();  // Initialize seed data
simulator.start();
```

### Step 7: Start the Backend

```bash
npm start
# or
npm run dev
```

You should see:
```
🔥 Initializing Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS
✅ Firebase Admin SDK initialized successfully!
🔥 Initializing Firestore database...
✅ Firestore initialized successfully with seed data!
Backend listening on port 3000
```

---

## Database Structure

### Collections

#### 1. **users**
Stores user accounts (managers, drivers)

```javascript
{
  id: "1",
  email: "driver@fleetnexus.ng",
  password: "hashed_password",  // TODO: Use bcrypt in production
  firstName: "John",
  lastName: "Doe",
  role: "driver",  // or "manager"
  phone: "+227 90 12 34 56",
  avatar: "https://...",
  createdAt: "2025-01-15T08:00:00.000Z",
  updatedAt: "2025-01-15T08:00:00.000Z"
}
```

#### 2. **drivers**
Driver profiles with license info and assignment

```javascript
{
  userId: "2",
  licenseNumber: "NE-123456",
  licenseExpiry: "2026-06-15T00:00:00.000Z",
  status: "on_mission",  // on_mission, active, off
  rating: 4.8,
  totalMissions: 156,
  currentVehicleId: "v5",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### 3. **vehicles**
Fleet vehicles inventory

```javascript
{
  plateNumber: "V-201",
  brand: "Toyota",
  model: "Land Cruiser",
  year: 2022,
  type: "suv",  // suv, van, pickup, truck, sedan
  status: "available",  // available, on_mission, maintenance
  fuelType: "diesel",  // diesel, gasoline
  mileage: 45230,
  consumptionTheoretical: 9.5,
  fuelCapacity: 80,
  currentDriverId: "d1",
  lastMaintenanceDate: "2024-11-15T00:00:00.000Z",
  nextMaintenanceDate: "2025-02-15T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### 4. **missions**
Active and completed missions

```javascript
{
  driverId: "d1",
  vehicleId: "v5",
  destination: "Dosso",
  purpose: "Livraison marchandises",
  status: "in_progress",  // pending, in_progress, completed, cancelled
  startTime: "2025-01-15T08:00:00.000Z",
  endTime: "2025-01-15T16:00:00.000Z",
  startLocation: "Niamey",
  endLocation: "Dosso",
  distance: 140,
  fuelConsumed: 18,
  createdAt: "2025-01-15T08:00:00.000Z",
  updatedAt: "2025-01-15T08:00:00.000Z"
}
```

#### 5. **fuelRecords**
Fuel transactions and consumption tracking

```javascript
{
  vehicleId: "v1",
  driverId: "d3",
  date: "2025-01-14T16:45:00.000Z",
  quantity: 45,
  pricePerLiter: 650,
  totalCost: 29250,
  mileage: 45230,
  station: "Total Niamey",
  notes: "Regular fill-up",
  createdAt: "2025-01-14T16:45:00.000Z"
}
```

#### 6. **driverPositions**
Real-time GPS positions (updated every 3 seconds)

```javascript
{
  vehicleId: "v5",
  driverId: "d1",
  lat: 13.5137,
  lng: 2.1098,
  speed: 65,
  heading: 120,
  progress: 45,
  distanceDone: 63,
  distanceTotal: 140,
  eta: 45,  // minutes
  timestamp: "2025-01-15T08:15:23.000Z",
  updatedAt: "2025-01-15T08:15:23.000Z"
}
```

#### 7. **notifications**
User notifications and alerts

```javascript
{
  userId: "2",
  title: "Mission démarrée",
  message: "Mission vers Dosso en cours",
  type: "success",  // info, success, warning, error
  isRead: false,
  link: "/missions",
  createdAt: "2025-01-15T08:00:00.000Z"
}
```

---

## Firestore Security Rules (Production)

Replace your current rules with this secure configuration:

### For Test Mode → Production Transition

1. Go to **Firestore → Rules** in Firebase Console
2. Replace with rules below:
3. Click **Publish**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /missions/{missionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /fuelRecords/{recordId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /driverPositions/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.auth.token.role == 'admin');
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

---

## API Reference

### Authentication

#### Login Driver
```javascript
POST /api/auth/login
Body: { email: "driver@fleetnexus.ng", password: "driver123" }
Returns: { token, user, driver }
```

### Driver Operations

#### Get Driver Profile
```javascript
GET /api/driver/me
Headers: { Authorization: "Bearer driver-token-<userId>" }
Returns: { driver with user and vehicle details }
```

#### Get Assigned Vehicle
```javascript
GET /api/driver/me/vehicle
Returns: { vehicle object }
```

#### Get Driver Missions
```javascript
GET /api/driver/me/missions
Returns: [ { mission objects sorted by date } ]
```

#### Create Mission
```javascript
POST /api/driver/me/missions
Body: {
  destination: "Dosso",
  purpose: "Delivery",
  startLocation: "Niamey",  // optional
  startTime: "2025-01-15T08:00:00.000Z"  // optional
}
Returns: { created mission }
```

#### Complete Mission
```javascript
POST /api/driver/me/missions/:missionId/complete
Body: {
  distance: 150,  // km traveled
  fuelConsumed: 20,  // liters
  notes: "Completed successfully"
}
Returns: { completed mission }
```

### Fuel Management

#### Get Fuel Records
```javascript
GET /api/driver/me/fuel-records
Returns: [ { fuel record objects } ]
```

#### Record Fuel
```javascript
POST /api/driver/me/fuel-records
Body: {
  quantity: 45,  // liters
  pricePerLiter: 650,  // CFA
  mileage: 45230,  // km on odometer
  station: "Total Niamey",  // optional
  notes: "Fill-up"  // optional
}
Returns: { created fuel record }
```

### GPS & Real-time

#### Get Current Positions
```javascript
GET /api/gps/positions
Returns: [ { vehicle positions } ]
```

#### Get Vehicle Trail
```javascript
GET /api/gps/vehicles/:vehicleId/trail
Returns: [ { lat, lng coordinates } ]
```

### WebSocket Events

#### Receive GPS Updates
```javascript
socket.on('gps_positions', (positions) => {
  // positions = [ { vehicleId, lat, lng, speed, heading, ... } ]
})

socket.on('gps_trails', (trails) => {
  // trails = { vehicleId: [ { lat, lng }, ... ] }
})
```

#### Pause/Resume Simulation
```javascript
socket.emit('toggle_pause', {});
// Simulator will broadcast: 'simulator_paused_state'

socket.on('simulator_paused_state', (isPaused) => {
  console.log(isPaused ? 'Paused' : 'Running');
})
```

---

## Firestore Features & Limits

### Read/Write Quota (Free Tier)
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 20,000 deletes/day
- ✅ 1 GB stored data

### Scaling
- Auto-scales from 0 to millions of operations
- No server management
- Automatic replication & backups

### Real-time Updates
- Native Firestore listeners
- Indexed queries
- Full-text search ready

---

## Migration from In-Memory Store

### Before (dataStore.js)
- Data lost on server restart
- Single instance only
- No persistence

### After (Firebase)
- Persistent across restarts
- Multi-instance compatible
- Accessible from anywhere
- Built-in backup & recovery

**Zero code changes needed in frontend or driver APIs!** Same interface, better backend.

---

## Production Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Generate service account key
- [ ] Store key securely (not in Git)
- [ ] Update `.env` with Firebase credentials
- [ ] Update security rules (remove test mode)
- [ ] Enable backups (optional, paid)
- [ ] Set up Firebase monitoring
- [ ] Test all API endpoints
- [ ] Load test with real data
- [ ] Deploy to production

---

## Troubleshooting

### Connection Issues

**Error: "Cannot initialize Firebase Admin SDK"**
- ✅ Verify `serviceAccountKey.json` exists in `backend/`
- ✅ Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- ✅ Verify credentials aren't expired

**Error: "Permission denied on document"**
- ✅ Check Firestore security rules
- ✅ Verify authentication token is valid
- ✅ Test in Firebase Console first

**Error: "Quota exceeded"**
- ✅ Check free tier limits
- ✅ Optimize queries (use indexes)
- ✅ Consider upgrading plan

### Data Issues

**Seed data not created**
- ✅ Check for existing data (only runs if empty)
- ✅ Manually delete collections in Firebase Console
- ✅ Restart backend: `npm start`

**Data not persisting**
- ✅ Verify `createFirebaseStore()` is called
- ✅ Check `.initializeFirestore()` runs at startup
- ✅ Monitor Firestore quotas

---

## Performance Tips

1. **Use indexes** for common queries
2. **Batch writes** for bulk operations
3. **Cache frequently accessed data** in memory
4. **Limit real-time listeners** (cost per listener)
5. **Use subcollections** for large datasets

---

## Next Steps

1. ✅ Set up Firebase project (done above)
2. ✅ Install firebase-admin (done: `npm install firebase-admin`)
3. ✅ Configure environment variables
4. ✅ Test the backend with `npm start`
5. ✅ Verify data in Firebase Console
6. ✅ Update frontend `.env` if needed (already compatible)

---

## Support & Resources

- 📖 [Firestore Documentation](https://firebase.google.com/docs/firestore)
- 📖 [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- 💬 [Firebase Support](https://firebase.google.com/support)
- 🔒 [Security Best Practices](https://firebase.google.com/docs/firestore/security/start)

---

**Your backend is now ready for production with Firebase Firestore!** 🚀
