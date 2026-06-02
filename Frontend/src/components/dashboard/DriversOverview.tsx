import { motion } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';

/**
 * DriversOverview — chauffeurs actifs (online) vs inactifs (offline).
 * UI-only : reçoit des compteurs déjà dérivés du flux drivers de DashboardView.
 */

interface DriversOverviewProps {
  active: number;
  inactive: number;
}

export function DriversOverview({ active, inactive }: DriversOverviewProps) {
  const total = active + inactive;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-lime/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-lime" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-display font-semibold text-text-primary">
            Chauffeurs
          </h3>
        </div>
        <span className="text-xs text-text-secondary">{total} au total</span>
      </div>

      {/* Proportion actifs */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-3xl font-display font-bold text-emerald-400 leading-none">{active}</p>
          <p className="text-xs text-text-secondary mt-1">actifs maintenant</p>
        </div>
        <span className="text-sm font-medium text-text-secondary">{activePct}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-background-secondary mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${activePct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-emerald-400"
        />
      </div>

      {/* Tuiles actifs / inactifs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background-secondary/50 p-3">
          <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-none">{active}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate-text">Actifs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background-secondary/50 p-3">
          <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-none">{inactive}</p>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate-text">Inactifs</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
