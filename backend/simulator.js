// GPS Simulator Service — Côté Serveur
// Simule le déplacement des véhicules en mission entre les villes du Niger

export const NIGER_CITIES_COORDS = {
  'Niamey':    { lat: 13.5137, lng: 2.1098  },
  'Dosso':     { lat: 13.0497, lng: 3.1972  },
  'Maradi':    { lat: 13.5000, lng: 7.1000  },
  'Zinder':    { lat: 13.8069, lng: 8.9881  },
  'Tillabéri': { lat: 14.2088, lng: 1.4515  },
  'Tahoua':    { lat: 14.8889, lng: 5.2678  },
  'Agadez':    { lat: 16.9742, lng: 7.9919  },
  'Diffa':     { lat: 13.3154, lng: 12.6113 },
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export class GpsSimulatorService {
  constructor() {
    this.vehicles = new Map();
    this.intervalId = null;
    this.listeners = [];
    this.isPaused = false;
    this.tickRate = 3000;
  }

  registerVehicle(vehicleId, missionId, fromCity, toCity, initialProgressPercent = 0) {
    const fromCoord = NIGER_CITIES_COORDS[fromCity] ?? NIGER_CITIES_COORDS['Niamey'];
    const toCoord   = NIGER_CITIES_COORDS[toCity]   ?? NIGER_CITIES_COORDS['Dosso'];
    const totalDistance = haversine(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);
    const distanceDone  = (initialProgressPercent / 100) * totalDistance;

    this.vehicles.set(vehicleId, {
      vehicleId,
      missionId,
      fromCity,
      toCity,
      fromCoord,
      toCoord,
      totalDistance,
      distanceDone,
      speedKmh: 60 + Math.random() * 30,
      trailPositions: [],
    });
  }

  unregisterVehicle(vehicleId) {
    this.vehicles.delete(vehicleId);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.tickRate);
    this.tick();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  get paused() {
    return this.isPaused;
  }

  reset() {
    this.vehicles.forEach((v) => {
      v.distanceDone = 0;
      v.trailPositions = [];
      v.speedKmh = 60 + Math.random() * 30;
    });
  }

  getCurrentPositions() {
    return this.buildPositions();
  }

  getTrail(vehicleId) {
    return this.vehicles.get(vehicleId)?.trailPositions ?? [];
  }

  tick() {
    if (this.isPaused) return;

    this.vehicles.forEach((v) => {
      v.speedKmh = Math.max(40, Math.min(110, v.speedKmh + (Math.random() - 0.5) * 10));
      const deltaKm = (v.speedKmh * (this.tickRate / 1000)) / 3600;
      v.distanceDone = Math.min(v.totalDistance, v.distanceDone + deltaKm);
      const pos = this.interpolate(v);

      v.trailPositions.push(pos);
      if (v.trailPositions.length > 60) {
        v.trailPositions.shift();
      }
    });

    const positions = this.buildPositions();
    this.listeners.forEach((l) => l(positions));
  }

  buildPositions() {
    return Array.from(this.vehicles.values()).map((v) => {
      const progress = v.totalDistance > 0 ? (v.distanceDone / v.totalDistance) * 100 : 0;
      const remainingKm = v.totalDistance - v.distanceDone;
      const eta = v.speedKmh > 0 ? (remainingKm / v.speedKmh) * 60 : 0;
      const currentPos = this.interpolate(v);
      const head = bearing(v.fromCoord.lat, v.fromCoord.lng, v.toCoord.lat, v.toCoord.lng);

      return {
        vehicleId: v.vehicleId,
        missionId: v.missionId,
        lat: currentPos.lat,
        lng: currentPos.lng,
        speed: Math.round(v.speedKmh),
        heading: Math.round(head),
        progress: Math.min(100, Math.round(progress * 10) / 10),
        distanceDone: Math.round(v.distanceDone),
        distanceTotal: Math.round(v.totalDistance),
        eta: Math.max(0, Math.round(eta)),
        timestamp: new Date().toISOString(),
      };
    });
  }

  interpolate(v) {
    if (v.totalDistance === 0) return { ...v.fromCoord };
    const t = Math.min(1, v.distanceDone / v.totalDistance);
    const jitter = 0.004;
    return {
      lat: v.fromCoord.lat + (v.toCoord.lat - v.fromCoord.lat) * t + (Math.random() - 0.5) * jitter,
      lng: v.fromCoord.lng + (v.toCoord.lng - v.fromCoord.lng) * t + (Math.random() - 0.5) * jitter,
    };
  }
}
