import { motion } from 'framer-motion';
import { MapPin, ArrowRight, CheckCircle, XCircle, User, Car } from 'lucide-react';
import type { Mission } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { StatusChip } from '@/components/common';

interface MissionCardProps {
  mission: Mission;
  index: number;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function MissionCard({ mission, index, onComplete, onCancel }: MissionCardProps) {
  const isActive = mission.status === 'en_cours' || mission.status === 'assignée';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
      className="mission-card"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Route Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusChip status={mission.status} />
            <span className="text-xs text-text-secondary/60 truncate-text">
              {formatDateTime(mission.startTime)}
            </span>
          </div>

          <div className="mission-route">
            <div className="mission-route-item">
              <MapPin className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <span className="text-sm text-text-primary truncate-text">
                {mission.startLocation || 'Niamey'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-accent-cyan flex-shrink-0" />
            <div className="mission-route-item">
              <MapPin className="w-4 h-4 text-accent-cyan flex-shrink-0" />
              <span className="text-sm font-medium text-accent-cyan truncate-text">
                {mission.destination}
              </span>
            </div>
          </div>

          <p className="text-xs text-text-secondary mt-2">
            {mission.purpose}
          </p>
        </div>

        {/* Driver & Vehicle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
              {mission.driver.user.avatar ? (
                <img
                  src={mission.driver.user.avatar}
                  alt={`${mission.driver.user.firstName} ${mission.driver.user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent-cyan" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-text-secondary/60">Chauffeur</p>
              <p className="text-sm text-text-primary">
                {mission.driver.user.firstName} {mission.driver.user.lastName.charAt(0)}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center">
              <Car className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary/60">Véhicule</p>
              <p className="text-sm font-mono text-text-primary">
                {mission.vehicle.plateNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex items-center gap-2 flex-wrap">
            {mission.status === 'en_cours' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComplete?.(mission.id)}
                className="btn btn-secondary text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Terminer</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCancel?.(mission.id)}
              className="btn btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4" />
              <span>Annuler</span>
            </motion.button>
          </div>
        )}

        {/* Completed Info */}
        {mission.status === 'terminée' && mission.endTime && (
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            {mission.distance && (
              <div>
                <p className="text-xs text-text-secondary/60">Distance</p>
                <p className="font-mono">{mission.distance} km</p>
              </div>
            )}
            {mission.fuelConsumed && (
              <div>
                <p className="text-xs text-text-secondary/60">Carburant</p>
                <p className="font-mono">{mission.fuelConsumed} L</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
