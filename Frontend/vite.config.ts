import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL || process.env.NODE_ENV === 'production' ? '/' : '/ApplicationFlotteVehicule/',
  server: {
    host: true,   // Expose sur le réseau local (tablette, téléphone, etc.)
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3100',
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          // Séparer les dépendances principales
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('leaflet')) {
              return 'maps';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'animations';
            }
            if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx')) {
              return 'utils';
            }
            return 'vendor';
          }
        }
      }
    },
    // Optimisations supplémentaires
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Désactiver les sourcemaps en production
  },
});

