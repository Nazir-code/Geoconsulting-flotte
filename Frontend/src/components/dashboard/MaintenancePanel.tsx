import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { MaintenanceRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { StatusChip, EmptyState, Skeleton } from '@/components/common';

interface MaintenancePanelProps {
  limit?: number;
}

export function MaintenancePanel({ limit = 5 }: MaintenancePanelProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceData();

    // Subscribe to maintenance updates
    const unsubscribe = dataService.subscribe('maintenance_update', () => {
      loadMaintenanceData();
    });

    return unsubscribe;
  }, []);

  const loadMaintenanceData = async () => {
    try {
      const records = await dataService.getMaintenanceRecords();
      setMaintenanceRecords(records.slice(0, limit));
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

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
            <p className="text-sm text-text-secondary">Maintenance & Réparations</p>
          </div>
        </div>
        <button className="p-2 hover:bg-background-tertiary rounded-lg transition-colors">
          <Plus className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="space-y-3">
        {maintenanceRecords.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucune maintenance en cours"
            description="Les entretiens planifiés et en cours s'afficheront ici."
          />
        ) : (
          maintenanceRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-background-primary/50 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    {record.vehicle.plateNumber} - {record.vehicle.model}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {record.description}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(record.scheduledDate)}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <StatusChip status={record.status} size="sm" />
                {record.cost && (
                  <p className="text-xs text-text-secondary">
                    {record.cost.toLocaleString()} FCFA
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {maintenanceRecords.length >= limit && (
        <div className="mt-4 pt-4 border-t border-border">
          <button className="w-full text-center text-sm text-cyan-500 hover:text-cyan-400 transition-colors">
            Voir toutes les maintenances →
          </button>
        </div>
      )}
    </motion.div>
  );
}