import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Droplets,
  Shield,
  ClipboardCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  allAlertsListener,
  generateAndSyncAlerts,
  resolveAlert,
  reopenAlert,
} from '@/services/firestoreAlertService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import type { Alert, AlertType, AlertSeverity } from '@/types';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'critical' | 'warning' | 'info' | 'resolved';

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { label: 'Critique',     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/40',    icon: ShieldAlert },
  warning:  { label: 'Avertissement', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  icon: AlertTriangle },
  info:     { label: 'Info',          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/40',   icon: Info },
};

const TYPE_CONFIG: Record<AlertType, { label: string; icon: React.ElementType }> = {
  maintenance_overdue: { label: 'Maintenance',         icon: Wrench },
  oil_change:          { label: 'Vidange',             icon: Droplets },
  insurance_expired:   { label: 'Assurance',           icon: Shield },
  inspection_due:      { label: 'Contrôle technique',  icon: ClipboardCheck },
  abnormal_consumption:{ label: 'Conso. anormale',     icon: AlertTriangle },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Écoute temps réel de toutes les alertes
  useEffect(() => {
    const unsub = allAlertsListener(setAlerts);
    return unsub;
  }, []);

  // Génération auto au premier montage
  useEffect(() => {
    handleSync(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = useCallback(async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    if (!silent) setSyncMessage(null);
    try {
      // Lit tous les véhicules puis génère les alertes
      const vehicles = await new Promise<Awaited<ReturnType<typeof FirestoreVehicleService.getVehicle>>[]>((resolve) => {
        const unsub = FirestoreVehicleService.allVehiclesListener((v) => {
          unsub();
          resolve(v as never);
        });
      });
      const count = await generateAndSyncAlerts(vehicles as never);
      if (!silent) setSyncMessage(`${count} alerte${count !== 1 ? 's' : ''} générée${count !== 1 ? 's' : ''}.`);
    } catch (e) {
      if (!silent) setSyncMessage('Erreur lors de la synchronisation.');
      console.error('[AlertsView] sync error:', e);
    } finally {
      setIsSyncing(false);
      if (!silent) setTimeout(() => setSyncMessage(null), 3000);
    }
  }, [isSyncing]);

  const handleResolve = async (id: string) => {
    setBusyId(id);
    try { await resolveAlert(id); } finally { setBusyId(null); }
  };

  const handleReopen = async (id: string) => {
    setBusyId(id);
    try { await reopenAlert(id); } finally { setBusyId(null); }
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const unresolved = alerts.filter((a) => !a.isResolved);
  const criticalCount = unresolved.filter((a) => a.severity === 'critical').length;
  const warningCount  = unresolved.filter((a) => a.severity === 'warning').length;
  const infoCount     = unresolved.filter((a) => a.severity === 'info').length;
  const resolvedCount = alerts.filter((a) => a.isResolved).length;

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = alerts.filter((a) => {
    if (activeTab === 'all')      return !a.isResolved;
    if (activeTab === 'resolved') return a.isResolved;
    return !a.isResolved && a.severity === activeTab;
  });

  const tabs: { id: FilterTab; label: string; count: number; color?: string }[] = [
    { id: 'all',      label: 'Toutes',          count: unresolved.length },
    { id: 'critical', label: 'Critiques',        count: criticalCount,  color: 'text-red-400' },
    { id: 'warning',  label: 'Avertissements',   count: warningCount,   color: 'text-amber-400' },
    { id: 'info',     label: 'Info',             count: infoCount,      color: 'text-blue-400' },
    { id: 'resolved', label: 'Résolues',         count: resolvedCount,  color: 'text-text-secondary' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={criticalCount} label="Critiques"        color="text-red-400"    bg="bg-red-500/8"    icon={ShieldAlert} />
        <StatCard value={warningCount}  label="Avertissements"   color="text-amber-400"  bg="bg-amber-500/8"  icon={AlertTriangle} />
        <StatCard value={infoCount}     label="Informations"     color="text-blue-400"   bg="bg-blue-500/8"   icon={Info} />
        <StatCard value={resolvedCount} label="Résolues"         color="text-text-secondary" bg="bg-background-secondary" icon={CheckCircle2} />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-background-secondary rounded-xl p-1 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'bg-background-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeTab === tab.id && tab.color ? tab.color : 'text-text-secondary',
                  'bg-background-secondary'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sync button */}
        <div className="flex items-center gap-3">
          {syncMessage && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-text-secondary"
            >
              {syncMessage}
            </motion.span>
          )}
          <button
            onClick={() => handleSync(false)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} strokeWidth={2} />
            Synchroniser
          </button>
        </div>
      </div>

      {/* ── Alert list ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-background-secondary flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent-cyan/50" strokeWidth={1.5} />
            </div>
            <p className="text-text-primary font-medium mb-1">
              {activeTab === 'resolved' ? 'Aucune alerte résolue' : 'Aucune alerte active'}
            </p>
            <p className="text-text-secondary text-sm">
              {activeTab === 'all'
                ? 'La flotte est en ordre. Cliquez sur "Synchroniser" pour vérifier.'
                : 'Aucune alerte dans cette catégorie.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isBusy={busyId === alert.id}
                onResolve={() => handleResolve(alert.id)}
                onReopen={() => handleReopen(alert.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  value, label, color, bg, icon: Icon,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border border-border/30 p-4 flex items-center gap-3', bg)}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-background-primary/50')}>
        <Icon className={cn('w-5 h-5', color)} strokeWidth={1.5} />
      </div>
      <div>
        <p className={cn('text-2xl font-bold font-display', color)}>{value}</p>
        <p className="text-text-secondary text-xs">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  isBusy,
  onResolve,
  onReopen,
}: {
  alert: Alert;
  isBusy: boolean;
  onResolve: () => void;
  onReopen: () => void;
}) {
  const sev = SEVERITY_CONFIG[alert.severity];
  const typ = TYPE_CONFIG[alert.type];
  const SevIcon = sev.icon;
  const TypeIcon = typ.icon;

  const triggeredDate = alert.triggeredAt
    ? new Date(alert.triggeredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'rounded-2xl border p-4 flex gap-4 transition-all duration-200',
        alert.isResolved
          ? 'bg-background-secondary/40 border-border/20 opacity-60'
          : cn(sev.bg, sev.border)
      )}
    >
      {/* Severity icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center',
        alert.isResolved ? 'bg-background-secondary' : 'bg-background-primary/40'
      )}>
        <SevIcon
          className={cn('w-5 h-5', alert.isResolved ? 'text-text-secondary' : sev.color)}
          strokeWidth={1.5}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full border',
              alert.isResolved ? 'text-text-secondary border-border/30 bg-transparent' : cn(sev.color, sev.border, sev.bg)
            )}>
              {sev.label}
            </span>
            <span className="text-text-secondary text-xs flex items-center gap-1">
              <TypeIcon className="w-3 h-3" strokeWidth={2} />
              {typ.label}
            </span>
            {alert.vehiclePlate && (
              <span className="text-text-secondary text-xs font-mono bg-background-secondary px-1.5 py-0.5 rounded">
                {alert.vehiclePlate}
              </span>
            )}
          </div>
          <span className="text-text-secondary text-xs flex-shrink-0">{triggeredDate}</span>
        </div>

        <p className="text-text-primary text-sm font-medium mb-0.5">{alert.title}</p>
        <p className="text-text-secondary text-xs leading-relaxed">{alert.message}</p>

        {/* Due date / km */}
        {(alert.dueDate || alert.dueKm != null) && !alert.isResolved && (
          <div className="mt-2 flex gap-3 text-xs text-text-secondary">
            {alert.dueDate && (
              <span>
                Échéance :{' '}
                <span className={cn('font-medium', sev.color)}>
                  {new Date(alert.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </span>
            )}
            {alert.dueKm != null && (
              <span>
                Kilométrage cible :{' '}
                <span className={cn('font-medium', sev.color)}>
                  {alert.dueKm.toLocaleString()} km
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="flex-shrink-0 flex items-start pt-0.5">
        {alert.isResolved ? (
          <button
            onClick={onReopen}
            disabled={isBusy}
            title="Rouvrir l'alerte"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary/50 transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          </button>
        ) : (
          <button
            onClick={onResolve}
            disabled={isBusy}
            title="Marquer comme résolu"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40',
              'bg-background-primary/60 border border-border/30 text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30'
            )}
          >
            {isBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            Résoudre
          </button>
        )}
      </div>
    </motion.div>
  );
}
