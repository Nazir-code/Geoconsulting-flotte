// lib/vehicleImages.ts
// Images par défaut des véhicules, par type — affichées quand un véhicule
// n'a pas de photo personnalisée. Modèles les plus courants au Niger :
// pickup → Toyota Hilux, suv → Land Cruiser, sedan → Corolla, van → Hiace, truck → camion.
//
// Photos BUNDLÉES EN LOCAL (src/assets/vehicles/) → fonctionnent hors ligne,
// pas de dépendance réseau. Vite les inclut au build et renvoie leur URL finale.
//
// 👉 POINT DE REMPLACEMENT UNIQUE : pour mettre tes propres photos, remplace
// simplement les fichiers dans src/assets/vehicles/ (mêmes noms) OU change les
// imports ci-dessous. Une photo par véhicule reste prioritaire via `vehicle.image`.

import type { Vehicle } from '@/types';
import pickupImg from '@/assets/vehicles/pickup.jpg';
import suvImg from '@/assets/vehicles/suv.jpg';
import sedanImg from '@/assets/vehicles/sedan.jpg';
import vanImg from '@/assets/vehicles/van.jpg';
import truckImg from '@/assets/vehicles/truck.jpg';
import fallbackImg from '@/assets/vehicles/fallback.jpg';

const DEFAULT_BY_TYPE: Record<Vehicle['type'], string> = {
  // Pickup — Toyota Hilux (omniprésent au Niger)
  pickup: pickupImg,
  // SUV — Toyota Land Cruiser (ONG, administration, flottes)
  suv: suvImg,
  // Berline — Toyota Corolla
  sedan: sedanImg,
  // Van / minibus — Toyota Hiace
  van: vanImg,
  // Camion
  truck: truckImg,
};

// Image générique de repli si le type est inconnu.
const FALLBACK = fallbackImg;

/** Photo à afficher pour un véhicule : sa photo custom, sinon le défaut par type. */
export function vehicleImageSrc(vehicle: Pick<Vehicle, 'image' | 'type'>): string {
  if (vehicle.image && vehicle.image.trim().length > 0) return vehicle.image;
  return DEFAULT_BY_TYPE[vehicle.type] ?? FALLBACK;
}

export { DEFAULT_BY_TYPE };
