import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';

/**
 * StatusChip — chip de statut unifié (missions, chauffeurs, véhicules…).
 *
 * UI-only : ne modifie aucune logique métier. Il s'appuie sur les helpers
 * existants `getStatusColor` / `getStatusLabel` pour rester cohérent avec
 * tous les statuts déjà gérés (français ET anglais canonique).
 *
 * Pourquoi ce composant : plusieurs cartes construisaient leurs couleurs via
 * des classes Tailwind dynamiques (`bg-${color}-500/20`) que le compilateur
 * JIT ne génère pas → couleurs absentes. Ici, chaque variante utilise des
 * classes statiques, donc réellement compilées et affichées.
 */

type StatusColorName =
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'orange'
  | 'yellow'
  | 'red'
  | 'slate';

const COLOR_CLASSES: Record<StatusColorName, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const DOT_CLASSES: Record<StatusColorName, string> = {
  emerald: 'bg-emerald-400',
  cyan: 'bg-cyan-300',
  blue: 'bg-blue-400',
  orange: 'bg-orange-400',
  yellow: 'bg-amber-400',
  red: 'bg-red-400',
  slate: 'bg-slate-400',
};

interface StatusChipProps {
  /** Statut brut (ex: 'en_cours', 'in_progress', 'available'…). */
  status: string;
  /** Libellé personnalisé (sinon dérivé via getStatusLabel). */
  label?: string;
  /** Affiche un point coloré (pulsé pour les statuts actifs). */
  dot?: boolean;
  /** Anime le point (utile pour "en cours" / "actif"). */
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusChip({
  status,
  label,
  dot = true,
  pulse,
  size = 'md',
  className,
}: StatusChipProps) {
  const color = getStatusColor(status) as StatusColorName;
  const colorClasses = COLOR_CLASSES[color] ?? COLOR_CLASSES.slate;
  const dotClass = DOT_CLASSES[color] ?? DOT_CLASSES.slate;

  // Pulse auto pour les statuts "vivants" si non précisé explicitement
  const isLive =
    pulse ??
    ['en_cours', 'in_progress', 'active', 'on_mission'].includes(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap transition-colors duration-300',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        colorClasses,
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {isLive && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                dotClass
              )}
            />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotClass)} />
        </span>
      )}
      {label ?? getStatusLabel(status)}
    </span>
  );
}

export default StatusChip;
