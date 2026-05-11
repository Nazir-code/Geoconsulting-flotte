import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Users, Plus, Search, Filter, Radio } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { DriverCard } from './DriverCard';
import { CreateVehicleForm } from './CreateVehicleForm';
import { dataService } from '@/services/dataService';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import type { Vehicle, Driver, User } from '@/types';
import { cn } from '@/lib/utils';

type TabType = 'vehicles' | 'drivers';

export function FleetView() {
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    // 1. Charger les véhicules (Mock)
    loadVehicles();

    // 2. Écouter les chauffeurs en temps réel (Firestore)
    const unsubscribe = FirestoreDriverService.allDriversListener((firestoreDrivers) => {
      const mappedDrivers: Driver[] = firestoreDrivers.map(fd => {
        const nameParts = (fd.name || 'Chauffeur Inconnu').split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        return {
          id: fd.id,
          userId: fd.uid,
          user: {
            id: fd.uid,
            email: fd.email || '',
            firstName: firstName,
            lastName: lastName,
            role: 'driver',
            phone: fd.phone || '',
            createdAt: fd.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: fd.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as User,
          licenseNumber: 'N/A',
          licenseExpiry: 'N/A',
          status: fd.status === 'online' ? 'active' : 'off',
          rating: 5,
          totalMissions: 0,
          currentVehicleId: undefined,
          createdAt: fd.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: fd.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      setDrivers(mappedDrivers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await dataService.getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleCreateVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newVehicle = await dataService.createVehicle(data);
      setVehicles([...vehicles, newVehicle]);
      setShowVehicleForm(false);
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      alert('Erreur lors de la création du véhicule');
    }
  };

  const handleUpdateVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingVehicle) return;

    try {
      const updatedVehicle = await dataService.updateVehicle(editingVehicle.id, data);
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? updatedVehicle : v));
      setShowVehicleForm(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Erreur lors de la modification du véhicule:', error);
      alert('Erreur lors de la modification du véhicule');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await dataService.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      alert('Erreur lors de la suppression du véhicule');
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleCloseForm = () => {
    setShowVehicleForm(false);
    setEditingVehicle(null);
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    searchQuery === '' ||
    vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    searchQuery === '' ||
    driver.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.user.phone?.includes(searchQuery)
  );

  // We remove the blocking loader to allow the UI shell (tabs, header) to render immediately.
  // The content areas will handle their own empty/loading states.

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
            Flotte & Chauffeurs
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Gérez vos véhicules et chauffeurs en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Vehicle Button */}
          {activeTab === 'vehicles' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVehicleForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Véhicule</span>
            </motion.button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>

          {/* Filter Button */}
          <button className="p-2.5 border border-border rounded-lg hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all">
            <Filter className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Real-time Indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-xs w-fit">
        <Radio className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
        <span>Synchronisation Firestore active</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
            activeTab === 'vehicles'
              ? 'text-accent-cyan'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Car className="w-4 h-4" />
          <span>Véhicules</span>
          <span className="px-1.5 py-0.5 bg-background-secondary rounded text-[10px]">
            {vehicles.length}
          </span>
          {activeTab === 'vehicles' && (
            <motion.div
              layoutId="fleetTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
            activeTab === 'drivers'
              ? 'text-accent-cyan'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Chauffeurs Firestore</span>
          <span className="px-1.5 py-0.5 bg-background-secondary rounded text-[10px]">
            {drivers.length}
          </span>
          {activeTab === 'drivers' && (
            <motion.div
              layoutId="fleetTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan"
            />
          )}
        </button>

        <div className='flex justify-center'>
          <button className='bg-accent-cyan/50 hover:bg-accent-cyan/80 hover:shadow-glow-cyan hover:shadow-accent-cyan/30 transition-all font-medium text-sm text-white px-4 py-2 rounded-lg w-fit'><a href="https://console.firebase.google.com/u/0/project/geoconsulting-fleet/authentication/users">Ajouter un chauffeur</a></button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'vehicles' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              onEdit={handleEditVehicle}
              onDelete={handleDeleteVehicle}
            />
          ))}
          {filteredVehicles.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Car className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
              <p className="text-text-secondary">Aucun véhicule trouvé</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Info for drivers */}
          <div className="p-4 rounded-xl bg-background-secondary border border-border text-sm text-text-secondary">
            Les chauffeurs s'inscrivent via l'application mobile et apparaissent ici automatiquement.
          </div>

          {filteredDrivers.map((driver, index) => (
            <DriverCard key={driver.id} driver={driver} index={index} />
          ))}
          {filteredDrivers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
              <p className="text-text-secondary">Aucun chauffeur trouvé sur Firestore</p>
            </div>
          )}
        </div>
      )}



      {/* Vehicle Form Modal */}
      <AnimatePresence>
        {showVehicleForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseForm}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] overflow-y-auto"
            >
              <CreateVehicleForm
                vehicle={editingVehicle || undefined}
                onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
                onSuccess={handleCloseForm}
                onCancel={handleCloseForm}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
