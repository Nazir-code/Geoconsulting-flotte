@echo off
set FIREBASE_PROJECT_ID=geoconsulting-fleet
set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@geoconsulting-fleet.iam.gserviceaccount.com
set FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
node test-mission-notification.cjs
pause
