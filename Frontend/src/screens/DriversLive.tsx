// screens/DriversLive.tsx
// Dashboard carte + liste des chauffeurs en temps réel via Firestore

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, MapPin, Clock, Signal, Navigation, Wifi, WifiOff } from 'lucide-react';
import type { Driver } from '@/services/firestoreDriverService';
import { FirestoreDriverService } from '@/services/firestoreDriverService';

// ─── Fix icône Leaflet (problème webpack classique) ────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Icônes personnalisées ────────────────────────────────────────────────
function createDriverIcon(status: string, name: string) {
  const color = status === 'online' ? '#0E7490' : '#6b7280';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <!-- Corps de l'épingle -->
      <path d="M22 2 C11 2 2 11 2 22 C2 33 22 50 22 50 C22 50 42 33 42 22 C42 11 33 2 22 2 Z"
            fill="${color}" filter="url(#shadow)"/>
      <!-- Cercle blanc intérieur -->
      <circle cx="22" cy="22" r="12" fill="white"/>
      <!-- Pictogramme véhicule -->
      <rect x="14" y="18" width="16" height="8" rx="2" fill="${color}" opacity="0.95"/>
      <rect x="17" y="15" width="10" height="4" rx="1.5" fill="${color}" opacity="0.75"/>
      <circle cx="17" cy="27" r="1.8" fill="${color}" />
      <circle cx="27" cy="27" r="1.8" fill="${color}" />
      ${status === 'online' ? `
      <!-- Indicateur pulse (online) -->
      <circle cx="36" cy="8" r="5" fill="#10b981" stroke="white" stroke-width="2"/>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -52],
  });
}

// ─── Composant qui centre la carte sur les markers ────────────────────────
function FitBoundsToDrivers({ drivers }: { drivers: Driver[] }) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const withGps = drivers.filter((d) => d.latitude && d.longitude);
    if (withGps.length === 0 || hasInitialized.current) return;

    if (withGps.length === 1) {
      map.setView([withGps[0].latitude!, withGps[0].longitude!], 15);
    } else {
      const bounds = L.latLngBounds(
        withGps.map((d) => [d.latitude!, d.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    hasInitialized.current = true;
  }, [drivers, map]);

  return null;
}

// ─── Formatage ────────────────────────────────────────────────────────────
function formatTime(timestamp: any): string {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

function formatCoords(lat?: number, lng?: number): string {
  if (lat == null || lng == null) return 'Position indisponible';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function timeSince(timestamp: any): string {
  if (!timestamp) return 'jamais';
  try {
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'à l\'instant';
    if (seconds < 60) return `il y a ${seconds}s`;
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`;
    return `il y a ${Math.floor(seconds / 3600)}h`;
  } catch {
    return 'N/A';
  }
}

// ─── Composant principal ─────────────────────────────────────────────────
export function DriversLive() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [, forceUpdate] = useState(0);

  // Mettre à jour les "il y a Xs" toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  // Listener Firestore pour TOUS les chauffeurs
  useEffect(() => {
    setLoading(true);
    const unsubscribeAll = FirestoreDriverService.allDriversListener((list) => {
      console.log('🔄 [DriversLive] Chauffeurs reçus de Firestore:', {
        count: list.length,
        drivers: list.map(d => ({ 
          id: d.id, 
          name: d.name, 
          status: d.status, 
          hasGPS: !!(d.latitude && d.longitude),
          lat: d.latitude,
          lng: d.longitude
        }))
      });
      setAllDrivers(list);
      setLoading(false);
    });
    return unsubscribeAll;
  }, []);

  // Filtrer selon le toggle
  useEffect(() => {
    setDrivers(showOnlineOnly ? allDrivers.filter((d) => d.status === 'online') : allDrivers);
  }, [allDrivers, showOnlineOnly]);

  // Chauffeurs avec coordonnées GPS valides
  const driversWithGps = drivers.filter((d) => d.latitude && d.longitude);
  const onlineCount = allDrivers.filter((d) => d.status === 'online').length;
  const gpsCount = allDrivers.filter((d) => d.latitude && d.longitude).length;
  const missionCount = allDrivers.filter((d) => d.currentMission).length;

  // Centre par défaut : Niamey, Niger
  const defaultCenter: [number, number] = [13.5137, 2.1098];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Connexion à Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4" style={{ minHeight: '80vh' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Navigation className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Suivi GPS en Direct</h1>
            <p className="text-xs text-gray-400">
              {onlineCount} chauffeur{onlineCount !== 1 ? 's' : ''} en ligne · Firebase Firestore
            </p>
          </div>
        </div>

        {/* Toggle Online Only */}
        <button
          onClick={() => setShowOnlineOnly(!showOnlineOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showOnlineOnly
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          {showOnlineOnly ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {showOnlineOnly ? 'En ligne seulement' : 'Tous les chauffeurs'}
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(16,185,129,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Signal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">En Ligne</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{onlineCount}</p>
        </div>

        <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(59,130,246,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Position GPS</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{gpsCount}</p>
        </div>

        <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(249,115,22,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">En Mission</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{missionCount}</p>
        </div>
      </div>

      {/* ── Layout Principal : Carte + Liste ───────────────── */}
      <div className="flex gap-4 flex-1" style={{ minHeight: '500px' }}>

        {/* Carte Leaflet */}
        <div
          className="flex-1 rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ minHeight: '500px' }}
        >
          {driversWithGps.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 text-center border border-gray-200">
                <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-700 text-sm font-medium">Aucune position GPS disponible</p>
                <p className="text-gray-500 text-xs mt-1">Les positions apparaîtront dès que les chauffeurs activent leur GPS</p>
              </div>
            </div>
          )}

          <MapContainer
            center={
              driversWithGps[0]
                ? [driversWithGps[0].latitude!, driversWithGps[0].longitude!]
                : defaultCenter
            }
            zoom={driversWithGps.length > 0 ? 12 : 6}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBoundsToDrivers drivers={driversWithGps} />

            {driversWithGps.map((driver) => (
              <Marker
                key={driver.uid}
                position={[driver.latitude!, driver.longitude!]}
                icon={createDriverIcon(driver.status, driver.name || driver.email)}
                eventHandlers={{
                  click: () => setSelectedDriver(driver.uid),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div className="font-bold text-gray-900 text-sm mb-1">
                      {driver.name || driver.email}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            driver.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {driver.status === 'online' ? 'En ligne' : 'Hors ligne'}
                      </div>
                      <div>📍 {formatCoords(driver.latitude, driver.longitude)}</div>
                      <div>🕐 Mise à jour : {timeSince(driver.lastLocationUpdate)}</div>
                      {driver.currentMission && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          🚗 <span className="font-medium">Mission en cours</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Liste des chauffeurs */}
        <div
          className="flex flex-col gap-2 overflow-y-auto rounded-2xl"
          style={{ width: 300, flexShrink: 0 }}
        >
          {drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Users className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Aucun chauffeur{showOnlineOnly ? ' en ligne' : ''}</p>
            </div>
          ) : (
            drivers.map((driver) => {
              const isSelected = selectedDriver === driver.uid;
              const isOnline = driver.status === 'online';
              const hasGps = !!(driver.latitude && driver.longitude);

              return (
                <div
                  key={driver.uid}
                  onClick={() => setSelectedDriver(isSelected ? null : driver.uid)}
                  className={`rounded-xl p-3 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                  style={{
                    background: isSelected
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {/* En-tête driver */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Avatar initiales */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: isOnline
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'rgba(107,114,128,0.3)',
                        color: 'white',
                      }}
                    >
                      {(driver.name || driver.email)
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {driver.name || driver.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{driver.email}</p>
                    </div>

                    {/* Indicateur statut */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                        }`}
                      />
                      {isOnline && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                      )}
                    </div>
                  </div>

                  {/* Position GPS */}
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-3 h-3 shrink-0 ${hasGps ? 'text-blue-400' : 'text-gray-600'}`}
                    />
                    <span className="text-xs font-mono text-gray-400 truncate">
                      {hasGps
                        ? formatCoords(driver.latitude, driver.longitude)
                        : 'Pas de GPS'}
                    </span>
                  </div>

                  {/* Dernière mise à jour */}
                  {driver.lastLocationUpdate && (
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-600 shrink-0" />
                      <span className="text-xs text-gray-500">
                        {timeSince(driver.lastLocationUpdate)}
                      </span>
                    </div>
                  )}

                  {/* Mission */}
                  {driver.currentMission && (
                    <div className="mt-2 px-2 py-1 rounded-lg text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20">
                      🚗 Mission en cours
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DriversLive;
