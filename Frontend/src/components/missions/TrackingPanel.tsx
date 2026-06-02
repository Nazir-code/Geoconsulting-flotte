import { motion } from 'framer-motion';
import { Navigation, Clock, Gauge, MapPin, ChevronRight, User, Radio } from 'lucide-react';
import type { LivePosition } from '@/services/gpsSimulatorService';
import type { Mission } from '@/types';
import { cn } from '@/lib/utils';
import { StatusChip, EmptyState } from '@/components/common';

// Couleurs stables par véhicule (même ordre que LiveMap)
const TRACK_COLORS = ['#06b6d4', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

interface TrackingPanelProps {
  positions: LivePosition[];
  missions: Mission[];
  selectedVehicleId: string | null;
  lastUpdate: Date | null;
  refreshCountdown: number; // secondes avant prochain refresh
  onSelectVehicle: (id: string | null) => void;
}

export function TrackingPanel({
  positions,
  missions,
  selectedVehicleId,
  lastUpdate,
  refreshCountdown,
  onSelectVehicle,
}: TrackingPanelProps) {
  const colorOf = (vehicleId: string) => {
    const idx = positions.findIndex((p) => p.vehicleId === vehicleId);
    return TRACK_COLORS[idx % TRACK_COLORS.length] ?? '#06b6d4';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const avgSpeed =
    positions.length > 0
      ? Math.round(positions.reduce((sum, p) => sum + p.speed, 0) / positions.length)
      : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header panneau — état temps réel */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-text-primary">Suivi en direct</span>
          </div>

          {/* Badge LIVE */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/30 tracking-widest">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Dernière MAJ + countdown */}
        <div className="flex items-center justify-between text-xs text-text-secondary/70">
          <span>Mise à jour : {formatTime(lastUpdate)}</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span
              className={cn(
                'font-mono font-semibold',
                refreshCountdown <= 1 ? 'text-accent-cyan' : 'text-text-secondary'
              )}
            >
              {refreshCountdown}s
            </span>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-text-secondary/70 mb-1">Véhicules actifs</p>
          <p className="text-2xl font-bold font-mono text-accent-cyan">{positions.length}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-text-secondary/70 mb-1">Vitesse moy.</p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {avgSpeed}
            <span className="text-xs text-text-secondary/60 font-normal"> km/h</span>
          </p>
        </div>
      </div>

      {/* Fiches chauffeur (profil + mission + statut) */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {positions.length === 0 && (
          <div className="glass-card">
            <EmptyState
              icon={Navigation}
              title="Aucun véhicule en mission"
              description="Les chauffeurs en mission active apparaîtront ici en temps réel."
            />
          </div>
        )}

        {positions.map((pos, idx) => {
          const mission = missions.find((m) => m.id === pos.missionId);
          const plate = mission?.vehicle?.plateNumber ?? pos.vehicleId;
          const driver = mission?.driver?.user;
          const fullName = driver ? `${driver.firstName} ${driver.lastName}`.trim() : 'Chauffeur';
          const initials = driver
            ? `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase() || 'CH'
            : 'CH';
          const color = colorOf(pos.vehicleId);
          const isSelected = selectedVehicleId === pos.vehicleId;

          return (
            <motion.button
              key={pos.vehicleId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => onSelectVehicle(isSelected ? null : pos.vehicleId)}
              className={cn(
                'glass-card p-4 text-left transition-all border w-full',
                isSelected
                  ? 'border-accent-cyan/40 bg-accent-cyan/5'
                  : 'border-transparent hover:border-border'
              )}
            >
              {/* En-tête : profil chauffeur + statut mission */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center"
                      style={{ borderColor: color + '55', background: color + '14' }}
                    >
                      {driver?.avatar ? (
                        <img src={driver.avatar} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold" style={{ color }}>
                          {initials}
                        </span>
                      )}
                    </div>
                    {/* pastille live */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background-primary" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate-text flex items-center gap-1">
                      <User className="w-3 h-3 text-text-secondary/50 flex-shrink-0" />
                      {fullName}
                    </p>
                    <span
                      className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded inline-block mt-0.5"
                      style={{ background: color + '18', color }}
                    >
                      {plate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {mission && <StatusChip status={mission.status} size="sm" />}
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-text-secondary/40 transition-transform',
                      isSelected && 'rotate-90 text-accent-cyan'
                    )}
                  />
                </div>
              </div>

              {/* Route */}
              {mission && (
                <div className="flex items-center gap-1 text-xs text-text-secondary/70 mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate-text">{mission.startLocation}</span>
                  <span className="text-accent-cyan/50 mx-1 flex-shrink-0">→</span>
                  <span className="truncate-text font-medium" style={{ color }}>
                    {mission.destination}
                  </span>
                </div>
              )}

              {/* Stats vitesse + ETA + distance */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-0.5">
                    <Gauge className="w-3 h-3 text-text-secondary/40" />
                  </div>
                  <p className="text-[11px] font-mono font-bold text-text-primary">{pos.speed}</p>
                  <p className="text-[9px] text-text-secondary/40">km/h</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-0.5">
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
