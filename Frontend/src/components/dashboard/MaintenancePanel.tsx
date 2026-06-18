import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Check, Car } from 'lucide-react';
import {
  FirestoreMaintenanceService,
  type MaintenanceRequest,
} from '@/services/firestoreMaintenanceService';
import { EmptyState, Skeleton, useToast } from '@/components/common';

interface MaintenancePanelProps {
  limit?: number;
}

export function MaintenancePanel({ limit = 5 }: MaintenancePanelProps) {
  const toast = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Demandes d'entretien réelles, signalées par les chauffeurs (temps réel).
    const unsubscribe = FirestoreMaintenanceService.allRequestsListener((all) => {
      setRequests(all);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openRequests = requests.filter((r) => r.status === 'requested').slice(0, limit);

  const handleResolve = async (id: string) => {
    try {
      await FirestoreMaintenanceService.resolveRequest(id);
      toast.success('Entretien résolu', 'La demande a été marquée comme traitée.');
    } catch (error) {
      console.error('Error resolving maintenance request:', error);
      toast.error('Échec', 'Impossible de mettre à jour la demande.');
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
            <p className="text-sm text-text-secondary">
              Demandes signalées par les chauffeurs
            </p>
          </div>
        </div>
        {openRequests.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-orange/10 text-accent-orange border border-accent-orange/30">
            {requests.filter((r) => r.status === 'requested').length} ouverte(s)
          </span>
        )}
      </div>

      <div className="space-y-3">
        {openRequests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucune demande d'entretien"
            description="Les signalements des chauffeurs (depuis l'app mobile) s'afficheront ici."
          />
        ) : (
          openRequests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between gap-3 p-3 bg-background-primary/50 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Car className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary text-sm">
                    {req.vehiclePlate} · <span className="text-accent-orange">{req.type}</span>
                  </p>
                  <p className="text-xs text-text-secondary line-clamp-2">{req.description}</p>
                  <p className="text-[11px] text-text-secondary/60 mt-0.5">
                    {req.driverName ? `Signalé par ${req.driverName}` : 'Signalé par un chauffeur'}
                    {req.mileage ? ` · ${req.mileage} km` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleResolve(req.id)}
                title="Marquer comme résolu"
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Résolu</span>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
