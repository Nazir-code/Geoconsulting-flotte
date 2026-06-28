// lib/fleetNav.ts
// Petit relais pour ouvrir la Flotte sur un onglet précis depuis une autre vue
// (ex. la carte KPI « Chauffeurs » du Dashboard). On dépose l'onglet voulu ici
// AVANT de naviguer vers la section 'fleet' ; FleetView le consomme à son montage.
// Évite le souci de timing d'un event (FleetView n'est pas encore monté au clic).

export type FleetTab = 'vehicles' | 'drivers';

let pendingTab: FleetTab | null = null;

export function setPendingFleetTab(tab: FleetTab): void {
  pendingTab = tab;
}

/** Renvoie l'onglet en attente (et le consomme : un seul usage). */
export function consumePendingFleetTab(): FleetTab | null {
  const t = pendingTab;
  pendingTab = null;
  return t;
}
