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
  color: 'cyan' | 'violet' | 'lime' | 'orange';
  delay?: number;
}

const colorMap = {
  cyan: {
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/30',
    text: 'text-accent-cyan',
    glow: 'shadow-glow-cyan',
  },
  violet: {
    bg: 'bg-accent-violet/10',
    border: 'border-accent-violet/30',
    text: 'text-accent-violet',
    glow: 'shadow-[0_0_18px_rgba(184,41,247,0.22)]',
  },
  lime: {
    bg: 'bg-accent-lime/10',
    border: 'border-accent-lime/30',
    text: 'text-accent-lime',
    glow: 'shadow-[0_0_18px_rgba(209,243,102,0.22)]',
  },
  orange: {
    bg: 'bg-accent-orange/10',
    border: 'border-accent-orange/30',
    text: 'text-accent-orange',
    glow: 'shadow-[0_0_18px_rgba(255,106,61,0.22)]',
  },
};

export function KPICard({
  title,
  value,
  suffix,
  change,
  changeLabel,
  icon: Icon,
  color,
  delay = 0,
}: KPICardProps) {
  const colors = colorMap[color];
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

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
      className={`glass-card p-5 ${colors.border} hover:${colors.glow} transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.text}`} strokeWidth={1.5} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-text-secondary'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-text-secondary text-sm mb-1">{title}</p>
        <h3 className={`text-2xl font-display font-bold ${colors.text}`}>
          {formatValue(value)}
        </h3>
        {changeLabel && (
          <p className="text-text-secondary/60 text-xs mt-1">{changeLabel}</p>
        )}
      </div>

      {/* Sparkline placeholder */}
      <div className="mt-4 h-8 flex items-end gap-0.5">
        {[40, 65, 45, 80, 55, 70, 60, 85, 75, 90].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: delay + 0.1 + i * 0.03, duration: 0.3 }}
            className={`flex-1 rounded-t-sm ${colors.bg} opacity-60`}
          />
        ))}
      </div>
    </motion.div>
  );
}
