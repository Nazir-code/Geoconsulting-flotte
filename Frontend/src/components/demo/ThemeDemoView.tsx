import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export function ThemeDemoView() {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
          🎨 Démonstration du Thème
        </h1>
        <p className="text-text-secondary">
          Voici tous les composants stylisés avec le système de thème global
        </p>
        <div className="mt-4 p-4 bg-background-secondary rounded-lg border border-border">
          <p className="text-sm text-text-primary">
            Thème actif : <strong className="capitalize">{theme}</strong>
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Cliquez sur l'icône de thème dans la barre supérieure pour basculer
          </p>
        </div>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold">Cartes</h2>
          </div>
          <div className="card-body space-y-3">
            <div className="p-3 bg-background-secondary rounded-lg border border-border/50">
              <p className="text-sm font-medium text-text-primary">Carte Simple</p>
              <p className="text-xs text-text-secondary mt-1">
                Les cartes utilisent les variables CSS de thème
              </p>
            </div>
            <div className="p-3 bg-background-tertiary rounded-lg border border-border/50">
              <p className="text-sm font-medium text-text-primary">Fond Tertiaire</p>
              <p className="text-xs text-text-secondary mt-1">
                Fond alternatif pour la hiérarchie visuelle
              </p>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold">Boutons</h2>
          </div>
          <div className="card-body space-y-3">
            <button className="w-full btn btn-primary">Bouton Primaire</button>
            <button className="w-full btn btn-secondary">Bouton Secondaire</button>
            <button className="w-full btn btn-primary" disabled>
              Bouton Désactivé
            </button>
          </div>
        </motion.div>

        {/* Input Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold">Champs de Saisie</h2>
          </div>
          <div className="card-body space-y-3">
            <input
              type="text"
              className="input-field"
              placeholder="Champ de texte..."
              defaultValue="Valeur entrée"
            />
            <input
              type="email"
              className="input-field"
              placeholder="Adresse email..."
            />
            <textarea
              className="input-field"
              rows={3}
              placeholder="Zone de texte multiligne..."
              defaultValue="Lorem ipsum dolor sit amet"
            />
          </div>
        </motion.div>

        {/* Status Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold">Badges de Statut</h2>
          </div>
          <div className="card-body flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium">
              <Check className="w-3 h-3" /> Actif
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium">
              <AlertCircle className="w-3 h-3" /> En Attente
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium">
              <X className="w-3 h-3" /> Erreur
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium">
              <Info className="w-3 h-3" /> Info
            </span>
          </div>
        </motion.div>
      </div>

      {/* Color Palette */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="card mb-8"
      >
        <div className="card-header">
          <h2 className="text-lg font-display font-semibold">Palette de Couleurs</h2>
          <p className="text-sm text-text-secondary mt-1">
            Variables CSS utilisées pour le thème {theme}
          </p>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Primary Colors */}
            <div className="space-y-2">
              <div
                className="w-full h-24 rounded-lg border border-border/50 flex items-center justify-center font-mono text-xs"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <span className="text-text-secondary">Primary BG</span>
              </div>
              <p className="text-xs text-text-secondary">--bg-primary</p>
            </div>

            <div className="space-y-2">
              <div
                className="w-full h-24 rounded-lg border border-border/50 flex items-center justify-center font-mono text-xs"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <span className="text-text-secondary">Secondary BG</span>
              </div>
              <p className="text-xs text-text-secondary">--bg-secondary</p>
            </div>

            <div className="space-y-2">
              <div
                className="w-full h-24 rounded-lg border border-border/50 flex items-center justify-center font-mono text-xs"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="text-text-secondary">Tertiary BG</span>
              </div>
              <p className="text-xs text-text-secondary">--bg-tertiary</p>
            </div>

            {/* Text Colors */}
            <div className="space-y-2">
              <div className="w-full h-24 rounded-lg border border-border/50 flex items-center justify-center bg-background-secondary">
                <span style={{ color: 'var(--text-primary)' }} className="font-mono text-xs font-bold">
                  Text Primary
                </span>
              </div>
              <p className="text-xs text-text-secondary">--text-primary</p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-24 rounded-lg border border-border/50 flex items-center justify-center bg-background-secondary">
                <span style={{ color: 'var(--text-secondary)' }} className="font-mono text-xs font-bold">
                  Text Secondary
                </span>
              </div>
              <p className="text-xs text-text-secondary">--text-secondary</p>
            </div>

            {/* Accent Colors */}
            <div className="space-y-2">
              <div className="w-full h-24 rounded-lg border border-accent-cyan/50 flex items-center justify-center bg-accent-cyan/10">
                <span className="font-mono text-xs font-bold text-accent-cyan">
                  Cyan Accent
                </span>
              </div>
              <p className="text-xs text-text-secondary">#00F0FF</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Text Examples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-lg font-display font-semibold">Typographie</h2>
        </div>

        <div className="card-body space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-text-primary">
              Titre H1 (Display)
            </h1>
            <p className="text-text-secondary mt-2">
              Utilise la famille de polices 'Space Grotesk'
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-display font-semibold text-text-primary">
              Titre H2 (Display)
            </h2>
            <p className="text-text-secondary mt-2">
              Titre de section avec style moderne
            </p>
          </div>

          <div>
            <p className="text-base text-text-primary">
              Texte normal avec couleur primaire (var(--text-primary))
            </p>
            <p className="text-base text-text-secondary mt-2">
              Texte secondaire avec couleur secondaire (var(--text-secondary))
            </p>
            <p className="text-sm text-text-secondary mt-2">
              Petit texte pour les annotations et les descriptions
            </p>
          </div>

          <div className="p-4 bg-background-secondary rounded-lg border border-border/50">
            <p className="font-mono text-xs text-text-secondary">
              Code ou texte monospace avec couleur de texte
            </p>
          </div>
        </div>

        <div className="card-footer">
          <p className="text-xs text-text-secondary">
            Toutes les couleurs de texte changent dynamiquement avec le thème
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
