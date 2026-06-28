# 🧪 Guide de Test - Application Driver FleetNexus

## 📋 Checklist de Test Complète

### ✅ Environnement

- [ ] Flutter installé (`flutter --version`)
- [ ] Android SDK configuré
- [ ] Emulateur Android lancé ou téléphone connecté
- [ ] Google Play Services disponible (pour Firebase)

---

## 🚀 Test 1: Démarrage de l'Application

### Commandes
```bash
# Terminal - Aller dans le répertoire
cd "c:\Users\zabei\OneDrive\Desktop\NOVATECH\ApplicationFlotteVehicule-main\Flotte de vehicule\driver_mobile"

# Récupérer les dépendances
flutter pub get

# Lancer l'app
flutter run
```

### Résultat Attendu
✅ L'app démarre  
✅ **Écran de Connexion** s'affiche avec le gradient FleetNexus (bleu-vert)  
✅ Boutons "Se connecter" et "S'inscrire" visibles  

---

## 🔐 Test 2: Inscription Nouvel Utilisateur

### Étapes
1. Sur l'écran login, cliquer **"S'inscrire"** en bas
2. Remplir les champs:
   - **Email:** `chauffeur@test.com`
   - **Nom:** `Jean Dupont`
   - **Mot de passe:** `Test123456`
3. Cliquer le bouton **"S'inscrire"**
4. Attendre 3-5 secondes

### Résultat Attendu
✅ Pas d'erreur affichée  
✅ **Redirection automatique** vers le **Tableau de Bord**  
✅ Profil affiche: "Jean Dupont" / "chauffeur@test.com"  

### Vérification Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Projet: `geoconsulting-fleet`
3. **Authentication** → Vérifier l'utilisateur créé
4. **Firestore** → Collection `drivers` → Document avec UID du chauffeur
5. Contient: `name`, `email`, `createdAt`, etc.

---

## 🔑 Test 3: Connexion avec Email/Mot de Passe

### Étapes
1. Déconnecter l'utilisateur (bouton logout en haut à droite)
2. Confirmer la déconnexion
3. Sur l'écran login, remplir:
   - **Email:** `chauffeur@test.com`
   - **Mot de passe:** `Test123456`
4. Cliquer **"Se connecter"**

### Résultat Attendu
✅ Pas d'erreur  
✅ **Redirection vers Tableau de Bord**  
✅ Profil chargé correctement  

---

## 🐛 Test 4: Gestion des Erreurs

### Test 4a: Email inexistant
1. Écran login
2. Remplir:
   - Email: `inexistant@test.com`
   - Mot de passe: `Test123456`
3. Cliquer "Se connecter"

### Résultat Attendu
❌ Message d'erreur rouge: **"Aucun utilisateur trouvé avec cet email."**

### Test 4b: Mot de passe incorrect
1. Remplir:
   - Email: `chauffeur@test.com`
   - Mot de passe: `wrongpassword`
2. Cliquer "Se connecter"

### Résultat Attendu
❌ Message d'erreur rouge: **"Mot de passe incorrect."**

### Test 4c: Mot de passe trop court (inscription)
1. Cliquer "S'inscrire"
2. Remplir:
   - Email: `test2@test.com`
   - Nom: `Test User`
   - Mot de passe: `123` (moins de 6 caractères)
3. Cliquer "S'inscrire"

### Résultat Attendu
❌ Message d'erreur: **"Le mot de passe doit contenir au minimum 6 caractères."**

### Test 4d: Champs vides
1. Laisser les champs vides
2. Cliquer "Se connecter"

### Résultat Attendu
❌ Message d'erreur: **"Veuillez remplir tous les champs."**

---

## 📡 Test 5: Tracking GPS

### Prérequis
- Téléphone/Émulateur avec GPS activé
- Permissions d'accès à la localisation

### Étapes
1. Connecté à l'app (Tableau de Bord visible)
2. Cliquer le bouton **"Démarrer le tracking"**
3. Si demande de permissions → Cliquer **"Autoriser"**
4. Attendre 5-10 secondes

### Résultat Attendu
✅ Bouton devient **"Arrêter le tracking"** (couleur rouge)  
✅ Les coordonnées GPS s'affichent:
   - `Latitude: 48.856613`
   - `Longitude: 2.352222`
   - `Dernière mise à jour: HH:MM`  
✅ Les coordonnées **se mettent à jour toutes les 5 secondes** environ

### Vérification Firestore
1. Aller sur Firebase Console
2. **Firestore** → Collection `drivers` → Document {UID}
3. Vérifier les champs:
   - `latitude` (mis à jour)
   - `longitude` (mis à jour)
   - `lastLocationUpdate` (timestamp récent)

### Simulation de mouvement (Émulateur Android Studio)
1. Ouvrir Android Emulator Extended Controls
2. Aller à **Location**
3. Changer latitude/longitude
4. Cliquer **"SET LOCATION"**
5. Observer les changements dans l'app

---

## 🔄 Test 6: Bouton "Obtenir Position Actuelle"

### Étapes
1. Cliquer **"Obtenir position actuelle"**
2. Attendre le chargement

### Résultat Attendu
✅ Un toast (notification) affiche la position actuelle  
✅ Exemple: `"Position: 48.8566, 2.3522"`  
✅ Les coordonnées se mettent à jour

---

## 🔌 Test 7: Arrêter le Tracking

### Étapes
1. Avec le tracking actif, cliquer **"Arrêter le tracking"**
2. Attendre 10 secondes
3. Observer que les coordonnées ne se mettent plus à jour

### Résultat Attendu
✅ Bouton redevient **"Démarrer le tracking"** (couleur bleue)  
✅ Les coordonnées Firestore ne changent plus  

---

## 👤 Test 8: Affichage du Profil

### Étapes
1. Sur le Tableau de Bord
2. Regarder la section "Profil du chauffeur"

### Résultat Attendu
✅ Affiche le nom du chauffeur  
✅ Affiche l'email  
✅ Icônes (👤 📧) bien alignées  

---

## 🚪 Test 9: Déconnexion

### Étapes
1. Cliquer l'icône logout en haut à droite
2. Une popup de confirmation s'affiche
3. Cliquer **"Déconnexion"**

### Résultat Attendu
✅ Redirection vers l'écran de login  
✅ L'utilisateur est **complètement déconnecté**  
✅ Les données ne sont pas accessibles  

### Test de Re-connexion
1. Se reconnecter avec les mêmes identifiants
2. Le Tableau de Bord se recharge avec les données correctes

---

## ⚠️ Test 10: Gestion des Erreurs GPS

### Test 10a: Permissions refusées
1. Refuser les permissions GPS quand demandées
2. Cliquer "Démarrer le tracking"

### Résultat Attendu
❌ Message d'erreur: **"Permissions de localisation refusées."**

### Test 10b: Services GPS désactivés
1. Désactiver la localisation du téléphone
2. Cliquer "Démarrer le tracking"

### Résultat Attendu
❌ Message d'erreur: **"Les services de localisation sont désactivés."**

---

## 🔐 Test 11: Sécurité des Données

### Vérification Firestore Rules
1. Firebase Console
2. **Firestore** → **Rules**
3. Vérifier que chaque utilisateur ne peut accéder qu'à son propre document

### Test d'Accès Non Autorisé
1. Copier l'UID d'un autre utilisateur
2. Tenter de modifier ses données → **Doit être refusé par Firestore**

---

## 📊 Test 12: Performance

### Métriques à Vérifier
- ⏱️ Temps de connexion: < 3 secondes
- ⏱️ Temps de chargement du profil: < 2 secondes
- ⏱️ Intervalle entre les mises à jour GPS: ~5 secondes
- 📱 Consommation batterie: Normale (GPS + réseau)

### Console Logs
```bash
flutter logs
```

Vérifier qu'il n'y a pas d'erreurs critiques

---

## ✅ Checklist Finale

- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Erreurs gérées correctement
- [ ] GPS fonctionne
- [ ] Données mises à jour dans Firestore
- [ ] Déconnexion fonctionne
- [ ] Pas de crashs
- [ ] Interface responsive
- [ ] Pas d'erreurs dans les logs

---

## 🚀 Si Tous les Tests Passent

**FÉLICITATIONS!** ✅ Votre application est **prête pour la production**.

Vous pouvez maintenant:
1. **Build APK**: `flutter build apk --release`
2. **Distribuer** via Play Store ou TestFlight
3. **Monitorer** les utilisateurs en production

---

## 🆘 Support & Dépannage

### Erreur: "Unknown host exception"
→ Vérifier la connexion Internet

### Erreur: "Firebase initialization failed"
→ Vérifier que `google-services.json` est correct

### Erreur: "PlatformException"
→ Vérifier les permissions Android dans `AndroidManifest.xml`

### GPS ne fonctionne pas sur émulateur
→ Utiliser les contrôles étendus d'Android Emulator pour simuler une position

---

**Date:** 2026-04-29  
**Status:** Prêt pour Test
