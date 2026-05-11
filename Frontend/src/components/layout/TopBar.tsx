import { motion } from 'framer-motion';
import { Bell, Sun, Moon, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { useTheme } from '@/context/ThemeContext';
import { formatTime } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { mockNotifications } from '@/data/mockData';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.isRead && n.userId === user?.id).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const notifications = mockNotifications.filter(n => n.userId === user?.id).slice(0, 5);

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
          <span className="text-sm">32°C</span>
        </div>
        <div className="px-3 py-1.5 bg-background-secondary rounded-lg border border-border">
          <span className="text-sm font-mono text-accent-cyan">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications & User */}
      <div className="flex items-center gap-4">
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
                            {new Date(notification.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
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
