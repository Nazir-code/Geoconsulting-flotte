# 🚀 Guide de Déploiement - Système Flotte de Véhicules

## 📋 Prérequis

- **Node.js 18+** pour le backend
- **Flutter 3.x** pour l'application mobile
- **Firebase Project** configuré avec Firestore et FCM
- **Variables d'environnement** configurées

---

## 🔧 Configuration Firebase

### Backend (.env)
```bash
FIREBASE_PROJECT_ID=geoconsulting-fleet
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@geoconsulting-fleet.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLÉ_PRIVÉE_ICI\n-----END PRIVATE KEY-----"
PORT=3001
SOCKET_PORT=3002
```

### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine
VITE_FIREBASE_PROJECT_ID=geoconsulting-fleet
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3002
```

---

## 🌐 Déploiement Frontend (React)

### Build Production
```bash
cd Frontend
npm install
npm run build
```

### Déploiement sur Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Configuration Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: `18.x`

---

## 🖥️ Déploiement Backend (Node.js)

### Build et Démarrage
```bash
cd backend
npm install
npm start
```

### Déploiement sur Render
1. **Connecter votre repository** GitHub
2. **Configuration du service**:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3001`

### Variables d'environnement Render
Ajouter toutes les variables Firebase dans les settings du service

---

## 📱 Déploiement Mobile (Flutter)

### Build APK Release
```bash
cd driver_mobile
flutter build apk --release
```

### Build iOS Release
```bash
cd driver_mobile
flutter build ios --release
```

### Déploiement Google Play Store
1. **Créer un compte** Google Play Developer
2. **Uploader l'APK** dans la console
3. **Configurer les métadonnées** (icônes, descriptions)
4. **Soumettre pour review**

### Déploiement App Store
1. **Créer un compte** Apple Developer
2. **Configurer Xcode** avec les certificats
3. **Uploader l'IPA** via App Store Connect
4. **Soumettre pour review**

---

## 🔗 Configuration Firebase Cloud Messaging

### Android (google-services.json)
```bash
# Placer dans driver_mobile/android/app/
google-services.json
```

### iOS (GoogleService-Info.plist)
```bash
# Placer dans driver_mobile/ios/Runner/
GoogleService-Info.plist
```

### Test des Notifications
```bash
cd backend
node test-mission-notification.cjs
```

---

## 🗺️ Configuration Cartes

### OpenStreetMap Tiles
- **URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Centrage par défaut**: Niamey, Niger (13.5137, 2.1098)
- **Zoom par défaut**: 12

### Icônes Véhicules
- **Couleur**: `#0E7490` (bleu marine)
- **Taille**: 32x32px
- **Format**: SVG avec markers personnalisés

---

## 🔐 Sécurité

### Fichiers Protégés (.gitignore)
```
# Firebase credentials
google-services.json
GoogleService-Info.plist
serviceAccountKey.json
*.p8
*.key
*.p12

# Environment files
.env
.env.local
.env.production

# Build outputs
build/
dist/
*.apk
*.ipa
node_modules/
```

### Variables d'environnement
- **Jamais** exposer les clés Firebase dans le code
- **Utiliser** toujours les variables d'environnement
- **Valider** les entrées utilisateur côté backend

---

## 📊 Monitoring et Logs

### Backend Logs
```bash
# Logs en temps réel
npm run dev

# Production avec PM2
pm2 logs fleet-backend
```

### Firebase Console
- **Firestore**: Monitoring des requêtes et performances
- **FCM**: Statistiques de livraison des notifications
- **Authentication**: Logs de connexion

---

## 🚨 Dépannage

### Erreurs Communes

#### 1. FCM Notifications non reçues
```bash
# Vérifier le token FCM
await FirebaseMessaging.instance.getToken()

# Vérifier les permissions
await FirebaseMessaging.instance.requestPermission()
```

#### 2. Connexion Firestore échouée
```bash
# Vérifier les règles Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3. Build Flutter échoué
```bash
# Nettoyer et rebuild
flutter clean
flutter pub get
flutter build apk --release
```

---

## 📈 Performance

### Optimisations Frontend
- **Code splitting**: Import dynamique des composants
- **Lazy loading**: Chargement des cartes à la demande
- **Caching**: Service Workers pour les ressources statiques

### Optimisations Backend
- **Indexation Firestore**: Index composites pour les requêtes complexes
- **Pagination**: Limitation des résultats par page
- **Caching Redis**: Pour les données fréquemment accédées

---

## 🔄 Mises à Jour

### Processus de Déploiement
1. **Tester** en environnement de staging
2. **Créer un tag** Git pour la version
3. **Déployer** progressivement (frontend → backend → mobile)
4. **Monitor** les erreurs et performances
5. **Rollback** si nécessaire

### Versioning
- **Backend**: `v1.0.0` (Semantic Versioning)
- **Frontend**: `v1.0.0` (aligné sur backend)
- **Mobile**: `1.0.0+1` (version + build number)

---

## 📞 Support

### Documentation Technique
- **API Documentation**: `/api/docs` (Swagger)
- **Firestore Schema**: Documentation dans le README
- **Architecture**: Diagrammes dans `/docs/architecture`

### Outils de Debug
- **Flutter Inspector**: Pour le debug mobile
- **React DevTools**: Pour le debug frontend
- **Firebase Emulator**: Pour le développement local

---

## ✅ Checklist Déploiement

- [ ] Variables d'environnement configurées
- [ ] Firebase project et services activés
- [ ] Build frontend réussi
- [ ] Build backend réussi
- [ ] Build mobile réussi
- [ ] Tests FCM fonctionnels
- [ ] Tests Firestore fonctionnels
- [ ] Monitoring configuré
- [ ] Sécurité validée
- [ ] Documentation mise à jour

---

**🎉 Votre système flotte est maintenant prêt pour la production !**
