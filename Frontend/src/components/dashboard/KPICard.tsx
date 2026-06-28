import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { formatFCFA, formatNumber } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  /** Si fournie, une vraie image remplace l'icône SVG (ex. photo véhicule). */
  image?: string;
  /** Si fourni, la carte devient cliquable (raccourci vers une section). */
  onClick?: () => void;
  color: 'cyan' | 'violet' | 'lime' | 'orange';
  delay?: number;
}

/**
 * Map de couleurs — classes STATIQUES uniquement (compilées par le JIT Tailwind).
 * `gradient` pointe vers un token CSS (var) appliqué en inline style.
 */
const colorMap = {
  cyan: {
    bg: 'bg-accent-cyan/10',
    text: 'text-accent-cyan',
    bar: 'bg-accent-cyan/50',
    gradient: 'var(--gradient-cyan)',
  },
  violet: {
    bg: 'bg-accent-violet/10',
    text: 'text-accent-violet',
    bar: 'bg-accent-violet/50',
    gradient: 'var(--gradient-violet)',
  },
  lime: {
    bg: 'bg-accent-lime/10',
    text: 'text-accent-lime',
    bar: 'bg-accent-lime/50',
    gradient: 'var(--gradient-lime)',
  },
  orange: {
    bg: 'bg-accent-orange/10',
    text: 'text-accent-orange',
    bar: 'bg-accent-orange/50',
    gradient: 'var(--gradient-orange)',
  },
};

export function KPICard({
  title,
  value,
  suffix,
  change,
  changeLabel,
  icon: Icon,
  image,
  onClick,
  color,
  delay = 0,
}: KPICardProps) {
  const colors = colorMap[color];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const formatValue = (val: number) => {
    if (suffix === 'FCFA') return formatFCFA(val);
    return formatNumber(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`kpi-card relative ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Accent gradient léger (coin supérieur) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ backgroundImage: colors.gradient }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          {image ? (
            <div className="w-24 h-20 flex items-center justify-center">
              <img src={image} alt={title} className="w-full h-full object-contain drop-shadow-md" />
            </div>
          ) : (
            <div className={`w-11 h-11 rounded-2xl ${colors.bg} flex items-center justify-center`}>
              <Icon className={`w-[22px] h-[22px] ${colors.text}`} strokeWidth={1.5} />
            </div>
          )}
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-text-secondary'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>

        <p className="text-text-secondary text-[11px] font-medium uppercase tracking-wider mb-1.5">{title}</p>
        <h3 className="text-3xl font-display font-bold tracking-tight text-text-primary truncate-text">
          {formatValue(value)}
        </h3>
        {changeLabel && (
          <p className="text-text-secondary/60 text-xs mt-1">{changeLabel}</p>
        )}

        {/* Sparkline décoratif (subtil) */}
        <div className="mt-4 h-8 flex items-end gap-0.5">
          {[40, 65, 45, 80, 55, 70, 60, 85, 75, 90].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: delay + 0.1 + i * 0.03, duration: 0.3 }}
              className={`flex-1 rounded-t-sm ${colors.bar}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
