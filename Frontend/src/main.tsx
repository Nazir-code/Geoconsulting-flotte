import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Restaurer les préférences d'affichage (densité / animations) au démarrage,
// avant le rendu, pour éviter tout flash visuel.
const savedDensity = localStorage.getItem('ui-density');
if (savedDensity === 'comfortable') document.documentElement.style.fontSize = '17px';
else if (savedDensity === 'compact') document.documentElement.style.fontSize = '14px';
if (localStorage.getItem('ui-animations') === 'off') {
  document.documentElement.classList.add('reduce-motion');
}

console.log('🚀 Starting FleetNexus application...');

const rootElement = document.getElementById('root');
console.log('📍 Root element found:', rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root created, rendering app...');

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('✅ App rendered successfully!');
}
