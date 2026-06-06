import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, FileText, User, Car, Calendar, Play } from 'lucide-react';
import { FirestoreMissionService, type Mission as FirestoreMission } from '@/services/firestoreMissionService';
import { FirestoreDriverService, type Driver as FirestoreDriver } from '@/services/firestoreDriverService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import { useAuth } from '@/context/AuthContext_Firebase';
import type { Vehicle } from '@/types';
import { NIGER_CITIES, MISSION_PURPOSES } from '@/data/mockData';

interface CreateMissionFormProps {
  onSuccess?: () => void;
}

export function CreateMissionForm({ onSuccess }: CreateMissionFormProps) {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<FirestoreDriver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    purpose: '',
    driverId: '',
    vehicleId: '',
    startTime: '',
  });

  useEffect(() => {
    const unsubscribeDrivers = FirestoreDriverService.allDriversListener(setDrivers);
    // Véhicules persistés (Firestore) — on ne propose que ceux disponibles.
    const unsubscribeVehicles = FirestoreVehicleService.allVehiclesListener((all) => {
      setVehicles(all.filter(v => v.status === 'available'));
    });
    return () => {
      unsubscribeDrivers();
      unsubscribeVehicles();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Créer la mission dans Firestore
      await FirestoreMissionService.createMission({
        title: formData.purpose,
        description: `Mission vers ${formData.destination}`,
        location: formData.destination,
        priority: 'medium',
        assignedTo: formData.driverId,
        createdBy: user?.id || 'admin',
        // Note: vehicleId n'est pas dans l'interface Mission typée mais est utile
        // pour rattacher la mission au véhicule (suivi, coûts).
        vehicleId: formData.vehicleId,
      } as Omit<FirestoreMission, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { vehicleId: string });
      
      setFormData({
        destination: '',
        purpose: '',
        driverId: '',
        vehicleId: '',
        startTime: '',
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating mission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-display font-semibold text-text-primary mb-6">
        Créer une Mission (Firestore)
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination */}
        <div className="form-group">
          <label className="form-label">
            <MapPin className="w-4 h-4" />
            Destination
          </label>
          <select
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Sélectionner une destination</option>
            {NIGER_CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <div className="form-group">
          <label className="form-label">
            <FileText className="w-4 h-4" />
            Objectif
          </label>
          <select
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Sélectionner un objectif</option>
            {MISSION_PURPOSES.map(purpose => (
              <option key={purpose} value={purpose}>{purpose}</option>
            ))}
          </select>
        </div>

        {/* Driver */}
        <div className="form-group">
          <label className="form-label">
            <User className="w-4 h-4" />
            Conducteur
          </label>
          <select
            value={formData.driverId}
            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Sélectionner un conducteur</option>
            {drivers.map(driver => (
              <option key={driver.uid} value={driver.uid}>
                {driver.name || driver.email} {driver.status === 'online' ? '(en ligne)' : '(hors ligne)'}
              </option>
            ))}
          </select>
          {drivers.length === 0 && (
            <p className="text-xs text-accent-orange">
              Aucun conducteur disponible
            </p>
          )}
        </div>

        {/* Vehicle */}
        <div className="form-group">
          <label className="form-label">
            <Car className="w-4 h-4" />
            Véhicule
          </label>
          <select
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Sélectionner un véhicule</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.model}
              </option>
            ))}
          </select>
          {vehicles.length === 0 && (
            <p className="text-xs text-accent-orange">
              Aucun véhicule disponible
            </p>
          )}
        </div>

        {/* Start Time */}
        <div className="form-group">
          <label className="form-label">
            <Calendar className="w-4 h-4" />
            Heure de départ (optionnel)
          </label>
          <input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="input-field"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading || drivers.length === 0 || vehicles.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-full py-3 mt-6"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner w-5 h-5" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Démarrer la Mission</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
