import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Car, Plus, Edit, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { Vehicle } from '@/types';

interface CreateVehicleFormProps {
  vehicle?: Vehicle;
  onSuccess?: () => void;
  onCancel?: () => void;
  onSubmit: (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const VEHICLE_TYPES = ['suv', 'van', 'truck', 'pickup', 'sedan'];
const FUEL_TYPES = ['diesel', 'gasoline'];

export function CreateVehicleForm({
  vehicle,
  onSuccess,
  onCancel,
  onSubmit,
}: CreateVehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'suv' as Vehicle['type'],
    status: 'available' as Vehicle['status'],
    fuelType: 'diesel' as Vehicle['fuelType'],
    mileage: 0,
    image: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    // Nouveaux champs
    consumptionTheoretical: 0,
    fuelCapacity: 0,
    kmAtLastService: 0,
    insuranceExpiry: '',
    technicalInspectionExpiry: '',
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        status: vehicle.status,
        fuelType: vehicle.fuelType,
        mileage: vehicle.mileage,
        image: vehicle.image || '',
        lastMaintenanceDate: vehicle.lastMaintenanceDate?.split('T')[0] || '',
        nextMaintenanceDate: vehicle.nextMaintenanceDate?.split('T')[0] || '',
        consumptionTheoretical: vehicle.consumptionTheoretical || 0,
        fuelCapacity: vehicle.fuelCapacity || 0,
        kmAtLastService: vehicle.kmAtLastService || 0,
        insuranceExpiry: vehicle.insuranceExpiry?.split('T')[0] || '',
        technicalInspectionExpiry: vehicle.technicalInspectionExpiry?.split('T')[0] || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        lastMaintenanceDate: formData.lastMaintenanceDate
          ? new Date(formData.lastMaintenanceDate).toISOString()
          : undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate
          ? new Date(formData.nextMaintenanceDate).toISOString()
          : undefined,
        insuranceExpiry: formData.insuranceExpiry
          ? new Date(formData.insuranceExpiry).toISOString()
          : undefined,
        technicalInspectionExpiry: formData.technicalInspectionExpiry
          ? new Date(formData.technicalInspectionExpiry).toISOString()
          : undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const title = vehicle ? 'Modifier le Véhicule' : 'Ajouter un Véhicule';
  const buttonText = vehicle ? 'Mettre à jour' : 'Ajouter';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-6 max-w-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-accent-cyan" />
          </div>
          <h2 className="text-xl font-display font-semibold text-text-primary">{title}</h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            type="button"
            className="p-2 hover:bg-background-secondary rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Plate & Brand */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Immatriculation</label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) =>
                setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })
              }
              placeholder="V-201"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Marque</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Toyota"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Row 2: Model & Year */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Modèle</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Land Cruiser"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Année</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min="1980"
              max={new Date().getFullYear()}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Row 3: Type & Fuel Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as Vehicle['type'] })
              }
              className="input-field"
              required
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Carburant</label>
            <select
              value={formData.fuelType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fuelType: e.target.value as Vehicle['fuelType'],
                })
              }
              className="input-field"
              required
            >
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'diesel' ? 'Diesel' : 'Essence'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Status & Mileage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Vehicle['status'],
                })
              }
              className="input-field"
              required
            >
              <option value="available">Disponible</option>
              <option value="on_mission">En mission</option>
              <option value="maintenance">Maintenance</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Kilométrage</label>
            <input
              type="number"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
              placeholder="0"
              min="0"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Row 5: Maintenance Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Dernière Maintenance</label>
            <input
              type="date"
              value={formData.lastMaintenanceDate}
              onChange={(e) =>
                setFormData({ ...formData, lastMaintenanceDate: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prochaine Maintenance</label>
            <input
              type="date"
              value={formData.nextMaintenanceDate}
              onChange={(e) =>
                setFormData({ ...formData, nextMaintenanceDate: e.target.value })
              }
              className="input-field"
            />
          </div>
        </div>

        {/* Row 6: Insurance & Inspection Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Expiration Assurance</label>
            <input
              type="date"
              value={formData.insuranceExpiry}
              onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contrôle Technique (expiration)</label>
            <input
              type="date"
              value={formData.technicalInspectionExpiry}
              onChange={(e) => setFormData({ ...formData, technicalInspectionExpiry: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Row 7: Consumption & Fuel Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Consommation Théorique (L/100km)</label>
            <input
              type="number"
              value={formData.consumptionTheoretical}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consumptionTheoretical: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="7.5"
              step="0.1"
              min="0"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Capacité Réservoir (Litres)</label>
            <input
              type="number"
              value={formData.fuelCapacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fuelCapacity: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="80"
              step="1"
              min="0"
              className="input-field"
            />
          </div>
        </div>

        {/* Row 7: Last Service KM */}
        <div className="form-group">
          <label className="form-label">Kilométrage Dernier Service</label>
          <input
            type="number"
            value={formData.kmAtLastService}
            onChange={(e) =>
              setFormData({
                ...formData,
                kmAtLastService: parseInt(e.target.value) || 0,
              })
            }
            placeholder="0"
            min="0"
            className="input-field"
          />
        </div>

        {/* Image Upload */}
        <ImageUpload
          onImageSelect={(image) => setFormData({ ...formData, image: image || '' })}
          currentImage={formData.image}
          label="Image du Véhicule"
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary flex-1"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                {vehicle ? (
                  <>
                    <Edit className="w-4 h-4" />
                    <span>{buttonText}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{buttonText}</span>
                  </>
                )}
              </>
            )}
          </motion.button>

          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
