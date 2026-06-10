import { motion } from 'framer-motion';
import { X, MapPin, ArrowRight, User, Car, Calendar, FileText, Gauge, Fuel, StickyNote } from 'lucide-react';
import type { Mission } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { StatusChip } from '@/components/common';

interface MissionDetailsModalProps {
  mission: Mission;
  onClose: () => void;
}

// Ligne d'information réutilisable (icône + libellé + valeur)
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-accent-cyan" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary/60">{label}</p>
        <div className="text-sm text-text-primary break-words">{value}</div>
      </div>
    </div>
  );
}

export function MissionDetailsModal({ mission, onClose }: MissionDetailsModalProps) {
  const driverName = `${mission.driver.user.firstName} ${mission.driver.user.lastName}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-semibold text-text-primary">
              Détails de la mission
            </h2>
            <StatusChip status={mission.status} />
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 hover:bg-background-secondary rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Itinéraire */}
        <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-background-secondary">
          <MapPin className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <span className="text-sm text-text-primary truncate">
            {mission.startLocation || 'Niamey'}
          </span>
          <ArrowRight className="w-4 h-4 text-accent-cyan flex-shrink-0" />
          <span className="text-sm font-medium text-accent-cyan truncate">
            {mission.destination}
          </span>
        </div>

        {/* Grille d'infos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={FileText} label="Objet" value={mission.purpose || '—'} />
          <InfoRow icon={User} label="Chauffeur" value={driverName || '—'} />
          <InfoRow
            icon={Car}
            label="Véhicule"
            value={
              <>
                <span className="font-mono">{mission.vehicle.plateNumber}</span>
                {(mission.vehicle.brand || mission.vehicle.model) && (
                  <span className="text-text-secondary">
                    {' '}
                    · {mission.vehicle.brand} {mission.vehicle.model}
                  </span>
                )}
              </>
            }
          />
          <InfoRow icon={Calendar} label="Début" value={formatDateTime(mission.startTime)} />
          {mission.endTime && (
            <InfoRow icon={Calendar} label="Fin" value={formatDateTime(mission.endTime)} />
          )}
          {(mission.kmStart != null || mission.kmEnd != null) && (
            <InfoRow
              icon={Gauge}
              label="Kilométrage (départ → arrivée)"
              value={`${mission.kmStart ?? '—'} → ${mission.kmEnd ?? '—'} km`}
            />
          )}
          {mission.distance != null && (
            <InfoRow icon={Gauge} label="Distance" value={`${mission.distance} km`} />
          )}
          {mission.fuelConsumed != null && (
            <InfoRow icon={Fuel} label="Carburant" value={`${mission.fuelConsumed} L`} />
          )}
          {mission.absenceReason && (
            <InfoRow icon={StickyNote} label="Motif d'absence" value={mission.absenceReason} />
          )}
        </div>

        {/* Notes */}
        {mission.notes && (
          <div className="mt-5">
            <p className="text-xs text-text-secondary/60 mb-1">Notes</p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{mission.notes}</p>
          </div>
        )}

        {/* ID technique */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-[10px] text-text-secondary/50 font-mono break-all">
            ID : {mission.id}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
