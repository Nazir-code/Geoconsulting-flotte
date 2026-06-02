import { cn } from '@/lib/utils';

/**
 * Skeleton — placeholders de chargement (shimmer).
 * UI-only. Le shimmer est défini dans index.css (.skeleton).
 */

interface SkeletonProps {
  className?: string;
  /** Forme rapide : 'text' (ligne), 'circle' (avatar), 'rect' (bloc). */
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rect', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'text' && 'h-3.5 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
    />
  );
}

/** Skeleton préfabriqué pour une carte KPI. */
export function SkeletonKPICard() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="rect" className="w-10 h-10" />
        <Skeleton variant="text" className="w-10" />
      </div>
      <Skeleton variant="text" className="w-24 mb-2" />
      <Skeleton variant="text" className="w-16 h-6 mb-3" />
      <Skeleton variant="rect" className="w-full h-8" />
    </div>
  );
}

/** Skeleton préfabriqué pour une carte de mission / ligne de liste. */
export function SkeletonCard() {
  return (
    <div className="mission-card">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="rect" className="w-24 h-9" />
      </div>
    </div>
  );
}

/** Grille de skeletons (ex: liste de cartes en chargement). */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
