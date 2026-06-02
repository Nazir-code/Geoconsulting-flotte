import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, TrendingUp, Users, Car } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Mission, Vehicle, Driver } from '@/types';
import { formatFCFA, formatNumber } from '@/lib/utils';
import { EmptyState, SkeletonKPICard, Skeleton } from '@/components/common';
import { mockChartData } from '@/data/mockData';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#00F0FF', '#B829F7', '#D1F366', '#FF6A3D'];

export function ReportsView() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [missionsData, vehiclesData, driversData] = await Promise.all([
        dataService.getMissions(),
        dataService.getVehicles(),
        dataService.getDrivers(),
      ]);
      setMissions(missionsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.status === 'terminée').length;
  const totalDistance = missions.reduce((sum, m) => sum + (m.distance || 0), 0);
  const totalFuelConsumed = missions.reduce((sum, m) => sum + (m.fuelConsumed || 0), 0);

  // Vehicle utilization data
  const vehicleUtilization = vehicles.map(v => {
    const vehicleMissions = missions.filter(m => m.vehicleId === v.id && m.status === 'terminée');
    return {
      name: v.plateNumber,
      value: vehicleMissions.length,
    };
  }).filter(v => v.value > 0);

  // Driver performance data
  const driverPerformance = drivers.map(d => {
    const driverMissions = missions.filter(m => m.driverId === d.id && m.status === 'terminée');
    return {
      name: `${d.user.firstName} ${d.user.lastName.charAt(0)}.`,
      missions: driverMissions.length,
      rating: d.rating,
    };
  }).sort((a, b) => b.missions - a.missions).slice(0, 5);

  const maxDriverMissions = Math.max(1, ...driverPerformance.map((d) => d.missions));

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
            Analysez les performances de votre flotte
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exporter PDF</span>
        </motion.button>
      </div>

      {/* Stats Overview */}
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
          <p className="text-emerald-400 text-xs mt-1">
            {completedMissions} terminées
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-accent-violet" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Distance Totale</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {formatNumber(totalDistance)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">kilomètres</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-lime/10 flex items-center justify-center mb-4">
            <Car className="w-5 h-5 text-accent-lime" />
          </div>
          <p className="text-text-secondary text-sm mb-1">Carburant Consommé</p>
          <h3 className="text-2xl font-display font-bold text-text-primary">
            {formatNumber(totalFuelConsumed)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">litres</p>
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
            {drivers.filter(d => d.status !== 'off').length}
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
              description="L'utilisation des véhicules s'affichera une fois des missions terminées."
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
                    backgroundColor: '#0D1320',
                    border: '1px solid rgba(244, 246, 255, 0.1)',
                    borderRadius: '8px',
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
              title="Pas encore de classement"
              description="Le top chauffeurs apparaîtra dès que des missions seront terminées."
            />
          ) : (
            <div className="space-y-3">
              {driverPerformance.map((driver, index) => (
                <div key={driver.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary">{driver.name}</span>
                      <span className="text-xs text-text-secondary">{driver.missions} missions</span>
                    </div>
                    <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(driver.missions / maxDriverMissions) * 100}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-accent-lime">★</span>
                    <span className="text-sm text-text-primary">{driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Summary */}
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
            <p className="text-text-secondary text-sm mb-2">Coût Total</p>
            <p className="text-2xl font-display font-bold text-accent-cyan">
              {formatFCFA(mockChartData[mockChartData.length - 1].totalCost)}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">Ce mois</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl">
            <p className="text-text-secondary text-sm mb-2">Économies</p>
            <p className="text-2xl font-display font-bold text-accent-lime">
              {formatFCFA(150000)}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">vs budget</p>
          </div>
          <div className="p-4 bg-background-secondary rounded-xl">
            <p className="text-text-secondary text-sm mb-2">Efficacité</p>
            <p className="text-2xl font-display font-bold text-accent-violet">
              94%
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">Taux d'utilisation</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
