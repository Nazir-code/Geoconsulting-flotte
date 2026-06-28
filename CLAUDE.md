# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FleetNexus** is a vehicle fleet management platform (NOVATECH). It has three independent sub-projects that share a Firebase backend:

- `Flotte de vehicule/Frontend/` — React 19 web dashboard for managers/admins
- `Flotte de vehicule/backend/` — Node.js API server (Express + Socket.io + Firebase Admin)
- `Flotte de vehicule/driver_mobile/` — Flutter driver mobile app

Firebase project: `geoconsulting-fleet`

---

## Commands

### Frontend (React)

```bash
cd "Flotte de vehicule/Frontend"
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # tsc + vite build → dist/
npm run lint         # eslint
npm run type-check   # tsc --noEmit
npm test             # vitest (watch mode)
npm run test:run     # vitest run (CI)
npm run test:coverage
```

### Backend (Node.js)

```bash
cd "Flotte de vehicule/backend"
npm install
node server.js       # Start server (also: npm run dev)
npm test             # jest
```

Backend listens on the port defined by `process.env.PORT` (defaults vary). CORS allows `localhost:5173` and `localhost:3000` in dev. Set `ALLOWED_ORIGINS` env var for production.

### Mobile (Flutter)

```bash
cd "Flotte de vehicule/driver_mobile"
flutter pub get
flutter run          # Run on connected device/emulator
flutter run -v       # Verbose
flutter build apk --release
flutter build appbundle --release
```

### Firebase Cloud Functions

```bash
cd "Flotte de vehicule/functions"
firebase deploy --only functions
```

---

## Architecture

### Frontend

Entry: `src/main.tsx` → `App.tsx`

`App.tsx` wraps everything in `<AuthProvider>` (Firebase) → `<ThemeProvider>`. After auth, it renders a single-page layout with `NavigationRail` + `TopBar` + one of six section views switched by `activeSection` state.

Key directories:
- `src/components/` — feature-scoped UI components (`dashboard/`, `fleet/`, `missions/`, `fuel/`, `reports/`, `settings/`, `auth/`, `layout/`, `common/`, `session/`, `security/`)
- `src/context/` — `AuthContext_Firebase.tsx` (active), `AuthContext.tsx` (mock, unused), `ThemeContext.tsx`
- `src/services/` — pure logic: `authService.ts`, `firestoreDriverService.ts`, `firestoreMissionService.ts`, `sessionManager.ts`, `gpsSimulatorService.ts`, etc.
- `src/lib/` — `firebaseConfig.ts`, `firestoreService.ts`, `utils.ts`
- `src/types/index.ts` — all shared TypeScript interfaces
- `src/data/` — mock/static data
- `src/screens/` — legacy standalone screens (`DriversLive.tsx`, `MissionsBoard.tsx`)

Path alias `@/` resolves to `src/`.

**AuthContext_Firebase.tsx is the active context.** `AuthContext.tsx` is a mock kept for reference. Role is derived from email at login: `admin` in email → `admin`, `driver`/`chauffeur` → `driver`, otherwise → `manager`.

### Backend

Entry: `server.js`

- `firebaseAdmin.js` — Firebase Admin SDK initialization (reads `serviceAccountKey.json`)
- `firebaseStore.js` — `createFirebaseStore()` wraps all Firestore operations
- `simulator.js` — `GpsSimulatorService`: registers vehicles and emits periodic GPS position updates
- `services/realtimeEventManager.js` — manages Socket.io room subscriptions and broadcasts Firestore events
- `controllers/missionStatusController.js` — handles mission status transition logic and emits Socket.io events
- `api/index.js` — Vercel serverless entry wrapper

### Mobile (Flutter)

Entry: `lib/main.dart` → `_RootNavigator` (StreamBuilder on `AuthService.authStateChanges`)

- `lib/services/` — singletons: `AuthService`, `FirestoreService`, `LocationService`, `MissionsService`, `FirebaseNotificationService`
- `lib/models/` — `DriverProfile`, `Mission`
- `lib/screens/` — `LoginScreen`, `DriverHome`, `MissionsScreen`
- `lib/theme/` — Material 3 theme configuration
- `lib/widgets/` — reusable widgets

GPS tracking updates Firestore every ~5 seconds via `LocationService.startLocationTracking(uid)`.

### Firebase / Firestore

Collections:
- `drivers/{uid}` — driver profiles with GPS coordinates, status, FCM tokens
- `missions/{missionId}` — missions with `status` (`pending` | `in_progress` | `completed`), `assignedTo` (driver UID), `priority`
- `fuel_records/{recordId}` — fuel/maintenance records

Security rules are in `Flotte de vehicule/firestore.rules`. Role check uses the driver's own Firestore document or email pattern matching.

Cloud Functions (`functions/index.js`): trigger on `missions` document create/update to send FCM push notifications to the assigned driver.

### Theme System (Frontend)

Defined in `src/index.css` via CSS custom properties. Dark theme is default (`:root`), light via `.light` class on `document.documentElement`.

**Mandatory**: never hardcode colors for themed elements — always use CSS variables (`var(--bg-primary)`, `var(--text-primary)`, `var(--border)`, `var(--accent-cyan)`, etc.). All theme-sensitive components need `transition: 0.3s ease`. Use `lucide-react` for icons.

### Deployment

- Frontend: Vercel (`vercel.json` in `Flotte de vehicule/`), build command `cd Frontend && npm install && npm run build`
- Backend: separate Vercel deployment (own `vercel.json` in `backend/`)
- Mobile: APK/AAB via `flutter build`

---

## Coding Standards (from GEMINI.md)

- Strict TypeScript — no `any`. All shared interfaces in `src/types/index.ts`.
- Functional components with hooks only.
- Use `clsx` + `tailwind-merge` for conditional classes.
- Run `npm run lint` before completing any task.
- Run `npm run build` after architectural changes.
- Verify UI changes in both Light and Dark modes.
