import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fuel, TrendingUp, AlertTriangle, Plus, Droplets } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { FuelRecord } from '@/types';
import { formatFCFA, formatNumber, formatDate } from '@/lib/utils';
import { mockChartData } from '@/data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function FuelView() {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const recordsData = await dataService.getFuelRecords();
      setFuelRecords(recordsData);
    } catch (error) {
      console.error('Error loading fuel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-spinner" />
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
            Carburant & Maintenance
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Suivez les coûts et les alertes
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un plein</span>
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Coût Carburant (mois)</p>
          <h3 className="text-2xl font-display font-bold text-accent-cyan">
            {formatFCFA(1240500)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">vs mois dernier</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-accent-violet" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>On budget</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Dépenses Mensuelles</p>
          <h3 className="text-2xl font-display font-bold text-accent-violet">
            {formatFCFA(2850000)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">Budget: 3,000,000 FCFA</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 border-accent-orange/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent-orange" />
            </div>
            <span className="px-2 py-0.5 bg-accent-orange/20 text-accent-orange text-xs rounded-full">
              2 alertes
            </span>
          </div>
          <p className="text-text-secondary text-sm mb-1">Alertes</p>
          <div className="space-y-1">
            <p className="text-xs text-accent-orange">Maintenance due: V-204</p>
            <p className="text-xs text-accent-orange">Anomalie carburant: V-207</p>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
          Carburant vs Maintenance (6 mois)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 246, 255, 0.08)" />
              <XAxis 
                dataKey="month" 
                stroke="#A7B1C6" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#A7B1C6" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D1320',
                  border: '1px solid rgba(244, 246, 255, 0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value) => typeof value === 'number' ? formatFCFA(value) : value}
              />
              <Legend />
              <Bar 
                dataKey="fuelCost" 
                name="Carburant" 
                fill="#00F0FF" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="maintenanceCost" 
                name="Maintenance" 
                fill="#B829F7" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Fuel Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5"
      >
        <h3 className="text-lg font-display font-semibold text-text-primary mb-4">
          Derniers Pleins
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Véhicule</th>
                <th>Chauffeur</th>
                <th>Quantité</th>
                <th>Coût Total</th>
                <th>Station</th>
              </tr>
            </thead>
            <tbody>
              {fuelRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td className="font-mono">{record.vehicle.plateNumber}</td>
                  <td>{record.driver.user.firstName} {record.driver.user.lastName.charAt(0)}.</td>
                  <td>{formatNumber(record.quantity)} L</td>
                  <td className="text-accent-cyan">{formatFCFA(record.totalCost)}</td>
                  <td>{record.station || 'N/A'}</td>
                </tr>
              ))}
              {fuelRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">
                    Aucun enregistrement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
