import { motion } from 'framer-motion';
import { Phone, Star, Route, User, Calendar } from 'lucide-react';
import type { Driver } from '@/types';
import { formatNumber, getStatusColor, getStatusLabel } from '@/lib/utils';

interface DriverCardProps {
  driver: Driver;
  index: number;
}

export function DriverCard({ driver, index }: DriverCardProps) {
  const statusColor = getStatusColor(driver.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.4 }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="glass-card p-4 flex items-center gap-4 card-hover"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border">
          {driver.user.avatar ? (
            <img
              src={driver.user.avatar}
              alt={`${driver.user.firstName} ${driver.user.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
              <User className="w-6 h-6 text-accent-cyan" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background-primary bg-${statusColor}-500`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {driver.user.firstName} {driver.user.lastName}
          </h3>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30`}>
            {getStatusLabel(driver.status)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{driver.user.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-accent-lime" />
            <span>{driver.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Route className="w-3 h-3 text-text-secondary/60" />
            <span className="text-[10px] text-text-secondary/60">
              {formatNumber(driver.totalMissions)} missions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-text-secondary/60" />
            <span className="text-[10px] text-text-secondary/60">
              Permis: {new Date(driver.licenseExpiry).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Current Vehicle */}
      {driver.currentVehicle && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-background-secondary rounded-lg">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {driver.currentVehicle.image ? (
              <img
                src={driver.currentVehicle.image}
                alt={driver.currentVehicle.plateNumber}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                <span className="text-[8px] text-accent-cyan">{driver.currentVehicle.plateNumber}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] text-text-secondary/60">Véhicule</p>
            <p className="text-xs font-mono text-text-primary">{driver.currentVehicle.plateNumber}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
