import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Users, Route, Fuel, AlertTriangle } from 'lucide-react';
import { KPICard } from './KPICard';
import { ActivityFeed } from './ActivityFeed';
import { MapPanel } from './MapPanel';
import { MissionStrip } from './MissionStrip';
import { MaintenancePanel } from './MaintenancePanel';
import { MissionsOverview } from './MissionsOverview';
import { DriversOverview } from './DriversOverview';
import { SkeletonKPICard } from '@/components/common';
import { dataService } from '@/services/dataService';
import { FirestoreDriverService } from '@/services/firestoreDriverService';
import { FirestoreMissionService } from '@/services/firestoreMissionService';
import type { DashboardStats, ActivityItem, Mission } from '@/types';

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeMissions: 0,
    totalDrivers: 0,
    monthlyFuelCost: 0,
    monthlyExpenses: 0,
    maintenanceAlerts: 0,
    fuelAnomalies: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [driverCounts, setDriverCounts] = useState({ active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initialiser les stats avec les données de base (véhicules encore mockés)
    loadInitialStats();

    // 2. Écouter les chauffeurs en temps réel
    const unsubscribeDrivers = FirestoreDriverService.allDriversListener((drivers) => {
      // Compteurs d'affichage dérivés du flux déjà abonné (présentation only).
      const active = drivers.filter((d) => d.status === 'online').length;
      setDriverCounts({ active, inactive: drivers.length - active });
      setStats(prev => ({
        ...prev,
        totalDrivers: drivers.length,
      }));
    });

    // 3. Écouter les missions en temps réel
    const unsubscribeMissions = FirestoreMissionService.allMissionsListener((firestoreMissions) => {
      // Convertir Firestore Mission vers Type Mission (UI)
      const mappedMissions = firestoreMissions.map(m => ({
        ...m,
        id: m.id,
        // Conversion basique des types si nécessaire pour la compatibilité UI
        startTime: m.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as unknown as Mission));

      setMissions(mappedMissions);

      const activeCount = mappedMissions.filter(m =>
        m.status === 'en_cours' || m.status === 'assignée' || m.status === 'en_attente'
      ).length;

      setStats(prev => ({
        ...prev,
        activeMissions: activeCount,
      }));

      // Mettre à jour le flux d'activité à partir des dernières missions
      const missionActivities: ActivityItem[] = [...firestoreMissions]
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 5)
        .map(m => ({
          id: `act-${m.id}`,
          type: 'mission',
          title: m.status === 'terminée' ? 'Mission Terminée' : 'Nouvelle Mission',
          description: `${m.title || 'Mission'} vers ${m.location || 'N/A'}`,
          timestamp: m.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

      setActivities(missionActivities);
    });

    // Subscriptions mock pour le reste (fuel, maintenance)
    const unsubscribeStats = dataService.subscribe('stats_update', (newStats: any) => {
      if (newStats) {
        setStats(prev => ({ ...prev, ...newStats }));
      }
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeMissions();
      unsubscribeStats();
    };
  }, []);

  const loadInitialStats = async () => {
    try {
      const statsData = await dataService.getDashboardStats();
      setStats(prev => ({ ...prev, ...statsData }));

      // On garde isLoading false dès qu'on a les premières données
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonKPICard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass-card h-80" />
          <div className="glass-card h-80" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Total Véhicules"
          value={stats.totalVehicles}
          change={3}
          changeLabel="+3 ce mois"
          icon={Car}
          color="cyan"
          delay={0}
        />
        <KPICard
          title="Missions Actives"
          value={stats.activeMissions}
          icon={Route}
          color="violet"
          delay={0.1}
        />
        <KPICard
          title="Chauffeurs"
          value={stats.totalDrivers}
          icon={Users}
          color="lime"
          delay={0.2}
        />
        <KPICard
          title="Coût Carburant"
          value={stats.monthlyFuelCost}
          suffix="FCFA"
          change={12}
          changeLabel="vs mois dernier"
          icon={Fuel}
          color="orange"
          delay={0.3}
        />
        <KPICard
          title="Alertes"
          value={stats.maintenanceAlerts + stats.fuelAnomalies}
          icon={AlertTriangle}
          color="orange"
          delay={0.4}
        />
      </div>

      {/* Vue d'ensemble : répartition missions + chauffeurs actifs/inactifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MissionsOverview missions={missions} />
        <DriversOverview active={driverCounts.active} inactive={driverCounts.inactive} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Panel - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <MapPanel missions={missions} />
        </div>

        {/* Activity Feed - Single column */}
        <div className="xl:col-span-1">
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Maintenance Panel - Full width below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaintenancePanel />
        <div className="hidden lg:block"></div>
      </div>

      {/* Mission Strip */}
      <MissionStrip missions={missions} />
    </motion.div>
  );
}
