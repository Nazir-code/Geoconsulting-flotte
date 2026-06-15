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

// Icône véhicule circulaire avec flèche directionnelle — tourne selon le heading
function createVehicleIcon(plateNumber: string, heading: number) {
  const color = '#0E7490';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <defs>
        <filter id="vshadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <!-- Halo externe -->
      <circle cx="22" cy="22" r="21" fill="${color}" opacity="0.18"/>
      <!-- Cercle principal -->
      <circle cx="22" cy="22" r="17" fill="${color}" filter="url(#vshadow)"/>
      <!-- Cercle intérieur blanc -->
      <circle cx="22" cy="22" r="12" fill="white"/>
      <!-- Flèche de navigation (pointe vers le Nord = haut) -->
      <path d="M22 9 L27.5 29 L22 25 L16.5 29 Z" fill="${color}"/>
    </svg>
  `;
  return L.divIcon({
    html: `<div title="${plateNumber}" style="transform:rotate(${heading}deg);transform-origin:center center;width:44px;height:44px;">${svg}</div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
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
            icon={createVehicleIcon(plate, pos.heading)}
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
