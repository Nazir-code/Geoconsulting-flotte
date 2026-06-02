import { createContext, useContext } from 'react';

/**
 * Contexte + hook du système de toasts (séparé du composant Provider pour
 * respecter react-refresh : un module composant n'exporte que des composants).
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  description?: string;
}

export interface ToastApi {
  show: (type: ToastType, message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const noop = () => {};

export const ToastContext = createContext<ToastApi>({
  show: noop,
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
});

/** Hook d'accès à l'API toasts. Renvoie des no-op si aucun provider monté. */
export function useToast() {
  return useContext(ToastContext);
}
