import { motion } from 'framer-motion';
import { Route, Fuel, Wrench, AlertTriangle } from 'lucide-react';
import type { ActivityItem } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const typeConfig = {
  mission: {
    icon: Route,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
  fuel: {
    icon: Fuel,
    color: 'text-accent-lime',
    bg: 'bg-accent-lime/10',
  },
  maintenance: {
    icon: Wrench,
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-accent-orange',
    bg: 'bg-accent-orange/10',
  },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card p-5 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-text-primary">
          Activité
        </h3>
        <button className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors">
          Voir tout
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
              className="activity-item"
            >
              <div className={`activity-icon ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
              </div>
              <div className="activity-content">
                <h4 className="activity-title">
                  {activity.title}
                </h4>
                <p className="activity-description">
                  {activity.description}
                </p>
                <span className="activity-time">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
