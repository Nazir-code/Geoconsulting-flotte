import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, MapPin, FileText, Clock, History, Truck, Fuel, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { dataService } from '@/services/dataService';
import type { Mission } from '@/types';
import { formatDateTime, formatTime, getStatusLabel } from '@/lib/utils';
import { NIGER_CITIES, MISSION_PURPOSES } from '@/data/mockData';

export function DriverDashboard() {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionHistory, setMissionHistory] = useState<Mission[]>([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    destination: '',
    purpose: '',
  });

  const loadDriverData = useCallback(async () => {
    try {
      // Get driver ID from user
      const drivers = await dataService.getDrivers();
      const driver = drivers.find(d => d.userId === user?.id);
      
      if (driver) {
        const missions = await dataService.getMissions({ driverId: driver.id });
        const active = missions.find(m => m.status === 'in_progress');
        setActiveMission(active || null);
        setMissionHistory(missions.filter(m => m.status !== 'in_progress').slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDriverData();
    
    // Subscribe to mission updates
    const unsubscribe = dataService.subscribe('mission_update', () => {
      loadDriverData();
    });

    return () => unsubscribe();
  }, [loadDriverData]);

  const handleStartMission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const drivers = await dataService.getDrivers();
      const driver = drivers.find(d => d.userId === user?.id);
      
      if (!driver || !driver.currentVehicleId) {
        alert('Vous n\'avez pas de véhicule assigné');
        return;
      }

      await dataService.createMission({
        destination: formData.destination,
        purpose: formData.purpose,
        driverId: driver.id,
        vehicleId: driver.currentVehicleId,
      });

      setShowStartForm(false);
      setFormData({ destination: '', purpose: '' });
      loadDriverData();
    } catch (error) {
      console.error('Error starting mission:', error);
    }
  };

  const handleEndMission = async () => {
    if (!activeMission) return;
    
    try {
      await dataService.completeMission(activeMission.id, {
        distance: Math.floor(Math.random() * 100) + 20,
        fuelConsumed: Math.floor(Math.random() * 20) + 5,
      });
      loadDriverData();
    } catch (error) {
      console.error('Error ending mission:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/30 flex items-center justify-center">
            <Truck className="w-6 h-6 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary">
              Fleet<span className="text-accent-cyan">Nexus</span>
            </h1>
            <p className="text-xs text-text-secondary">Espace Chauffeur</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
              <span className="text-accent-cyan font-medium">{user?.firstName?.[0]}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-display font-bold text-text-primary">
          Bonjour, {user?.firstName}
        </h2>
        <p className="text-text-secondary">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Active Mission or Start Button */}
      {activeMission ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6 border-accent-cyan/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-accent-cyan rounded-full animate-pulse" />
            <span className="text-accent-cyan text-sm font-medium">Mission en cours</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-accent-cyan" />
            <div>
              <p className="text-xs text-text-secondary">Destination</p>
              <p className="text-lg font-medium text-text-primary">{activeMission.destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Objectif</p>
              <p className="text-sm text-text-primary">{activeMission.purpose}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Début</p>
              <p className="text-sm text-text-primary">{formatTime(activeMission.startTime)}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEndMission}
            className="w-full py-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 font-medium flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Terminer la Mission</span>
          </motion.button>
        </motion.div>
      ) : showStartForm ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-text-primary mb-4">Nouvelle Mission</h3>
          
          <form onSubmit={handleStartMission} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Destination</label>
              <select
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Choisir une destination</option>
                {NIGER_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1 block">Objectif</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Choisir un objectif</option>
                {MISSION_PURPOSES.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowStartForm(false)}
                className="flex-1 py-3 border border-border rounded-xl text-text-secondary"
              >
                Annuler
              </motion.button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-accent-cyan/10 border border-accent-cyan/50 rounded-xl text-accent-cyan font-medium flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Démarrer</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowStartForm(true)}
          className="w-full py-6 glass-card mb-6 flex flex-col items-center justify-center gap-3 border-accent-cyan/30 hover:border-accent-cyan/50 hover:bg-accent-cyan/5 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-accent-cyan/10 flex items-center justify-center">
            <Play className="w-8 h-8 text-accent-cyan fill-current" />
          </div>
          <span className="text-lg font-medium text-accent-cyan">Démarrer une Mission</span>
        </motion.button>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <button className="p-4 glass-card flex flex-col items-center gap-2 hover:border-accent-cyan/30 transition-all">
          <Fuel className="w-6 h-6 text-accent-lime" />
          <span className="text-sm text-text-secondary">Signaler Plein</span>
        </button>
        <button className="p-4 glass-card flex flex-col items-center gap-2 hover:border-accent-cyan/30 transition-all">
          <User className="w-6 h-6 text-accent-violet" />
          <span className="text-sm text-text-secondary">Mon Profil</span>
        </button>
      </motion.div>

      {/* Mission History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-text-secondary" />
          <h3 className="text-lg font-medium text-text-primary">Historique</h3>
        </div>

        <div className="space-y-3">
          {missionHistory.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="p-4 glass-card"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">
                  {mission.destination}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  mission.status === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {getStatusLabel(mission.status)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-1">{mission.purpose}</p>
              <p className="text-xs text-text-secondary/60">
                {formatDateTime(mission.startTime)}
              </p>
              {mission.distance && (
                <p className="text-xs text-accent-cyan mt-1">
                  {mission.distance} km • {mission.fuelConsumed} L
                </p>
              )}
            </motion.div>
          ))}
          {missionHistory.length === 0 && (
            <p className="text-center text-text-secondary py-8">
              Aucune mission dans l'historique
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
