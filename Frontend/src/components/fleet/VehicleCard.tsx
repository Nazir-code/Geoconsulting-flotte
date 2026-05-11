import { motion } from 'framer-motion';
import { Car, Gauge, Calendar, User, Edit, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/types';
import { formatNumber, getStatusColor, getStatusLabel } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
}

export function VehicleCard({ vehicle, index, onEdit, onDelete }: VehicleCardProps) {
  const statusColor = getStatusColor(vehicle.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card overflow-hidden card-hover"
    >
      {/* Vehicle Image */}
      <div className="relative h-40 overflow-hidden">
        {vehicle.image ? (
          <img
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background-secondary flex items-center justify-center">
            <Car className="w-16 h-16 text-text-secondary/30" strokeWidth={1} />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30 backdrop-blur-sm`}>
            {getStatusLabel(vehicle.status)}
          </span>
        </div>

        {/* Plate Number */}
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 bg-background-primary/80 border border-border rounded-lg text-xs font-mono text-text-primary backdrop-blur-sm">
            {vehicle.plateNumber}
          </span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        <h3 className="text-lg font-display font-semibold text-text-primary mb-1">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-sm text-text-secondary mb-3">
          {vehicle.year} • {vehicle.type === 'suv' ? 'SUV' : vehicle.type === 'pickup' ? 'Pickup' : vehicle.type === 'van' ? 'Van' : vehicle.type === 'truck' ? 'Camion' : 'Berline'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center">
              <Gauge className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary/60">Kilométrage</p>
              <p className="text-xs font-mono text-text-primary">{formatNumber(vehicle.mileage)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary/60">Prochaine revis.</p>
              <p className="text-xs font-mono text-text-primary">
                {vehicle.nextMaintenanceDate 
                  ? new Date(vehicle.nextMaintenanceDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Driver */}
        {vehicle.currentDriver && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-border">
              {vehicle.currentDriver.user.avatar ? (
                <img
                  src={vehicle.currentDriver.user.avatar}
                  alt={`${vehicle.currentDriver.user.firstName} ${vehicle.currentDriver.user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                  <User className="w-3 h-3 text-accent-cyan" />
                </div>
              )}
            </div>
            <span className="text-xs text-text-secondary">
              {vehicle.currentDriver.user.firstName} {vehicle.currentDriver.user.lastName.charAt(0)}.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="mt-4 pt-3 border-t border-border flex gap-2">
            {onEdit && (
              <motion.button
                onClick={() => onEdit(vehicle)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/50 rounded-lg text-accent-cyan text-xs font-medium transition-all"
              >
                <Edit className="w-3 h-3" />
                <span>Modifier</span>
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                onClick={() => {
                  if (confirm(`Êtes-vous sûr de vouloir supprimer ${vehicle.brand} ${vehicle.model}?`)) {
                    onDelete(vehicle.id);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs font-medium transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
