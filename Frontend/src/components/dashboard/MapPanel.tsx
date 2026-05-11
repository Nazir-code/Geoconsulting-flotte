import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Mission } from '@/types';

// Fix pour les icônes Leaflet avec Vite/webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icône véhicule identique à LiveMap pour cohérence
function createVehicleIcon(plateNumber: string) {
  const color = '#0E7490';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <!-- Corps du pin -->
      <path d="M22 2 C11 2 2 11 2 22 C2 33 22 50 22 50 C22 50 42 33 42 22 C42 11 33 2 22 2 Z"
            fill="${color}" filter="url(#shadow)"/>
      <!-- Cercle intérieur -->
      <circle cx="22" cy="22" r="12" fill="white"/>
      <!-- Pictogramme véhicule -->
      <rect x="14" y="18" width="16" height="8" rx="2" fill="${color}" opacity="0.95"/>
      <rect x="17" y="15" width="10" height="4" rx="1.5" fill="${color}" opacity="0.75"/>
      <circle cx="17" cy="27" r="1.8" fill="${color}" />
      <circle cx="27" cy="27" r="1.8" fill="${color}" />
    </svg>
  `;
  return L.divIcon({
    html: `<div title="${plateNumber}">${svg}</div>`,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  });
}

// Composant pour centrer la carte sur le Niger
function MapCenter() {
  const map = useMap();
  useEffect(() => {
    // Centrer sur le Niger avec un zoom approprié
    map.setView([13.5137, 2.1098], 6);
  }, [map]);
  return null;
}

interface MapPanelProps {
  missions: Mission[];
}

export function MapPanel({ missions }: MapPanelProps) {
  // Filtrer les missions en cours pour afficher les véhicules actifs
  const activeMissions = missions.filter(m => m.status === 'in_progress');
  
  // Créer des positions mockées basées sur les missions actives (utilise useMemo pour éviter les re-renders)
  const vehiclePositions = useMemo(() => {
    return activeMissions.map((mission, index) => {
      // Génération déterministe basée sur l'index pour éviter Math.random dans le render
      const seed = index * 1000 + mission.id.charCodeAt(0);
      const latOffset = ((seed % 200) - 100) / 100; // -1 à 1
      const lngOffset = (((seed + 100) % 200) - 100) / 100; // -1 à 1
      const speed = 40 + (seed % 40); // 40-80 km/h
      const progress = seed % 100; // 0-99%
      
      return {
        vehicleId: mission.vehicleId || `v${index + 1}`,
        missionId: mission.id,
        lat: 13.5137 + latOffset, // autour de Niamey
        lng: 2.1098 + lngOffset,
        plateNumber: mission.vehicle?.plateNumber || `V-${200 + index}`,
        driver: mission.driver?.user,
        destination: mission.destination,
        speed,
        progress,
      };
    });
  }, [activeMissions]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-card p-5 h-full relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-text-primary">
          Suivi en temps réel
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-text-secondary">Live</span>
        </div>
      </div>

      {/* Map Container - OpenStreetMap standard */}
      <div className="relative h-[calc(100%-3rem)] min-h-[250px] rounded-xl overflow-hidden">
        <MapContainer
          center={[13.5137, 2.1098]} // Niamey
          zoom={15}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          zoomControl={true}
        >
          {/* Tuiles OpenStreetMap standard (identique mobile) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* Centrage automatique */}
          <MapCenter />

          {/* Markers des véhicules */}
          {vehiclePositions.map((pos) => (
            <Marker
              key={`marker-${pos.vehicleId}`}
              position={[pos.lat, pos.lng]}
              icon={createVehicleIcon(pos.plateNumber)}
            >
              <Popup>
                <div style={{
                  background: '#ffffff',
                  color: '#1f2937',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  minWidth: '200px',
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #e5e7eb',
                }}>
                  {/* Plaque */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      background: '#0E74901a',
                      color: '#0E7490',
                      border: '1px solid #0E749033',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontWeight: 700,
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}>
                      {pos.plateNumber}
                    </span>
                    <span style={{
                      background: '#0E74901a',
                      color: '#10b981',
                      border: '1px solid #10b98133',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      animation: 'pulse 2s infinite',
                    }}>
                      ● LIVE
                    </span>
                  </div>

                  {/* Infos chauffeur */}
                  {pos.driver && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      <strong style={{ color: '#111827' }}>
                        {pos.driver.firstName} {pos.driver.lastName}
                      </strong>
                    </div>
                  )}

                  {/* Destination */}
                  {pos.destination && (
                    <div style={{ fontSize: '12px', marginBottom: '10px', color: '#6b7280' }}>
                      📍 Vers <strong style={{ color: '#0E7490' }}>{pos.destination}</strong>
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}>
                    <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Vitesse</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                        {pos.speed} <span style={{ fontSize: '10px', color: '#64748b' }}>km/h</span>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 8px' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Progression</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: pos.progress >= 100 ? '#10b981' : '#0E7490' }}>
                        {pos.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}
