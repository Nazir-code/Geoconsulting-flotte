import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Satellite, AlertCircle, Radio } from 'lucide-react';
import { LiveMap } from './LiveMap';
import { TrackingPanel } from './TrackingPanel';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import { EmptyState } from '@/components/common';
import type { LivePosition } from '@/services/gpsSimulatorService';
import type { Mission } from '@/types';

interface LiveTrackingViewProps {
  missions: Mission[];
}

export function LiveTrackingView({ missions }: LiveTrackingViewProps) {
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [trails, setTrails] = useState<Record<string, Array<{ lat: number; lng: number }>>>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(3);

  // Missions actives — mémoïsées pour éviter une nouvelle référence à chaque render
  const activeMissions = useMemo(() =>
    missions.filter((m) =>
      (m.status as string) === 'en_cours' ||
      (m.status as string) === 'assignée' ||
      (m.status as string) === 'in_progress'
    ),
    [missions]
  );

  // Ref stable vers activeMissions : le listener y accède sans rouvrir la subscription
  // Garantit que N chauffeurs simultanés ne provoquent pas de re-subscription en boucle
  const activeMissionsRef = useRef(activeMissions);
  useEffect(() => {
    activeMissionsRef.current = activeMissions;
  }, [activeMissions]);

  // Abonnement unique aux positions GPS de TOUS les chauffeurs en ligne
  // La subscription est ouverte une seule fois (deps: []) et reste stable
  // même quand les missions ou les positions d'autres chauffeurs changent.
  useEffect(() => {
    const unsubscribe = FirestoreDriverService.onlineDriversListener((drivers) => {
      console.log(`📡 [LiveTracking] ${drivers.length} chauffeur(s) en ligne.`);

      // Snapshot courant des missions actives — sans déclencher de re-subscription
      const currentMissions = activeMissionsRef.current;

      const newPositions: LivePosition[] = drivers
        .filter(d => d.latitude !== undefined && d.longitude !== undefined)
        // Un véhicule n'est affiché comme actif QUE si le chauffeur a une mission en cours.
        // Signal d'autorité : drivers/{uid}.currentMission (positionné à l'acceptation,
        // remis à null à la fin/annulation par la transaction atomique des missions).
        // Fallback : une mission active référençant ce chauffeur (m.driverId === d.uid).
        // Sinon, le chauffeur peut être "online" (GPS encore actif) sans mission → on le cache.
        .filter(d => {
          const hasCurrentMission = typeof d.currentMission === 'string' && d.currentMission.length > 0;
          const hasActiveMission = currentMissions.some((m) => m.driverId === d.uid);
          return hasCurrentMission || hasActiveMission;
        })
        .map(d => {
          // Associer chaque chauffeur (uid = Firebase UID) à sa mission active
          // m.driverId est mappé depuis mission.assignedTo (= Firebase UID du chauffeur)
          const mission = currentMissions.find((m) => m.driverId === d.uid);

          return {
            vehicleId: d.currentMission || (mission?.vehicleId || `v-${d.uid || d.id}`),
            missionId: d.currentMission || mission?.id || '',
            lat: d.latitude!,
            lng: d.longitude!,
            speed: d.speed ? Math.round(d.speed) : 0,
            heading: d.heading || 0,
            progress: (d as unknown as { progress?: number }).progress || 0,
            distanceDone: 0,
            distanceTotal: 0,
            eta: 0,
            timestamp: d.lastLocationUpdate?.toDate().toISOString() || new Date().toISOString(),
          };
        });

      setPositions(newPositions);
      setLastUpdate(new Date());
      setRefreshCountdown(3);

      // Traces par vehicleId — chaque chauffeur a sa propre trace indépendante
      setTrails(prev => {
        const updatedTrails = { ...prev };
        newPositions.forEach(p => {
          if (!updatedTrails[p.vehicleId]) updatedTrails[p.vehicleId] = [];
          const lastPoint = updatedTrails[p.vehicleId][updatedTrails[p.vehicleId].length - 1];
          if (!lastPoint || lastPoint.lat !== p.lat || lastPoint.lng !== p.lng) {
            updatedTrails[p.vehicleId] = [...updatedTrails[p.vehicleId], { lat: p.lat, lng: p.lng }].slice(-20);
          }
        });
        return updatedTrails;
      });
    });

    return () => unsubscribe();
  // Subscription ouverte une seule fois — activeMissions accessible via activeMissionsRef
  }, []);

  // On affiche la carte si on a des positions OU des missions actives
  if (activeMissions.length === 0 && positions.length === 0) {
    return (
      <EmptyState
        icon={Satellite}
        title="Aucune mission en cours"
        description="Les véhicules en mission apparaîtront ici dès qu'un chauffeur en accepte une et passe en ligne."
        action={
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Connectez-vous sur l'application mobile pour activer le suivi GPS</span>
          </div>
        }
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {/* Info banner */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-xs">
        <Radio className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
        <span>
          Suivi <strong>Temps Réel Firebase</strong> activé — 
          Mise à jour directe depuis les appareils mobiles des chauffeurs.
        </span>
      </div>

      {/* Layout principal : carte + panneau */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '520px' }}>
        {/* Carte (2/3) */}
        <div className="lg:col-span-2 glass-card overflow-hidden" style={{ minHeight: '480px', height: '520px' }}>
          <LiveMap
            positions={positions}
            trails={trails}
            missions={activeMissions}
            selectedVehicleId={selectedVehicleId}
            onMarkerClick={setSelectedVehicleId}
          />
        </div>

        {/* Panneau latéral (1/3) */}
        <div className="lg:col-span-1" style={{ minHeight: '480px' }}>
          <TrackingPanel
            positions={positions}
            missions={activeMissions}
            selectedVehicleId={selectedVehicleId}
            lastUpdate={lastUpdate}
            refreshCountdown={refreshCountdown}
            onSelectVehicle={setSelectedVehicleId}
          />
        </div>
      </div>
    </motion.div>
  );
}
