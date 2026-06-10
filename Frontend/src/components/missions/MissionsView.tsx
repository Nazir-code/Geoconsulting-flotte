import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, RefreshCw, Satellite, List, Search } from 'lucide-react';
import { MissionCard } from './MissionCard';
import { MissionDetailsModal } from './MissionDetailsModal';
import { CreateMissionForm } from './CreateMissionForm';
import { CreateMissionFirebaseForm } from './CreateMissionFirebaseForm';
import { LiveTrackingView } from './LiveTrackingView';
import { dataService } from '@/services/dataService';
import { FirestoreMissionService, normalizeMissionStatus, type Mission as FirestoreMission } from '@/services/firestoreMissionService';
import { FirestoreDriverService, type Driver as FirestoreDriver } from '@/services/firestoreDriverService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import type { Mission, MissionStatus, Driver, Vehicle } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState, SkeletonList, useToast } from '@/components/common';

type FilterStatus = 'all' | MissionStatus;
type ActiveTab = 'missions' | 'tracking' | 'create-firebase';

// Convertit un chauffeur Firestore (champ `name` plat + uid) vers le type Driver
// de l'app (structure `user.firstName` / `user.lastName` attendue par l'UI de suivi).
function mapFirestoreDriver(rd: FirestoreDriver): Driver {
  const label = (rd.name || rd.email || 'Chauffeur').trim();
  const parts = label.split(/\s+/);
  const firstName = parts[0] || 'Chauffeur';
  const lastName = parts.slice(1).join(' ');
  const nowIso = new Date().toISOString();
  return {
    id: rd.uid,
    userId: rd.uid,
    user: {
      id: rd.uid,
      email: rd.email || '',
      firstName,
      lastName,
      role: 'driver',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    status: rd.status === 'online' ? 'active' : 'off',
    rating: 0,
    totalMissions: 0,
    licenseNumber: '',
    licenseExpiry: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// Construit une Mission (type app) depuis une mission Firestore brute, en résolvant
// le chauffeur (Firestore prioritaire, sinon mock) et le véhicule.
function buildMission(
  fm: FirestoreMission,
  firestoreDrivers: FirestoreDriver[],
  allDrivers: Driver[],
  allVehicles: Vehicle[]
): Mission {
  const vehicleId = (fm as FirestoreMission & { vehicleId?: string }).vehicleId;
  const nowIso = new Date().toISOString();

  // Priorité au vrai chauffeur Firestore (uid === assignedTo), fallback sur mock.
  const realDriver = firestoreDrivers.find(d => d.uid === fm.assignedTo);
  const driver = realDriver
    ? mapFirestoreDriver(realDriver)
    : allDrivers.find(d => d.id === fm.assignedTo || d.userId === fm.assignedTo);
  const vehicle = allVehicles.find(v => v.id === vehicleId);

  // Driver par défaut (évite un crash UI si le chauffeur est introuvable)
  const defaultDriver: Driver = {
    id: fm.assignedTo || 'unknown',
    userId: fm.assignedTo || 'unknown',
    user: {
      id: 'unknown',
      email: 'unknown@example.com',
      firstName: 'Chauffeur',
      lastName: 'Inconnu',
      role: 'driver',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    status: 'active',
    rating: 0,
    totalMissions: 0,
    licenseNumber: 'TEMP-001',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const defaultVehicle: Vehicle = {
    id: vehicleId || 'v-default',
    plateNumber: 'N/A',
    brand: 'Véhicule',
    model: 'Assigné',
    type: 'truck',
    status: 'available',
    year: 2024,
    mileage: 0,
    fuelType: 'diesel',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    id: fm.id,
    driverId: fm.assignedTo,
    driver: driver || defaultDriver,
    vehicleId: vehicleId || 'v-default',
    vehicle: vehicle || defaultVehicle,
    destination: fm.location || 'Destination inconnue',
    purpose: fm.title || fm.description || 'Mission de transport',
    startTime: fm.createdAt?.toDate?.()?.toISOString() || nowIso,
    endTime: fm.completedAt?.toDate?.()?.toISOString(),
    status: normalizeMissionStatus(fm.status) as MissionStatus,
    startLocation: 'Niamey',
    createdAt: fm.createdAt?.toDate?.()?.toISOString() || nowIso,
    updatedAt: fm.updatedAt?.toDate?.()?.toISOString() || nowIso,
  };
}

export function MissionsView() {
  const toast = useToast();
  const [rawMissions, setRawMissions] = useState<FirestoreMission[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsMission, setDetailsMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('missions');
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  // Vrais chauffeurs / véhicules Firestore pour résoudre noms et plaques.
  const [firestoreDrivers, setFirestoreDrivers] = useState<FirestoreDriver[]>([]);
  const [firestoreVehicles, setFirestoreVehicles] = useState<Vehicle[]>([]);

  // Suivi des statuts précédents pour logger les transitions temps réel
  const prevStatusesRef = useRef<Record<string, string>>({});

  // Charger les données de référence (drivers/vehicles) pour le mapping
  const loadReferenceData = useCallback(async () => {
    try {
      // Fallback chauffeurs (mock) ; les vrais viennent du listener Firestore.
      const drivers = await dataService.getDrivers();
      setAllDrivers(drivers);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, []);

  // 1. Charger les données de référence une seule fois au montage
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // 1bis. Écouter les vrais chauffeurs Firestore pour résoudre leurs noms
  // dans le suivi GPS (sinon affichage "Chauffeur Inconnu").
  useEffect(() => {
    const unsubscribe = FirestoreDriverService.allDriversListener(setFirestoreDrivers);
    return () => unsubscribe();
  }, []);

  // 1ter. Écouter les véhicules persistés (Firestore) pour résoudre les plaques.
  useEffect(() => {
    const unsubscribe = FirestoreVehicleService.allVehiclesListener(setFirestoreVehicles);
    return () => unsubscribe();
  }, []);

  // 2. Écouter les missions en temps réel — stockage BRUT uniquement.
  //    L'abonnement est ouvert une seule fois (deps []) ; il ne dépend pas des
  //    chauffeurs (qui changent à chaque tick GPS) → pas de réabonnement en boucle.
  useEffect(() => {
    const unsubscribe = FirestoreMissionService.allMissionsListener((firestoreMissions) => {
      setRawMissions(firestoreMissions);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Construire les missions affichées : résolution chauffeur (Firestore puis mock)
  //    + véhicule. Recalculé quand les missions brutes OU les chauffeurs/véhicules
  //    changent, sans toucher à l'abonnement Firestore.
  const missions = useMemo<Mission[]>(
    () => rawMissions.map((fm) => buildMission(fm, firestoreDrivers, allDrivers, firestoreVehicles)),
    [rawMissions, firestoreDrivers, allDrivers, firestoreVehicles]
  );

  // 4. Log temps réel des transitions de statut (ex. mission terminée depuis le mobile).
  useEffect(() => {
    const prev = prevStatusesRef.current;
    missions.forEach((m) => {
      const before = prev[m.id];
      if (before && before !== m.status) {
        console.log(
          `🔄 [Manager/Realtime] Mission ${m.id} : "${before}" → "${m.status}"`,
          { destination: m.destination, driver: m.driverId }
        );
        if (m.status === 'terminée') {
          console.log(
            `✅ [Manager/Realtime] Mission TERMINÉE reçue en temps réel : ${m.id}`,
            { endTime: m.endTime }
          );
        }
      }
    });
    prevStatusesRef.current = Object.fromEntries(
      missions.map((m) => [m.id, m.status as string])
    );
  }, [missions]);

  const filteredMissions = missions.filter((mission) => {
    if (filter !== 'all' && mission.status !== filter) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const driverName =
      `${mission.driver.user.firstName} ${mission.driver.user.lastName}`.toLowerCase();
    return (
      mission.destination.toLowerCase().includes(q) ||
      (mission.startLocation || '').toLowerCase().includes(q) ||
      mission.purpose.toLowerCase().includes(q) ||
      driverName.includes(q) ||
      mission.vehicle.plateNumber.toLowerCase().includes(q)
    );
  });

  const handleComplete = async (id: string) => {
    try {
      await FirestoreMissionService.completeMission(id);
      // Le state sera mis à jour via le listener
      toast.success('Mission terminée', 'Le statut a été mis à jour en temps réel.');
    } catch (error) {
      console.error('Error completing mission:', error);
      toast.error('Échec', "Impossible de terminer la mission.");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await FirestoreMissionService.cancelMission(id);
      toast.warning('Mission annulée', 'La mission a été annulée.');
    } catch (error) {
      console.error('Error cancelling mission:', error);
      toast.error('Échec', "Impossible d'annuler la mission.");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      'Supprimer définitivement cette mission ? Cette action est irréversible.'
    );
    if (!ok) return;
    try {
      await FirestoreMissionService.deleteMission(id);
      // Le state se met à jour via le listener temps réel.
      toast.success('Mission supprimée', 'La mission a été supprimée définitivement.');
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast.error('Échec', 'Impossible de supprimer la mission.');
    }
  };

  const legacyFilterButtons: Array<{ value: string; label: string; count: number }> = [
    { value: 'all', label: 'Toutes', count: missions.length },
    { value: 'en_cours', label: 'En cours', count: missions.filter(m => String(m.status) === 'in_progress').length },
    { value: 'pending', label: 'Planifiées', count: missions.filter(m => String(m.status) === 'pending').length },
    { value: 'completed', label: 'Terminées', count: missions.filter(m => String(m.status) === 'completed').length },
    { value: 'cancelled', label: 'Annulées', count: missions.filter(m => String(m.status) === 'cancelled').length },
  ];

  void legacyFilterButtons;

  const filterButtons: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'Toutes', count: missions.length },
    { value: 'en_attente', label: 'En attente', count: missions.filter(m => m.status === 'en_attente').length },
    { value: 'assignée', label: 'Acceptées', count: missions.filter(m => m.status === 'assignée').length },
    { value: 'en_cours', label: 'En cours', count: missions.filter(m => m.status === 'en_cours').length },
    { value: 'terminée', label: 'Terminées', count: missions.filter(m => m.status === 'terminée').length },
    { value: 'annulée', label: 'Annulées', count: missions.filter(m => m.status === 'annulée').length },
  ];

  const activeMissionsCount = missions.filter(m => m.status === 'en_cours').length;

  // We remove the blocking loader so the UI shell renders instantly.
  // Data will pop in once Firestore responds.

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary">
            Contrôle des Missions
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Gérez et suivez toutes les missions en temps réel avec Firebase
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'missions' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadReferenceData}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent-cyan/30 hover:text-accent-cyan transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser les Drivers</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ─── Onglets : Missions | Suivi Live | Créer (Firestore) ─────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl w-fit border border-border">
        <button
          id="tab-missions"
          onClick={() => setActiveTab('missions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'missions'
              ? 'bg-background-primary text-text-primary shadow-sm border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <List className="w-4 h-4" />
          <span>Missions Firestore</span>
          <span className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-semibold',
            activeTab === 'missions'
              ? 'bg-accent-cyan/20 text-accent-cyan'
              : 'bg-white/5 text-text-secondary/60'
          )}>
            {missions.length}
          </span>
        </button>

        <button
          id="tab-tracking"
          onClick={() => setActiveTab('tracking')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'tracking'
              ? 'bg-background-primary text-text-primary shadow-sm border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Satellite className="w-4 h-4" />
          <span>Suivi Live GPS</span>
          {activeMissionsCount > 0 && (
            <span className="relative">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activeMissionsCount}
              </span>
              {activeTab !== 'tracking' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </span>
          )}
        </button>

        <button
          id="tab-create-firebase"
          onClick={() => setActiveTab('create-firebase')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'create-firebase'
              ? 'bg-background-primary text-text-primary shadow-sm border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <span className="text-xs">🔥 Créer (Firestore)</span>
        </button>
      </div>

      {/* ─── Contenu des onglets ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'missions' ? (
          <motion.div
            key="missions-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mission List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Rechercher (destination, chauffeur, véhicule, objet…)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field input-with-icon w-full"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {filterButtons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => setFilter(btn.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filter === btn.value
                          ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                          : 'bg-background-secondary text-text-secondary border border-transparent hover:border-border'
                      )}
                    >
                      {btn.label}
                      <span className={cn(
                        'ml-2 px-1.5 py-0.5 rounded text-[10px]',
                        filter === btn.value
                          ? 'bg-accent-cyan/20 text-accent-cyan'
                          : 'bg-background-primary text-text-secondary/60'
                      )}>
                        {btn.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Mission Cards */}
                <div className="space-y-3">
                  {isLoading ? (
                    <SkeletonList count={4} />
                  ) : filteredMissions.length > 0 ? (
                    filteredMissions.map((mission, index) => (
                      <MissionCard
                        key={mission.id}
                        mission={mission}
                        index={index}
                        onComplete={handleComplete}
                        onCancel={handleCancel}
                        onDelete={handleDelete}
                        onDetails={setDetailsMission}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={Route}
                      title={
                        searchQuery
                          ? 'Aucune mission correspondante'
                          : filter === 'all'
                            ? 'Aucune mission'
                            : 'Aucune mission pour ce filtre'
                      }
                      description={
                        searchQuery
                          ? 'Essayez un autre terme de recherche.'
                          : filter === 'all'
                            ? 'Créez une mission pour la voir apparaître ici en temps réel.'
                            : 'Essayez un autre filtre ou créez une nouvelle mission.'
                      }
                    />
                  )}
                </div>
              </div>

              {/* Create Mission Form */}
              <div className="lg:col-span-1">
                <CreateMissionForm onSuccess={loadReferenceData} />
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'tracking' ? (
          <motion.div
            key="tracking-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <LiveTrackingView missions={missions} />
          </motion.div>
        ) : (
          <motion.div
            key="create-firebase-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <CreateMissionFirebaseForm />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale détails mission */}
      <AnimatePresence>
        {detailsMission && (
          <MissionDetailsModal
            mission={detailsMission}
            onClose={() => setDetailsMission(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
