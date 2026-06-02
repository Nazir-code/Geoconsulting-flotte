import { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, type ToastApi, type ToastItem, type ToastType } from './toastContext';

/**
 * ToastProvider — fournit le feedback visuel (success / error / warning / info).
 *
 * UI-only : aucun appel métier. Monter <ToastProvider> à la racine (App).
 * Le hook `useToast` est défini dans ./toastContext.
 */

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-300',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, description?: string) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, type, message, description }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const api: ToastApi = {
    show,
    success: (m, d) => show('success', m, d),
    error: (m, d) => show('error', m, d),
    warning: (m, d) => show('warning', m, d),
    info: (m, d) => show('info', m, d),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-viewport">
          <AnimatePresence initial={false}>
            {toasts.map((t) => {
              const Icon = ICONS[t.type];
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: 40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={cn('toast', `toast-${t.type}`)}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', ICON_COLOR[t.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{t.message}</p>
                    {t.description && (
                      <p className="text-xs text-text-secondary mt-0.5">{t.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
