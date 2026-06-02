import { motion } from 'framer-motion';
import { Route } from 'lucide-react';
import type { Mission } from '@/types';

/**
 * MissionsOverview — répartition des missions (en attente / en cours / terminées).
 * UI-only : reçoit les missions déjà chargées par DashboardView, calcule des
 * compteurs d'affichage. Aucune logique métier, aucun appel Firestore.
 */

interface MissionsOverviewProps {
  missions: Mission[];
}

const SEGMENTS = [
  { key: 'pending', label: 'En attente', dot: 'bg-amber-400', bar: 'bg-amber-400', text: 'text-amber-400' },
  { key: 'active', label: 'En cours', dot: 'bg-cyan-300', bar: 'bg-cyan-300', text: 'text-cyan-300' },
  { key: 'done', label: 'Terminées', dot: 'bg-emerald-400', bar: 'bg-emerald-400', text: 'text-emerald-400' },
] as const;

export function MissionsOverview({ missions }: MissionsOverviewProps) {
  const counts = {
    pending: missions.filter((m) => m.status === 'en_attente').length,
    active: missions.filter((m) => m.status === 'en_cours' || m.status === 'assignée').length,
    done: missions.filter((m) => m.status === 'terminée').length,
  };
  const total = counts.pending + counts.active + counts.done || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
            <Route className="w-4 h-4 text-accent-cyan" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-display font-semibold text-text-primary">
            Répartition des missions
          </h3>
        </div>
        <span className="text-xs text-text-secondary">{counts.pending + counts.active + counts.done} total</span>
      </div>

      {/* Barre segmentée proportionnelle */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-background-secondary mb-5">
        {SEGMENTS.map((s) => {
          const value = counts[s.key];
          const pct = (value / total) * 100;
          if (pct === 0) return null;
          return (
            <motion.div
              key={s.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={s.bar}
            />
          );
        })}
      </div>

      {/* Légende + compteurs */}
      <div className="grid grid-cols-3 gap-3">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-text-secondary truncate-text">{s.label}</span>
            </div>
            <span className={`text-xl font-display font-bold ${s.text}`}>{counts[s.key]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
