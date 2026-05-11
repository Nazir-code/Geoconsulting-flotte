import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  Route, 
  Fuel, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { cn } from '@/lib/utils';

interface NavigationRailProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'fleet', label: 'Flotte', icon: Car },
  { id: 'missions', label: 'Missions', icon: Route },
  { id: 'fuel', label: 'Carburant', icon: Fuel },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export function NavigationRail({ activeSection, onSectionChange }: NavigationRailProps) {
  const { signOut } = useAuth();

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="nav-rail"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-8"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/30 flex items-center justify-center">
          <span className="text-accent-cyan font-display font-bold text-lg">F</span>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group',
                isActive 
                  ? 'bg-accent-cyan/10 border border-accent-cyan/50' 
                  : 'border border-transparent hover:border-border hover:bg-background-secondary'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors duration-300',
                  isActive ? 'text-accent-cyan' : 'text-text-secondary group-hover:text-text-primary'
                )} 
                strokeWidth={1.5} 
              />
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-accent-cyan rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-background-secondary border border-border rounded-lg text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        onClick={signOut}
        className="w-12 h-12 rounded-xl flex items-center justify-center border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-300 group mt-auto"
      >
        <LogOut 
          className="w-5 h-5 text-text-secondary group-hover:text-red-400 transition-colors" 
          strokeWidth={1.5} 
        />
        <div className="absolute left-full ml-3 px-2 py-1 bg-background-secondary border border-border rounded-lg text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          Déconnexion
        </div>
      </motion.button>
    </motion.nav>
  );
}
