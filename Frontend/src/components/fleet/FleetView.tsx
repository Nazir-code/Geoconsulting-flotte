import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Users, Plus, Search, Filter, Radio } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { DriverCard } from './DriverCard';
import { CreateVehicleForm } from './CreateVehicleForm';
import { AddDriverModal } from './AddDriverModal';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import { FirestoreVehicleService } from '@/services/firestoreVehicleService';
import type { Vehicle, Driver, User } from '@/types';
import { cn } from '@/lib/utils';
import { EmptyState, Skeleton, SkeletonList } from '@/components/common';
import { consumePendingFleetTab } from '@/lib/fleetNav';

type TabType = 'vehicles' | 'drivers';

export function FleetView() {
  // Onglet initial : 'drivers' si on arrive via la carte KPI « Chauffeurs »,
  // sinon 'vehicles' par défaut.
  const [activeTab, setActiveTab] = useState<TabType>(() => consumePendingFleetTab() ?? 'vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Vehicle['status']>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    // 1. Écouter les véhicules en temps réel (Firestore — persistant)
    const unsubscribeVehicles = FirestoreVehicleService.allVehiclesListener((firestoreVehicles) => {
      setVehicles(firestoreVehicles);
      setIsLoading(false);
    });

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
          approvalStatus: fd.approvalStatus,
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

    return () => {
      unsubscribeVehicles();
      unsubscribe();
    };
  }, []);

  // Vérifie l'unicité de l'immatriculation (identifiant naturel du véhicule).
  // Comparaison insensible à la casse/espaces, en excluant le véhicule édité.
  const isPlateTaken = (plate: string, excludeId?: string) => {
    const norm = (s: string) => s.replace(/\s+/g, '').toUpperCase();
    const target = norm(plate);
    return vehicles.some((v) => v.id !== excludeId && norm(v.plateNumber) === target);
  };

  const handleCreateVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isPlateTaken(data.plateNumber)) {
      alert(`L'immatriculation « ${data.plateNumber} » existe déjà.`);
      return;
    }
    try {
      // Le listener temps réel mettra la liste à jour automatiquement.
      await FirestoreVehicleService.createVehicle(data);
      setShowVehicleForm(false);
    } catch (error) {
      console.error('Erreur lors de la création du véhicule:', error);
      alert('Erreur lors de la création du véhicule');
    }
  };

  const handleUpdateVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingVehicle) return;

    if (isPlateTaken(data.plateNumber, editingVehicle.id)) {
      alert(`L'immatriculation « ${data.plateNumber} » existe déjà.`);
      return;
    }
    try {
      await FirestoreVehicleService.updateVehicle(editingVehicle.id, data);
      setShowVehicleForm(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Erreur lors de la modification du véhicule:', error);
      alert('Erreur lors de la modification du véhicule');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    // La confirmation est gérée par VehicleCard avant d'appeler ce handler.
    try {
      await FirestoreVehicleService.deleteVehicle(id);
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule:', error);
      alert('Erreur lors de la suppression du véhicule');
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleDeleteDriver = async (uid: string) => {
    const ok = window.confirm('Confirmer la suppression du chauffeur ? Cette action est irréversible.');
    if (!ok) return;

    try {
      await FirestoreDriverService.deleteDriver(uid);
    } catch (error) {
      console.error('Erreur suppression chauffeur:', error);
      alert('Impossible de supprimer le chauffeur. Voir la console pour détails.');
    }
  };

  const handleCloseForm = () => {
    setShowVehicleForm(false);
    setEditingVehicle(null);
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      vehicle.plateNumber.toLowerCase().includes(q) ||
      vehicle.brand.toLowerCase().includes(q) ||
      vehicle.model.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

          {/* Add Driver Button */}
          {activeTab === 'drivers' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDriverForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/50 rounded-lg text-accent-cyan hover:bg-accent-cyan/20 hover:shadow-glow-cyan transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Chauffeur</span>
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
              className="input-field input-with-icon w-64"
            />
          </div>

          {/* Filter Button + menu (véhicules uniquement) */}
          {activeTab === 'vehicles' && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((s) => !s)}
                title="Filtrer par statut"
                className={cn(
                  'p-2.5 border rounded-lg transition-all',
                  statusFilter !== 'all'
                    ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border text-text-secondary hover:border-accent-cyan/30 hover:bg-accent-cyan/5'
                )}
              >
                <Filter className="w-5 h-5" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card overflow-hidden z-50 py-1">
                  {([
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'available', label: 'Disponible' },
                    { value: 'on_mission', label: 'En mission' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'unavailable', label: 'Indisponible' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setShowFilterMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm transition-colors',
                        statusFilter === opt.value
                          ? 'bg-accent-cyan/10 text-accent-cyan'
                          : 'text-text-secondary hover:bg-background-secondary'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          {isLoading && vehicles.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <Skeleton variant="rect" className="h-40 rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton variant="text" className="w-2/3 h-4" />
                  <Skeleton variant="text" className="w-1/3" />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Skeleton variant="rect" className="h-8" />
                    <Skeleton variant="rect" className="h-8" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                index={index}
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={Car}
                title={searchQuery ? 'Aucun véhicule correspondant' : 'Aucun véhicule'}
                description={
                  searchQuery
                    ? 'Essayez un autre terme de recherche.'
                    : 'Ajoutez un véhicule pour constituer votre flotte.'
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Info for drivers */}
          <div className="p-4 rounded-xl bg-background-secondary border border-border text-sm text-text-secondary">
            Les chauffeurs s'inscrivent via l'application mobile et apparaissent ici automatiquement.
          </div>

          {isLoading && drivers.length === 0 ? (
            <SkeletonList count={4} />
          ) : filteredDrivers.length > 0 ? (
            filteredDrivers.map((driver, index) => (
              <DriverCard key={driver.id} driver={driver} index={index} onDelete={handleDeleteDriver} />
            ))
          ) : (
            <EmptyState
              icon={Users}
              title={searchQuery ? 'Aucun chauffeur correspondant' : 'Aucun chauffeur'}
              description={
                searchQuery
                  ? 'Essayez un autre terme de recherche.'
                  : "Les chauffeurs apparaissent ici dès qu'ils s'inscrivent via l'application mobile."
              }
            />
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

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={showDriverForm}
        onClose={() => setShowDriverForm(false)}
        onSuccess={() => {
          // Le listener Firestore mettra à jour les drivers automatiquement
          setShowDriverForm(false);
        }}
      />
    </motion.div>
  );
}
