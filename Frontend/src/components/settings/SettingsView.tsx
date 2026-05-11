import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export function SettingsView() {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
          Paramètres
        </h1>
        <p className="text-text-secondary">
          Personnalisez votre expérience FleetNexus
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Theme Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-text-primary">
              Apparence
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Contrôlez l'apparence de l'application
            </p>
          </div>

          <div className="card-body space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-text-primary font-medium">Thème</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Thème actuel : {theme === 'dark' ? 'Sombre' : 'Clair'}
                </p>
              </div>
              <ThemeToggle compact={true} />
            </div>

            {/* Theme Info */}
            <div className="p-4 bg-background-secondary rounded-lg border border-border">
              <p className="text-sm text-text-secondary leading-relaxed">
                Le thème {theme === 'dark' ? 'sombre' : 'clair'} s'applique à 
                <strong> l'ensemble de l'application</strong>. Votre préférence 
                est sauvegardée automatiquement et restaurée lors de votre prochaine visite.
              </p>
            </div>

            {/* Theme Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Dark Mode Preview */}
              <div className="p-4 bg-background-secondary rounded-lg border-2 border-accent-cyan/30">
                <div className="w-full h-24 bg-gradient-to-br from-accent-violet to-accent-cyan rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-text-primary font-medium">Thème Sombre</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Futuriste et moderne avec des couleurs sombres
                </p>
              </div>

              {/* Light Mode Preview */}
              <div className="p-4 bg-background-secondary rounded-lg border-2 border-accent-orange/30">
                <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-slate-700 font-medium">Thème Clair</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Minimaliste et propre avec des couleurs claires
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Display Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-text-primary">
              Affichage
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Options d'affichage et d'interface
            </p>
          </div>

          <div className="card-body space-y-4">
            {/* Density Setting */}
            <div className="flex items-center justify-between py-3 border-b border-border/50">
              <div>
                <p className="text-text-primary font-medium">Densité de l'interface</p>
                <p className="text-sm text-text-secondary">Ajustez l'espacement des éléments</p>
              </div>
              <select className="input-field w-32">
                <option>Confortable</option>
                <option>Normal</option>
                <option>Compact</option>
              </select>
            </div>

            {/* Animations Setting */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-text-primary font-medium">Animations</p>
                <p className="text-sm text-text-secondary">Activer les animations fluides</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded cursor-pointer" />
            </div>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-text-primary">
              À Propos
            </h2>
          </div>

          <div className="card-body space-y-3 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-text-primary">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Thème</span>
              <span className="text-text-primary capitalize">{theme}</span>
            </div>
            <div className="flex justify-between">
              <span>Dernière mise à jour</span>
              <span className="text-text-primary">Aujourd'hui</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
