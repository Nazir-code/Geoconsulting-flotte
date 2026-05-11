import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LivePosition } from '@/services/gpsSimulatorService';
import type { Mission } from '@/types';

// Fix pour les icônes Leaflet avec Vite/webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icône véhicule en style clair, proche de la map mobile
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

// Composant pour centrer la carte sur un véhicule sélectionné
function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Couleurs des polylines par véhicule
const TRAIL_COLORS = ['#06b6d4', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

interface LiveMapProps {
  positions: LivePosition[];
  trails: Record<string, Array<{ lat: number; lng: number }>>;
  missions: Mission[];
  selectedVehicleId: string | null;
  onMarkerClick?: (vehicleId: string) => void;
}

export function LiveMap({ positions, trails, missions, selectedVehicleId, onMarkerClick }: LiveMapProps) {
  const colorMap = useRef<Record<string, string>>({});

  // Assigner une couleur stable à chaque véhicule
  positions.forEach((p, i) => {
    if (!colorMap.current[p.vehicleId]) {
      colorMap.current[p.vehicleId] = TRAIL_COLORS[i % TRAIL_COLORS.length];
    }
  });

  // Position de la carte centrée sur le Niger
  const NIGER_CENTER: [number, number] = [14.0, 8.0];

  // Position du véhicule sélectionné
  const selectedPos = selectedVehicleId
    ? positions.find((p) => p.vehicleId === selectedVehicleId)
    : null;
  const flyToPos: [number, number] | null = selectedPos
    ? [selectedPos.lat, selectedPos.lng]
    : null;

  return (
    <MapContainer
      center={NIGER_CENTER}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      zoomControl={true}
    >
      {/* Tuiles claires OpenStreetMap (alignées mobile) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Fly to sélection */}
      <MapFlyTo position={flyToPos} />

      {/* Traces de trajectoire */}
      {positions.map((pos) => {
        const trail = trails[pos.vehicleId] ?? [];
        if (trail.length < 2) return null;
        const latLngs: [number, number][] = trail.map((p) => [p.lat, p.lng]);
        const color = colorMap.current[pos.vehicleId] ?? '#06b6d4';
        return (
          <Polyline
            key={`trail-${pos.vehicleId}`}
            positions={latLngs}
            pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: '6 4' }}
          />
        );
      })}

      {/* Markers des véhicules */}
      {positions.map((pos) => {
        const mission = missions.find((m) => m.id === pos.missionId);
        const plate = mission?.vehicle?.plateNumber ?? pos.vehicleId;
        const driver = mission?.driver?.user;
        const color = colorMap.current[pos.vehicleId] ?? '#06b6d4';

        return (
          <Marker
            key={`marker-${pos.vehicleId}`}
            position={[pos.lat, pos.lng]}
            icon={createVehicleIcon(plate)}
            eventHandlers={{
              click: () => onMarkerClick?.(pos.vehicleId),
            }}
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
                    background: color + '1a',
                    color,
                    border: `1px solid ${color}33`,
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}>
                    {plate}
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
                {driver && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    <strong style={{ color: '#111827' }}>
                      {driver.firstName} {driver.lastName}
                    </strong>
                  </div>
                )}

                {/* Route */}
                {mission && (
                  <div style={{ fontSize: '12px', marginBottom: '10px', color: '#6b7280' }}>
                    📍 {mission.startLocation} → <strong style={{ color }}>{mission.destination}</strong>
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
                    <div style={{ fontSize: '10px', color: '#64748b' }}>ETA</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                      {pos.eta} <span style={{ fontSize: '10px', color: '#64748b' }}>min</span>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Distance</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                      {pos.distanceDone}<span style={{ fontSize: '10px', color: '#64748b' }}>/{pos.distanceTotal} km</span>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Progression</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: pos.progress >= 100 ? '#10b981' : color }}>
                      {pos.progress}%
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div style={{
                  marginTop: '10px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  height: '5px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pos.progress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}99)`,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
