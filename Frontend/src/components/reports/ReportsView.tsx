import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, TrendingUp, Users, Car, Fuel } from 'lucide-react';
import {
  FirestoreMissionService,
  normalizeMissionStatus,
  type Mission as FirestoreMission,
} from '@/services/firestoreMissionService';
import { FirestoreDriverService, type Driver as FirestoreDriver } from '@/services/firestoreDriverService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import { FirestoreFuelService, type FuelRecord } from '@/services/firestoreFuelService';
import type { Vehicle } from '@/types';
import { formatFCFA, formatNumber } from '@/lib/utils';
import { EmptyState, SkeletonKPICard, Skeleton } from '@/components/common';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#00F0FF', '#B829F7', '#D1F366', '#FF6A3D', '#0EA5E9', '#F472B6'];

export function ReportsView() {
  const [rawMissions, setRawMissions] = useState<FirestoreMission[]>([]);
  const [drivers, setDrivers] = useState<FirestoreDriver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubMissions = FirestoreMissionService.allMissionsListener((m) => {
      setRawMissions(m);
      setIsLoading(false);
    });
    const unsubDrivers = FirestoreDriverService.allDriversListener(setDrivers);
    const unsubVehicles = FirestoreVehicleService.allVehiclesListener(setVehicles);
    const unsubFuel = FirestoreFuelService.allFuelRecordsListener(setFuelRecords);
    return () => {
      unsubMissions();
      unsubDrivers();
      unsubVehicles();
      unsubFuel();
    };
  }, []);

  // ── Statistiques réelles ────────────────────────────────────────────────
  const totalMissions = rawMissions.length;
  const completedMissions = rawMissions.filter(
    (m) => normalizeMissionStatus(m.status) === 'terminée'
  ).length;
  const totalFuelLiters = fuelRecords.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalFuelCost = fuelRecords.reduce((s, r) => s + (r.totalCost || 0), 0);
  const activeDrivers = drivers.filter((d) => d.status === 'online').length;

  // Utilisation des véhicules (nb de missions par véhicule)
  const vehicleUtilization = useMemo(() => {
    const counts = new Map<string, number>();
    rawMissions.forEach((m) => {
      const vid = (m as FirestoreMission & { vehicleId?: string }).vehicleId;
      if (vid) counts.set(vid, (counts.get(vid) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([vid, value]) => {
        const v = vehicles.find((ve) => ve.id === vid);
        return { name: v?.plateNumber || vid, value };
      })
      .filter((x) => x.value > 0);
  }, [rawMissions, vehicles]);

  // Performance des chauffeurs (missions terminées par chauffeur)
  const driverPerformance = useMemo(() => {
    return drivers
      .map((d) => {
        const completed = rawMissions.filter(
          (m) => m.assignedTo === d.uid && normalizeMissionStatus(m.status) === 'terminée'
        ).length;
        const total = rawMissions.filter((m) => m.assignedTo === d.uid).length;
        const parts = (d.name || d.email || 'Chauffeur').trim().split(/\s+/);
        const display = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        return { name: display, completed, total, online: d.status === 'online' };
      })
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [drivers, rawMissions]);
  const maxDriverMissions = Math.max(1, ...driverPerformance.map((d) => d.completed));

  // ── Résumé mensuel (mois en cours) ───────────────────────────────────────
  const now = new Date();
  const isThisMonth = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const monthlyFuelCost = fuelRecords
    .filter((r) => isThisMonth(r.date))
    .reduce((s, r) => s + (r.totalCost || 0), 0);
  const missionsThisMonth = rawMissions.filter((m) =>
    isThisMonth(m.createdAt?.toDate?.()?.toISOString())
  ).length;
  const completionRate =
    totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKPICard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="rect" className="h-72 w-full" />
          <Skeleton variant="rect" className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary">
            Rapports & Analytiques
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Analysez les performances réelles de votre flotte
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.print()}
          title="Ouvrir la boîte d'impression (choisir « Enregistrer en PDF »)"
          className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exporter PDF</span>
        </motion.button>
      </div>

      {/* Stats Overview — réelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-accent-cyan" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Total Missions</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {formatNumber(totalMissions)}
          </h3>
          <p className="text-emerald-400 text-xs mt-1">{completedMissions} terminées</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center mb-4">
            <Fuel className="w-5 h-5 text-accent-lime" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Carburant Consommé</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {formatNumber(totalFuelLiters)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">litres</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-accent-violet" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Coût Carburant (total)</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {formatFCFA(totalFuelCost)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">tous pleins confondus</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-accent-orange" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Chauffeurs Actifs</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {activeDrivers}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">sur {drivers.length} total</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
            Utilisation des Véhicules
          </h3>
          {vehicleUtilization.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Pas encore de données"
              description="L'utilisation des véhicules s'affichera une fois des missions créées."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleUtilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vehicleUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-solid)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Driver Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
            Performance des Chauffeurs
          </h3>
          {driverPerformance.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun chauffeur"
              description="Le classement apparaîtra dès que des chauffeurs et missions existeront."
            />
          ) : (
            <div className="space-y-3">
              {driverPerformance.map((driver, index) => (
                <div key={`${driver.name}-${index}`} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary flex items-center gap-1.5">
                        {driver.name}
                        {driver.online && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {driver.completed}/{driver.total} missions
                      </span>
                    </div>
                    <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(driver.completed / maxDriverMissions) * 100}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Summary — réel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-5"
      >
        <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
          Résumé Mensuel
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-background-secondary rounded-xl">
            <p className="text-text-secondary text-sm mb-2">Coût Carburant</p>
            <p className="text-2xl font-display font-bold text-accent-cyan">
              {formatFCFA(monthlyFuelCost)}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">Ce mois</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl">
            <p className="text-text-secondary text-sm mb-2">Missions ce mois</p>
            <p className="text-2xl font-display font-bold text-accent-lime">
              {formatNumber(missionsThisMonth)}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">créées ce mois</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl">
            <p className="text-text-secondary text-sm mb-2">Taux de complétion</p>
            <p className="text-2xl font-display font-bold text-accent-violet">
              {completionRate}%
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">missions terminées</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
