# Spécification technique complète – Module Carburant

## 1. Objectif

Unifier la gestion des pleins de carburant sur l’ensemble du système FleetNexus autour d’un modèle unique, d’un flux métier unique et de règles d’accès strictes, en s’appuyant sur Firestore comme source de vérité.

Le module carburant doit permettre :
- la saisie d’un plein par un chauffeur,
- la consultation par un manager,
- le calcul fiable du coût total,
- la mise à jour du kilométrage véhicule,
- l’export / la visualisation des consommations,
- l’audit des changements.

---

## 2. Choix d’architecture

### Décision cible
- Utiliser une seule collection Firestore : `fuel_records`.
- Toutes les écritures passent par le backend métier ou par des Cloud Functions, avec validation centralisée.
- Le backend reste le point d’orchestration métier, mais l’écriture finale se fait dans Firestore.

### Pourquoi ce choix
- Éviter la divergence actuelle entre `fuel_records` et `fuelRecords`.
- Garantir un schéma unique.
- Permettre des règles Firestore strictes.
- Faciliter les rapports et la cohérence entre mobile et web.

---

## 3. Schéma Firestore définitif

### Collection principale
`fuel_records`

### Structure d’un document
```json
{
  "id": "string",
  "vehicleId": "string",
  "vehiclePlate": "string",
  "driverId": "string",
  "driverName": "string",
  "date": "timestamp",
  "quantityLiters": 40.5,
  "pricePerLiter": 650,
  "totalCost": 26325,
  "currency": "XOF",
  "station": "string",
  "mileage": 125000,
  "odometerDelta": 1250,
  "consumptionPer100Km": 3.24,
  "source": "mobile|web|backend",
  "status": "draft|submitted|approved|rejected",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string",
  "updatedBy": "string",
  "notes": "string",
  "missionId": "string|null",
  "vehicleAssignmentId": "string|null"
}
```

### Champs obligatoires
- `vehicleId`
- `driverId`
- `date`
- `quantityLiters`
- `pricePerLiter`
- `totalCost`
- `currency`
- `mileage`
- `createdAt`
- `status`

### Champs optionnels
- `station`
- `notes`
- `missionId`
- `vehicleAssignmentId`
- `vehiclePlate`
- `driverName`

### Collection d’audit
`fuel_records/{recordId}/audit`

Chaque modification importante doit créer un document audit :
```json
{
  "action": "create|update|approve|reject",
  "performedBy": "uid",
  "performedAt": "timestamp",
  "before": { "..." },
  "after": { "..." },
  "reason": "string"
}
```

### Collection de synthèse véhicule (optionnelle mais recommandée)
`vehicle_fuel_summary/{vehicleId}`

Contient :
- `lastOdometer`
- `lastFuelDate`
- `monthlyCost`
- `monthlyLiters`
- `avgPricePerLiter`

---

## 4. Cloud Functions à créer

### 4.1. `fuelRecordCreateHandler`
- Type : Cloud Function Firestore Trigger
- Déclencheur : création d’un document dans `fuel_records`
- Rôle :
  - valider la structure du document,
  - calculer `totalCost`,
  - calculer `odometerDelta` si possible,
  - calculer `consumptionPer100Km` si le kilométrage précédent existe,
  - mettre à jour le document véhicule,
  - créer un log d’audit,
  - notifier les managers si nécessaire.

### 4.2. `fuelRecordUpdateHandler`
- Type : Cloud Function Firestore Trigger
- Déclencheur : mise à jour d’un document dans `fuel_records`
- Rôle :
  - empêcher une modification non autorisée,
  - recalculer les champs dérivés,
  - conserver l’historique dans la sous-collection `audit`,
  - mettre à jour les agrégats de synthèse véhicule.

### 4.3. `fuelRecordDeleteHandler`
- Type : Cloud Function Firestore Trigger
- Déclencheur : suppression d’un document dans `fuel_records`
- Rôle :
  - enregistrer la suppression dans l’audit,
  - ajuster le résumé véhicule si nécessaire,
  - empêcher la suppression brutale si l’enregistrement est déjà validé.

### 4.4. `fuelRecordApprovalHandler` (optionnelle, mais recommandée)
- Type : Cloud Function HTTP ou Firestore Trigger
- Déclencheur : changement de `status` vers `approved` ou `rejected`
- Rôle :
  - verrouiller le document,
  - notifier le chauffeur ou le manager concerné,
  - préparer les données pour les rapports.

### 4.5. `fuelRecordDailySummaryJob` (optionnelle)
- Type : Scheduled Cloud Function
- Déclencheur : quotidien
- Rôle :
  - calculer des agrégats journaliers/mensuels,
  - alimenter les tableaux de bord de reporting.

---

## 5. Règles Firestore

### Objectif
- Les chauffeurs ne peuvent lire et créer que leurs propres pleins.
- Les managers peuvent lire tous les pleins et modifier le statut.
- Les règles doivent empêcher toute falsification du coût ou du kilométrage.

### Règles proposées
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isManager() {
      return isAuthenticated() && (
        request.auth.token.role == 'manager' ||
        request.auth.token.role == 'admin'
      );
    }

    function isDriver() {
      return isAuthenticated() && request.auth.token.role == 'driver';
    }

    function isOwnerOrManager(resourceData) {
      return isManager() || (isDriver() && resourceData.driverId == request.auth.uid);
    }

    match /fuel_records/{recordId} {
      allow read: if isAuthenticated() && (
        isManager() || resource.data.driverId == request.auth.uid
      );

      allow create: if isAuthenticated() && (
        isDriver() && request.resource.data.driverId == request.auth.uid
      );

      allow update: if isAuthenticated() && (
        isManager() || (
          isDriver() && resource.data.driverId == request.auth.uid &&
          resource.data.status == 'draft'
        )
      );

      allow delete: if isManager();
    }

    match /fuel_records/{recordId}/audit/{auditId} {
      allow read: if isAuthenticated() && (
        isManager() || get(/databases/$(database)/documents/fuel_records/$(recordId)).data.driverId == request.auth.uid
      );
      allow create: if isManager();
    }
  }
}
```

### Contraintes métier à appliquer côté règles
- `totalCost` doit être égal à `quantityLiters * pricePerLiter`.
- `pricePerLiter` doit être strictement positif.
- `quantityLiters` doit être strictement positif.
- `mileage` doit être supérieur à `0`.
- `status` ne doit accepter qu’un sous-ensemble défini (`draft`, `submitted`, `approved`, `rejected`).

---

## 6. Index Firestore

### Indexes nécessaires pour les requêtes métier

#### 1. Par conducteur, tri par date
- `driverId` ASC
- `date` DESC

#### 2. Par véhicule, tri par date
- `vehicleId` ASC
- `date` DESC

#### 3. Par statut et date
- `status` ASC
- `date` DESC

#### 4. Par date de création
- `createdAt` DESC

#### 5. Par mission si un plein est lié à une mission
- `missionId` ASC
- `date` DESC

### Requêtes attendues
- l’historique d’un chauffeur,
- l’historique d’un véhicule,
- les pleins d’un mois donné,
- les pleins à valider,
- les pleins liés à une mission.

---

## 7. Calculs métier détaillés

### 7.1. Coût total
```text
totalCost = quantityLiters * pricePerLiter
```

### 7.2. Arrondi
- Arrondir à 2 décimales pour les montants.
- Exemple : `40.5 * 650 = 26325.00`.

### 7.3. Delta kilométrique
```text
odometerDelta = currentMileage - previousMileage
```

### 7.4. Consommation moyenne
Si `odometerDelta > 0` :
```text
consumptionPer100Km = (quantityLiters / odometerDelta) * 100
```

### 7.5. Coût mensuel
Aggrégation par mois :
```text
monthlyCost = sum(totalCost of records in month)
```

### 7.6. Consommation mensuelle
```text
monthlyLiters = sum(quantityLiters of records in month)
```

### 7.7. Prix moyen au litre
```text
avgPricePerLiter = totalCost / totalLiters
```

### 7.8. Règles de validation métier
- Le prix doit être positif.
- Le volume doit être positif.
- Le kilométrage ne doit pas diminuer par rapport au dernier plein connu pour ce véhicule.
- Si un plein est enregistré avec un kilométrage inférieur à la valeur déjà connue, le système doit :
  - soit rejeter l’enregistrement,
  - soit créer une alerte de correction manuel.

### 7.9. Règles de cohérence véhicule
- Le véhicule référencé dans le plein doit exister.
- Le chauffeur doit être autorisé à saisir ce véhicule.
- La valeur de `vehiclePlate` doit être synchronisée avec la fiche véhicule au moment de l’écriture.

---

## 8. Écrans Mobile concernés

### 8.1. Écran de saisie de plein
Fichier concerné : [driver_mobile/lib/screens/fuel_entry_screen.dart](driver_mobile/lib/screens/fuel_entry_screen.dart)

Modifications attendues :
- utiliser le flux métier unifié,
- envoyer les données avec les bons noms de champs,
- afficher les erreurs métier détaillées,
- empêcher la saisie si le véhicule n’est pas autorisé.

### 8.2. Dashboard conducteur
Fichier concerné : [driver_mobile/lib/screens/dashboard_screen.dart](driver_mobile/lib/screens/dashboard_screen.dart)

Modifications attendues :
- afficher l’historique des pleins récents,
- afficher la consommation estimée,
- afficher un état de validation du plein.

### 8.3. Écran profil / navigation
Fichier concerné : [driver_mobile/lib/screens/driver_home.dart](driver_mobile/lib/screens/driver_home.dart)

Modifications attendues :
- exposer la navigation vers l’écran carburant si nécessaire,
- afficher un indicateur de statut de validation.

### 8.4. Services concernés
- [driver_mobile/lib/services/firestore_service.dart](driver_mobile/lib/services/firestore_service.dart)
- [driver_mobile/lib/services/api_service.dart](driver_mobile/lib/services/api_service.dart)

---

## 9. Écrans Web concernés

### 9.1. Vue carburant
Fichier concerné : [Frontend/src/components/fuel/FuelView.tsx](Frontend/src/components/fuel/FuelView.tsx)

Modifications attendues :
- utiliser la même structure de données,
- filtrer les pleins par véhicule / conducteur / période,
- afficher les agrégats mensuels,
- permettre l’édition / approbation si statut manager.

### 9.2. Dashboard web
Fichier concerné : [Frontend/src/components/dashboard/DashboardView.tsx](Frontend/src/components/dashboard/DashboardView.tsx)

Modifications attendues :
- afficher le coût carburant du mois,
- afficher les anomalies potentielles,
- afficher la consommation moyenne.

### 9.3. Rapports web
Fichier concerné : [Frontend/src/components/reports/ReportsView.tsx](Frontend/src/components/reports/ReportsView.tsx)

Modifications attendues :
- utiliser les champs dérivés du document Firestore,
- produire les rapports par véhicule, période, conducteur.

---

## 10. Plan de tests

### 10.1. Tests unitaires
- calcul du `totalCost`,
- calcul de la consommation par 100 km,
- validation de la cohérence kilométrique,
- validation des règles d’accès.

### 10.2. Tests d’intégration
- création d’un plein depuis mobile,
- création d’un plein depuis web,
- lecture par un manager,
- lecture par un chauffeur non propriétaire,
- mise à jour d’un plein en statut `draft`.

### 10.3. Tests Firestore Rules
- refus d’écriture par un chauffeur pour un autre véhicule,
- refus de modification par un chauffeur sur un document déjà validé,
- autorisation de lecture par manager,
- refus de création si `totalCost` est incohérent.

### 10.4. Tests Cloud Functions
- création d’un document déclenche le calcul de `totalCost`,
- update déclenche l’audit,
- suppression déclenche le log et l’ajustement synthèse véhicule.

### 10.5. Tests UI
- saisie valide sur mobile,
- saisie invalide sur web,
- affichage d’un message d’erreur cohérent,
- affichage du détail du plein avec montant et consommation.

### 10.6. Tests de régression
- vérifier que les missions ne sont pas cassées,
- vérifier que l’affichage GPS n’est pas perturbé,
- vérifier que les véhicules continuent d’afficher leur odomètre correctement.

---

## 11. Impacts sur les modules existants

### 11.1. Missions
- Ajout d’un lien optionnel `missionId` sur les pleins.
- Permettre un suivi carburant par mission.
- Réduire le risque de consommation non attribuée.

### 11.2. GPS
- Aucun changement fonctionnel direct nécessaire.
- Le GPS reste utilisé pour la localisation en temps réel.
- Le module carburant ne doit pas dépendre du GPS pour le calcul du plein.

### 11.3. Véhicules
- Le document véhicule doit disposer d’un champ `mileage` ou `odometer` mis à jour de manière centralisée.
- Le plein doit être la source de vérité pour la mise à jour de ce champ.
- Éviter des mises à jour concurrentes incohérentes.

### 11.4. Notifications
- À ajouter si besoin : notification de création de plein pour le manager.
- À conserver comme extension, pas comme cœur du module.

---

## 12. Risques de régression et mesures de prévention

### 12.1. Risque : divergence de schéma
- Cause : coexistence de `fuel_records` et `fuelRecords`.
- Mesure : migration unique vers `fuel_records` et suppression de toute écriture parallèle.

### 12.2. Risque : incohérence du coût total
- Cause : calcul côté client non fiable.
- Mesure : calcul obligatoire côté Cloud Function et validation stricte dans les règles.

### 12.3. Risque : kilométrage incohérent
- Cause : saisie erronée ou valeur décroissante.
- Mesure : validation monotone et contrôle par lecture du dernier odomètre connu.

### 12.4. Risque : accès non autorisé
- Cause : règles Firestore trop permissives.
- Mesure : restreindre la création/lecture/modification selon rôle et propriétaire.

### 12.5. Risque : écriture concurrente
- Cause : plusieurs clients modifient le même document.
- Mesure : utiliser des Cloud Functions de validation et un flux d’update séquentiel.

### 12.6. Risque : régressions UI
- Cause : changement de structure de données du document.
- Mesure : tests E2E et compatibilité des écrans mobile/web avec le nouveau modèle.

### 12.7. Risque : impact sur les tableaux de bord existants
- Cause : les vues web et mobile s’appuient sur l’ancienne structure.
- Mesure : migration progressive et compatibilité avec les champs legacy pendant une période de transition.

---

## 13. Plan de mise en œuvre recommandé

### Phase 1 – Fondation
- unifier la collection `fuel_records` ;
- définir les champs obligatoires ;
- mettre à jour les règles Firestore ;
- créer les index nécessaires.

### Phase 2 – Logique métier
- créer les Cloud Functions de validation et de calcul ;
- maintenir la cohérence du kilométrage véhicule ;
- mettre en place l’audit.

### Phase 3 – Intégration applicative
- migrer mobile et web vers le nouveau format ;
- supprimer les chemins d’écriture divergents ;
- adapter les vues de dashboard et de rapports.

### Phase 4 – Validation
- exécuter les tests de sécurité, d’intégration et de régression ;
- valider les cas limites ;
- déployer progressivement.

---

## 14. Conclusion

Cette spécification pose les bases d’un module carburant robuste, cohérent et prêt pour la production. Elle garantit :
- un modèle unique,
- une logique métier centralisée,
- des règles d’accès sécurisées,
- des calculs fiables,
- une montée en complexité compatible avec l’évolution du système.
