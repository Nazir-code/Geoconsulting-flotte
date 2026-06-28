import { motion } from 'framer-motion';
import { Phone, Star, Route, User, Calendar, Trash2, Check, X } from 'lucide-react';
import type { Driver } from '@/types';
import { formatNumber } from '@/lib/utils';
import { StatusChip } from '@/components/common';
import { FirestoreDriverService } from '@/services/firestoreDriverService';

interface DriverCardProps {
  driver: Driver;
  index: number;
  onDelete?: (uid: string) => void;
}

export function DriverCard({ driver, index, onDelete }: DriverCardProps) {
  const isActive = driver.status === 'active';
  const uid = driver.user?.id || driver.userId || driver.id;
  const isPending = driver.approvalStatus === 'pending';
  const isRejected = driver.approvalStatus === 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.4 }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="glass-card p-4 flex items-center gap-4 card-hover"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border">
          {driver.user.avatar ? (
            <img
              src={driver.user.avatar}
              alt={`${driver.user.firstName} ${driver.user.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
              <User className="w-6 h-6 text-accent-cyan" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background-primary ${
            isActive ? 'bg-emerald-500' : 'bg-slate-500'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {driver.user.firstName} {driver.user.lastName}
          </h3>
          {isPending ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-orange/15 text-accent-orange whitespace-nowrap">
              En attente
            </span>
          ) : isRejected ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 whitespace-nowrap">
              Refusé
            </span>
          ) : (
            <StatusChip status={driver.status} size="sm" />
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{driver.user.phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-accent-lime" />
            <span>{driver.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Route className="w-3 h-3 text-text-secondary/60" />
            <span className="text-[10px] text-text-secondary/60">
              {formatNumber(driver.totalMissions)} missions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-text-secondary/60" />
            <span className="text-[10px] text-text-secondary/60">
              Permis: {new Date(driver.licenseExpiry).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Current Vehicle */}
      {driver.currentVehicle && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-background-secondary rounded-lg">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {driver.currentVehicle.image ? (
              <img
                src={driver.currentVehicle.image}
                alt={driver.currentVehicle.plateNumber}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                <span className="text-[8px] text-accent-cyan">{driver.currentVehicle.plateNumber}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] text-text-secondary/60">Véhicule</p>
            <p className="text-xs font-mono text-text-primary">{driver.currentVehicle.plateNumber}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2">
        {isPending && (
          <>
            <button
              onClick={() => FirestoreDriverService.setApprovalStatus(uid, 'approved')}
              title="Approuver l'inscription"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Approuver</span>
            </button>
            <button
              onClick={() => FirestoreDriverService.setApprovalStatus(uid, 'rejected')}
              title="Refuser l'inscription"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refuser</span>
            </button>
          </>
        )}
        <button
          onClick={() => onDelete?.(uid)}
          title="Supprimer le chauffeur"
          className="p-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
