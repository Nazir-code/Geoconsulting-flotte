import { motion } from 'framer-motion';
import { ArrowRight, Clock, Route } from 'lucide-react';
import type { Mission } from '@/types';
import { formatTime } from '@/lib/utils';
import { StatusChip, EmptyState } from '@/components/common';

interface MissionStripProps {
  missions: Mission[];
}

export function MissionStrip({ missions }: MissionStripProps) {
  const activeMissions = missions.filter(m => m.status === 'en_cours' || m.status === 'assignée').slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold text-text-primary">
          Missions en cours
        </h3>
        <button className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors">
          Voir tout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeMissions.map((mission, index) => {
          const driverUser = mission.driver?.user;
          const firstName = driverUser?.firstName || 'Chauffeur';
          const lastName = driverUser?.lastName || '';
          const initials = `${firstName[0] || 'C'}${lastName[0] || ''}`;
          const extra = mission as unknown as { location?: string; title?: string };
          const destination = mission.destination || extra.location || extra.title || 'Destination';
          
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="p-3 rounded-xl bg-background-secondary/50 border border-border hover:border-accent-cyan/30 transition-all cursor-pointer"
            >
              {/* Route */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-text-primary">
                  {mission.startLocation || 'Niamey'}
                </span>
                <ArrowRight className="w-3 h-3 text-text-secondary" />
                <span className="text-xs font-medium text-accent-cyan">
                  {destination}
                </span>
              </div>

              {/* Driver & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-border">
                    {driverUser?.avatar ? (
                      <img 
                        src={driverUser.avatar} 
                        alt={`${firstName} ${lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                        <span className="text-[8px] text-accent-cyan">
                          {initials}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-text-secondary">
                    {firstName} {lastName ? `${lastName.charAt(0)}.` : ''}
                  </span>
                </div>

                <StatusChip status={mission.status} size="sm" />
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-text-secondary/60">
                <Clock className="w-3 h-3" />
                <span>{formatTime(mission.startTime)}</span>
              </div>
            </motion.div>
          );
        })}

        {activeMissions.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Route}
              title="Aucune mission en cours"
              description="Les missions actives apparaîtront ici dès qu'un chauffeur en accepte une."
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
