# AGENTS

This file helps AI coding agents work safely and efficiently in the FleetNexus repository.

## Focus: tokens

- This repository uses two main token flows:
  - Firebase Auth JWT tokens for web session auth.
  - Firebase Cloud Messaging (FCM) registration tokens for driver push notifications.
- There is also a simple mock bearer token format used in the backend dev sync path: `driver-token-{id}`.
- Do not store or expose real credentials, secrets, or token values in code or generated output.

## What agents should know

- Frontend auth is based on Firebase, using `AuthContext_Firebase.tsx` and `authService.ts`.
- JWT/session tokens are managed carefully:
  - prefer `browserSessionPersistence` for web auth.
  - session tokens are refreshed automatically.
  - localStorage is used only for transient state; session data should not become a permanent long-lived token store.
- `AuthContext.tsx` is a legacy/mock context and should not replace `AuthContext_Firebase.tsx` in production behavior.

## Token-related files and features

- `Flotte de vehicule/Frontend/src/context/AuthContext_Firebase.tsx`
- `Flotte de vehicule/Frontend/src/services/authService.ts`
- `Flotte de vehicule/SESSION_MANAGEMENT_GUIDE.md`
- `Flotte de vehicule/backend/server.js`
- `Flotte de vehicule/backend/firebaseStore.js`
- `Flotte de vehicule/backend/endpoint-firebase-sync.js`
- `Flotte de vehicule/functions/index.js`
- `Flotte de vehicule/backend/dataStore.js`

## Important conventions

- When editing auth/session code, preserve Firebase token handling and avoid adding insecure token persistence.
- When editing push notification code, handle FCM tokens as user-specific registration tokens and support both:
  - `driver.fcmToken` string
  - `driver.fcmTokens` array
- Avoid hardcoding tokens or credentials in the repository.
- For detailed session and token behavior, reference existing documentation instead of copying it verbatim:
  - `Flotte de vehicule/SESSION_MANAGEMENT_GUIDE.md`
  - `Flotte de vehicule/DEPLOYMENT_GUIDE.md`
  - `Flotte de vehicule/firestore.rules`

## Agent behavior guidance

- Prefer concise answers and actionable changes.
- If asked to modify auth or token flows, validate against the existing Firebase/session management design.
- If a task involves security or tokens, ask for clarification before changing authentication persistence or token storage.

## Quick start commands

- Frontend: `cd "Flotte de vehicule/Frontend" && npm install && npm run dev`
- Backend: `cd "Flotte de vehicule/backend" && npm install && node server.js`
- Functions: `cd "Flotte de vehicule/functions" && firebase deploy --only functions`
