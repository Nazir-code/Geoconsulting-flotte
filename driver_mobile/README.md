# Driver Mobile

Application Flutter pour les chauffeurs, connectee au backend Node du projet.

## Fonctionnalites

- Connexion chauffeur
- Vue d'ensemble du profil et du vehicule assigne
- Demarrage et cloture d'une mission
- Consultation de l'historique des missions
- Enregistrement d'un plein de carburant
- Recuperation de la position GPS courante du vehicule en mission

## Backend attendu

Le backend du projet expose maintenant les routes suivantes :

- `POST /api/auth/login`
- `GET /api/driver/me`
- `GET /api/driver/me/vehicle`
- `GET /api/driver/me/missions`
- `GET /api/driver/me/missions/active`
- `POST /api/driver/me/missions`
- `POST /api/driver/me/missions/:missionId/complete`
- `GET /api/driver/me/fuel-records`
- `POST /api/driver/me/fuel-records`
- `GET /api/gps/positions`

## Lancement

1. Demarrer le backend :

```powershell
cd "Flotte de vehicule/backend"
npm install
npm start
```

2. Si les dossiers `android/`, `ios/` et `web/` ne sont pas encore presents, generer la coquille Flutter une seule fois :

```powershell
cd "Flotte de vehicule/driver_mobile"
flutter create .
```

3. Lancer l'application :

```powershell
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Sur emulateur Android, `10.0.2.2` pointe vers le serveur local de la machine. Sur un telephone physique, remplacez cette adresse par l'IP locale du PC.
