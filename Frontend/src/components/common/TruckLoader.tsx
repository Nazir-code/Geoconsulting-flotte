import { motion } from 'framer-motion';
import { Truck, MapPin } from 'lucide-react';

interface TruckLoaderProps {
  onComplete?: () => void;
}

export function TruckLoader({ onComplete }: TruckLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card p-12 w-[62vw] min-w-[320px] max-w-[800px] h-[44vh] min-h-[260px] flex flex-col items-center justify-center relative"
        onAnimationComplete={onComplete}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-2">
            Fleet<span className="text-accent-cyan">Nexus</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Fleet operations, simplified.
          </p>
        </motion.div>

        {/* Truck Animation */}
        <div className="relative w-full max-w-md mb-8">
          {/* Road Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
            className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan/50 to-accent-cyan origin-center"
          />
          
          {/* Dashed Road Effect */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] -mt-[1px]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="w-full h-full"
              style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0, 240, 255, 0.3) 10px, rgba(0, 240, 255, 0.3) 20px)',
              }}
            />
          </div>

          {/* Truck */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '0%', opacity: 1 }}
            transition={{ 
              delay: 0.8, 
              duration: 0.8, 
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative z-10"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut',
                delay: 1.6,
              }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <Truck className="w-12 h-12 text-accent-cyan" strokeWidth={1.5} />
                {/* Truck Glow */}
                <div className="absolute inset-0 blur-xl bg-accent-cyan/30 rounded-full" />
              </div>
            </motion.div>
          </motion.div>

          {/* Destination Pin */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4, ease: 'backOut' }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <MapPin className="w-8 h-8 text-accent-violet" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-lg bg-accent-violet/40 rounded-full" />
            </motion.div>
          </motion.div>
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-accent-cyan rounded-full"
          />
          <span className="text-text-secondary text-sm font-mono">
            Initializing systems...
          </span>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="absolute bottom-8 left-12 right-12"
        >
          <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: 2, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-cyan"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Floating Orbs */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-cyan/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-violet/20 rounded-full blur-[80px]"
        />
      </div>
    </div>
  );
}
