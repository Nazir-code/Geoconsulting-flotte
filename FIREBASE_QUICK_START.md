# 🚀 Firebase Integration - Quick Start

## What Changed?

✅ **dataStore.js** → **firebaseStore.js** (Firestore backend)
✅ **In-memory data** → **Persistent Firestore**
✅ **Synchronous** → **Asynchronous (async/await)**
✅ **Single instance** → **Multi-instance ready**

---

## Installation (2 minutes)

### 1. Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### 2. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Create a project"**
3. Name it: `fleetnexus`
4. Click **Create**

### 3. Enable Firestore

1. In Firebase Console → **Build → Firestore Database**
2. Click **Create database**
3. Select region: **us-central1**
4. Click **Create**

### 4. Get Service Account Key

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate new private key**
4. Save as `backend/serviceAccountKey.json`

### 5. Configure Environment

Update `backend/.env`:

```ini
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### 6. Start Backend

```bash
npm start
```

Expected output:
```
🔥 Initializing Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS
✅ Firebase Admin SDK initialized successfully!
🔥 Initializing Firestore database...
✅ Firestore initialized successfully with seed data!
✅ Simulator synced: 2 active missions
🚀 GPS Simulator started
Backend listening on port 3000
```

---

## Testing

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@fleetnexus.ng",
    "password": "driver123"
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "token": "driver-token-2",
    "user": { ... },
    "driver": { ... }
  },
  "message": "Connexion réussie."
}
```

---

## Files Created

✅ `firebaseAdmin.js` - Firebase initialization
✅ `firebaseStore.js` - Firestore database operations
✅ `FIREBASE_SETUP.md` - Complete setup guide
✅ `.gitignore` - Security (protects serviceAccountKey.json)

---

## Files Modified

✅ `server.js` - Now uses Firestore
✅ `package.json` - Added firebase-admin
✅ `.env` - Added Firebase config options

---

## What's Preserved

✅ All API routes unchanged
✅ All WebSocket events unchanged
✅ GPS simulator working same way
✅ Frontend compatibility 100%
✅ Same login credentials work

---

## Database Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Driver/manager accounts |
| `drivers` | Driver profiles & licenses |
| `vehicles` | Fleet inventory |
| `missions` | Active & completed missions |
| `fuelRecords` | Fuel consumption tracking |
| `driverPositions` | Real-time GPS positions |
| `notifications` | User notifications |

---

## Key Features

🔥 **Real-time Firestore**
- Data persists across restarts
- Multi-instance support
- Automatic backups

📍 **GPS Tracking**
- Vehicle positions updated every 3 seconds
- Stored in Firestore
- Real-time WebSocket updates

🚗 **Mission Management**
- Create missions
- Track progress
- Complete with distance & fuel

⛽ **Fuel Management**
- Log fuel records
- Track consumption
- Automatic vehicle mileage update

---

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"
```bash
# Make sure serviceAccountKey.json exists in backend/
# And .env has: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

### Error: "Permission denied"
- Check Firebase Console > Firestore > Rules
- For development, use **Test mode**
- For production, update security rules

### Data not saving
- Check Firestore quota (free tier: 20,000 writes/day)
- Verify database rules allow writes
- Check browser console for errors

---

## Next Steps

1. ✅ Install firebase-admin
2. ✅ Create Firebase project
3. ✅ Download serviceAccountKey.json
4. ✅ Update .env
5. ✅ Run: `npm start`
6. ✅ Test endpoints with curl
7. ✅ View data in Firebase Console
8. ✅ Deploy when ready

---

## Documentation

📖 Full setup: See `FIREBASE_SETUP.md`
📖 API reference: See `FIREBASE_SETUP.md` (API Reference section)
📖 Firestore docs: https://firebase.google.com/docs/firestore

---

## Support

If you hit any issues:

1. Check `FIREBASE_SETUP.md` troubleshooting section
2. Verify `serviceAccountKey.json` exists
3. Check `.env` configuration
4. View Firebase Console for data
5. Check terminal logs for errors

**You're all set! 🎉**
