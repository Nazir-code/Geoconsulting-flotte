import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmptyState — état vide propre et cohérent (aucune donnée).
 * UI-only. Réutilisable dans toutes les vues (missions, flotte, rapports…).
 */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Action optionnelle (bouton). */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('empty-state', className)}
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        </div>
      )}
      <div className="max-w-sm">
        <p className="text-text-primary font-medium mb-1">{title}</p>
        {description && <p className="text-text-secondary/70 text-sm">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
