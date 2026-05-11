import { motion } from 'framer-motion';
import { Navigation, Clock, Gauge, MapPin, ChevronRight } from 'lucide-react';
import type { LivePosition } from '@/services/gpsSimulatorService';
import type { Mission } from '@/types';
import { cn } from '@/lib/utils';

// Couleurs stables par véhicule (même ordre que LiveMap)
const TRACK_COLORS = ['#06b6d4', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

interface TrackingPanelProps {
  positions: LivePosition[];
  missions: Mission[];
  selectedVehicleId: string | null;
  isPaused: boolean;
  lastUpdate: Date | null;
  refreshCountdown: number; // secondes avant prochain refresh
  onSelectVehicle: (id: string | null) => void;
  onTogglePause: () => void;
}

export function TrackingPanel({
  positions,
  missions,
  selectedVehicleId,
  isPaused,
  lastUpdate,
  refreshCountdown,
  onSelectVehicle,
  onTogglePause,
}: TrackingPanelProps) {
  const colorOf = (vehicleId: string) => {
    const idx = positions.findIndex((p) => p.vehicleId === vehicleId);
    return TRACK_COLORS[idx % TRACK_COLORS.length] ?? '#06b6d4';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header panneau */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              {!isPaused && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              )}
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {isPaused ? 'Simulation en pause' : 'Suivi en direct'}
            </span>
          </div>

          {/* Badge LIVE */}
          {!isPaused && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 tracking-widest">
              LIVE
            </span>
          )}
        </div>

        {/* Dernière MAJ + countdown */}
        <div className="flex items-center justify-between text-xs text-text-secondary/60">
          <span>Mise à jour : {formatTime(lastUpdate)}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className={cn(
              'font-mono font-semibold',
              refreshCountdown <= 1 ? 'text-accent-cyan' : 'text-text-secondary'
            )}>
              {isPaused ? '—' : `${refreshCountdown}s`}
            </span>
          </div>
        </div>

        {/* Bouton pause */}
        <button
          onClick={onTogglePause}
          className={cn(
            'mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-all border',
            isPaused
              ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/20'
              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
          )}
        >
          {isPaused ? '▶ Reprendre la simulation' : '⏸ Pause'}
        </button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-text-secondary/60 mb-1">Véhicules actifs</p>
          <p className="text-2xl font-bold font-mono text-accent-cyan">{positions.length}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-text-secondary/60 mb-1">Vitesse moy.</p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {positions.length > 0
              ? Math.round(positions.reduce((sum, p) => sum + p.speed, 0) / positions.length)
              : 0}
            <span className="text-xs text-text-secondary/60 font-normal"> km/h</span>
          </p>
        </div>
      </div>

      {/* Cartes des véhicules */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {positions.length === 0 && (
          <div className="glass-card p-6 text-center">
            <Navigation className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">Aucun véhicule en mission</p>
          </div>
        )}

        {positions.map((pos, idx) => {
          const mission = missions.find((m) => m.id === pos.missionId);
          const plate = mission?.vehicle?.plateNumber ?? pos.vehicleId;
          const driver = mission?.driver?.user;
          const color = colorOf(pos.vehicleId);
          const isSelected = selectedVehicleId === pos.vehicleId;

          return (
            <motion.button
              key={pos.vehicleId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelectVehicle(isSelected ? null : pos.vehicleId)}
              className={cn(
                'glass-card p-4 text-left transition-all border w-full',
                isSelected
                  ? 'border-accent-cyan/40 bg-accent-cyan/5'
                  : 'border-transparent hover:border-border'
              )}
            >
              {/* Header carte véhicule */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Indicateur couleur trace */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <span
                    className="text-sm font-bold font-mono px-2 py-0.5 rounded"
                    style={{ background: color + '18', color }}
                  >
                    {plate}
                  </span>
                  {/* Badge EN MOUVEMENT */}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    LIVE
                  </span>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 text-text-secondary/40 transition-transform',
                  isSelected && 'rotate-90 text-accent-cyan'
                )} />
              </div>

              {/* Chauffeur & Route */}
              {driver && (
                <p className="text-xs text-text-secondary mb-1">
                  👤 {driver.firstName} {driver.lastName}
                </p>
              )}
              {mission && (
                <div className="flex items-center gap-1 text-xs text-text-secondary/60 mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span>{mission.startLocation}</span>
                  <span className="text-accent-cyan/50 mx-1">→</span>
                  <span style={{ color }}>{mission.destination}</span>
                </div>
              )}

              {/* Stats vitesse + ETA */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Gauge className="w-3 h-3 text-text-secondary/40" />
                  </div>
                  <p className="text-[11px] font-mono font-bold text-text-primary">{pos.speed}</p>
                  <p className="text-[9px] text-text-secondary/40">km/h</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Clock className="w-3 h-3 text-text-secondary/40" />
                  </div>
                  <p className="text-[11px] font-mono font-bold text-text-primary">{pos.eta}</p>
                  <p className="text-[9px] text-text-secondary/40">min ETA</p>
                </div>
                <div className="text-center">
                  <div className="mb-0.5 h-3" />
                  <p className="text-[11px] font-mono font-bold" style={{ color }}>
                    {pos.distanceDone}
                  </p>
                  <p className="text-[9px] text-text-secondary/40">/{pos.distanceTotal} km</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between text-[9px] text-text-secondary/40 mb-1">
                  <span>Progression</span>
                  <span style={{ color }}>{pos.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pos.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
