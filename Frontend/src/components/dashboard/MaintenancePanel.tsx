import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Car } from 'lucide-react';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import type { Vehicle } from '@/types';
import { formatDate } from '@/lib/utils';
import { EmptyState, Skeleton } from '@/components/common';

interface MaintenancePanelProps {
  limit?: number;
}

const STATUS_LABEL: Record<string, string> = {
  maintenance: 'En maintenance',
  unavailable: 'Indisponible',
};

export function MaintenancePanel({ limit = 5 }: MaintenancePanelProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Véhicules réels en temps réel ; on dérive ceux qui nécessitent un entretien.
    const unsubscribe = FirestoreVehicleService.allVehiclesListener((all) => {
      setVehicles(all);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const inMaintenance = vehicles
    .filter((v) => v.status === 'maintenance' || v.status === 'unavailable')
    .slice(0, limit);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Skeleton variant="rect" className="w-9 h-9" />
          <div className="space-y-2">
            <Skeleton variant="text" className="w-32 h-4" />
            <Skeleton variant="text" className="w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-16" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Wrench className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Suivi d'Entretien</h3>
            <p className="text-sm text-text-secondary">Véhicules en maintenance</p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-section', { detail: 'fuel' }))}
          title="Gérer la maintenance"
          className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="space-y-3">
        {inMaintenance.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun véhicule en maintenance"
            description="Tous les véhicules de la flotte sont opérationnels."
          />
        ) : (
          inMaintenance.map((v, index) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-background-primary/50 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <Car className="w-4 h-4 text-text-secondary" />
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    {v.plateNumber} — {v.model}
                  </p>
                  <p className="text-xs text-text-secondary">{v.brand}</p>
                  {v.lastMaintenanceDate && (
                    <p className="text-xs text-text-secondary">
                      Dernier entretien : {formatDate(v.lastMaintenanceDate)}
                    </p>
                  )}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-orange/10 text-accent-orange border border-accent-orange/30 whitespace-nowrap">
                {STATUS_LABEL[v.status] || v.status}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {inMaintenance.length >= limit && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-section', { detail: 'fuel' }))}
            className="w-full text-center text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            Voir toutes les maintenances →
          </button>
        </div>
      )}
    </motion.div>
  );
}
