@echo off
echo ========================================
echo    CONFIGURATION VARIABLES VERCEL
echo ========================================

echo.
echo Configuration des variables d'environnement Firebase...

echo VITE_FIREBASE_API_KEY | vercel env add VITE_FIREBASE_API_KEY production
echo AIzaSyCZXQlz8tLydBMeFAg-zgnqrNzaVONM6x0

echo VITE_FIREBASE_AUTH_DOMAIN | vercel env add VITE_FIREBASE_AUTH_DOMAIN production  
echo geoconsulting-fleet.firebaseapp.com

echo VITE_FIREBASE_PROJECT_ID | vercel env add VITE_FIREBASE_PROJECT_ID production
echo geoconsulting-fleet

echo VITE_FIREBASE_STORAGE_BUCKET | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo geoconsulting-fleet.firebasestorage.app

echo VITE_FIREBASE_MESSAGING_SENDER_ID | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo 119982444575

echo VITE_FIREBASE_APP_ID | vercel env add VITE_FIREBASE_APP_ID production
echo 1:119982444575:web:71bd697c56acf1bcd7852a

echo VITE_FIREBASE_MEASUREMENT_ID | vercel env add VITE_FIREBASE_MEASUREMENT_ID production
echo G-46BXF9BYSW

echo.
echo ========================================
echo    CONFIGURATION TERMINEE!
echo ========================================
pause