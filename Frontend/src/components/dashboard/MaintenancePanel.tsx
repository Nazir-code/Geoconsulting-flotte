import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { MaintenanceRecord } from '@/types';
import { formatDate } from '@/lib/utils';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'scheduled':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      case 'scheduled':
        return 'Planifiée';
      case 'overdue':
        return 'En retard';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-secondary/50 backdrop-blur-xl rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-center h-32">
          <div className="loading-spinner" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background-secondary/50 backdrop-blur-xl rounded-xl border border-border p-6"
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
          <div className="text-center py-8">
            <Wrench className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
            <p className="text-text-secondary">Aucune maintenance en cours</p>
          </div>
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
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(record.status)} bg-current/10`}>
                  {getStatusText(record.status)}
                </span>
                {record.cost && (
                  <p className="text-xs text-text-secondary mt-1">
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