// lib/vehicleImages.ts
// Images par défaut des véhicules, par type — affichées quand un véhicule
// n'a pas de photo personnalisée. Modèles les plus courants au Niger :
// pickup → Toyota Hilux, suv → Land Cruiser, sedan → Corolla, van → Hiace, truck → camion.
//
// 👉 POINT DE REMPLACEMENT UNIQUE : pour mettre tes propres photos (Hilux,
// Land Cruiser, etc.), remplace simplement l'URL correspondante ci-dessous.
// N'importe quelle URL d'image publique fonctionne.

import type { Vehicle } from '@/types';

const DEFAULT_BY_TYPE: Record<Vehicle['type'], string> = {
  // Pickup — Toyota Hilux (omniprésent au Niger)
  pickup: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=300&fit=crop',
  // SUV — Toyota Land Cruiser (ONG, administration, flottes)
  suv: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  // Berline — Toyota Corolla
  sedan: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
  // Van / minibus — Toyota Hiace
  van: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&h=300&fit=crop',
  // Camion
  truck: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
};

// Image générique de repli si le type est inconnu.
const FALLBACK = 'https://images.unsplash.com/photo-1566008885218-90abf9200ddb?w=400&h=300&fit=crop';

/** Photo à afficher pour un véhicule : sa photo custom, sinon le défaut par type. */
export function vehicleImageSrc(vehicle: Pick<Vehicle, 'image' | 'type'>): string {
  if (vehicle.image && vehicle.image.trim().length > 0) return vehicle.image;
  return DEFAULT_BY_TYPE[vehicle.type] ?? FALLBACK;
}

export { DEFAULT_BY_TYPE };
