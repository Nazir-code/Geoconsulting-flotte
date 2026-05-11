import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-300"
        title={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === 'dark' ? 0 : 180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          )}
        </motion.div>
      </motion.button>
    );
  }

  // Extended version with label
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 bg-background-secondary rounded-xl border border-border hover:border-accent-cyan/30 transition-all duration-300 cursor-pointer"
      onClick={toggleTheme}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: theme === 'dark' ? 0 : 180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          )}
        </motion.div>
        <span className="text-sm font-medium text-text-primary">
          {theme === 'dark' ? 'Thème Sombre' : 'Thème Clair'}
        </span>
      </div>
      <div className="ml-2 w-12 h-6 bg-accent-cyan/10 rounded-full border border-accent-cyan/20 flex items-center transition-all duration-300">
        <motion.div
          animate={{ x: theme === 'dark' ? 2 : 24 }}
          transition={{ duration: 0.3 }}
          className="w-5 h-5 bg-accent-cyan rounded-full"
        />
      </div>
    </motion.div>
  );
}
