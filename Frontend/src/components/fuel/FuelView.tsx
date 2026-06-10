import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, TrendingUp, AlertTriangle, Plus, Droplets, X } from 'lucide-react';
import { FirestoreFuelService, type FuelRecord } from '@/services/firestoreFuelService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import type { Vehicle } from '@/types';
import { formatFCFA, formatNumber, formatDate } from '@/lib/utils';
import { EmptyState, Skeleton, useToast } from '@/components/common';
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

const emptyForm = {
  vehicleId: '',
  quantity: '',
  pricePerLiter: '',
  station: '',
  mileage: '',
  date: new Date().toISOString().slice(0, 10),
};

export function FuelView() {
  const toast = useToast();
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    const unsubRecords = FirestoreFuelService.allFuelRecordsListener((records) => {
      setFuelRecords(records);
      setIsLoading(false);
    });
    const unsubVehicles = FirestoreVehicleService.allVehiclesListener(setVehicles);
    return () => {
      unsubRecords();
      unsubVehicles();
    };
  }, []);

  // Coût carburant du mois en cours, calculé sur les données réelles.
  const now = new Date();
  const monthlyFuelCost = fuelRecords
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(form.quantity);
    const pricePerLiter = parseFloat(form.pricePerLiter);

    if (!form.vehicleId || !(quantity > 0) || !(pricePerLiter > 0)) {
      toast.error('Champs requis', 'Véhicule, quantité et prix/litre sont obligatoires.');
      return;
    }

    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    setIsSubmitting(true);
    try {
      await FirestoreFuelService.createFuelRecord({
        vehicleId: form.vehicleId,
        vehiclePlate: vehicle?.plateNumber || 'N/A',
        date: new Date(form.date).toISOString(),
        quantity,
        pricePerLiter,
        totalCost: quantity * pricePerLiter,
        station: form.station.trim() || undefined,
        mileage: form.mileage ? parseFloat(form.mileage) : undefined,
      });
      // La liste se met à jour via le listener temps réel.
      toast.success('Plein enregistré', 'Le plein a été ajouté avec succès.');
      setForm({ ...emptyForm });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating fuel record:', error);
      toast.error('Échec', "Impossible d'enregistrer le plein.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={() => setShowAddForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un plein</span>
        </motion.button>
      </div>

      {/* Formulaire d'ajout de plein */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-text-primary">
                Nouveau plein
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-background-secondary rounded-lg transition-all"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Véhicule</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantité (litres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="40"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prix / litre (FCFA)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.pricePerLiter}
                  onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })}
                  placeholder="650"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Station (optionnel)</label>
                <input
                  type="text"
                  value={form.station}
                  onChange={(e) => setForm({ ...form, station: e.target.value })}
                  placeholder="Total Niamey"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kilométrage (optionnel)</label>
                <input
                  type="number"
                  min="0"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder="125000"
                  className="input-field"
                />
              </div>
            </div>

            {/* Total calculé */}
            <div className="mt-4 text-sm text-text-secondary">
              Coût total :{' '}
              <span className="text-accent-cyan font-semibold">
                {formatFCFA(
                  (parseFloat(form.quantity) || 0) * (parseFloat(form.pricePerLiter) || 0)
                )}
              </span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer le plein'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

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
              <span>Ce mois</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-1">Coût Carburant (mois)</p>
          <h3 className="text-2xl font-display font-bold text-accent-cyan">
            {formatFCFA(monthlyFuelCost)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">
            {fuelRecords.length} plein{fuelRecords.length > 1 ? 's' : ''} enregistré
            {fuelRecords.length > 1 ? 's' : ''}
          </p>
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
          </div>
          <p className="text-text-secondary text-sm mb-1">Volume Total (mois)</p>
          <h3 className="text-2xl font-display font-bold text-accent-violet">
            {formatNumber(
              fuelRecords
                .filter((r) => {
                  const d = new Date(r.date);
                  return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, r) => sum + (r.quantity || 0), 0)
            )}{' '}
            L
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">Carburant consommé</p>
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
          </div>
          <p className="text-text-secondary text-sm mb-1">Prix moyen / litre</p>
          <h3 className="text-2xl font-display font-bold text-accent-orange">
            {fuelRecords.length > 0
              ? formatFCFA(
                  Math.round(
                    fuelRecords.reduce((s, r) => s + (r.pricePerLiter || 0), 0) /
                      fuelRecords.length
                  )
                )
              : formatFCFA(0)}
          </h3>
          <p className="text-text-secondary/60 text-xs mt-1">Sur tous les pleins</p>
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
              <XAxis dataKey="month" stroke="#A7B1C6" fontSize={12} tickLine={false} />
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
                formatter={(value) => (typeof value === 'number' ? formatFCFA(value) : value)}
              />
              <Legend />
              <Bar dataKey="fuelCost" name="Carburant" fill="#00F0FF" radius={[4, 4, 0, 0]} />
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
        {isLoading ? (
          <Skeleton variant="rect" className="h-40 w-full" />
        ) : fuelRecords.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Aucun plein enregistré"
            description="Cliquez sur « Ajouter un plein » pour suivre la consommation et les coûts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Véhicule</th>
                  <th>Quantité</th>
                  <th>Prix/L</th>
                  <th>Coût Total</th>
                  <th>Station</th>
                </tr>
              </thead>
              <tbody>
                {fuelRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td className="font-mono">{record.vehiclePlate}</td>
                    <td>{formatNumber(record.quantity)} L</td>
                    <td>{formatFCFA(record.pricePerLiter)}</td>
                    <td className="text-accent-cyan">{formatFCFA(record.totalCost)}</td>
                    <td>{record.station || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
