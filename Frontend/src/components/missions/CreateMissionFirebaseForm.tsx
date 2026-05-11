// components/missions/CreateMissionFirebaseForm.tsx
// Formulaire pour créer une mission directement dans Firestore
// avec synchronisation correcte des UIDs Firebase

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Users } from 'lucide-react';
import {
  createMissionWithFirebaseUid,
  listAllDriversInFirestore,
  debugMissionSync,
} from '@/services/firestoreMissionCreator';
import { useAuth } from '@/context/AuthContext_Firebase';

export function CreateMissionFirebaseForm() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Array<{ uid: string; email: string; name: string; status: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    driverEmail: '',
    location: '',
    title: '',
    description: '',
    priority: 'medium' as const,
  });

  // Charger la liste des drivers au montage
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const allDrivers = await listAllDriversInFirestore();
    setDrivers(allDrivers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createMissionWithFirebaseUid(
        formData.driverEmail,
        formData.location,
        formData.title,
        formData.description,
        formData.priority,
        user?.id || 'admin'
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Mission créée avec succès! ID: ${result.missionId}`,
        });
        
        // Réinitialiser le formulaire
        setFormData({
          driverEmail: '',
          location: '',
          title: '',
          description: '',
          priority: 'medium',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erreur lors de la création',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebug = async () => {
    setMessage({ type: 'info', text: 'Vérification de la synchronisation...' });
    await debugMissionSync();
    setMessage({ type: 'success', text: 'Vérification terminée (voir console)' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 max-w-2xl"
    >
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
          Créer une Mission (Firestore - Mode Synchronisé)
        </h3>
        <p className="text-sm text-text-secondary/60">
          Crée une mission directement avec le UID Firebase du driver pour assurer la synchronisation mobile
        </p>
      </div>

      {/* Drivers disponibles */}
      <div className="mb-6 p-4 rounded-lg bg-background-secondary border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent-cyan" />
          <h4 className="font-semibold text-sm text-text-primary">Drivers disponibles</h4>
        </div>
        
        {drivers.length === 0 ? (
          <p className="text-xs text-text-secondary/60">
            ❌ Aucun driver trouvé. Assurez-vous que les drivers se sont connectés une première fois.
          </p>
        ) : (
          <div className="space-y-2">
            {drivers.map(driver => (
              <button
                key={driver.uid}
                onClick={() => setFormData({ ...formData, driverEmail: driver.email })}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs
                  ${formData.driverEmail === driver.email
                    ? 'bg-accent-cyan/10 border-accent-cyan/50 text-accent-cyan'
                    : 'border-border hover:border-accent-cyan/30 text-text-secondary hover:text-text-primary'
                  }`}
              >
                <div className="font-semibold">{driver.name}</div>
                <div className="opacity-60">{driver.email}</div>
                <div className="text-[10px] opacity-40 font-mono">UID: {driver.uid}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : message.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Driver Email (read-only ou readonly display) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Driver (Email)
          </label>
          <input
            type="text"
            value={formData.driverEmail}
            readOnly
            placeholder="Sélectionnez un driver ci-dessus"
            className="input-field bg-background-secondary opacity-70"
            required
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Titre
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="ex: Livraison urgente"
            className="input-field"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Destination
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="ex: Niamey, Mali"
            className="input-field"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Détails de la mission..."
            className="input-field min-h-20"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Priorité
          </label>
          <select
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
            className="input-field"
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={isLoading || !formData.driverEmail || !formData.title || !formData.location}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn btn-primary py-3 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Création...' : 'Créer la Mission'}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleDebug}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-lg border border-border hover:border-accent-cyan/50 text-text-secondary hover:text-accent-cyan transition-all text-sm font-medium"
          >
            🔍 Debug
          </motion.button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400/80 space-y-2">
        <p className="font-semibold">ℹ️ Comment ça fonctionne:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Sélectionnez un driver (il doit s'être connecté une fois à l'app mobile)</li>
          <li>Remplissez les détails de la mission</li>
          <li>La mission sera créée avec le UID Firebase correct</li>
          <li>L'app mobile recevra la mission instantanément</li>
        </ul>
      </div>
    </motion.div>
  );
}
