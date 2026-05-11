// screens/MissionsBoard.tsx
// Tableau de bord pour créer et assigner les missions

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Check, X, AlertCircle, Loader } from 'lucide-react';
import { FirestoreMissionService, type Mission } from '@/services/firestoreMissionService';
import { FirestoreDriverService, type Driver } from '@/services/firestoreDriverService';
import { useAuth } from '@/context/AuthContext_Firebase';

/**
 * Formulaire de création de mission
 */
function MissionForm({
  drivers,
  onSubmit,
  onCancel,
}: {
  drivers: Driver[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium' as const,
    assignedTo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.location || !formData.assignedTo) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        location: '',
        priority: 'medium',
        assignedTo: '',
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Créer une Mission
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Livraison Niamey"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Décrivez les détails de la mission..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
          />
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Ex: Niamey, Niger"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
          />
        </div>

        {/* Grille 2 colonnes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>

          {/* Chauffeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigner à</label>
            <select
              required
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
            >
              <option value="">Sélectionner un chauffeur</option>
              {drivers.map((driver) => (
                <option key={driver.uid} value={driver.uid}>
                  {driver.name} ({driver.status === 'online' ? '🟢' : '🔴'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Création...' : 'Créer la Mission'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Carte de mission
 */
function MissionCard({
  mission,
  driverName,
  onComplete,
  loading,
}: {
  mission: Mission;
  driverName?: string;
  onComplete: () => Promise<void>;
  loading: boolean;
}) {
  const statusColors = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-200' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-200' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200' },
  };

  const statusLabels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Complétée',
  };

  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-orange-600',
    high: 'text-red-600',
  };

  const priorityLabels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
  };

  const colors = statusColors[mission.status];

  return (
    <div className={`${colors.bg} border rounded-lg p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{mission.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
        </div>
        <span className={`${colors.badge} text-sm font-semibold px-3 py-1 rounded-full`}>
          {statusLabels[mission.status]}
        </span>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Localisation</p>
          <p className="font-semibold text-gray-900">{mission.location}</p>
        </div>
        <div>
          <p className="text-gray-600">Priorité</p>
          <p className={`font-semibold ${priorityColors[mission.priority]}`}>
            {priorityLabels[mission.priority]}
          </p>
        </div>
      </div>

      {/* Chauffeur */}
      {driverName && (
        <div className="text-sm">
          <p className="text-gray-600">Assignée à</p>
          <p className="font-semibold text-gray-900">{driverName}</p>
        </div>
      )}

      {/* Notes */}
      {mission.notes && mission.notes.length > 0 && (
        <div className="text-sm bg-white bg-opacity-50 p-3 rounded">
          <p className="text-gray-600 font-medium mb-2">Notes:</p>
          <ul className="space-y-1 text-gray-900">
            {mission.notes.slice(-3).map((note, idx) => (
              <li key={idx} className="text-xs">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {mission.status !== 'completed' && (
        <button
          onClick={onComplete}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? 'Mise à jour...' : 'Marquer comme Complétée'}
        </button>
      )}
    </div>
  );
}

/**
 * Tableau de bord des missions
 */
export function MissionsBoard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completingMission, setCompletingMission] = useState<string | null>(null);
  const [error, setError] = useState('');

  /**
   * Charger les missions et drivers
   */
  useEffect(() => {
    const unsubscribeMissions = FirestoreMissionService.allMissionsListener((missionsList) => {
      setMissions(missionsList);
      setLoading(false);
    });

    const unsubscribeDrivers = FirestoreDriverService.allDriversListener((driversList) => {
      setDrivers(driversList);
    });

    return () => {
      unsubscribeMissions();
      unsubscribeDrivers();
    };
  }, []);

  /**
   * Créer une nouvelle mission
   */
  const handleCreateMission = async (formData: any) => {
    try {
      setError('');
      const missionId = await FirestoreMissionService.createMission({
        ...formData,
        priority: formData.priority,
        createdBy: user?.id || '',
      });
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  /**
   * Marquer une mission comme complétée
   */
  const handleCompleteMission = async (missionId: string) => {
    try {
      setCompletingMission(missionId);
      await FirestoreMissionService.completeMission(missionId);
      setCompletingMission(null);
    } catch (err) {
      console.error('Erreur:', err);
      setCompletingMission(null);
    }
  };

  /**
   * Obtenir le nom du chauffeur
   */
  const getDriverName = (uid: string) => {
    return drivers.find((d) => d.uid === uid)?.name || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Missions</h1>
            <p className="text-gray-600 mt-2">{missions.length} mission(s)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Mission
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="mb-8">
            <MissionForm
              drivers={drivers.filter((d) => d.status === 'online')}
              onSubmit={handleCreateMission}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{missions.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-700">En Attente</p>
            <p className="text-2xl font-bold text-yellow-900">{missions.filter((m) => m.status === 'pending').length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-700">En Cours</p>
            <p className="text-2xl font-bold text-blue-900">{missions.filter((m) => m.status === 'in_progress').length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Complétées</p>
            <p className="text-2xl font-bold text-green-900">{missions.filter((m) => m.status === 'completed').length}</p>
          </div>
        </div>

        {/* Missions par statut */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* En Attente */}
          <div>
            <h2 className="text-lg font-semibold text-yellow-900 mb-4">En Attente</h2>
            <div className="space-y-3">
              {missions
                .filter((m) => m.status === 'pending')
                .map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    driverName={getDriverName(mission.assignedTo)}
                    onComplete={() => handleCompleteMission(mission.id)}
                    loading={completingMission === mission.id}
                  />
                ))}
              {missions.filter((m) => m.status === 'pending').length === 0 && (
                <p className="text-gray-500 text-sm">Aucune mission en attente</p>
              )}
            </div>
          </div>

          {/* En Cours */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4">En Cours</h2>
            <div className="space-y-3">
              {missions
                .filter((m) => m.status === 'in_progress')
                .map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    driverName={getDriverName(mission.assignedTo)}
                    onComplete={() => handleCompleteMission(mission.id)}
                    loading={completingMission === mission.id}
                  />
                ))}
              {missions.filter((m) => m.status === 'in_progress').length === 0 && (
                <p className="text-gray-500 text-sm">Aucune mission en cours</p>
              )}
            </div>
          </div>

          {/* Complétées */}
          <div>
            <h2 className="text-lg font-semibold text-green-900 mb-4">Complétées</h2>
            <div className="space-y-3">
              {missions
                .filter((m) => m.status === 'completed')
                .map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    driverName={getDriverName(mission.assignedTo)}
                    onComplete={async () => {}}
                    loading={false}
                  />
                ))}
              {missions.filter((m) => m.status === 'completed').length === 0 && (
                <p className="text-gray-500 text-sm">Aucune mission complétée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionsBoard;
