import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext_Firebase';
import { ThemeProvider } from '@/context/ThemeContext';
import { TruckLoader } from '@/components/common/TruckLoader';
import { LoginPage } from '@/components/auth/LoginPage';
import { SessionTimeoutAlert } from '@/components/session/SessionTimeoutAlert';
import { SessionDebugOverlay } from '@/components/session/SessionDebugInfo';
import { NavigationRail } from '@/components/layout/NavigationRail';
import { TopBar } from '@/components/layout/TopBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { FleetView } from '@/components/fleet/FleetView';
import { MissionsView } from '@/components/missions/MissionsView';
import { FuelView } from '@/components/fuel/FuelView';
import { ReportsView } from '@/components/reports/ReportsView';
import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { SettingsView } from '@/components/settings/SettingsView';


// Section titles mapping
const sectionTitles: Record<string, string> = {
  dashboard: 'Tableau de Bord',
  fleet: 'Flotte & Chauffeurs',
  missions: 'Contrôle des Missions',
  fuel: 'Carburant & Maintenance',
  reports: 'Rapports & Analytiques',
  settings: 'Paramètres',
};

function AppContent() {
  console.log('🎯 AppContent component mounted');
  const { isAuthenticated, user } = useAuth();
  const [showLoader, setShowLoader] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Handle loader completion
  const handleLoaderComplete = () => {
    setTimeout(() => {
      setShowLoader(false);
    }, 100);
  };

  // Show loader on initial load
  if (showLoader && !isAuthenticated) {
    console.log('📍 Showing TruckLoader');
    return <TruckLoader onComplete={handleLoaderComplete} />;
  }

  // Manager/Admin Dashboard content
  const renderManagerDashboard = () => {
    const renderSection = () => {
      switch (activeSection) {
        case 'dashboard':
          return <DashboardView />;
        case 'fleet':
          return <FleetView />;
        case 'missions':
          return <MissionsView />;
        case 'fuel':
          return <FuelView />;
        case 'reports':
          return <ReportsView />;
        case 'settings':
          return <SettingsView />;
        default:
          return <DashboardView />;
      }
    };

    return (
      <div className="min-h-screen bg-background-primary">
        {/* Navigation Rail */}
        <NavigationRail 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />

        {/* Top Bar */}
        <TopBar title={sectionTitles[activeSection] || 'FleetNexus'} />

        {/* Main Content */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Background Effects */}
        <div className="grain-overlay" />
        <div className="vignette" />

        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.05, 0.08, 0.05],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-violet/20 rounded-full blur-[120px]"
          />
        </div>
      </div>
    );
  };

  // Render based on authentication status
  return (
    <>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPage onLogin={() => {
              console.log('✅ Login successful, AppContent will re-render');
            }} />
          </motion.div>
        ) : user?.role === 'driver' ? (
          <motion.div
            key="driver-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DriverDashboard />
          </motion.div>
        ) : (
          <motion.div
            key="manager-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderManagerDashboard()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Timeout Alert - affiché pour tous les utilisateurs authentifiés */}
      {isAuthenticated && <SessionTimeoutAlert />}

      {/* Debug Info - visible en développement uniquement */}
      <SessionDebugOverlay />
    </>
  );
}

function App() {
  console.log('🏠 App component rendering...');
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
