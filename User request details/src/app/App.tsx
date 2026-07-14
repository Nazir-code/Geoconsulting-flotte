import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  MapPin, Navigation2, Car, Fuel, Wrench, Bell, User,
  ChevronRight, Clock, Calendar, CheckCircle, AlertCircle,
  XCircle, Battery, Shield, Gauge, Plus, Camera, Phone,
  Mail, Building, LogOut, Settings, Search, Filter,
  TrendingUp, Home, List, Map, Eye, EyeOff, Play,
  Square, RefreshCw, Check, Zap, ArrowRight, Target,
  Timer, BarChart3, Droplets, Activity, Route, Layers,
  Wifi, MoreHorizontal,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from "recharts"

// ─────────────────────────────── Types ───────────────────────────────
type Screen =
  | "splash" | "login" | "dashboard" | "missions" | "gps"
  | "fuel" | "fuel-history" | "maintenance" | "notifications" | "profile"

// ─────────────────────────────── Mock Data ───────────────────────────
const DRIVER = {
  name: "Thomas Laurent",
  firstName: "Thomas",
  role: "Chauffeur Senior",
  company: "Geoconsulting SAS",
  email: "t.laurent@geoconsulting.fr",
  phone: "+33 6 12 34 56 78",
  vehicle: "Peugeot 508 SW",
  plate: "AB-123-CD",
  kmTotal: 48234,
}

const MISSIONS = [
  { id: "M-2847", destination: "Aéroport CDG T2", address: "95700 Roissy-en-France", time: "14:30", priority: "urgent", status: "pending", duration: "45 min", distance: "32 km", client: "Accenture Paris" },
  { id: "M-2846", destination: "La Défense — Tour Areva", address: "92400 Courbevoie", time: "11:00", priority: "normal", status: "in-progress", duration: "25 min", distance: "18 km", client: "EDF Direction" },
  { id: "M-2845", destination: "Gare de Lyon", address: "75012 Paris", time: "09:15", priority: "normal", status: "completed", duration: "35 min", distance: "24 km", client: "McKinsey & Co" },
  { id: "M-2844", destination: "Stade de France", address: "93200 Saint-Denis", time: "16:00", priority: "low", status: "pending", duration: "40 min", distance: "28 km", client: "Orange Events" },
]

const NOTIFS = [
  { id: "1", type: "warning", title: "Entretien requis", message: "La vidange est due dans 500 km", time: "Il y a 10 min", read: false },
  { id: "2", type: "success", title: "Mission terminée", message: "Mission M-2845 validée — Gare de Lyon", time: "Il y a 2h", read: false },
  { id: "3", type: "info", title: "Nouvelle mission assignée", message: "Mission M-2847 — Aéroport CDG T2 à 14h30", time: "Il y a 3h", read: true },
  { id: "4", type: "error", title: "Contrôle technique expiré", message: "Expiré depuis le 01/06/2026 — action requise", time: "Hier", read: true },
  { id: "5", type: "info", title: "Synchronisation réussie", message: "Données de mission synchronisées", time: "Hier", read: true },
]

const FUEL_HISTORY = [
  { date: "29 Juin", station: "Total Access Paris 12", liters: 52.4, price: 1.789, total: 93.75, km: 48234 },
  { date: "22 Juin", station: "Shell Autoroute A6", liters: 48.1, price: 1.812, total: 87.21, km: 47891 },
  { date: "15 Juin", station: "BP Paris 15", liters: 55.8, price: 1.765, total: 98.49, km: 47432 },
  { date: "08 Juin", station: "Total Access Paris 12", liters: 50.3, price: 1.798, total: 90.44, km: 46987 },
  { date: "01 Juin", station: "Intermarché Bobigny", liters: 46.9, price: 1.745, total: 81.84, km: 46521 },
]

const CONSO_DATA = [
  { month: "Jan", conso: 8.2 }, { month: "Fév", conso: 7.9 }, { month: "Mar", conso: 8.5 },
  { month: "Avr", conso: 7.6 }, { month: "Mai", conso: 8.1 }, { month: "Jui", conso: 7.8 },
]

const MAINTENANCE_ITEMS = [
  { id: 1, label: "Vidange moteur", icon: "oil", next: "48 734 km", lastDate: "15/01/2026", progress: 92, status: "warning" },
  { id: 2, label: "Pneus avant", icon: "tires", next: "68 234 km", lastDate: "10/10/2025", progress: 34, status: "ok" },
  { id: 3, label: "Freins", icon: "brakes", next: "58 234 km", lastDate: "20/09/2025", progress: 51, status: "ok" },
  { id: 4, label: "Assurance", icon: "shield", next: "31/12/2026", lastDate: "01/01/2026", progress: 50, status: "ok" },
  { id: 5, label: "Contrôle technique", icon: "ct", next: "01/06/2026", lastDate: "01/06/2024", progress: 100, status: "error" },
  { id: 6, label: "Batterie", icon: "battery", next: "78 234 km", lastDate: "05/05/2025", progress: 22, status: "ok" },
]

// ─────────────────────────────── Primitives ──────────────────────────

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 pt-4 pb-1 text-[11px] font-bold ${dark ? "text-white" : "text-[#09090f]"}`}>
      <span>09:41</span>
      <div className="flex items-center gap-1.5">
        <Wifi size={11} />
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <rect x="0" y="3" width="3" height="8" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="4.5" y="2" width="3" height="9" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="9" y="0.5" width="3" height="10.5" rx="1" fill="currentColor" opacity="0.8" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-black/[0.055] ${className}`}>
      {children}
    </div>
  )
}

function Badge({ label, variant }: { label: string; variant: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-50 text-red-600 border border-red-100",
    normal: "bg-violet-50 text-violet-600 border border-violet-100",
    low: "bg-gray-50 text-gray-500 border border-gray-100",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    info: "bg-blue-50 text-blue-600 border border-blue-100",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
    error: "bg-red-50 text-red-600 border border-red-100",
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    "in-progress": "bg-violet-50 text-violet-600 border border-violet-100",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[variant] ?? styles.info}`}>
      {label}
    </span>
  )
}

function ScreenWrapper({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 bg-[#f6f5fa] overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────── Splash ──────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="absolute inset-0 bg-white flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <motion.div
          className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center"
          animate={{
            boxShadow: [
              "0 20px 60px rgba(124,58,237,0.25)",
              "0 20px 70px rgba(124,58,237,0.5)",
              "0 20px 60px rgba(124,58,237,0.25)",
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Car className="text-white" size={40} strokeWidth={1.8} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-[22px] font-extrabold text-[#09090f] tracking-tight">Geoconsulting</div>
          <div className="text-xs font-bold text-violet-500 tracking-[0.3em] uppercase mt-1">Fleet</div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="absolute bottom-14 flex flex-col items-center gap-3"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-600"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <p className="text-[11px] text-gray-300 font-medium tracking-wide">Chargement…</p>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────── Login ───────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 1400)
  }

  return (
    <motion.div
      className="absolute inset-0 bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-violet-50 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-20 right-4 w-24 h-24 rounded-full bg-violet-100/50 pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 pt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-200">
            <Car className="text-white" size={28} strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Geoconsulting Fleet</div>
            <div className="text-sm text-gray-400 mt-1 font-medium">Bienvenue, connectez-vous pour continuer</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Adresse e-mail</label>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all duration-200">
              <Mail size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 bg-transparent text-sm text-[#09090f] outline-none placeholder:text-gray-300 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mot de passe</label>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all duration-200">
              <Shield size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-[#09090f] outline-none placeholder:text-gray-300 font-medium"
              />
              <button onClick={() => setShowPass(!showPass)} className="text-gray-400 p-0.5">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="text-right -mt-1">
            <button className="text-xs text-violet-600 font-bold">Mot de passe oublié ?</button>
          </div>

          <motion.button
            onClick={handleLogin}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-violet-200 flex items-center justify-center gap-2 mt-2 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw size={20} className="text-white" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <span>Se connecter</span>
                  <ArrowRight size={17} />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: loading ? "200%" : "-100%" }}
              transition={{ duration: 0.9, ease: "easeInOut", repeat: loading ? Infinity : 0 }}
            />
          </motion.button>
        </motion.div>
      </div>

      <div className="pb-8 text-center relative z-10">
        <p className="text-[11px] text-gray-300 font-medium">v2.4.0 · © 2026 Geoconsulting SAS</p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────── Dashboard ───────────────────────────

function DashboardScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <ScreenWrapper id="dashboard">
      {/* Violet header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-6 right-8 w-36 h-36 rounded-full border-2 border-white" />
          <div className="absolute top-16 right-24 w-16 h-16 rounded-full border border-white" />
          <div className="absolute -bottom-10 -left-4 w-48 h-48 rounded-full border border-white" />
        </div>
        <StatusBar dark />
        <div className="px-6 pt-2 pb-7 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-300 text-xs font-semibold">Bonjour 👋</p>
              <h1 className="text-white text-[22px] font-extrabold tracking-tight mt-0.5">{DRIVER.firstName}</h1>
              <p className="text-violet-300 text-xs mt-0.5 font-medium">{DRIVER.role}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate("notifications")}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center relative"
              >
                <Bell size={17} className="text-white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 border border-violet-700" />
              </motion.button>
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white font-extrabold text-sm">
                TL
              </div>
            </div>
          </div>

          {/* Vehicle pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-4 bg-white/10 border border-white/15 rounded-2xl p-3.5 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Car size={18} className="text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{DRIVER.vehicle}</p>
              <p className="text-violet-200 text-xs font-medium">{DRIVER.plate} · {DRIVER.kmTotal.toLocaleString()} km</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-400/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse block" />
              <span className="text-emerald-300 text-[10px] font-bold">En service</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Missions", value: "4", sub: "aujourd'hui", icon: <Target size={15} />, c: "violet" },
            { label: "Distance", value: "89 km", sub: "ce matin", icon: <Route size={15} />, c: "blue" },
            { label: "Durée", value: "3h 20", sub: "en route", icon: <Timer size={15} />, c: "emerald" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
            >
              <Card className="p-3">
                <div className={`w-7 h-7 rounded-xl mb-2.5 flex items-center justify-center text-xs ${s.c === "violet" ? "bg-violet-100 text-violet-600" : s.c === "blue" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {s.icon}
                </div>
                <div className="font-extrabold text-[#09090f] text-[17px] leading-none">{s.value}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-1">{s.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Active mission */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-[#09090f] text-[15px]">Mission en cours</h2>
            <button onClick={() => navigate("missions")} className="text-[11px] text-violet-600 font-bold flex items-center gap-0.5">
              Voir tout <ChevronRight size={13} />
            </button>
          </div>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Navigation2 size={17} className="text-violet-700" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-[10px] font-bold text-gray-400 font-mono">M-2846</span>
                  <Badge label="En cours" variant="in-progress" />
                </div>
                <p className="font-extrabold text-[#09090f] text-sm leading-tight">La Défense — Tour Areva</p>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">92400 Courbevoie · EDF Direction</p>
                <div className="flex items-center gap-4 mt-3">
                  {[
                    { icon: <Clock size={11} />, text: "11:00" },
                    { icon: <Route size={11} />, text: "18 km" },
                    { icon: <Timer size={11} />, text: "25 min" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <span className="text-violet-400">{m.icon}</span>
                      {m.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("gps")}
              className="mt-4 w-full h-11 bg-violet-600 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-violet-200"
            >
              <Navigation2 size={15} /> Ouvrir la navigation
            </motion.button>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
          <h2 className="font-extrabold text-[#09090f] text-[15px] mb-3">Accès rapide</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Missions", icon: <List size={20} />, screen: "missions", c: "violet" },
              { label: "Carte GPS", icon: <Map size={20} />, screen: "gps", c: "blue" },
              { label: "Carburant", icon: <Fuel size={20} />, screen: "fuel", c: "amber" },
              { label: "Entretien", icon: <Wrench size={20} />, screen: "maintenance", c: "emerald" },
            ].map((item, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.screen as Screen)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${item.c === "violet" ? "bg-violet-100 text-violet-600" : item.c === "blue" ? "bg-blue-100 text-blue-600" : item.c === "amber" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="font-extrabold text-[#09090f] text-[15px] mb-3">Prochaines missions</h2>
          <div className="space-y-3">
            {MISSIONS.filter(m => m.status === "pending").map((m) => (
              <Card key={m.id} className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#09090f] text-sm truncate">{m.destination}</p>
                      <Badge label={m.priority === "urgent" ? "Urgent" : "Normal"} variant={m.priority} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium">{m.time}</span>
                      <span className="text-[11px] text-gray-400 font-medium">{m.distance}</span>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-200 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Missions ────────────────────────────

function MissionsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [filter, setFilter] = useState("all")
  const filters = [
    { id: "all", label: "Toutes" },
    { id: "pending", label: "En attente" },
    { id: "in-progress", label: "En cours" },
    { id: "completed", label: "Terminées" },
  ]

  const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
    pending: { label: "En attente", badge: "pending", dot: "bg-amber-400" },
    accepted: { label: "Acceptée", badge: "info", dot: "bg-blue-400" },
    "in-progress": { label: "En cours", badge: "in-progress", dot: "bg-violet-500" },
    completed: { label: "Terminée", badge: "completed", dot: "bg-emerald-400" },
    refused: { label: "Refusée", badge: "error", dot: "bg-red-400" },
  }

  const filtered = filter === "all" ? MISSIONS : MISSIONS.filter(m => m.status === filter)

  return (
    <ScreenWrapper id="missions">
      <div className="bg-white border-b border-black/[0.055]">
        <StatusBar />
        <div className="px-6 pt-1 pb-3">
          <h1 className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Missions</h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Dimanche 29 juin 2026</p>
        </div>
        <div className="flex gap-2 px-6 pb-3.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {filters.map(f => (
            <motion.button
              key={f.id}
              onClick={() => setFilter(f.id)}
              whileTap={{ scale: 0.94 }}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 ${filter === f.id ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : "bg-gray-100 text-gray-500"}`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-3.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((mission, i) => (
            <motion.div
              key={mission.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider font-mono">{mission.id}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[mission.status]?.dot ?? "bg-gray-300"}`} />
                  </div>
                  <Badge label={statusConfig[mission.status]?.label ?? mission.status} variant={statusConfig[mission.status]?.badge ?? "info"} />
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <MapPin size={17} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#09090f] text-sm leading-tight">{mission.destination}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{mission.address}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{mission.client}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  {[
                    { icon: <Clock size={11} />, text: mission.time },
                    { icon: <Route size={11} />, text: mission.distance },
                    { icon: <Timer size={11} />, text: mission.duration },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                      <span className="text-violet-400">{m.icon}</span>{m.text}
                    </div>
                  ))}
                  {mission.priority === "urgent" && <Badge label="Urgent" variant="urgent" />}
                </div>

                {mission.status === "pending" && (
                  <div className="flex gap-2 mt-3.5">
                    <motion.button whileTap={{ scale: 0.95 }} className="flex-1 h-9 rounded-xl bg-gray-50 text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5">
                      <XCircle size={13} className="text-red-400" /> Refuser
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="flex-1 h-9 rounded-xl bg-violet-600 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-violet-200">
                      <CheckCircle size={13} /> Accepter
                    </motion.button>
                  </div>
                )}
                {mission.status === "in-progress" && (
                  <div className="flex gap-2 mt-3.5">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("gps")} className="flex-1 h-9 rounded-xl bg-violet-50 text-violet-600 text-[12px] font-bold flex items-center justify-center gap-1.5">
                      <Navigation2 size={13} /> Naviguer
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="flex-1 h-9 rounded-xl bg-[#09090f] text-white text-[12px] font-bold flex items-center justify-center gap-1.5">
                      <Square size={11} /> Terminer
                    </motion.button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── GPS ─────────────────────────────────

function GPSScreen() {
  const [eta, setEta] = useState(18)
  const [centered, setCentered] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setEta(e => Math.max(0, e - 1)), 7000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E4E8F0]">
      {/* Map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        {/* Background */}
        <rect width="390" height="844" fill="#E8EBF3" />
        {/* Blocks */}
        <rect x="0" y="0" width="140" height="340" fill="#D9DCE8" rx="2" />
        <rect x="160" y="0" width="90" height="200" fill="#D9DCE8" rx="2" />
        <rect x="270" y="30" width="120" height="160" fill="#D9DCE8" rx="2" />
        <rect x="0" y="360" width="120" height="180" fill="#D9DCE8" rx="2" />
        <rect x="200" y="220" width="190" height="200" fill="#D9DCE8" rx="2" />
        <rect x="140" y="460" width="250" height="200" fill="#D9DCE8" rx="2" />
        <rect x="0" y="560" width="100" height="280" fill="#D9DCE8" rx="2" />
        {/* Roads */}
        <rect x="140" y="0" width="18" height="844" fill="#F8F8FC" />
        <rect x="0" y="340" width="390" height="18" fill="#F8F8FC" />
        <rect x="0" y="458" width="390" height="14" fill="#FFFFFF" />
        <rect x="120" y="0" width="10" height="844" fill="#FFFFFF" />
        <rect x="258" y="0" width="10" height="844" fill="#FFFFFF" />
        {/* Active route */}
        <path d="M 149 844 L 149 350 L 390 350" fill="none" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" strokeDasharray="0" />
        <path d="M 149 844 L 149 350 L 390 350" fill="none" stroke="#C4B5FD" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        {/* Vehicle */}
        <circle cx="149" cy="540" r="22" fill="#7C3AED" opacity="0.15" />
        <circle cx="149" cy="540" r="14" fill="#7C3AED" opacity="0.3" />
        <circle cx="149" cy="540" r="9" fill="#7C3AED" />
        <circle cx="149" cy="540" r="4" fill="white" />
        {/* Destination pin */}
        <ellipse cx="340" cy="352" rx="8" ry="4" fill="#EF4444" opacity="0.3" />
        <circle cx="340" cy="340" r="10" fill="#EF4444" />
        <circle cx="340" cy="340" r="4" fill="white" />
        {/* Road labels */}
        <text x="155" y="700" fontSize="8" fill="#9CA3AF" fontWeight="600" fontFamily="system-ui">Av. Victor Hugo</text>
        <text x="50" y="335" fontSize="8" fill="#9CA3AF" fontWeight="600" fontFamily="system-ui">Bd. Haussmann</text>
      </svg>

      {/* Overlay status */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 flex items-center justify-between text-[11px] font-bold text-[#09090f]"
        style={{ background: "linear-gradient(to bottom, rgba(232,235,243,0.95) 60%, transparent)" }}>
        <span>09:41</span>
        <div className="flex items-center gap-1.5"><Wifi size={11} /></div>
      </div>

      {/* Top card */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 24 }}
        className="absolute top-11 left-4 right-4 z-20"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Navigation2 size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-[#09090f] text-sm truncate">La Défense — Tour Areva</p>
              <p className="text-[11px] text-gray-400 font-medium">92400 Courbevoie</p>
            </div>
            <button className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
              <MoreHorizontal size={15} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            {[
              { icon: <Clock size={12} />, val: `${eta} min`, lbl: "arrivée", c: "violet" },
              { icon: <Route size={12} />, val: "7.4 km", lbl: "restants", c: "violet" },
              { icon: <Zap size={12} />, val: "68 km/h", lbl: "vitesse", c: "emerald" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${m.c === "violet" ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {m.icon}
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-[#09090f] leading-none">{m.val}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{m.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Turn instruction */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
        className="absolute bottom-[140px] left-4 right-4 z-20 bg-violet-600 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg shadow-violet-300/40"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ArrowRight size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-extrabold text-sm">Tournez à droite</p>
          <p className="text-violet-200 text-[11px] font-medium mt-0.5">dans 320 m · Boulevard Circulaire</p>
        </div>
        <div className="text-white font-extrabold text-sm">320m</div>
      </motion.div>

      {/* Floating buttons */}
      <div className="absolute right-4 bottom-52 z-20 flex flex-col gap-2">
        {[
          { icon: <Navigation2 size={18} />, active: centered, action: () => setCentered(!centered) },
          { icon: <Layers size={18} />, active: false, action: () => {} },
          { icon: <Plus size={18} />, active: false, action: () => {} },
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.88 }}
            onClick={btn.action}
            className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center ${btn.active ? "bg-violet-600 shadow-violet-200" : "bg-white"}`}
          >
            <span className={btn.active ? "text-white" : "text-gray-600"}>{btn.icon}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────── Fuel ────────────────────────────────

function FuelScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [liters, setLiters] = useState("")
  const [ppl, setPpl] = useState("1.789")
  const total = (parseFloat(liters || "0") * parseFloat(ppl || "0")).toFixed(2)

  return (
    <ScreenWrapper id="fuel">
      <div className="bg-white border-b border-black/[0.055]">
        <StatusBar />
        <div className="px-6 pt-1 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Carburant</h1>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Saisie de plein</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("fuel-history")}
            className="flex items-center gap-1.5 text-violet-600 text-[12px] font-bold"
          >
            <BarChart3 size={14} /> Historique
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-4">
        <Card className="p-5">
          <h3 className="font-extrabold text-[#09090f] text-sm mb-4">Nouveau plein</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Station-service</label>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-3 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all">
                <MapPin size={14} className="text-gray-400" />
                <input className="flex-1 bg-transparent text-sm text-[#09090f] outline-none placeholder:text-gray-300 font-medium" placeholder="Nom de la station" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Prix / litre (€)</label>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-3 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all">
                  <Fuel size={13} className="text-gray-400" />
                  <input type="number" step="0.001" value={ppl} onChange={e => setPpl(e.target.value)} className="flex-1 bg-transparent text-sm text-[#09090f] outline-none font-medium w-0" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Litres</label>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-3 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all">
                  <Droplets size={13} className="text-gray-400" />
                  <input type="number" placeholder="0.0" value={liters} onChange={e => setLiters(e.target.value)} className="flex-1 bg-transparent text-sm text-[#09090f] outline-none placeholder:text-gray-300 font-medium w-0" />
                </div>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl px-4 py-3 flex items-center justify-between border border-violet-100">
              <span className="text-sm font-bold text-violet-600">Montant total</span>
              <span className="text-xl font-extrabold text-violet-700">{total} €</span>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Kilométrage</label>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-3 border border-transparent focus-within:border-violet-300 focus-within:bg-white transition-all">
                <Gauge size={14} className="text-gray-400" />
                <input type="number" defaultValue={DRIVER.kmTotal} className="flex-1 bg-transparent text-sm text-[#09090f] outline-none font-medium" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.95 }} className="h-12 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center gap-2 text-[12px] text-gray-400 font-bold">
                <Camera size={15} /> Photo reçu
              </motion.button>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3">
                <input className="flex-1 bg-transparent text-sm text-[#09090f] outline-none placeholder:text-gray-300 font-medium" placeholder="Commentaire…" />
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 h-12 bg-violet-600 rounded-xl text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-violet-200"
          >
            <Check size={15} /> Enregistrer le plein
          </motion.button>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Conso. moy.", value: "7.8 L/100", icon: <Activity size={13} />, c: "violet" },
            { label: "Coût / km", value: "0.139 €", icon: <TrendingUp size={13} />, c: "blue" },
            { label: "Autonomie est.", value: "~620 km", icon: <Route size={13} />, c: "emerald" },
            { label: "Dernier plein", value: "29/06/26", icon: <Calendar size={13} />, c: "amber" },
          ].map((s, i) => (
            <Card key={i} className="p-3.5">
              <div className={`flex items-center gap-1.5 mb-2 ${s.c === "violet" ? "text-violet-500" : s.c === "blue" ? "text-blue-500" : s.c === "emerald" ? "text-emerald-500" : "text-amber-500"}`}>
                {s.icon}
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="font-extrabold text-[#09090f] text-[15px]">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="font-extrabold text-[#09090f] text-sm mb-4">Consommation (L/100km)</h3>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={CONSO_DATA} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontWeight: 700 }}
                formatter={(v: number) => [`${v} L/100`, "Conso."]}
              />
              <Area type="monotone" dataKey="conso" stroke="#7C3AED" strokeWidth={2.5} fill="url(#fuelGrad)" dot={{ fill: "#7C3AED", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Fuel History ────────────────────────

function FuelHistoryScreen() {
  return (
    <ScreenWrapper id="fuel-history">
      <div className="bg-white border-b border-black/[0.055]">
        <StatusBar />
        <div className="px-6 pt-1 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Historique</h1>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">6 derniers mois · 5 pleins</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Search size={15} className="text-gray-500" />
            </button>
            <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Filter size={15} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-24">
        {FUEL_HISTORY.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-3 mb-1"
          >
            <div className="flex flex-col items-center pt-1">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Fuel size={13} className="text-violet-600" />
              </div>
              {i < FUEL_HISTORY.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1 min-h-[20px]" />}
            </div>
            <Card className="flex-1 p-4 mb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-bold text-[#09090f] text-sm truncate">{entry.station}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{entry.date} · {entry.km.toLocaleString()} km</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-[#09090f] text-sm">{entry.total.toFixed(2)} €</div>
                  <div className="text-[11px] text-gray-400 font-medium">{entry.liters} L</div>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                  {entry.price.toFixed(3)} €/L
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Maintenance ─────────────────────────

function MaintenanceScreen() {
  const statusStyle: Record<string, { color: string; bg: string; bar: string; label: string }> = {
    ok: { color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-400", label: "OK" },
    warning: { color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", label: "Bientôt" },
    error: { color: "text-red-600", bg: "bg-red-50", bar: "bg-red-400", label: "Expiré" },
  }

  const icons: Record<string, React.ReactNode> = {
    oil: <Droplets size={17} />, tires: <Car size={17} />, brakes: <Activity size={17} />,
    shield: <Shield size={17} />, ct: <CheckCircle size={17} />, battery: <Battery size={17} />,
  }

  return (
    <ScreenWrapper id="maintenance">
      <div className="bg-white border-b border-black/[0.055]">
        <StatusBar />
        <div className="px-6 pt-1 pb-3">
          <h1 className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Maintenance</h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{DRIVER.vehicle} · {DRIVER.plate}</p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-3.5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle size={19} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-extrabold text-red-700">Contrôle technique expiré</p>
            <p className="text-[11px] text-red-400 font-medium mt-0.5">Action requise — expiré le 01/06/2026</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle size={19} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-extrabold text-amber-700">Vidange bientôt requise</p>
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">Dans 500 km — prévoir un rendez-vous</p>
          </div>
        </motion.div>

        {MAINTENANCE_ITEMS.map((item, i) => {
          const s = statusStyle[item.status]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
                    {icons[item.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#09090f] text-sm">{item.label}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">Prochain : {item.next}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${s.bg} ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ delay: i * 0.05 + 0.45, duration: 0.75, ease: "easeOut" }}
                    className={`h-full rounded-full ${s.bar}`}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">{item.lastDate}</span>
                  <span className={`text-[10px] font-bold ${s.color}`}>{item.progress}%</span>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Notifications ───────────────────────

function NotificationsScreen() {
  const [notifs, setNotifs] = useState(NOTIFS)
  const unread = notifs.filter(n => !n.read).length

  const notifIcons: Record<string, React.ReactNode> = {
    info: <Bell size={15} className="text-blue-500" />,
    success: <CheckCircle size={15} className="text-emerald-500" />,
    warning: <AlertCircle size={15} className="text-amber-500" />,
    error: <XCircle size={15} className="text-red-500" />,
  }
  const notifBg: Record<string, string> = {
    info: "bg-blue-50", success: "bg-emerald-50", warning: "bg-amber-50", error: "bg-red-50",
  }

  return (
    <ScreenWrapper id="notifications">
      <div className="bg-white border-b border-black/[0.055]">
        <StatusBar />
        <div className="px-6 pt-1 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#09090f] tracking-tight">Notifications</h1>
            {unread > 0 && <p className="text-[11px] text-violet-600 font-bold mt-0.5">{unread} non lue{unread > 1 ? "s" : ""}</p>}
          </div>
          <button
            onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
            className="text-[12px] text-violet-600 font-bold"
          >
            Tout lire
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-3">
        <AnimatePresence>
          {notifs.map((notif, i) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.05, layout: { duration: 0.2 } }}
            >
              <Card className={`p-4 ${!notif.read ? "border-l-[3px] border-l-violet-500" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${notifBg[notif.type]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {notifIcons[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-extrabold ${notif.read ? "text-gray-600" : "text-[#09090f]"} leading-tight`}>{notif.title}</p>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-[12px] text-gray-400 font-medium mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-300 font-medium mt-1.5">{notif.time}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Profile ─────────────────────────────

function ProfileScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const menu = [
    { label: "Informations personnelles", icon: <User size={15} /> },
    { label: "Mon véhicule", icon: <Car size={15} /> },
    { label: "Entreprise", icon: <Building size={15} /> },
    { label: "Paramètres", icon: <Settings size={15} /> },
    { label: "Déconnexion", icon: <LogOut size={15} />, danger: true },
  ]

  return (
    <ScreenWrapper id="profile">
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full border-2 border-white" />
          <div className="absolute top-24 right-20 w-16 h-16 rounded-full border border-white" />
          <div className="absolute bottom-0 -left-6 w-28 h-28 rounded-full border border-white" />
        </div>
        <StatusBar dark />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pb-8 pt-3 relative z-10 px-6"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-extrabold text-2xl mb-3.5 shadow-lg">
            TL
          </div>
          <h2 className="text-white font-extrabold text-xl tracking-tight">{DRIVER.name}</h2>
          <p className="text-violet-200 text-sm font-medium mt-0.5">{DRIVER.role}</p>
          <div className="flex items-center gap-2 mt-2.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            <Building size={11} className="text-violet-300" />
            <span className="text-violet-200 text-[11px] font-semibold">{DRIVER.company}</span>
          </div>
        </motion.div>
      </div>

      <div className="px-5 pt-4 pb-24 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Missions", value: "247" },
            { label: "KM totaux", value: "48 234" },
            { label: "Évaluation", value: "4.9 ★" },
          ].map((s, i) => (
            <Card key={i} className="p-3 text-center">
              <div className="font-extrabold text-[#09090f] text-[15px]">{s.value}</div>
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        <Card className="p-4 space-y-3.5">
          {[
            { icon: <Mail size={14} />, label: "Email", value: DRIVER.email },
            { icon: <Phone size={14} />, label: "Téléphone", value: DRIVER.phone },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.label}</p>
                <p className="text-sm text-[#09090f] font-medium truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </Card>

        <Card className="overflow-hidden">
          {menu.map((item, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.99, backgroundColor: "#F9FAFB" }}
              onClick={item.label === "Déconnexion" ? () => navigate("login") : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${i > 0 ? "border-t border-gray-50" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.danger ? "bg-red-50 text-red-500" : "bg-violet-50 text-violet-600"}`}>
                {item.icon}
              </div>
              <span className={`flex-1 text-left text-sm font-bold ${item.danger ? "text-red-500" : "text-[#09090f]"}`}>
                {item.label}
              </span>
              {!item.danger && <ChevronRight size={15} className="text-gray-200 flex-shrink-0" />}
            </motion.button>
          ))}
        </Card>

        <p className="text-center text-[11px] text-gray-300 font-medium">v2.4.0 · © 2026 Geoconsulting SAS</p>
      </div>
    </ScreenWrapper>
  )
}

// ─────────────────────────────── Bottom Nav ──────────────────────────

function BottomNav({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  const tabs = [
    { id: "dashboard", label: "Accueil", icon: Home },
    { id: "missions", label: "Missions", icon: List },
    { id: "gps", label: "Carte", icon: Map },
    { id: "fuel", label: "Carburant", icon: Fuel },
    { id: "profile", label: "Profil", icon: User },
  ] as const

  const activeTab = tabs.find(t => t.id === screen || (screen === "fuel-history" && t.id === "fuel") || (screen === "notifications" && t.id === "dashboard"))?.id ?? tabs[0].id

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-black/[0.055] z-30">
      <div className="flex items-center px-2 pt-2 pb-5">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.id as Screen)}
              className="flex-1 flex flex-col items-center gap-1 py-1 relative"
              whileTap={{ scale: 0.88 }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-violet-600 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <motion.div
                animate={{ y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`transition-colors ${active ? "text-violet-600" : "text-gray-400"}`}
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              </motion.div>
              <span className={`text-[9px] font-bold transition-colors ${active ? "text-violet-600" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────── App ─────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [loggedIn, setLoggedIn] = useState(false)

  const navigate = (s: Screen) => setScreen(s)
  const showNav = loggedIn && !["splash", "login"].includes(screen)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 100%)" }}
    >
      {/* Phone frame */}
      <div
        className="relative w-[390px] bg-white overflow-hidden flex-shrink-0"
        style={{
          height: "844px",
          borderRadius: "52px",
          boxShadow: "0 50px 100px rgba(91,33,182,0.3), 0 0 0 1.5px rgba(124,58,237,0.2), 0 0 0 10px rgba(255,255,255,0.08)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-black rounded-b-[20px] z-50" />

        {/* Screens */}
        <AnimatePresence mode="wait">
          {screen === "splash" && (
            <SplashScreen key="splash" onDone={() => setScreen("login")} />
          )}
          {screen === "login" && (
            <LoginScreen key="login" onLogin={() => { setLoggedIn(true); setScreen("dashboard") }} />
          )}
          {screen === "dashboard" && <DashboardScreen key="dashboard" navigate={navigate} />}
          {screen === "missions" && <MissionsScreen key="missions" navigate={navigate} />}
          {screen === "gps" && <GPSScreen key="gps" />}
          {screen === "fuel" && <FuelScreen key="fuel" navigate={navigate} />}
          {screen === "fuel-history" && <FuelHistoryScreen key="fuel-history" />}
          {screen === "maintenance" && <MaintenanceScreen key="maintenance" />}
          {screen === "notifications" && <NotificationsScreen key="notifications" />}
          {screen === "profile" && <ProfileScreen key="profile" navigate={navigate} />}
        </AnimatePresence>

        {/* Bottom nav */}
        {showNav && <BottomNav screen={screen} navigate={navigate} />}
      </div>
    </div>
  )
}
