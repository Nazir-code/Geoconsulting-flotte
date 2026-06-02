import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, RefreshCw, Satellite, List } from 'lucide-react';
import { MissionCard } from './MissionCard';
import { CreateMissionForm } from './CreateMissionForm';
import { CreateMissionFirebaseForm } from './CreateMissionFirebaseForm';
import { LiveTrackingView } from './LiveTrackingView';
import { dataService } from '@/services/dataService';
import { FirestoreMissionService, normalizeMissionStatus } from '@/services/firestoreMissionService';
import type { Mission, MissionStatus, Driver, Vehicle } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState, SkeletonList, useToast } from '@/components/common';

type FilterStatus = 'all' | MissionStatus;
type ActiveTab = 'missions' | 'tracking' | 'create-firebase';

export function MissionsView() {
  const toast = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('missions');
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);

  // Suivi des statuts précédents pour logger les transitions temps réel
  const prevStatusesRef = useRef<Record<string, string>>({});

  // Charger les données de référence (drivers/vehicles) pour le mapping
  const loadReferenceData = useCallback(async () => {
    try {
      const [drivers, vehicles] = await Promise.all([
        dataService.getDrivers(),
        dataService.getVehicles(),
      ]);
      setAllDrivers(drivers);
      setAllVehicles(vehicles);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, []);

  // 1. Charger les données de référence une seule fois au montage
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  // 2. Écouter les missions en temps réel
  useEffect(() => {
    // Subscribe to Firestore missions real-time
    const unsubscribe = FirestoreMissionService.allMissionsListener(async (firestoreMissions) => {
      // Pour chaque mission Firestore, on doit trouver le driver et le véhicule correspondants
      // Note: Dans une version finale, ces objets devraient aussi venir de Firestore
      const mappedMissions: Mission[] = firestoreMissions.map(fm => {
        // Recherche du driver (soit par ID interne, soit par UID Firebase)
        const driver = allDrivers.find(d => d.id === fm.assignedTo || d.userId === fm.assignedTo);
        const vehicle = allVehicles.find(v => v.id === (fm as any).vehicleId);

        // Création d'un driver par défaut si non trouvé pour éviter le crash UI
        const defaultDriver: Driver = {
          id: fm.assignedTo || 'unknown',
          userId: fm.assignedTo || 'unknown',
          user: {
            id: 'unknown',
            email: 'unknown@example.com',
            firstName: 'Chauffeur',
            lastName: 'Inconnu',
            role: 'driver' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          status: 'active' as const,
          rating: 0,
          totalMissions: 0,
          licenseNumber: 'TEMP-001',
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const defaultVehicle: Vehicle = {
          id: (fm as any).vehicleId || 'v-default',
          plateNumber: 'N/A',
          brand: 'Véhicule',
          model: 'Assigné',
          type: 'truck',
          status: 'available',
          year: 2024,
          mileage: 0,
          fuelType: 'diesel',
          // lastService: new Date().toISOString(), // Commented - not in Vehicle type
          // nextService: new Date().toISOString(), // Commented - not in Vehicle type
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          id: fm.id,
          driverId: fm.assignedTo,
          driver: driver || defaultDriver,
          vehicleId: (fm as any).vehicleId || 'v-default',
          vehicle: vehicle || defaultVehicle,
          destination: fm.location || 'Destination inconnue',
          purpose: fm.title || fm.description || 'Mission de transport',
          startTime: fm.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          endTime: fm.completedAt?.toDate?.()?.toISOString(),
          status: normalizeMissionStatus(fm.status) as MissionStatus,
          startLocation: 'Niamey',
          createdAt: fm.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: fm.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      // ── Log temps réel : détecter les transitions de statut ──────────────
      // Notamment les missions qui viennent de passer à "terminée" depuis le
      // mobile (bouton "Terminer la mission" du chauffeur).
      const prev = prevStatusesRef.current;
      mappedMissions.forEach((m) => {
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
      // Mémoriser les statuts courants pour la prochaine comparaison
      prevStatusesRef.current = Object.fromEntries(
        mappedMissions.map((m) => [m.id, m.status as string])
      );

      setMissions(mappedMissions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [allDrivers, allVehicles]); // On garde ces dépendances pour re-mapper si les drivers/vehicules changent, MAIS sans rappeler loadReferenceData

  const filteredMissions = missions.filter(mission =>
    filter === 'all' || mission.status === filter
  );

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
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={Route}
                      title={filter === 'all' ? 'Aucune mission' : 'Aucune mission pour ce filtre'}
                      description={
                        filter === 'all'
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
    </motion.div>
  );
}
