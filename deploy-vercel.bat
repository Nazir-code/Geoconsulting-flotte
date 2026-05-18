@echo off
echo ========================================
echo    DEPLOIEMENT FLEETNEXUS SUR VERCEL
echo ========================================

echo.
echo 1. Installation des dependances Frontend...
cd Frontend
call npm install

echo.
echo 2. Build du projet Frontend...
call npm run build

echo.
echo 3. Test du build...
if not exist "dist\index.html" (
    echo ERREUR: Le build a echoue!
    pause
    exit /b 1
)

echo.
echo 4. Deploiement sur Vercel...
call vercel --prod

echo.
echo 5. Deploiement du Backend (optionnel)...
cd ..\backend
echo Voulez-vous deployer le backend aussi? (y/N)
set /p deploy_backend=
if /i "%deploy_backend%"=="y" (
    call npm install
    call vercel --prod
)

echo.
echo ========================================
echo    DEPLOIEMENT TERMINE!
echo ========================================
echo.
echo N'oubliez pas de configurer les variables d'environnement dans le dashboard Vercel:
echo - VITE_FIREBASE_API_KEY
echo - VITE_FIREBASE_AUTH_DOMAIN
echo - VITE_FIREBASE_PROJECT_ID
echo - VITE_FIREBASE_STORAGE_BUCKET
echo - VITE_FIREBASE_MESSAGING_SENDER_ID
echo - VITE_FIREBASE_APP_ID
echo - VITE_FIREBASE_MEASUREMENT_ID
echo.
pause