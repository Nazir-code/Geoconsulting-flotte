import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Satellite, AlertCircle, Radio } from 'lucide-react';
import { LiveMap } from './LiveMap';
import { TrackingPanel } from './TrackingPanel';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
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
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Missions en cours uniquement
  const activeMissions = missions.filter((m) => m.status === 'in_progress');

  // Abonnement aux positions GPS réelles via Firestore Drivers
  useEffect(() => {
    const unsubscribe = FirestoreDriverService.onlineDriversListener((drivers) => {
      const newPositions: LivePosition[] = drivers
        .filter(d => d.latitude && d.longitude) // Seulement ceux qui ont une position
        .map(d => {
          // Trouver la mission correspondante pour ce driver
          const mission = activeMissions.find(m => m.driverId === d.id || m.driverId === d.uid);
          
          return {
            vehicleId: d.currentMission ? d.currentMission : (mission?.vehicleId || `v-${d.id}`),
            missionId: d.currentMission || mission?.id || '',
            lat: d.latitude!,
            lng: d.longitude!,
            speed: (d as any).speed || 0,
            heading: (d as any).heading || 0,
            progress: (d as any).progress || 0,
            distanceDone: 0,
            distanceTotal: 0,
            eta: 0,
            timestamp: d.lastLocationUpdate?.toDate().toISOString() || new Date().toISOString(),
          };
        });

      setPositions(newPositions);
      setLastUpdate(new Date());
      setRefreshCountdown(3);

      // Pour les traces, on pourrait les stocker dans Firestore aussi, mais pour l'instant on garde une trace locale
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
  }, [activeMissions]);

  // Countdown visuel pour simuler l'attente de la prochaine synchro
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (activeMissions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-background-secondary flex items-center justify-center">
          <Satellite className="w-8 h-8 text-text-secondary/30" />
        </div>
        <div className="text-center">
          <p className="text-text-secondary font-medium mb-1">Aucune mission en cours sur Firestore</p>
          <p className="text-text-secondary/50 text-sm">
            Les véhicules en mission apparaîtront ici dès que les drivers seront en ligne
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Connectez-vous sur l'application mobile pour activer le suivi GPS</span>
        </div>
      </motion.div>
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
            isPaused={false}
            lastUpdate={lastUpdate}
            refreshCountdown={refreshCountdown}
            onSelectVehicle={setSelectedVehicleId}
            onTogglePause={() => {}}
          />
        </div>
      </div>
    </motion.div>
  );
}
