import { motion } from 'framer-motion';
import { Bell, Sun, Moon, MapPin, RefreshCw, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { useTheme } from '@/context/ThemeContext';
import { formatTime } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { FirestoreMissionService, type Mission as FirestoreMission } from '@/services/firestoreMissionService';
import { FirestoreFuelService, type FuelRecord } from '@/services/firestoreFuelService';
import { FirestoreMaintenanceService, type MaintenanceRequest } from '@/services/firestoreMaintenanceService';
import { FirestoreDriverService, type Driver } from '@/services/firestoreDriverService';

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
}

export function TopBar({ title, onRefresh }: TopBarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [missions, setMissions] = useState<FirestoreMission[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [maintRequests, setMaintRequests] = useState<MaintenanceRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [temp, setTemp] = useState<number | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    // Animation de rotation brève (le contenu, lui, se recharge immédiatement)
    setTimeout(() => setIsRefreshing(false), 700);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications réelles : missions + pleins + demandes d'entretien (temps réel).
  useEffect(() => {
    const unsubMissions = FirestoreMissionService.allMissionsListener(setMissions);
    const unsubFuel = FirestoreFuelService.allFuelRecordsListener(setFuelRecords);
    const unsubMaint = FirestoreMaintenanceService.allRequestsListener(setMaintRequests);
    const unsubDrivers = FirestoreDriverService.allDriversListener(setDrivers);
    return () => {
      unsubMissions();
      unsubFuel();
      unsubMaint();
      unsubDrivers();
    };
  }, []);

  // Météo réelle de Niamey via open-meteo (API gratuite, sans clé).
  useEffect(() => {
    let active = true;
    const fetchTemp = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=13.5137&longitude=2.1098&current=temperature_2m'
        );
        const data = await res.json();
        if (active && typeof data?.current?.temperature_2m === 'number') {
          setTemp(Math.round(data.current.temperature_2m));
        }
      } catch {
        /* silencieux : on conserve l'affichage de repli */
      }
    };
    fetchTemp();
    const id = setInterval(fetchTemp, 10 * 60 * 1000); // rafraîchir toutes les 10 min
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Notifications unifiées : missions + pleins + demandes d'entretien + inscriptions.
  type Notif = { id: string; title: string; message: string; type: string; time: Date; isRead: boolean; driverUid?: string };

  const missionNotifs: Notif[] = missions.map((m) => {
    const status = m.status as string;
    return {
      id: `mission-${m.id}`,
      title:
        status === 'terminée'
          ? 'Mission terminée'
          : status === 'annulée'
            ? 'Mission annulée'
            : status === 'en_attente'
              ? 'Nouvelle mission'
              : 'Mission mise à jour',
      message: `${m.title || 'Mission'} → ${m.location || 'N/A'}`,
      type: status === 'terminée' ? 'success' : status === 'annulée' ? 'error' : 'info',
      time: m.updatedAt?.toDate?.() || m.createdAt?.toDate?.() || new Date(),
      isRead: status !== 'en_attente',
    };
  });

  const fuelNotifs: Notif[] = fuelRecords.map((r) => ({
    id: `fuel-${r.id}`,
    title: 'Plein de carburant',
    message: `${r.driverName || 'Chauffeur'} · ${r.vehiclePlate} (${r.quantity} L)`,
    type: 'success',
    time: new Date(r.createdAt || r.date),
    isRead: true,
  }));

  const maintNotifs: Notif[] = maintRequests.map((q) => ({
    id: `maint-${q.id}`,
    title: "Demande d'entretien",
    message: `${q.vehiclePlate} · ${q.type}`,
    type: q.status === 'resolved' ? 'success' : 'warning',
    time: new Date(q.createdAt || q.date),
    isRead: q.status === 'resolved',
  }));

  // Demandes d'inscription chauffeur EN ATTENTE (mobile) → à approuver/refuser.
  const pendingDrivers = drivers.filter((d) => d.approvalStatus === 'pending');
  const driverNotifs: Notif[] = pendingDrivers.map((d) => ({
    id: `driver-${d.id}`,
    title: "Demande d'inscription",
    message: `${d.name || 'Chauffeur'} · ${d.email}`,
    type: 'warning',
    time: d.createdAt?.toDate?.() || new Date(),
    isRead: false,
    driverUid: d.uid,
  }));

  const notifications = [...missionNotifs, ...fuelNotifs, ...maintNotifs, ...driverNotifs]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  // Badge : missions en attente + demandes d'entretien ouvertes + inscriptions en attente.
  const unreadCount =
    missions.filter((m) => (m.status as string) === 'en_attente').length +
    maintRequests.filter((q) => q.status === 'requested').length +
    pendingDrivers.length;

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="top-bar"
    >
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          {title}
        </h2>
      </div>

      {/* Center: Weather & Time */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">Niamey</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Sun className="w-4 h-4 text-accent-orange" />
          <span className="text-sm">{temp !== null ? `${temp}°C` : '--°C'}</span>
        </div>
        <div className="px-3 py-1.5 bg-background-secondary rounded-lg border border-border">
          <span className="text-sm font-mono text-accent-cyan">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Right: Refresh, Theme Toggle, Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Refresh — actualise la section affichée */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            aria-label="Actualiser cette page"
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-300"
          >
            <motion.span
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={
                isRefreshing
                  ? { duration: 0.7, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.2 }
              }
              className="flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
            </motion.span>
          </motion.button>

          {/* Tooltip au survol */}
          <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-md bg-background-secondary border border-border text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
            Actualiser cette page
          </span>
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-300"
          title={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-border hover:border-accent-cyan/30 hover:bg-accent-cyan/5 transition-all duration-300"
          >
            <Bell className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange rounded-full flex items-center justify-center text-[10px] font-medium text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 glass-card overflow-hidden z-50"
            >
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-medium text-text-primary">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-text-secondary text-sm">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border/50 hover:bg-background-secondary/50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-accent-cyan/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-accent-orange' :
                          notification.type === 'success' ? 'bg-emerald-500' :
                          'bg-accent-cyan'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-text-secondary/60 mt-1">
                            {notification.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {notification.driverUid && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  FirestoreDriverService.setApprovalStatus(notification.driverUid!, 'approved');
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
                              >
                                <Check className="w-3 h-3" /> Approuver
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  FirestoreDriverService.setApprovalStatus(notification.driverUid!, 'rejected');
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
                              >
                                <X className="w-3 h-3" /> Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-text-primary">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-text-secondary">
              {user?.role === 'manager' ? 'Manager' : 'Chauffeur'}
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-border">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent-cyan/10 flex items-center justify-center">
                  <span className="text-accent-cyan font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background-primary" />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
