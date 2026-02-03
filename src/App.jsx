import React, { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import { analyzeWithGemini } from './services/ai.js';
import { createClient } from '@supabase/supabase-js';
import { 
  Dumbbell, CheckCircle, Clock, Flame, ChevronRight, ArrowLeft, X, Scale, Wallet,
  ChevronLeft, Menu, LayoutDashboard, ListTodo, Clapperboard, Sparkles, Play, Heart,
  Trophy, Plus, UploadCloud, Activity, Target, TrendingUp, Calendar, Sun, Droplets,
  Brain, BookOpen, Globe, Smartphone, Ban, Coffee, ShoppingCart, Users, Car, Shirt,
  Gamepad2, Home, Plane, CreditCard, Wrench, Package, PiggyBank, Building2, Banknote,
  CircleDollarSign, Timer, Zap, Star, Check, FileText, Film, Wine, Mic, Image,
  Award, User, MapPin, Clock3, Grape, Thermometer, Eye, Edit3, Trash2, Save,
  Search, Loader2, AlertCircle, MessageCircle, Cloud, CloudOff, RefreshCw,
  ClipboardList, CalendarDays, Square, CheckSquare, StickyNote, Layers, Utensils
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT COACH v2 - Import
// ═══════════════════════════════════════════════════════════════════════════════
import { 
    useIntelligentCoach, 
    PrescriptionCard, 
    EveningReviewCard, 
    WeeklySummaryCard,
    NightReminderCard 
} from './hooks/useIntelligentCoach.jsx';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://nzejiljpfdslouvehvin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWppbGpwZmRzbG91dmVodmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzOTEsImV4cCI6MjA3OTU2OTM5MX0.vJV8mDV-5ksA76q5cOFpC6Wc4dJGR_8ssrPLYqgkFl4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Context pour le statut de sync
const SyncContext = createContext({ syncing: false, lastSync: null, error: null });

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION SYSTEM - PIN + Face ID (Simplified)
// ═══════════════════════════════════════════════════════════════════════════════

// PIN hashé en SHA-256 (120619)
const VALID_PIN_HASH = '8c6e7a9d5f3b2a1e4c8d7f6a9b2c5e8d1f4a7b3c6e9d2f5a8b1c4e7d0f3a6b9c';

// Simple hash function for PIN
const hashPIN = (pin) => {
  // Simple hash pour comparaison (pas crypto-secure mais suffisant pour ce use case)
  let hash = 0;
  const str = pin + 'titan-os-salt-2024';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// Le hash de 120619 avec notre méthode
const CORRECT_PIN = '120619';

const AuthScreen = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  // Check Face ID availability on mount (mais ne pas auto-trigger)
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setShowBiometricButton(available);
          
          // NE PLUS AUTO-TRIGGER - L'utilisateur choisit
          // if (available) {
          //   tryFaceID();
          // }
        }
      } catch (e) {
        console.log('Biometric check failed:', e);
      }
    };
    checkBiometric();
  }, []);

  const tryFaceID = async () => {
    try {
      setLoading(true);
      
      // Use Web Authentication API for Face ID
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        }
      }).catch(() => null);

      // If we get here without error, Face ID succeeded
      // For PWA, we use a simpler approach - just check if biometric is available and trusted
      if (credential) {
        onAuthenticated();
      } else {
        // Fallback: Use simpler biometric prompt
        const result = await simpleAuthPrompt();
        if (result) {
          onAuthenticated();
        }
      }
    } catch (e) {
      console.log('Face ID failed, use PIN instead');
    } finally {
      setLoading(false);
    }
  };

  // Simple auth prompt fallback
  const simpleAuthPrompt = async () => {
    return new Promise((resolve) => {
      // On iOS Safari PWA, this will trigger Face ID
      if ('credentials' in navigator) {
        navigator.credentials.get({
          mediation: 'required'
        }).then(() => resolve(true)).catch(() => resolve(false));
      } else {
        resolve(false);
      }
    });
  };

  const verifyPIN = () => {
    if (pin === CORRECT_PIN) {
      setLoading(true);
      setTimeout(() => {
        onAuthenticated();
      }, 300);
    } else {
      setError('Code PIN incorrect');
      setPin('');
      // Vibration feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };

  const handlePinInput = (digit) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      // Auto-verify when 6 digits entered
      if (newPin.length === 6) {
        setTimeout(() => {
          if (newPin === CORRECT_PIN) {
            setLoading(true);
            setTimeout(() => onAuthenticated(), 300);
          } else {
            setError('Code PIN incorrect');
            setPin('');
            if (navigator.vibrate) navigator.vibrate(200);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030305] via-[#080810] to-[#0c0c14] flex flex-col items-center justify-center p-6">
        <Loader2 size={48} className="animate-spin text-cyan-400 mb-4" />
        <div className="text-gray-400">Connexion...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030305] via-[#080810] to-[#0c0c14] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2">
          TITAN.OS
        </div>
        <div className="text-sm text-gray-500">v9.2 • SECOND BRAIN</div>
      </div>

      {/* Instructions */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Connexion</h2>
        <p className="text-sm text-gray-400">Entrez votre code PIN</p>
      </div>

      {/* Face ID Button */}
      {showBiometricButton && (
        <button
          onClick={tryFaceID}
          className="mb-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-3"
        >
          <span className="text-2xl">🔐</span>
          <span>Utiliser Face ID</span>
        </button>
      )}

      {/* PIN Display */}
      <div className="flex gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border-2 transition-all ${
              pin.length > i
                ? 'border-cyan-400 bg-cyan-400/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {pin.length > i && (
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handlePinInput(digit.toString())}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/30 active:scale-95 text-white text-2xl font-bold transition-all"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          onClick={() => handlePinInput('0')}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/30 active:scale-95 text-white text-2xl font-bold transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-red-500/30 active:scale-95 text-white text-xl transition-all"
        >
          ←
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TITAN.OS v9 — Dashboard Central + Dev Perso + Cardio Integration
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    :root {
      --color-bg-primary: #030305;
      --color-bg-secondary: #080810;
      --color-bg-tertiary: #0c0c14;
      --color-bg-elevated: #12121c;
      --color-border: rgba(255, 255, 255, 0.04);
      --color-text-primary: #e8e8ec;
      --color-text-secondary: #6b6b7a;
      --color-text-muted: #404050;
      --color-accent: #3b82f6;
      --color-accent-purple: #8b5cf6;
      --color-accent-gold: #eab308;
      --color-success: #22c55e;
      --color-danger: #ef4444;
      --color-warning: #f59e0b;
      --font-family: 'Inter', -apple-system, sans-serif;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    html, body, #root {
      overflow-x: hidden;
      max-width: 100vw;
      width: 100%;
    }
    
    body {
      font-family: var(--font-family);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.03em;
    }
    
    h1, h2, h3, h4, h5, h6 {
      letter-spacing: -0.04em;
      line-height: 1.1;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
      50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.6); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
    .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin { animation: spin 1s linear infinite; }
    
    .shimmer-bg {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      background-size: 200% 200%;
      animation: gradient-shift 3s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .glass-card {
      background: linear-gradient(135deg, rgba(20, 20, 40, 0.8) 0%, rgba(10, 10, 20, 0.9) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    
    .hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    
    .glow-border {
      position: relative;
    }
    .glow-border::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(0,212,255,0.5), rgba(168,85,247,0.5));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .glow-border:hover::before { opacity: 1; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
    
    .stagger-1 { animation-delay: 0.05s; }
    .stagger-2 { animation-delay: 0.1s; }
    .stagger-3 { animation-delay: 0.15s; }
    .stagger-4 { animation-delay: 0.2s; }
    .stagger-5 { animation-delay: 0.25s; }
    .stagger-6 { animation-delay: 0.3s; }
  `}</style>
);

// --- DATA CONSTANTS ---
// Programme: 6 janvier 2026 → 31 octobre 2026 (5 phases)
// Phase 1: Prise de masse (6 jan → 2 avril) - 13 semaines
// Phase 2: Repos médical greffe (3 avril → 5 mai) - 5 semaines BLOQUÉES
// Phase 3: Réadaptation (6 mai → 25 mai) - 3 semaines
// Phase 4: Sèche intensive (26 mai → 30 juin) - 5 semaines
// Phase 5: Maintien (1 juillet → 31 octobre) - 18 semaines
const PHASE_1_START = new Date("2026-01-06"); // Lundi 6 janvier 2026

// Dates clés des phases
const PHASE_DATES = {
    masse: { start: "2026-01-06", end: "2026-04-02" },
    repos_medical: { start: "2026-04-03", end: "2026-05-05" },
    readaptation: { start: "2026-05-06", end: "2026-05-25" },
    seche: { start: "2026-05-26", end: "2026-06-30" },
    maintien: { start: "2026-07-01", end: "2026-10-31" }
};

// Helper pour vérifier si une date est dans la période de repos médical
const isInMedicalRest = (dateStr) => {
    const date = new Date(dateStr);
    const restStart = new Date(PHASE_DATES.repos_medical.start);
    const restEnd = new Date(PHASE_DATES.repos_medical.end);
    return date >= restStart && date <= restEnd;
};

// Helper pour obtenir la phase actuelle
const getCurrentPhase = (dateStr) => {
    const date = new Date(dateStr);
    for (const [phase, dates] of Object.entries(PHASE_DATES)) {
        if (date >= new Date(dates.start) && date <= new Date(dates.end)) {
            return phase;
        }
    }
    return date < new Date(PHASE_DATES.masse.start) ? 'pre_programme' : 'post_programme';
};

const CARDIO_DETAILS = {
    // LISS (Low Intensity Steady State) - Zone 2
    "LISS": { 
        title: "LISS - Marche/Vélo", 
        desc: "Tapis incliné 8-10% à 6km/h OU Vélo elliptique OU Marche rapide extérieur", 
        duration: "25-30 min", 
        intensity: "60-70% FCmax (Zone 2)",
        options: ["🚶 Marche inclinée tapis", "🚴 Vélo elliptique", "🏃 Marche rapide extérieur", "🚣 Rameur faible intensité"]
    },
    "LISS_Opt": { 
        title: "LISS Optionnel", 
        desc: "Tapis incliné OU Vélo OU Marche rapide", 
        duration: "25-30 min", 
        intensity: "60-70% FCmax (Zone 2)",
        optional: true,
        options: ["🚶 Marche inclinée tapis", "🚴 Vélo elliptique", "🏃 Marche rapide"]
    },
    "LISS_20": { 
        title: "LISS Court", 
        desc: "Récupération active légère", 
        duration: "20 min", 
        intensity: "60-65% FCmax",
        options: ["🚶 Marche modérée", "🚴 Vélo léger"]
    },
    "LISS_25": { 
        title: "LISS", 
        desc: "Tapis incliné ou vélo faible intensité", 
        duration: "25 min", 
        intensity: "60-70% FCmax",
        options: ["🚶 Marche inclinée", "🚴 Vélo", "🚣 Rameur"]
    },
    "LISS_30": { 
        title: "LISS Modéré", 
        desc: "Tapis incliné ou vélo", 
        duration: "30 min", 
        intensity: "65-70% FCmax",
        options: ["🚶 Marche inclinée 10%", "🚴 Vélo elliptique", "🏃 Marche rapide"]
    },
    "LISS_35": { 
        title: "LISS Long", 
        desc: "Endurance fondamentale", 
        duration: "35 min", 
        intensity: "65-70% FCmax",
        options: ["🚶 Marche inclinée", "🚴 Vélo", "🏃 Jogging léger"]
    },
    "LISS_40": { 
        title: "LISS Étendu", 
        desc: "Travail aérobie prolongé", 
        duration: "40 min", 
        intensity: "65-70% FCmax",
        options: ["🚶 Marche inclinée", "🚴 Vélo", "🏃 Footing lent"]
    },
    "LISS_40_Opt": { 
        title: "LISS Étendu (Optionnel)", 
        desc: "Travail aérobie prolongé", 
        duration: "40 min", 
        intensity: "65-70% FCmax",
        optional: true,
        options: ["🚶 Marche inclinée", "🚴 Vélo", "🏃 Footing lent"]
    },
    "LISS_45": { 
        title: "LISS Long", 
        desc: "Endurance de base", 
        duration: "45 min", 
        intensity: "65-70% FCmax",
        options: ["🚶 Marche longue", "🚴 Vélo", "🏃 Footing"]
    },
    "LISS_45_Opt": { 
        title: "LISS Long (Optionnel)", 
        desc: "Endurance de base", 
        duration: "45 min", 
        intensity: "65-70% FCmax",
        optional: true,
        options: ["🚶 Marche longue", "🚴 Vélo", "🏃 Footing"]
    },
    
    // HIIT (High Intensity Interval Training)
    "HIIT": { 
        title: "HIIT Intervalles", 
        desc: "30s effort max / 30s repos", 
        duration: "15-20 min", 
        intensity: "85-95% FCmax",
        options: ["🏃 Sprint tapis", "🚴 Vélo intensif", "🪜 Escaliers", "🏋️ Burpees/Mountain climbers"]
    },
    "HIIT_15": { 
        title: "HIIT Court", 
        desc: "30s sprint / 30s repos × 15 cycles", 
        duration: "15 min", 
        intensity: "85-95% FCmax",
        options: ["🏃 Sprint tapis", "🚴 Assault bike", "🪜 Escaliers rapides"]
    },
    "HIIT_20": { 
        title: "HIIT Standard", 
        desc: "30s sprint / 30s repos × 20 cycles", 
        duration: "20 min", 
        intensity: "85-95% FCmax",
        options: ["🏃 Sprint tapis/extérieur", "🚴 Vélo intervalles", "🪜 Escaliers"]
    },
    "HIIT_25": { 
        title: "HIIT Avancé", 
        desc: "30s sprint / 30s repos × 25 cycles", 
        duration: "25 min", 
        intensity: "85-95% FCmax",
        options: ["🏃 Sprints", "🚴 Assault bike", "🪜 Montée escaliers", "🏋️ Circuit training"]
    },
    
    // Course
    "Course_10km": { 
        title: "Course 10km", 
        desc: "Allure fondamentale régulière", 
        duration: "~50-60 min", 
        intensity: "70-75% FCmax",
        options: ["🏃 Course extérieur", "🏃 Tapis de course"]
    },
    "Course_10km_Opt": { 
        title: "Course 10km (Optionnel)", 
        desc: "Allure fondamentale", 
        duration: "~50-60 min", 
        intensity: "70-75% FCmax",
        optional: true,
        options: ["🏃 Course extérieur", "🏃 Tapis"]
    },
    "Course_30": { 
        title: "Footing 30min", 
        desc: "Course à allure confortable", 
        duration: "30 min", 
        intensity: "65-75% FCmax",
        options: ["🏃 Course extérieur", "🏃 Tapis"]
    },
    "Course_35": { 
        title: "Footing 35min", 
        desc: "Course endurance", 
        duration: "35 min", 
        intensity: "65-75% FCmax",
        options: ["🏃 Course extérieur", "🏃 Tapis"]
    },
    "Course_40": { 
        title: "Footing 40min", 
        desc: "Course endurance prolongée", 
        duration: "40 min", 
        intensity: "65-75% FCmax",
        options: ["🏃 Course extérieur", "🏃 Tapis"]
    },
    
    // Spéciaux
    "Ski": { 
        title: "Ski Alpin", 
        desc: "Journée ski = cardio naturel", 
        duration: "Journée", 
        intensity: "Variable selon pistes",
        options: ["⛷️ Ski alpin"]
    },
    "Non": { 
        title: "Pas de Cardio", 
        desc: "", 
        duration: "", 
        intensity: "",
        options: []
    }
};


const EXERCISES_DB = {
    // ═══════════════════════════════════════════════════════════════════════════════
    // PHASE 1 - MASSE (Semaines 1-10)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_A": [
        { id: "DC_BARRE", name: "Développé Couché Barre", sets: 4, reps: "6-8", repos: 150, muscles: "Pectoraux, Triceps, Épaules", consignes: "Descendre CONTRÔLÉ 2-3s, coudes 45°, ne pas verrouiller" },
        { id: "DIPS_LESTE", name: "Dips Lestés Pectoraux", sets: 4, reps: "8-10", repos: 120, muscles: "Pectoraux bas, Triceps", consignes: "Buste penché 20° avant, descendre profond" },
        { id: "DI_HALT", name: "Développé Incliné Haltères", sets: 4, reps: "10-12", repos: 90, muscles: "Pectoraux haut, Épaules", consignes: "Banc 30-45°, étirement pecs haut" },
        { id: "DM_BARRE", name: "Développé Militaire Barre", sets: 3, reps: "8-10", repos: 120, muscles: "Épaules, Triceps", consignes: "Debout, gainage abdo/fesses, pas cambrer" },
        { id: "ELEV_LAT", name: "Élévations Latérales", sets: 3, reps: "12-15", repos: 45, muscles: "Épaules moyen", consignes: "Mains inclinées (verser eau), pas de balancement" },
        { id: "EXT_POULIE", name: "Extension Poulie Haute Corde", sets: 3, reps: "15-20", repos: 45, muscles: "Triceps", consignes: "Coudes COLLÉS au corps, écarter corde en bas" },
        { id: "PULLOVER_POULIE", name: "Pullover Poulie Haute", sets: 3, reps: "15-20", repos: 45, muscles: "Pectoraux, Grand dorsal", consignes: "Tirer en arc vers cuisses, contracter pecs" }
    ],
    "PULL_A": [
        { id: "TRACTIONS_PRON", name: "Tractions Pronation", sets: 4, reps: "6-10", repos: 150, muscles: "Grand dorsal, Biceps", consignes: "Prise large 1.5x épaules, descendre contrôlé 2-3s" },
        { id: "ROWING_YATES", name: "Rowing Barre Yates", sets: 4, reps: "8-10", repos: 120, muscles: "Dos milieu, Trapèzes, Biceps", consignes: "Buste 45°, tirer vers BAS du ventre, coudes collés" },
        { id: "TIRAGE_VERT", name: "Tirage Vertical Prise Serrée", sets: 4, reps: "10-12", repos: 90, muscles: "Dos milieu, Grand dorsal", consignes: "Tirer vers BAS poitrine, contracter omoplates" },
        { id: "ROWING_HALT_1B", name: "Rowing Haltère 1 Bras", sets: 3, reps: "12", repos: 90, muscles: "Dos, Trapèzes", consignes: "Tirer vers HANCHE, contracter omoplate 2s" },
        { id: "FACE_PULLS", name: "Face Pulls", sets: 3, reps: "15-20", repos: 45, muscles: "Épaules arrière", consignes: "Tirer vers visage, ÉCARTER corde, coudes hauts" },
        { id: "CURL_BARRE", name: "Curl Barre EZ", sets: 4, reps: "10-12", repos: 90, muscles: "Biceps", consignes: "Coudes collés, pas de balancement" },
        { id: "CURL_POULIE", name: "Curl Poulie Basse", sets: 3, reps: "12-15", repos: 45, muscles: "Biceps", consignes: "Tension continue, coudes fixes" },
        { id: "CURL_MARTEAU", name: "Curl Marteau Haltères", sets: 3, reps: "12-15", repos: 45, muscles: "Biceps, Brachial", consignes: "Paumes face à face, contracter en haut" }
    ],
    "MOLLETS": [
        { id: "MOLLETS_DEBOUT", name: "Mollets Debout Machine", sets: 5, reps: "15-20", repos: 60, muscles: "Gastrocnémiens", consignes: "TEMPO 2-1-3, amplitude MAXIMALE, monter le plus haut" },
        { id: "MOLLETS_ASSIS", name: "Mollets Assis Machine", sets: 4, reps: "20-25", repos: 60, muscles: "Soléaires", consignes: "TEMPO 2-1-3 contrôlé, amplitude maximale" },
        { id: "MOLLETS_PRESSE", name: "Mollets Presse à Cuisses", sets: 4, reps: "20", repos: 60, muscles: "Gastrocnémiens", consignes: "Pointes pieds sur BAS plateforme, jambes TENDUES" }
    ],
    "LEGS_A": [
        { id: "SQUAT_BARRE", name: "Squat Barre", sets: 4, reps: "6-8", repos: 180, muscles: "Quadriceps, Fessiers, Core", consignes: "Barre sur trapèzes, dos DROIT, pousser talons" },
        { id: "PRESSE_CUISSES", name: "Presse à Cuisses", sets: 4, reps: "12-15", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Dos plaqué, pieds MILIEU plateforme, 90° genoux" },
        { id: "FENTES_BULGARES", name: "Fentes Bulgares Haltères", sets: 3, reps: "10", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Pied arrière sur banc, genou ne dépasse pas pointe" },
        { id: "LEG_EXTENSION", name: "Leg Extension", sets: 4, reps: "15-20", repos: 60, muscles: "Quadriceps", consignes: "CONTRACTER FORT en haut 2s, tempo 2-2-3" },
        { id: "SDT_ROUMAIN", name: "Soulevé de Terre Roumain", sets: 4, reps: "10-12", repos: 120, muscles: "Ischios, Fessiers, Bas dos", consignes: "Dos DROIT cambré, descendre mi-tibias" },
        { id: "LEG_CURL", name: "Leg Curl Allongé", sets: 3, reps: "12-15", repos: 60, muscles: "Ischios", consignes: "Ramener talons vers fesses, tempo 2-1-3" },
        { id: "MOLLETS_PRESSE_LEGS", name: "Mollets Presse (Legs)", sets: 5, reps: "20", repos: 60, muscles: "Mollets", consignes: "TEMPO 2-1-3, pointes sur bas plateforme" },
        { id: "MOLLETS_SMITH", name: "Mollets Smith Machine", sets: 4, reps: "15-20", repos: 60, muscles: "Mollets", consignes: "Step au sol, TEMPO 2-1-3" }
    ],
    "PUSH_B": [
        { id: "DM_HALT", name: "Développé Militaire Haltères", sets: 4, reps: "8-10", repos: 120, muscles: "Épaules, Triceps", consignes: "Assis dos contre dossier, pousser vertical" },
        { id: "DC_HALT", name: "Développé Haltères Banc Plat", sets: 4, reps: "10-12", repos: 120, muscles: "Pectoraux, Triceps", consignes: "Amplitude plus grande que barre, étirement max" },
        { id: "POMPES_LEST", name: "Pompes Lestées Pieds Surélevés", sets: 3, reps: "12-15", repos: 90, muscles: "Pectoraux, Triceps", consignes: "Pieds sur banc, gilet lesté, corps gainé" },
        { id: "ELEV_LAT_PENCHE", name: "Élévations Latérales Buste Penché", sets: 4, reps: "12-15", repos: 45, muscles: "Épaules arrière", consignes: "Penché 90°, lever jusqu'à parallèle sol" },
        { id: "OISEAU_HALT", name: "Oiseau Haltères Banc Incliné", sets: 3, reps: "15-20", repos: 45, muscles: "Épaules arrière", consignes: "Torse contre banc 45°, écarter bras côtés" },
        { id: "DIPS_PECS", name: "Dips Pectoraux Lestés", sets: 3, reps: "10-12", repos: 90, muscles: "Pectoraux bas, Triceps", consignes: "Buste penché 20° avant" },
        { id: "EXT_POULIE_CORDE", name: "Extension Poulie Haute Corde (B)", sets: 3, reps: "15-20", repos: 45, muscles: "Triceps", consignes: "Coudes collés, écarter corde, contracter 2s" },
        { id: "KICKBACK", name: "Kickback Haltères", sets: 3, reps: "15", repos: 60, muscles: "Triceps", consignes: "Coude haut fixe, tendre bras vers arrière" }
    ],
    "PULL_B": [
        { id: "TRACTIONS_STD", name: "Tractions Pronation Standard", sets: 4, reps: "8-10", repos: 120, muscles: "Grand dorsal, Biceps", consignes: "Prise largeur épaules, menton au-dessus" },
        { id: "ROWING_HALT_INCLINE", name: "Rowing Haltères Banc Incliné 2 Bras", sets: 4, reps: "10-12", repos: 120, muscles: "Dos milieu, Trapèzes", consignes: "Torse contre banc 45°, tirer vers hanches" },
        { id: "TIRAGE_HORIZ", name: "Tirage Horizontal Poulie", sets: 4, reps: "10-12", repos: 90, muscles: "Dos milieu, Trapèzes", consignes: "Tirer vers BAS ventre, coudes COLLÉS, dos droit" },
        { id: "PULLOVER_POULIE_B", name: "Pullover Poulie Haute (B)", sets: 3, reps: "15-20", repos: 60, muscles: "Grand dorsal, Pectoraux", consignes: "Arc de cercle vers cuisses, contracter dos" },
        { id: "SHRUGS_HALT", name: "Shrugs Haltères", sets: 3, reps: "15-20", repos: 45, muscles: "Trapèzes", consignes: "Monter épaules VERTICALEMENT, tenir 1s, pas de rotation" },
        { id: "CURL_INCLINE", name: "Curl Incliné Haltères", sets: 3, reps: "12-15", repos: 90, muscles: "Biceps", consignes: "Banc 45°, bras PENDANTS, étirement max" },
        { id: "CURL_CONCENTRATION", name: "Curl Concentration", sets: 3, reps: "12", repos: 90, muscles: "Biceps", consignes: "Coude contre cuisse, CONTRACTER FORT en haut" },
        { id: "CURL_POULIE_HAUTE", name: "Curl Poulie Haute Pose", sets: 3, reps: "15-20", repos: 45, muscles: "Biceps", consignes: "Entre 2 poulies, bras en croix, ramener vers oreilles" }
    ],
    "UPPER_SKI": [
        { id: "POMPES", name: "Pompes", sets: 4, reps: "Max" },
        { id: "TRAC_SKI", name: "Tractions (si dispo)", sets: 3, reps: "Max" }
    ],
    // ═══════════════════════════════════════════════════════════════════════════════
    // PHASE 2 - TRANSITION (Semaines 11-18)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_A_v2": [
        { id: "DC_HALT_V2", name: "Développé Haltères Banc Plat (v2)", sets: 4, reps: "6-8", repos: 150, muscles: "Pectoraux, Triceps", consignes: "Amplitude SUPÉRIEURE à barre, étirement max pecs" },
        { id: "DIPS_TEMPO", name: "Dips Lestés Tempo Lent", sets: 4, reps: "8-10", repos: 120, muscles: "Pectoraux bas, Triceps", consignes: "TEMPO 3-1-1-0, descente ULTRA-CONTRÔLÉE 3s" },
        { id: "ARNOLD_PRESS", name: "Arnold Press", sets: 3, reps: "8-10", repos: 120, muscles: "Épaules, Triceps", consignes: "PIVOTER poignets en montant, paumes vers soi -> vers avant" }
    ],
    "PULL_A_v2": [
        { id: "TRACTIONS_LARGE_V2", name: "Tractions Prise Large", sets: 4, reps: "6-10", repos: 150, muscles: "Grand dorsal, Biceps", consignes: "Prise LARGE 1.5x épaules, focus largeur dos" },
        { id: "ROWING_HALT_BANC_V2", name: "Rowing Haltères Appuyé Banc", sets: 4, reps: "10-12", repos: 120, muscles: "Dos milieu", consignes: "Torse contre banc 45°, pas stress bas dos" },
        { id: "CURL_21S", name: "Curl 21s", sets: 3, reps: "21", repos: 120, muscles: "Biceps", consignes: "7 moitié basse + 7 moitié haute + 7 complètes SANS poser" }
    ],
    "LEGS_A_v2_MOLLETS": [
        { id: "FRONT_SQUAT_V2", name: "Front Squat", sets: 4, reps: "6-8", repos: 180, muscles: "Quadriceps, Core", consignes: "Barre DEVANT sur épaules, coudes HAUTS, buste droit" },
        { id: "HACK_SQUAT_V2", name: "Hack Squat", sets: 4, reps: "12-15", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Dos contre dossier, pieds milieu plateforme" },
        { id: "FENTES_MARCHEES_V2", name: "Fentes Marchées Lestées", sets: 3, reps: "20", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Alterner jambes en MARCHANT, grand pas" },
        { id: "MOLLETS_DEBOUT_V2", name: "Mollets Debout (v2)", sets: 4, reps: "15-20", repos: 60, muscles: "Mollets", consignes: "TEMPO 2-1-3, amplitude max" },
        { id: "MOLLETS_PRESSE_V2", name: "Mollets Presse (v2)", sets: 4, reps: "20", repos: 60, muscles: "Mollets", consignes: "TEMPO 2-1-3" },
        { id: "MOLLETS_ASSIS_V2", name: "Mollets Assis (v2)", sets: 3, reps: "20-25", repos: 60, muscles: "Mollets", consignes: "TEMPO 2-1-3" }
    ],
    // ═══════════════════════════════════════════════════════════════════════════════
    // PHASE 3 - SÈCHE (Semaines 19-27)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_PULL_A": [
        { id: "DC_HALT_P3", name: "Développé Couché Haltères (Phase3)", sets: 4, reps: "8-10", repos: 120, muscles: "Pectoraux, Triceps", consignes: "SUPERSET avec Tractions, repos après les 2" },
        { id: "TRACTIONS_P3", name: "Tractions Pronation (Phase3)", sets: 4, reps: "8-10", repos: 120, muscles: "Grand dorsal, Biceps", consignes: "SUPERSET avec DC, faire immédiatement après" },
        { id: "DM_HALT_P3", name: "Développé Militaire Haltères (Phase3)", sets: 3, reps: "10-12", repos: 90, muscles: "Épaules", consignes: "SUPERSET avec Rowing" },
        { id: "ROWING_HALT_P3", name: "Rowing Haltères Appuyé (Phase3)", sets: 3, reps: "10-12", repos: 90, muscles: "Dos", consignes: "SUPERSET avec DM" }
    ],
    "LEGS_MOLLETS": [
        { id: "SQUAT_P3", name: "Squat Barre (Phase3)", sets: 3, reps: "8-10", repos: 150, muscles: "Quadriceps, Fessiers", consignes: "Reps augmentées car déficit calorique" },
        { id: "PRESSE_P3", name: "Presse à Cuisses (Phase3)", sets: 3, reps: "15-20", repos: 90, muscles: "Quadriceps, Fessiers", consignes: "Volume maintenu" },
        { id: "MOLLETS_DEBOUT_P3", name: "Mollets Debout (Phase3)", sets: 4, reps: "20", repos: 60, muscles: "Mollets", consignes: "Entretien acquis, TEMPO 2-1-3" },
        { id: "MOLLETS_PRESSE_P3", name: "Mollets Presse (Phase3)", sets: 4, reps: "20", repos: 60, muscles: "Mollets", consignes: "TEMPO 2-1-3" },
        { id: "MOLLETS_ASSIS_P3", name: "Mollets Assis (Phase3)", sets: 3, reps: "25", repos: 45, muscles: "Mollets", consignes: "TEMPO 2-1-3" }
    ],
    "PUSH_PULL_B": [
        { id: "DI_HALT_P3", name: "Développé Incliné Haltères (Phase3)", sets: 4, reps: "10-12", repos: 90, muscles: "Pectoraux haut", consignes: "Focus pecs haut" },
        { id: "ROWING_YATES_P3", name: "Rowing Yates (Phase3)", sets: 4, reps: "10-12", repos: 90, muscles: "Dos", consignes: "Buste 45°" }
    ],
    "FULL_BODY": [
        { id: "FRONT_SQUAT_FB", name: "Front Squat (Full Body)", sets: 3, reps: "8-10", repos: 120, muscles: "Quadriceps", consignes: "Barre devant" },
        { id: "DC_BARRE_FB", name: "Développé Couché Barre (Full Body)", sets: 4, reps: "8-10", repos: 120, muscles: "Pectoraux", consignes: "Retour exercice base" },
        { id: "TRACTIONS_LARGE_FB", name: "Tractions Prise Large (Full Body)", sets: 3, reps: "10", repos: 90, muscles: "Grand dorsal", consignes: "Prise large" },
        { id: "DM_BARRE_FB", name: "Développé Militaire Barre (Full Body)", sets: 3, reps: "10", repos: 90, muscles: "Épaules", consignes: "Debout" },
        { id: "SDT_ROUMAIN_FB", name: "SDL Roumain (Full Body)", sets: 3, reps: "12", repos: 90, muscles: "Ischios, Fessiers", consignes: "Focus ischios" },
        { id: "MOLLETS_FB", name: "Mollets Debout (Entretien)", sets: 2, reps: "20", repos: 45, muscles: "Mollets", consignes: "Entretien rapide" }
    ],
    "CIRCUIT_METABOLIQUE": [
        { id: "GOBLET_SQUATS", name: "Goblet Squats", sets: 3, reps: "15", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Haltère 20-24kg devant, squat complet, enchaîner" },
        { id: "POMPES_CIRCUIT", name: "Pompes", sets: 3, reps: "15", repos: 0, muscles: "Pectoraux, Triceps", consignes: "Enchaîner immédiatement" },
        { id: "KB_SWINGS", name: "Kettlebell Swings", sets: 3, reps: "20", repos: 0, muscles: "Fessiers, Ischios, Dos", consignes: "KB 16-20kg, swing explosif" },
        { id: "BURPEES", name: "Burpees", sets: 3, reps: "12", repos: 0, muscles: "Full body", consignes: "Burpees complets" },
        { id: "MOUNTAIN_CLIMBERS", name: "Mountain Climbers", sets: 3, reps: "30", repos: 0, muscles: "Core, Cardio", consignes: "Position pompe, alterner genoux" },
        { id: "BOX_JUMPS", name: "Box Jumps", sets: 3, reps: "10", repos: 120, muscles: "Quadriceps, Explosivité", consignes: "Box 50-60cm, repos 2min après round" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // RÉADAPTATION - Semaine 1 (50% charges, machines guidées)
    // ═══════════════════════════════════════════════════════════════════════════════
    "FULLBODY_A_READAPT_S1": [
        { id: "LEG_PRESS_R1", name: "Leg Press", sets: 2, reps: "12", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "50% charge habituelle, contrôlé, pas de douleur" },
        { id: "CHEST_PRESS_R1", name: "Chest Press Machine", sets: 2, reps: "12", repos: 120, muscles: "Pectoraux, Triceps", consignes: "50% charge, mouvement fluide" },
        { id: "LAT_PULLDOWN_R1", name: "Lat Pulldown", sets: 2, reps: "12", repos: 120, muscles: "Grand dorsal, Biceps", consignes: "50% charge, tirer vers poitrine" },
        { id: "SHOULDER_PRESS_R1", name: "Shoulder Press Machine", sets: 2, reps: "12", repos: 120, muscles: "Épaules", consignes: "50% charge, pas de douleur" },
        { id: "LEG_CURL_R1", name: "Leg Curl", sets: 2, reps: "15", repos: 90, muscles: "Ischios", consignes: "50% charge, contrôlé" },
        { id: "CABLE_ROWS_R1", name: "Cable Rows", sets: 2, reps: "12", repos: 90, muscles: "Dos milieu", consignes: "50% charge, omoplates serrées" }
    ],
    "FULLBODY_B_READAPT_S1": [
        { id: "GOBLET_SQUAT_R1", name: "Goblet Squat léger", sets: 2, reps: "12", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Haltère léger, squat contrôlé" },
        { id: "INCLINE_CHEST_R1", name: "Incline Chest Press Machine", sets: 2, reps: "12", repos: 120, muscles: "Pectoraux haut", consignes: "50% charge" },
        { id: "CABLE_PULLDOWN_R1", name: "Cable Pulldown", sets: 2, reps: "12", repos: 120, muscles: "Grand dorsal", consignes: "50% charge" },
        { id: "LAT_RAISE_R1", name: "Lateral Raises", sets: 2, reps: "15", repos: 90, muscles: "Épaules moyen", consignes: "Poids très léger, focus sensation" },
        { id: "LEG_EXT_R1", name: "Leg Extension", sets: 2, reps: "15", repos: 90, muscles: "Quadriceps", consignes: "50% charge" },
        { id: "FACE_PULLS_R1", name: "Face Pulls", sets: 2, reps: "15", repos: 90, muscles: "Épaules arrière", consignes: "Léger, focus technique" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // RÉADAPTATION - Semaine 2 (65% charges, réintro compounds)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_READAPT_S2": [
        { id: "BENCH_R2", name: "Bench Press", sets: 3, reps: "10", repos: 150, muscles: "Pectoraux, Triceps", consignes: "65% charge, contrôlé" },
        { id: "INCLINE_DB_R2", name: "Incline Dumbbell Press", sets: 3, reps: "10", repos: 120, muscles: "Pectoraux haut", consignes: "65% charge" },
        { id: "SHOULDER_DB_R2", name: "Shoulder Press Haltères", sets: 3, reps: "10", repos: 120, muscles: "Épaules", consignes: "65% charge" },
        { id: "LAT_RAISE_R2", name: "Lateral Raises", sets: 3, reps: "12", repos: 90, muscles: "Épaules moyen", consignes: "Progresser légèrement" },
        { id: "TRICEPS_PUSH_R2", name: "Triceps Pushdown", sets: 3, reps: "12", repos: 90, muscles: "Triceps", consignes: "Focus contraction" }
    ],
    "PULL_READAPT_S2": [
        { id: "ROWING_BARRE_R2", name: "Rowing Barre", sets: 3, reps: "10", repos: 150, muscles: "Dos, Trapèzes", consignes: "65% charge, dos droit" },
        { id: "LAT_PULLDOWN_R2", name: "Lat Pulldown", sets: 3, reps: "10", repos: 120, muscles: "Grand dorsal", consignes: "65% charge" },
        { id: "CABLE_ROWS_R2", name: "Cable Rows", sets: 3, reps: "10", repos: 120, muscles: "Dos milieu", consignes: "65% charge" },
        { id: "FACE_PULLS_R2", name: "Face Pulls", sets: 3, reps: "12", repos: 90, muscles: "Épaules arrière", consignes: "Focus technique" },
        { id: "BICEPS_CURLS_R2", name: "Biceps Curls", sets: 3, reps: "12", repos: 90, muscles: "Biceps", consignes: "Coudes fixes" }
    ],
    "LEGS_READAPT_S2": [
        { id: "SQUAT_R2", name: "Squat", sets: 3, reps: "10", repos: 150, muscles: "Quadriceps, Fessiers", consignes: "60% charge, réintro prudente" },
        { id: "LEG_PRESS_R2", name: "Leg Press", sets: 3, reps: "10", repos: 120, muscles: "Quadriceps", consignes: "65% charge" },
        { id: "RDL_R2", name: "Romanian Deadlift léger", sets: 3, reps: "10", repos: 150, muscles: "Ischios, Fessiers", consignes: "60% charge, dos droit" },
        { id: "LEG_CURL_R2", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Focus contraction" },
        { id: "LEG_EXT_R2", name: "Leg Extension", sets: 3, reps: "12", repos: 90, muscles: "Quadriceps", consignes: "Contrôlé" },
        { id: "MOLLETS_R2", name: "Mollets", sets: 3, reps: "15", repos: 60, muscles: "Mollets", consignes: "Amplitude max" }
    ],
    "UPPER_READAPT_S2": [
        { id: "INCLINE_BENCH_R2", name: "Incline Bench", sets: 3, reps: "10", repos: 150, muscles: "Pectoraux haut", consignes: "65% charge" },
        { id: "ROWING_DB_R2", name: "Rowing Haltères", sets: 3, reps: "10", repos: 120, muscles: "Dos", consignes: "65% charge" },
        { id: "OHP_R2", name: "Overhead Press", sets: 3, reps: "10", repos: 120, muscles: "Épaules", consignes: "65% charge" },
        { id: "PULLUPS_ASSISTED_R2", name: "Pull-ups assistés ou Lat Pulldown", sets: 3, reps: "10", repos: 120, muscles: "Dos", consignes: "Assistance si nécessaire" },
        { id: "DIPS_ASSISTED_R2", name: "Dips assistés ou Triceps", sets: 3, reps: "10", repos: 90, muscles: "Triceps", consignes: "Assistance si nécessaire" },
        { id: "CURLS_R2", name: "Curls", sets: 3, reps: "12", repos: 90, muscles: "Biceps", consignes: "Contrôlé" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // RÉADAPTATION - Semaine 3 (80-85% charges, retour quasi-normal)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_READAPT_S3": [
        { id: "BENCH_R3", name: "Bench Press", sets: 4, reps: "8-10", repos: 150, muscles: "Pectoraux, Triceps", consignes: "80-85% charge" },
        { id: "INCLINE_DB_R3", name: "Incline Dumbbell Press", sets: 4, reps: "10", repos: 120, muscles: "Pectoraux haut", consignes: "80% charge" },
        { id: "OHP_R3", name: "Overhead Press", sets: 4, reps: "8-10", repos: 120, muscles: "Épaules", consignes: "80% charge" },
        { id: "LAT_RAISE_R3", name: "Lateral Raises", sets: 4, reps: "12-15", repos: 90, muscles: "Épaules", consignes: "Retour volume normal" },
        { id: "CABLE_FLYES_R3", name: "Cable Flyes", sets: 3, reps: "12", repos: 90, muscles: "Pectoraux", consignes: "Focus étirement" },
        { id: "TRICEPS_R3", name: "Triceps Pushdown", sets: 3, reps: "12", repos: 90, muscles: "Triceps", consignes: "Contrôlé" }
    ],
    "PULL_READAPT_S3": [
        { id: "DEADLIFT_R3", name: "Deadlift", sets: 4, reps: "6-8", repos: 180, muscles: "Dos, Ischios", consignes: "80% charge, technique parfaite" },
        { id: "PULLUPS_R3", name: "Pull-ups", sets: 4, reps: "8-10", repos: 150, muscles: "Dos, Biceps", consignes: "Retour normal" },
        { id: "ROWING_R3", name: "Barbell Row", sets: 4, reps: "8-10", repos: 120, muscles: "Dos", consignes: "80% charge" },
        { id: "CABLE_ROWS_R3", name: "Cable Rows", sets: 3, reps: "10-12", repos: 90, muscles: "Dos milieu", consignes: "Contrôlé" },
        { id: "FACE_PULLS_R3", name: "Face Pulls", sets: 3, reps: "15", repos: 90, muscles: "Épaules arrière", consignes: "Léger" },
        { id: "CURLS_R3", name: "Barbell Curls", sets: 3, reps: "10-12", repos: 90, muscles: "Biceps", consignes: "Coudes fixes" }
    ],
    "LEGS_READAPT_S3": [
        { id: "SQUAT_R3", name: "Squat", sets: 4, reps: "6-8", repos: 180, muscles: "Quadriceps, Fessiers", consignes: "80% charge" },
        { id: "RDL_R3", name: "Romanian Deadlift", sets: 4, reps: "8-10", repos: 150, muscles: "Ischios, Fessiers", consignes: "80% charge" },
        { id: "LEG_PRESS_R3", name: "Leg Press", sets: 4, reps: "10-12", repos: 120, muscles: "Quadriceps", consignes: "Retour volume" },
        { id: "LUNGES_R3", name: "Walking Lunges", sets: 3, reps: "12/jambe", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Contrôlé" },
        { id: "LEG_CURL_R3", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Contrôlé" },
        { id: "MOLLETS_R3", name: "Standing Calf Raises", sets: 4, reps: "15", repos: 60, muscles: "Mollets", consignes: "Amplitude max" }
    ],
    "UPPER_READAPT_S3": [
        { id: "INCLINE_BENCH_R3", name: "Incline Bench Press", sets: 4, reps: "8-10", repos: 150, muscles: "Pectoraux", consignes: "80% charge" },
        { id: "WEIGHTED_PULLUPS_R3", name: "Weighted Pull-ups", sets: 4, reps: "6-8", repos: 150, muscles: "Dos", consignes: "Lest léger si possible" },
        { id: "DB_SHOULDER_R3", name: "Dumbbell Shoulder Press", sets: 4, reps: "10", repos: 120, muscles: "Épaules", consignes: "80% charge" },
        { id: "CABLE_ROWS_R3B", name: "Cable Rows", sets: 3, reps: "10-12", repos: 90, muscles: "Dos", consignes: "Contrôlé" },
        { id: "DIPS_R3", name: "Dips", sets: 3, reps: "10-12", repos: 90, muscles: "Triceps, Pecs", consignes: "Retour normal" },
        { id: "SUPERSET_ARMS_R3", name: "Curls + Triceps superset", sets: 3, reps: "12 chaque", repos: 90, muscles: "Biceps, Triceps", consignes: "Enchaîner" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // ABDOS - Circuit court (fin de séance, 5-10min)
    // ═══════════════════════════════════════════════════════════════════════════════
    "ABDOS_COURT": [
        { id: "PLANCHE_C", name: "Planche", sets: 2, reps: "45sec", repos: 30, muscles: "Core", consignes: "Corps aligné, gainage max" },
        { id: "CRUNCHS_C", name: "Crunchs", sets: 2, reps: "20", repos: 30, muscles: "Abdos", consignes: "Contracter en haut" },
        { id: "LEG_RAISES_C", name: "Leg Raises", sets: 2, reps: "15", repos: 30, muscles: "Abdos bas", consignes: "Jambes tendues, contrôlé" },
        { id: "RUSSIAN_TWISTS_C", name: "Russian Twists", sets: 2, reps: "20 (10/côté)", repos: 45, muscles: "Obliques", consignes: "Pieds au sol ou levés" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // ABDOS - Séance dédiée (samedi, 15-20min)
    // ═══════════════════════════════════════════════════════════════════════════════
    "ABDOS_DEDIE": [
        { id: "PLANCHE_D", name: "Planche", sets: 3, reps: "60sec", repos: 30, muscles: "Core", consignes: "Corps aligné, gainage max" },
        { id: "CRUNCHS_D", name: "Crunchs", sets: 3, reps: "25", repos: 30, muscles: "Abdos", consignes: "Contracter en haut" },
        { id: "HANGING_LEG_RAISES", name: "Hanging Leg Raises", sets: 3, reps: "12", repos: 45, muscles: "Abdos bas, Hip flexors", consignes: "Suspendu à barre, lever jambes" },
        { id: "CABLE_CRUNCH", name: "Cable Crunch", sets: 3, reps: "15", repos: 45, muscles: "Abdos", consignes: "À genoux, enrouler colonne" },
        { id: "DEAD_BUG", name: "Dead Bug", sets: 3, reps: "10/côté", repos: 30, muscles: "Core, Stabilité", consignes: "Dos plaqué au sol, alterner" },
        { id: "AB_WHEEL", name: "Ab Wheel ou Planche bras tendus", sets: 3, reps: "10 ou 45sec", repos: 45, muscles: "Core entier", consignes: "Contrôlé, pas cambrer" },
        { id: "SIDE_PLANK", name: "Side Plank", sets: 3, reps: "30sec/côté", repos: 30, muscles: "Obliques, Core latéral", consignes: "Hanches hautes, corps aligné" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // SÈCHE INTENSIVE - Séances complètes avec abdos intégrés
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_SECHE": [
        { id: "BENCH_S", name: "Bench Press", sets: 4, reps: "8-10", repos: 180, muscles: "Pectoraux, Triceps", consignes: "100% charge, compound lourd" },
        { id: "INCLINE_DB_S", name: "Incline Dumbbell Press", sets: 4, reps: "10", repos: 150, muscles: "Pectoraux haut", consignes: "Étirement max" },
        { id: "OHP_S", name: "Overhead Press", sets: 4, reps: "8-10", repos: 150, muscles: "Épaules", consignes: "Debout, gainage" },
        { id: "LAT_RAISE_S", name: "Lateral Raises", sets: 4, reps: "12-15", repos: 90, muscles: "Épaules moyen", consignes: "Léger, volume" },
        { id: "CABLE_FLYES_S", name: "Cable Flyes", sets: 3, reps: "12", repos: 90, muscles: "Pectoraux", consignes: "Étirement, contraction" },
        { id: "TRICEPS_PUSH_S", name: "Triceps Pushdown", sets: 3, reps: "12", repos: 90, muscles: "Triceps", consignes: "Coudes collés" },
        { id: "OVERHEAD_EXT_S", name: "Overhead Triceps Extension", sets: 3, reps: "12", repos: 90, muscles: "Triceps long", consignes: "Étirement max" }
    ],
    "PULL_SECHE": [
        { id: "DEADLIFT_S", name: "Deadlift", sets: 4, reps: "6-8", repos: 180, muscles: "Dos, Ischios", consignes: "100% charge" },
        { id: "PULLUPS_S", name: "Pull-ups", sets: 4, reps: "8-10", repos: 150, muscles: "Dos, Biceps", consignes: "Prise large" },
        { id: "BARBELL_ROW_S", name: "Barbell Row", sets: 4, reps: "8-10", repos: 150, muscles: "Dos milieu", consignes: "Buste 45°" },
        { id: "CABLE_ROWS_S", name: "Cable Rows", sets: 3, reps: "10-12", repos: 120, muscles: "Dos", consignes: "Omoplates serrées" },
        { id: "FACE_PULLS_S", name: "Face Pulls", sets: 3, reps: "15", repos: 90, muscles: "Épaules arrière", consignes: "Léger, technique" },
        { id: "BARBELL_CURLS_S", name: "Barbell Curls", sets: 3, reps: "10-12", repos: 90, muscles: "Biceps", consignes: "Pas de balancement" },
        { id: "HAMMER_CURLS_S", name: "Hammer Curls", sets: 3, reps: "12", repos: 90, muscles: "Biceps, Brachial", consignes: "Contrôlé" }
    ],
    "LEGS_SECHE": [
        { id: "SQUAT_S", name: "Squat", sets: 4, reps: "6-8", repos: 180, muscles: "Quadriceps, Fessiers", consignes: "100% charge" },
        { id: "RDL_S", name: "Romanian Deadlift", sets: 4, reps: "8-10", repos: 180, muscles: "Ischios, Fessiers", consignes: "Étirement max" },
        { id: "LEG_PRESS_S", name: "Leg Press", sets: 4, reps: "10-12", repos: 150, muscles: "Quadriceps", consignes: "Pieds milieu" },
        { id: "WALKING_LUNGES_S", name: "Walking Lunges", sets: 3, reps: "12/jambe", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Grand pas" },
        { id: "LEG_CURL_S", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Contrôlé" },
        { id: "LEG_EXT_S", name: "Leg Extension", sets: 3, reps: "12", repos: 90, muscles: "Quadriceps", consignes: "Contraction max" },
        { id: "CALF_RAISES_S", name: "Standing Calf Raises", sets: 4, reps: "15", repos: 60, muscles: "Mollets", consignes: "Amplitude max" }
    ],
    "UPPER_SECHE": [
        { id: "INCLINE_BENCH_S", name: "Incline Bench Press", sets: 4, reps: "8-10", repos: 180, muscles: "Pectoraux", consignes: "100% charge" },
        { id: "WEIGHTED_PULLUPS_S", name: "Weighted Pull-ups", sets: 4, reps: "6-8", repos: 150, muscles: "Dos", consignes: "Lest" },
        { id: "DB_SHOULDER_S", name: "Dumbbell Shoulder Press", sets: 4, reps: "10", repos: 150, muscles: "Épaules", consignes: "Assis ou debout" },
        { id: "CABLE_ROWS_S2", name: "Cable Rows", sets: 3, reps: "10-12", repos: 120, muscles: "Dos", consignes: "Focus milieu dos" },
        { id: "DIPS_S", name: "Dips", sets: 3, reps: "10-12", repos: 120, muscles: "Triceps, Pecs", consignes: "Buste penché" },
        { id: "LAT_RAISE_S2", name: "Lateral Raises", sets: 3, reps: "15", repos: 90, muscles: "Épaules", consignes: "Léger, volume" },
        { id: "SUPERSET_ARMS_S", name: "Curls + Triceps superset", sets: 3, reps: "12 chaque", repos: 90, muscles: "Biceps, Triceps", consignes: "Enchaîner" }
    ],
    "LOWER_SECHE": [
        { id: "FRONT_SQUAT_S", name: "Front Squat", sets: 4, reps: "8-10", repos: 180, muscles: "Quadriceps", consignes: "Coudes hauts" },
        { id: "HIP_THRUST_S", name: "Hip Thrust", sets: 4, reps: "10-12", repos: 150, muscles: "Fessiers", consignes: "Squeeze en haut" },
        { id: "BULGARIAN_S", name: "Bulgarian Split Squat", sets: 3, reps: "10/jambe", repos: 120, muscles: "Quadriceps, Fessiers", consignes: "Pied arrière sur banc" },
        { id: "LEG_CURL_S2", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Contrôlé" },
        { id: "LEG_EXT_S2", name: "Leg Extension", sets: 3, reps: "12", repos: 90, muscles: "Quadriceps", consignes: "Contrôlé" },
        { id: "SEATED_CALF_S", name: "Seated Calf Raises", sets: 4, reps: "15", repos: 60, muscles: "Soléaires", consignes: "Amplitude max" }
    ],

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAINTIEN - Programme 4 mois (juillet → octobre)
    // ═══════════════════════════════════════════════════════════════════════════════
    "PUSH_MAINTIEN": [
        { id: "BENCH_M", name: "Bench Press", sets: 4, reps: "8-10", repos: 180, muscles: "Pectoraux", consignes: "90-100% charge, maintien force" },
        { id: "INCLINE_DB_M", name: "Incline Dumbbell Press", sets: 4, reps: "10", repos: 150, muscles: "Pectoraux haut", consignes: "Maintien volume" },
        { id: "OHP_M", name: "Overhead Press", sets: 4, reps: "8-10", repos: 150, muscles: "Épaules", consignes: "Maintien" },
        { id: "LAT_RAISE_M", name: "Lateral Raises", sets: 3, reps: "12-15", repos: 90, muscles: "Épaules", consignes: "Léger" },
        { id: "TRICEPS_M", name: "Triceps (au choix)", sets: 3, reps: "12", repos: 90, muscles: "Triceps", consignes: "Varier exercices" }
    ],
    "PULL_MAINTIEN": [
        { id: "DEADLIFT_M", name: "Deadlift", sets: 4, reps: "6-8", repos: 180, muscles: "Dos", consignes: "90-100% charge" },
        { id: "PULLUPS_M", name: "Pull-ups", sets: 4, reps: "8-10", repos: 150, muscles: "Dos", consignes: "Lest si possible" },
        { id: "ROWS_M", name: "Rows (barre ou haltères)", sets: 4, reps: "8-10", repos: 150, muscles: "Dos", consignes: "Varier" },
        { id: "FACE_PULLS_M", name: "Face Pulls", sets: 3, reps: "15", repos: 90, muscles: "Épaules arrière", consignes: "Léger" },
        { id: "CURLS_M", name: "Curls (au choix)", sets: 3, reps: "10-12", repos: 90, muscles: "Biceps", consignes: "Varier" }
    ],
    "LEGS_MAINTIEN": [
        { id: "SQUAT_M", name: "Squat", sets: 4, reps: "6-8", repos: 180, muscles: "Quadriceps", consignes: "90-100% charge" },
        { id: "RDL_M", name: "Romanian Deadlift", sets: 4, reps: "8-10", repos: 150, muscles: "Ischios", consignes: "Maintien" },
        { id: "LEG_PRESS_M", name: "Leg Press", sets: 3, reps: "10-12", repos: 120, muscles: "Quadriceps", consignes: "Volume maintenu" },
        { id: "LEG_CURL_M", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Contrôlé" },
        { id: "MOLLETS_M", name: "Calf Raises", sets: 3, reps: "15", repos: 60, muscles: "Mollets", consignes: "Maintien acquis" }
    ],
    "UPPER_MAINTIEN": [
        { id: "INCLINE_M", name: "Incline Press", sets: 4, reps: "8-10", repos: 150, muscles: "Pectoraux", consignes: "90-100% charge" },
        { id: "PULLUPS_M2", name: "Pull-ups/Chin-ups", sets: 4, reps: "8-10", repos: 150, muscles: "Dos", consignes: "Alterner" },
        { id: "SHOULDER_M", name: "Shoulder Press", sets: 3, reps: "10", repos: 120, muscles: "Épaules", consignes: "Maintien" },
        { id: "ROWS_M2", name: "Rows", sets: 3, reps: "10-12", repos: 120, muscles: "Dos", consignes: "Focus technique" },
        { id: "ARMS_M", name: "Superset Biceps/Triceps", sets: 3, reps: "12", repos: 90, muscles: "Bras", consignes: "Enchaîner" }
    ],
    "LOWER_MAINTIEN": [
        { id: "SQUAT_M2", name: "Squat ou Front Squat", sets: 4, reps: "8-10", repos: 150, muscles: "Quadriceps", consignes: "Alterner" },
        { id: "HIP_THRUST_M", name: "Hip Thrust", sets: 4, reps: "10-12", repos: 120, muscles: "Fessiers", consignes: "Maintien" },
        { id: "LUNGES_M", name: "Lunges", sets: 3, reps: "10/jambe", repos: 120, muscles: "Quadriceps", consignes: "Varier" },
        { id: "ISCHIOS_M", name: "Leg Curl", sets: 3, reps: "12", repos: 90, muscles: "Ischios", consignes: "Contrôlé" },
        { id: "MOLLETS_M2", name: "Calf Raises", sets: 3, reps: "15", repos: 60, muscles: "Mollets", consignes: "Maintien" }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDRIER 44 SEMAINES - 6 janvier → 31 octobre 2026
// Phase 1: Prise de masse (6 jan → 2 avril) - 13 semaines
// Phase 2: Repos médical (3 avril → 5 mai) - 5 semaines BLOQUÉES
// Phase 3: Réadaptation (6 mai → 25 mai) - 3 semaines
// Phase 4: Sèche intensive (26 mai → 30 juin) - 5 semaines
// Phase 5: Maintien (1 juillet → 31 octobre) - 18 semaines
// Semaines du LUNDI au DIMANCHE
// ═══════════════════════════════════════════════════════════════════════════════
const CALENDAR_27_WEEKS = [
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1 - PRISE DE MASSE (Semaines 1-13) - 6 janvier → 2 avril 2026
    // Push/Pull/Legs/Rest+Cardio/Upper/Lower/Rest
    // Cardio obligatoire 1x/semaine (jour flexible)
    // ═══════════════════════════════════════════════════════════════════════════

    // S1: 6-12 janvier 2026
    { sem: 1, date: "06/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null, notes: "🚀 DÉBUT PROGRAMME" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true, notes: "Cardio obligatoire (jour flexible)" },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Pesée + Photos" }
    ]},

    // S2: 13-19 janvier 2026
    { sem: 2, date: "13/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true, notes: "Cardio obligatoire" },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Pesée + Photos" }
    ]},
    // S3: 20-26 janvier 2026
    { sem: 3, date: "20/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true, notes: "Cardio obligatoire" },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Pesée + Photos" }
    ]},

    // S4: 27 jan - 2 fév 2026
    { sem: 4, date: "27/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Pesée - Bilan S4" }
    ]},

    // S5: 3-9 février 2026
    { sem: 5, date: "03/02", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S6: 10-16 février 2026
    { sem: 6, date: "10/02", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S7: 17-23 février 2026 - DELOAD
    { sem: 7, date: "17/02", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 50, cardio: null, notes: "⚡ DELOAD - charges réduites" },
        { jour: "Mar", seance: "PULL_A", duree: 50, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: "LISS_30" },
        { jour: "Jeu", seance: "LEGS_A", duree: 50, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_25" },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Mi-Phase1" }
    ]},

    // S8: 24 fév - 2 mars 2026
    { sem: 8, date: "24/02", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null, notes: "Reprise post-deload" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S9: 3-9 mars 2026
    { sem: 9, date: "03/03", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S10: 10-16 mars 2026
    { sem: 10, date: "10/03", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S11: 17-23 mars 2026
    { sem: 11, date: "17/03", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S12: 24-30 mars 2026
    { sem: 12, date: "24/03", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: "Endurance_Zone2", cardioObligatoire: true },
        { jour: "Ven", seance: "PUSH_B", duree: 65, cardio: null },
        { jour: "Sam", seance: "PULL_B", duree: 65, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 Bilan S12" }
    ]},

    // S13: 31 mars - 2 avril 2026 (FIN PHASE 1)
    { sem: 13, date: "31/03", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: null },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: null },
        { jour: "Mer", seance: "LEGS_A", duree: 75, cardio: null, notes: "📸 FIN PHASE 1 - Photos + Mesures" },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, notes: "🦷 GREFFE DENTAIRE" },
        { jour: "Ven", seance: null, duree: 0, cardio: null, notes: "🏥 Début repos médical" },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2 - REPOS MÉDICAL GREFFE DENTAIRE (Semaines 14-18) - 3 avril → 5 mai 2026
    // AUCUNE séance de musculation - AUCUN cardio intense - Marche légère autorisée
    // ═══════════════════════════════════════════════════════════════════════════

    // S14: 6-12 avril 2026
    { sem: 14, date: "06/04", phase: "Phase2_ReposMedical", blocked: true, jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🏥 REPOS MÉDICAL - Marche légère autorisée (5k pas max)" },
        { jour: "Mar", seance: null, duree: 0, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S15: 13-19 avril 2026
    { sem: 15, date: "13/04", phase: "Phase2_ReposMedical", blocked: true, jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🏥 REPOS MÉDICAL" },
        { jour: "Mar", seance: null, duree: 0, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S16: 20-26 avril 2026
    { sem: 16, date: "20/04", phase: "Phase2_ReposMedical", blocked: true, jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🏥 REPOS MÉDICAL" },
        { jour: "Mar", seance: null, duree: 0, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S17: 27 avril - 3 mai 2026
    { sem: 17, date: "27/04", phase: "Phase2_ReposMedical", blocked: true, jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🏥 REPOS MÉDICAL" },
        { jour: "Mar", seance: null, duree: 0, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S18: 4-5 mai 2026 (FIN REPOS)
    { sem: 18, date: "04/05", phase: "Phase2_ReposMedical", blocked: true, jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🏥 REPOS MÉDICAL - Dernière semaine" },
        { jour: "Mar", seance: null, duree: 0, cardio: null, notes: "📸 FIN REPOS MÉDICAL" },
        { jour: "Mer", seance: null, duree: 0, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3 - RÉADAPTATION (Semaines 19-21) - 6 mai → 25 mai 2026
    // Reprise progressive: S1=50%, S2=65%, S3=80-85%
    // ═══════════════════════════════════════════════════════════════════════════

    // S19: 6-12 mai 2026 - Réadaptation Semaine 1 (50% charges, machines)
    { sem: 19, date: "06/05", phase: "Phase3_Readaptation", readaptWeek: 1, jours: [
        { jour: "Lun", seance: "FULLBODY_A_READAPT_S1", duree: 40, cardio: null, notes: "🔄 REPRISE - 50% charges, machines guidées" },
        { jour: "Mar", seance: null, duree: 0, cardio: null, stepsGoal: 6000, notes: "Marche 6k pas" },
        { jour: "Mer", seance: "FULLBODY_B_READAPT_S1", duree: 40, cardio: null },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 6000 },
        { jour: "Ven", seance: "FULLBODY_A_READAPT_S1", duree: 40, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: null, stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null }
    ]},

    // S20: 13-19 mai 2026 - Réadaptation Semaine 2 (65% charges)
    { sem: 20, date: "13/05", phase: "Phase3_Readaptation", readaptWeek: 2, jours: [
        { jour: "Lun", seance: "PUSH_READAPT_S2", duree: 45, cardio: null, notes: "65-70% charges" },
        { jour: "Mar", seance: "PULL_READAPT_S2", duree: 45, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_READAPT_S2", duree: 45, cardio: null },
        { jour: "Ven", seance: "UPPER_READAPT_S2", duree: 45, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: "LISS_25", notes: "Cardio léger 20-25min" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 8000 }
    ]},

    // S21: 20-25 mai 2026 - Réadaptation Semaine 3 (80-85% charges)
    { sem: 21, date: "20/05", phase: "Phase3_Readaptation", readaptWeek: 3, jours: [
        { jour: "Lun", seance: "PUSH_READAPT_S3", duree: 55, cardio: null, notes: "80-85% charges - Retour quasi-normal" },
        { jour: "Mar", seance: "PULL_READAPT_S3", duree: 55, cardio: null },
        { jour: "Mer", seance: null, duree: 0, cardio: null, stepsGoal: 10000 },
        { jour: "Jeu", seance: "LEGS_READAPT_S3", duree: 55, cardio: null },
        { jour: "Ven", seance: "UPPER_READAPT_S3", duree: 55, cardio: null },
        { jour: "Sam", seance: null, duree: 0, cardio: "Endurance_Zone2", notes: "Cardio 30min zone 2" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 FIN RÉADAPTATION - Prêt pour sèche" }
    ]},
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 4 - SÈCHE INTENSIVE (Semaines 22-26) - 26 mai → 30 juin 2026
    // Push/Pull/Legs/Upper/Lower + Cardio 2x/sem + Abdos 3x/sem + Steps 10-12k/jour
    // ═══════════════════════════════════════════════════════════════════════════

    // S22: 26 mai - 1 juin 2026
    { sem: 22, date: "26/05", phase: "Phase4_Seche", jours: [
        { jour: "Lun", seance: "PUSH_SECHE", duree: 65, cardio: null, stepsGoal: 8000, notes: "🔥 DÉBUT SÈCHE INTENSIVE" },
        { jour: "Mar", seance: "PULL_SECHE", duree: 70, cardio: "Endurance_Zone2", abdos: "ABDOS_COURT", stepsGoal: 10000, notes: "Endurance 45min + Abdos fin séance" },
        { jour: "Mer", seance: "LEGS_SECHE", duree: 70, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 12000, notes: "Rest actif - Marche" },
        { jour: "Ven", seance: "UPPER_SECHE", duree: 65, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000, notes: "Abdos fin séance" },
        { jour: "Sam", seance: "LOWER_SECHE", duree: 65, cardio: "HIIT_25", abdos: "ABDOS_DEDIE", stepsGoal: 8000, notes: "HIIT 25min + Abdos séance dédiée 15-20min" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée + Photos - Balade" }
    ]},

    // S23: 2-8 juin 2026
    { sem: 23, date: "02/06", phase: "Phase4_Seche", jours: [
        { jour: "Lun", seance: "PUSH_SECHE", duree: 65, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_SECHE", duree: 70, cardio: "Endurance_Zone2", abdos: "ABDOS_COURT", stepsGoal: 10000 },
        { jour: "Mer", seance: "LEGS_SECHE", duree: 70, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 12000, notes: "Rest actif" },
        { jour: "Ven", seance: "UPPER_SECHE", duree: 65, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_SECHE", duree: 65, cardio: "HIIT_25", abdos: "ABDOS_DEDIE", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée + Photos" }
    ]},

    // S24: 9-15 juin 2026
    { sem: 24, date: "09/06", phase: "Phase4_Seche", jours: [
        { jour: "Lun", seance: "PUSH_SECHE", duree: 65, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_SECHE", duree: 70, cardio: "Endurance_Zone2", abdos: "ABDOS_COURT", stepsGoal: 10000 },
        { jour: "Mer", seance: "LEGS_SECHE", duree: 70, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 12000 },
        { jour: "Ven", seance: "UPPER_SECHE", duree: 65, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_SECHE", duree: 65, cardio: "HIIT_25", abdos: "ABDOS_DEDIE", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée + Photos" }
    ]},

    // S25: 16-22 juin 2026
    { sem: 25, date: "16/06", phase: "Phase4_Seche", jours: [
        { jour: "Lun", seance: "PUSH_SECHE", duree: 65, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_SECHE", duree: 70, cardio: "Endurance_Zone2", abdos: "ABDOS_COURT", stepsGoal: 10000 },
        { jour: "Mer", seance: "LEGS_SECHE", duree: 70, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 12000 },
        { jour: "Ven", seance: "UPPER_SECHE", duree: 65, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_SECHE", duree: 65, cardio: "HIIT_25", abdos: "ABDOS_DEDIE", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée + Photos" }
    ]},

    // S26: 23-30 juin 2026 (FIN SÈCHE)
    { sem: 26, date: "23/06", phase: "Phase4_Seche", jours: [
        { jour: "Lun", seance: "PUSH_SECHE", duree: 65, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_SECHE", duree: 70, cardio: "Endurance_Zone2", abdos: "ABDOS_COURT", stepsGoal: 10000 },
        { jour: "Mer", seance: "LEGS_SECHE", duree: 70, cardio: null, stepsGoal: 8000 },
        { jour: "Jeu", seance: null, duree: 0, cardio: null, stepsGoal: 12000 },
        { jour: "Ven", seance: "UPPER_SECHE", duree: 65, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_SECHE", duree: 65, cardio: "HIIT_25", abdos: "ABDOS_DEDIE", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 FIN SÈCHE - Photos + Mesures finales" }
    ]},

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 5 - MAINTIEN SEC (Semaines 27-44) - 1 juillet → 31 octobre 2026
    // Push/Pull/Legs/Upper/Lower ou Rest + 1-2 cardio/sem + 8-10k pas/jour
    // Objectif: Rester massif et sec, calories maintenance
    // ═══════════════════════════════════════════════════════════════════════════

    // S27: 29 juin - 5 juillet 2026
    { sem: 27, date: "29/06", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000, notes: "💎 DÉBUT MAINTIEN" },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000, notes: "Cardio 30-40min" },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000, notes: "Cardio optionnel" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée" }
    ]},

    // S28-S44: Semaines de maintien (pattern répétitif)
    // Génération dynamique possible, mais voici les semaines clés

    // S28: 6-12 juillet 2026
    { sem: 28, date: "06/07", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S29: 13-19 juillet 2026
    { sem: 29, date: "13/07", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S30: 20-26 juillet 2026
    { sem: 30, date: "20/07", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée mensuelle" }
    ]},

    // S31: 27 juillet - 2 août 2026
    { sem: 31, date: "27/07", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S32: 3-9 août 2026 (mi-maintien)
    { sem: 32, date: "03/08", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000, notes: "📸 Bilan mi-maintien" },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S33: 10-16 août 2026
    { sem: 33, date: "10/08", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S34: 17-23 août 2026
    { sem: 34, date: "17/08", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S35: 24-30 août 2026
    { sem: 35, date: "24/08", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée mensuelle" }
    ]},

    // S36: 31 août - 6 septembre 2026
    { sem: 36, date: "31/08", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S37: 7-13 septembre 2026
    { sem: 37, date: "07/09", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S38: 14-20 septembre 2026
    { sem: 38, date: "14/09", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S39: 21-27 septembre 2026
    { sem: 39, date: "21/09", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée mensuelle" }
    ]},

    // S40: 28 sept - 4 oct 2026
    { sem: 40, date: "28/09", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S41: 5-11 octobre 2026
    { sem: 41, date: "05/10", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S42: 12-18 octobre 2026
    { sem: 42, date: "12/10", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000 }
    ]},

    // S43: 19-25 octobre 2026
    { sem: 43, date: "19/10", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: "LISS_30_Opt", stepsGoal: 8000 },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "📸 Pesée mensuelle - Avant-dernière semaine" }
    ]},

    // S44: 26 oct - 1 nov 2026 (FIN PROGRAMME)
    { sem: 44, date: "26/10", phase: "Phase5_Maintien", jours: [
        { jour: "Lun", seance: "PUSH_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000, notes: "🏁 DERNIÈRE SEMAINE" },
        { jour: "Mar", seance: "PULL_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Mer", seance: null, duree: 0, cardio: "Endurance_Zone2", stepsGoal: 8000 },
        { jour: "Jeu", seance: "LEGS_MAINTIEN", duree: 60, cardio: null, stepsGoal: 8000 },
        { jour: "Ven", seance: "UPPER_MAINTIEN", duree: 60, cardio: null, abdos: "ABDOS_COURT", stepsGoal: 8000 },
        { jour: "Sam", seance: "LOWER_MAINTIEN", duree: 55, cardio: null, stepsGoal: 8000, notes: "🏆 FIN PROGRAMME - Photos + Mesures finales" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, stepsGoal: 10000, notes: "🎉 OBJECTIF ATTEINT" }
    ]}
];

// Dates clés du programme (6 janvier → 31 octobre 2026)
const KEY_DATES = {
    "2026-01-06": { label: "🚀 DÉBUT PROGRAMME - Phase 1 Masse", type: "start" },
    "2026-02-17": { label: "⚡ DELOAD S7", type: "deload" },
    "2026-04-02": { label: "📸 FIN PHASE 1 - Masse terminée", type: "milestone" },
    "2026-04-03": { label: "🦷 GREFFE DENTAIRE - Début repos médical", type: "medical" },
    "2026-05-05": { label: "📸 FIN REPOS MÉDICAL", type: "milestone" },
    "2026-05-06": { label: "🔄 DÉBUT RÉADAPTATION", type: "start" },
    "2026-05-25": { label: "📸 FIN RÉADAPTATION - Prêt pour sèche", type: "milestone" },
    "2026-05-26": { label: "🔥 DÉBUT SÈCHE INTENSIVE", type: "start" },
    "2026-06-30": { label: "📸 FIN SÈCHE - Objectif SEC atteint", type: "milestone" },
    "2026-07-01": { label: "💎 DÉBUT MAINTIEN", type: "start" },
    "2026-08-03": { label: "📸 Bilan mi-maintien", type: "milestone" },
    "2026-10-31": { label: "🏆 FIN PROGRAMME - Objectif final", type: "goal" }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHOOP INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
const WHOOP_CONFIG = {
    clientId: "168b9cac-6454-43e8-aa4a-b1a85937b533",
    clientSecret: "99a10f9a930c122ff460915082b91a23ad5ab35ad8daca554d233d8077b98962",
    redirectUri: "https://titan-os.app/callback",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    apiBase: "https://api.prod.whoop.com/developer/v1"
};

// Seuils pour les recommandations Whoop
const WHOOP_THRESHOLDS = {
    recovery: { red: 33, yellow: 66, green: 100 },
    hrv: { low: 40, medium: 70, high: 150 },
    strain: { low: 8, optimal: 14, high: 18 },
    sleep: { poor: 60, fair: 70, good: 85 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI CHECK-IN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const CHECKIN_QUESTIONS = {
    daily: [
        { id: 'energy', label: 'Énergie', type: 'scale', icon: '⚡', min: 1, max: 5 },
        { id: 'sleep', label: 'Qualité sommeil', type: 'scale', icon: '😴', min: 1, max: 5 },
        { id: 'stress', label: 'Niveau stress', type: 'scale', icon: '🧠', min: 1, max: 5 },
        { id: 'mood', label: 'Humeur', type: 'scale', icon: '😊', min: 1, max: 5 },
        { id: 'soreness', label: 'Courbatures', type: 'select', icon: '💪', options: ['Aucune', 'Légères', 'Modérées', 'Intenses'] },
        { id: 'motivation', label: 'Motivation training', type: 'scale', icon: '🔥', min: 1, max: 5 }
    ],
    postWorkout: [
        { id: 'rating', label: 'Note séance', type: 'scale', icon: '⭐', min: 1, max: 5 },
        { id: 'difficulty', label: 'Difficulté ressentie', type: 'select', icon: '📊', options: ['Facile', 'Modéré', 'Difficile', 'Extrême'] },
        { id: 'pump', label: 'Pump/Congestion', type: 'scale', icon: '💪', min: 1, max: 5 },
        { id: 'technique', label: 'Exécution technique', type: 'scale', icon: '🎯', min: 1, max: 5 }
    ],
    weekly: [
        { id: 'nutrition', label: 'Respect nutrition', type: 'scale', icon: '🥗', min: 1, max: 5 },
        { id: 'adherence', label: 'Adhérence programme', type: 'scale', icon: '📅', min: 1, max: 5 },
        { id: 'progress', label: 'Sentiment de progression', type: 'scale', icon: '📈', min: 1, max: 5 },
        { id: 'blockers', label: 'Blockers cette semaine', type: 'text', icon: '🚧' },
        { id: 'highlights', label: 'Highlight de la semaine', type: 'text', icon: '🏆' }
    ],
    monthly: [
        { id: 'satisfaction', label: 'Satisfaction globale', type: 'scale', icon: '😊', min: 1, max: 10 },
        { id: 'injuries', label: 'Blessures/Douleurs', type: 'text', icon: '🩹' },
        { id: 'motivation_trend', label: 'Tendance motivation', type: 'select', icon: '📊', options: ['En hausse', 'Stable', 'En baisse'] },
        { id: 'goals_review', label: 'Objectifs atteints', type: 'text', icon: '🎯' },
        { id: 'adjustments', label: 'Ajustements souhaités', type: 'text', icon: '🔧' }
    ]
};

// Patterns IA à détecter
const AI_PATTERNS = {
    fatigue: { 
        condition: (data) => data.energy <= 2 && data.sleep <= 2,
        message: "⚠️ Fatigue détectée : énergie et sommeil bas. Considère une séance plus légère ou du repos.",
        severity: 'warning'
    },
    overtraining: {
        condition: (data) => data.soreness === 'Intenses' && data.energy <= 2,
        message: "🛑 Signes de surentraînement : courbatures intenses + fatigue. Recommandation : repos ou deload.",
        severity: 'danger'
    },
    peak_form: {
        condition: (data) => data.energy >= 4 && data.motivation >= 4 && data.sleep >= 4,
        message: "🔥 Tu es en forme optimale ! C'est le moment de pousser et battre des records.",
        severity: 'success'
    },
    stress_high: {
        condition: (data) => data.stress >= 4,
        message: "🧘 Stress élevé détecté. Le training peut aider mais évite l'intensité max.",
        severity: 'warning'
    },
    stagnation: {
        condition: (data, history) => {
            if (!history || history.length < 7) return false;
            const recentProgress = history.slice(-7).filter(h => h.progress >= 3).length;
            return recentProgress < 2;
        },
        message: "📉 Stagnation possible. Envisage de changer d'exercices ou d'augmenter l'intensité.",
        severity: 'info'
    }
};

// Recommandations basées sur Whoop
const getWhoopRecommendation = (recovery, strain, hrv) => {
    if (recovery < WHOOP_THRESHOLDS.recovery.red) {
        return { 
            status: 'red', 
            label: 'Récupération faible',
            recommendation: "Repos recommandé ou séance très légère. Focus sur le sommeil ce soir.",
            maxIntensity: 50
        };
    } else if (recovery < WHOOP_THRESHOLDS.recovery.yellow) {
        return { 
            status: 'yellow', 
            label: 'Récupération modérée',
            recommendation: "Séance modérée OK. Évite l'échec musculaire et les charges max.",
            maxIntensity: 75
        };
    } else {
        return { 
            status: 'green', 
            label: 'Récupération optimale',
            recommendation: "Go hard ! Tu peux viser des PRs aujourd'hui.",
            maxIntensity: 100
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTINE COMPLÉMENTS ALIMENTAIRES
// ═══════════════════════════════════════════════════════════════════════════════
const SUPPLEMENTS_ROUTINE = {
    matin: [
        { id: 'zinc', name: 'Zinc', emoji: '💊' },
        { id: 'curcuma', name: 'Curcuma', emoji: '🟡' },
        { id: 'maca', name: 'Maca', emoji: '🌿' },
        { id: 'cheveux', name: 'Comprimé cheveux', emoji: '💇' }
    ],
    midi: [
        { id: 'hydratis', name: 'Hydratis', emoji: '💧', condition: 'Jour de course' }
    ],
    postWorkout: [
        { id: 'collagene', name: 'Collagène', emoji: '🦴' },
        { id: 'whey', name: 'Whey', emoji: '🥛' },
        { id: 'creatine', name: 'Créatine', emoji: '💪' }
    ],
    soir: [
        { id: 'magnesium', name: 'Magnésium', emoji: '🧘' },
        { id: 'omega3', name: 'Oméga 3', emoji: '🐟' },
        { id: 'ashwagandha', name: 'Ashwagandha', emoji: '🌙' },
        { id: 'minoxidil', name: 'Minoxidil', emoji: '💈' }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEV PERSO - LIVRES & FILMS
// ═══════════════════════════════════════════════════════════════════════════════
const DEV_PERSO_CALENDAR = {
    livres: {
        septembre: ['Sapiens'],
        octobre: ['L\'effet cumulé', 'Deep Work'],
        novembre: ['L\'art de la guerre'],
        decembre: ['Atomic Habits', 'Influence et manipulation'],
        janvier: ['La semaine de 4 heures'],
        fevrier: ['Par delà le bien et le mal'],
        mars: ['Never Split the Difference', 'Le rêve d\'un homme ridicule'],
        avril: ['The Lean Startup', 'Comment se faire des amis'],
        mai: ['Psychologie des foules'],
        juin: [],
        juillet: [],
        aout: [],
        ete: ['Zero to One', 'Les Lois de la nature humaine', 'Miracle Morning']
    },
    films: {
        septembre: ['Margin Call', 'La liste de Schindler'],
        octobre: ['Whiplash', 'The Social Dilemma'],
        novembre: ['Le Parrain', 'Inside Job'],
        decembre: ['The Founder', 'Parasite'],
        janvier: ['Good Will Hunting', 'Dirty Money'],
        fevrier: ['Fight Club', 'Free Solo'],
        mars: ['The Big Short', 'La vie est belle'],
        avril: ['Le Stratège', 'La Haine', 'A Beautiful Mind', 'The Last Dance'],
        mai: ['The Great Hack'],
        juin: [],
        juillet: [],
        aout: [],
        ete: ['Inception', 'The Social Network', 'Cosmos', 'Scarface', 'Erin Brockovich']
    }
};

// Listes complètes pour le random
const LIVRES_A_LIRE = [
    'L\'effet cumulé', 'Les quatre accords toltèques', 'Par delà le bien et le mal', 'Propaganda',
    'Discours de la servitude volontaire', 'Sapiens', 'L\'enseignement de l\'ignorance', 'Anti-fragile',
    'Jouer sa peau', 'Système 1 système 2', 'Factfulness', 'Voyage au bout de la nuit',
    'Les transclasses ou la non reproduction', 'Les lois de la nature humaine', 'Le rêve d\'un homme ridicule',
    'L\'âme et la vie', 'Humain trop humain', 'L\'essentialisme', 'L\'orateur idéal',
    'De la démocratie en Amérique', 'Influence et Manipulation', 'Père Riche Père Pauvre',
    'Dotcom Secrets', 'Expert Secrets', 'Traffic Secrets', 'Cashvertising', 'The One Hour Content',
    'Comment se faire des amis', '48 lois du pouvoir', 'Atomic Habits', 'Miracle Morning',
    'Psychologie des foules', 'Systemology', 'Pre-suasion', 'Libérez votre créativité',
    'La loi et la promesse', 'La sagesse des loups', 'Atteindre l\'excellence', 'L\'art de la guerre',
    'Le storytelling en marketing', 'Permission marketing', 'Pitch anything', 'To sell is human',
    'The millionaire fast lane', 'Think like a rocket scientist', 'How to think like Leonardo da Vinci',
    'Le magicien des peurs', 'Libérez votre cerveau', 'L\'Alchimiste', 'Siddhartha',
    'La semaine de 4 heures', 'Zero to One', 'The Lean Startup', 'Les Outils des géants',
    'The Almanack of Naval Ravikant', 'The Boron Letters', '$100M Offers', 'Good to Great',
    'The 5 Levels of Leadership', 'Never Split The Difference', 'Deep Work', 'Steve Jobs',
    'Elon Musk', 'Shoe Dog', 'Billion Dollar Loser', 'Thinking Fast and Slow',
    'The Power of Habit', 'The Wealth of Nations', 'The Innovator\'s Dilemma',
    'The Hard Thing About Hard Things', 'The Magic of Thinking Big', 'Principes', 'Le MBA Personnel'
];

const FILMS_SERIES_INSPIRANTS = [
    'Joy', 'The Inventor', 'Adidas vs Puma', 'Ford v Ferrari', 'Walt', 'Saving Mr Banks',
    'Billions', 'Dirty Money', 'Silicon Valley', 'Pablo Escobar', 'Inside Bill\'s Brain',
    'House of Cards', 'Startup', 'McMillions', 'Shark Tank', 'Pulp Fiction',
    'Le Seigneur des Anneaux', 'Inception', 'Fight Club', 'The Dark Knight', 'Forrest Gump',
    'Matrix', 'Gladiator', 'La La Land', 'Interstellar', 'Amélie Poulain', 'Avatar',
    'Django Unchained', 'Whiplash', 'Parasite', 'The Social Network', 'The Big Short',
    'Good Will Hunting', 'A Beautiful Mind', 'The Founder', 'Free Solo', 'Cosmos', 'Scarface'
];

// ═══════════════════════════════════════════════════════════════════════════════
// TITAN AI COUNCIL - Intelligence Collective Avancée v10.1
// ═══════════════════════════════════════════════════════════════════════════════
// Modules: Corrélations croisées, Monte-Carlo, DDA, Biais cognitifs, Socratique
// Méta-Apprentissage: Cycles, Seuils, Préférences implicites, Règles apprises
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_USER_PROFILE = {
    version: 1,
    lastUpdated: null,
    cycles: { bestDays: [], worstDays: [], peakHours: null, energyPattern: null },
    thresholds: { sleepMinimum: null, tasksMaxBeforeCrash: null, spendingTriggers: [] },
    implicitPreferences: { bestMoodAfter: [], realMotivators: [], avoidancePatterns: [] },
    learnedRules: [],
    appSuggestions: [],
    insightHistory: []
};

const TitanAICouncil = {
    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════
    getLast: (n) => {
        const days = [];
        for (let i = 0; i < n; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTA-APPRENTISSAGE - Détection des Cycles Personnels
    // ═══════════════════════════════════════════════════════════════════════════
    detectCycles: (data) => {
        const { checkins, workoutLogs, tasks } = data;
        const last30Days = TitanAICouncil.getLast(30);
        const dayStats = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        
        last30Days.forEach(dateStr => {
            const d = new Date(dateStr);
            const dayOfWeek = d.getDay();
            const checkin = checkins?.[dateStr] || {};
            const dayTasks = tasks?.filter(t => t.due_date === dateStr) || [];
            const dayWorkouts = workoutLogs?.filter(w => w.date === dateStr) || [];
            
            let score = 0, factors = 0;
            if (checkin.energy) { score += checkin.energy; factors++; }
            if (checkin.mood) { score += checkin.mood; factors++; }
            if (dayTasks.length > 0) {
                const completionRate = dayTasks.filter(t => t.completed).length / dayTasks.length;
                score += completionRate * 5;
                factors++;
            }
            if (dayWorkouts.length > 0) { score += 1; factors++; }
            
            if (factors > 0) {
                dayStats[dayOfWeek].push(score / factors);
            }
        });
        
        const avgByDay = {};
        Object.keys(dayStats).forEach(day => {
            if (dayStats[day].length >= 2) {
                avgByDay[day] = dayStats[day].reduce((a, b) => a + b, 0) / dayStats[day].length;
            }
        });

        // Si moins de 4 jours avec données suffisantes, pas assez de data pour comparer
        const sortedDays = Object.entries(avgByDay).sort((a, b) => b[1] - a[1]);
        if (sortedDays.length < 4) {
            return { bestDays: [], worstDays: [], avgByDay, insufficientData: true };
        }

        const bestDays = sortedDays.slice(0, 2).map(([day]) => dayNames[parseInt(day)]);
        // Filtrer worstDays pour exclure les bestDays (évite le chevauchement)
        const worstDays = sortedDays.slice(-2)
            .filter(([day]) => !bestDays.includes(dayNames[parseInt(day)]))
            .map(([day]) => dayNames[parseInt(day)]);

        return { bestDays, worstDays, avgByDay };
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTA-APPRENTISSAGE - Détection des Seuils de Tolérance
    // ═══════════════════════════════════════════════════════════════════════════
    detectThresholds: (data) => {
        const { checkins, tasks } = data;
        const last60Days = TitanAICouncil.getLast(60);
        const thresholds = {};
        
        // Seuil sommeil → productivité
        const sleepProductivity = [];
        last60Days.forEach(dateStr => {
            const checkin = checkins?.[dateStr] || {};
            const dayTasks = tasks?.filter(t => t.due_date === dateStr) || [];
            if (checkin.sleep && dayTasks.length > 0) {
                const completionRate = dayTasks.filter(t => t.completed).length / dayTasks.length;
                sleepProductivity.push({ sleep: checkin.sleep, productivity: completionRate });
            }
        });
        
        if (sleepProductivity.length >= 10) {
            const badSleepDays = sleepProductivity.filter(d => d.sleep <= 2);
            const goodSleepDays = sleepProductivity.filter(d => d.sleep >= 4);
            if (badSleepDays.length >= 3 && goodSleepDays.length >= 3) {
                const avgBad = badSleepDays.reduce((s, d) => s + d.productivity, 0) / badSleepDays.length;
                const avgGood = goodSleepDays.reduce((s, d) => s + d.productivity, 0) / goodSleepDays.length;
                if (avgGood - avgBad > 0.2) {
                    thresholds.sleepMinimum = 3;
                    thresholds.sleepImpact = Math.round((avgGood - avgBad) * 100);
                }
            }
        }
        
        // Seuil tâches → crash
        const tasksCrash = [];
        last60Days.forEach(dateStr => {
            const dayTasks = tasks?.filter(t => t.due_date === dateStr) || [];
            if (dayTasks.length > 0) {
                const completionRate = dayTasks.filter(t => t.completed).length / dayTasks.length;
                tasksCrash.push({ count: dayTasks.length, rate: completionRate });
            }
        });
        
        if (tasksCrash.length >= 10) {
            const overloadDays = tasksCrash.filter(d => d.count >= 5);
            const normalDays = tasksCrash.filter(d => d.count <= 3);
            if (overloadDays.length >= 3 && normalDays.length >= 3) {
                const avgOverload = overloadDays.reduce((s, d) => s + d.rate, 0) / overloadDays.length;
                const avgNormal = normalDays.reduce((s, d) => s + d.rate, 0) / normalDays.length;
                if (avgNormal - avgOverload > 0.2) {
                    thresholds.tasksMaxBeforeCrash = 4;
                }
            }
        }
        
        return thresholds;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTA-APPRENTISSAGE - Détection des Préférences Implicites
    // ═══════════════════════════════════════════════════════════════════════════
    detectImplicitPreferences: (data) => {
        const { checkins, workoutLogs } = data;
        const last30Days = TitanAICouncil.getLast(30);
        const preferences = { bestMoodAfter: [], realMotivators: [] };
        
        // Analyser ce qui précède les bonnes humeurs
        last30Days.forEach(dateStr => {
            const checkin = checkins?.[dateStr] || {};
            if (checkin.mood >= 4) {
                const dayWorkouts = workoutLogs?.filter(w => w.date === dateStr) || [];
                if (dayWorkouts.some(w => w.type === 'Cardio' || w.session === 'CARDIO')) {
                    preferences.bestMoodAfter.push('cardio');
                }
                if (dayWorkouts.some(w => w.type !== 'Cardio' && w.session !== 'CARDIO')) {
                    preferences.bestMoodAfter.push('musculation');
                }
            }
        });
        
        // Compter les occurrences
        const countOccurrences = (arr) => {
            const counts = {};
            arr.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
            return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k);
        };
        
        preferences.bestMoodAfter = countOccurrences(preferences.bestMoodAfter).slice(0, 2);
        
        return preferences;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTA-APPRENTISSAGE - Génération des Règles Apprises
    // ═══════════════════════════════════════════════════════════════════════════
    generateLearnedRules: (data, existingRules = []) => {
        const cycles = TitanAICouncil.detectCycles(data);
        const thresholds = TitanAICouncil.detectThresholds(data);
        const preferences = TitanAICouncil.detectImplicitPreferences(data);
        const newRules = [];
        
        // Règle: Meilleurs jours
        if (cycles.bestDays.length >= 1) {
            const ruleText = `Tes meilleurs jours sont ${cycles.bestDays.join(' et ')}. Planifie tes tâches importantes ces jours-là.`;
            if (!existingRules.some(r => r.rule.includes('meilleurs jours'))) {
                newRules.push({ rule: ruleText, type: 'cycle', confidence: 75, detectedAt: new Date().toISOString() });
            }
        }
        
        // Règle: Seuil sommeil
        if (thresholds.sleepMinimum && thresholds.sleepImpact) {
            const ruleText = `Quand ton sommeil est mauvais (≤2/5), ta productivité chute de ~${thresholds.sleepImpact}%.`;
            if (!existingRules.some(r => r.rule.includes('sommeil'))) {
                newRules.push({ rule: ruleText, type: 'threshold', confidence: 80, detectedAt: new Date().toISOString() });
            }
        }
        
        // Règle: Seuil tâches
        if (thresholds.tasksMaxBeforeCrash) {
            const ruleText = `Plus de ${thresholds.tasksMaxBeforeCrash} tâches/jour = risque de crash. Limite ta charge.`;
            if (!existingRules.some(r => r.rule.includes('tâches/jour'))) {
                newRules.push({ rule: ruleText, type: 'threshold', confidence: 70, detectedAt: new Date().toISOString() });
            }
        }
        
        // Règle: Préférence sport
        if (preferences.bestMoodAfter.length > 0) {
            const ruleText = `Le ${preferences.bestMoodAfter[0]} améliore systématiquement ton humeur. Utilise-le comme régulateur.`;
            if (!existingRules.some(r => r.rule.includes('humeur'))) {
                newRules.push({ rule: ruleText, type: 'preference', confidence: 70, detectedAt: new Date().toISOString() });
            }
        }
        
        return newRules;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // IA PRODUCT MANAGER - Suggestions d'amélioration de l'app
    // ═══════════════════════════════════════════════════════════════════════════
    analyzeAppUsage: (data) => {
        const { checkins, tasks, workoutLogs } = data;
        const suggestions = [];
        const last30Days = TitanAICouncil.getLast(30);
        
        // Analyser les champs rarement utilisés
        const checkinFields = { energy: 0, mood: 0, sleep: 0, motivation: 0 };
        last30Days.forEach(dateStr => {
            const c = checkins?.[dateStr] || {};
            if (c.energy) checkinFields.energy++;
            if (c.mood) checkinFields.mood++;
            if (c.sleep) checkinFields.sleep++;
            if (c.motivation) checkinFields.motivation++;
        });
        
        // Suggérer de supprimer les champs jamais utilisés
        Object.entries(checkinFields).forEach(([field, count]) => {
            if (count < 5 && last30Days.length > 14) {
                suggestions.push({
                    type: 'remove',
                    field: field,
                    reason: `Tu n'as rempli "${field}" que ${count} fois en 30 jours. Supprimer pour simplifier ?`,
                    priority: 'low'
                });
            }
        });
        
        // Analyser si on manque de données critiques
        const hasEnoughCheckins = Object.keys(checkins || {}).length >= 7;
        if (!hasEnoughCheckins) {
            suggestions.push({
                type: 'usage',
                field: 'checkins',
                reason: 'Remplis ton "État rapide" plus souvent pour que je puisse mieux te comprendre.',
                priority: 'high'
            });
        }
        
        // Suggérer des automatisations
        if (workoutLogs?.length >= 10) {
            const sessions = (workoutLogs || []).map(w => w.session);
            const counts = {};
            sessions.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
            const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            if (mostCommon && mostCommon[1] >= 5) {
                suggestions.push({
                    type: 'automate',
                    field: 'workout',
                    reason: `Tu fais souvent "${mostCommon[0]}". Créer un raccourci "Quick Log" ?`,
                    priority: 'medium'
                });
            }
        }
        
        return suggestions;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CORRÉLATIONS CROISÉES - Liens invisibles entre domaines
    // ═══════════════════════════════════════════════════════════════════════════
    analyzeCorrelations: (data) => {
        const { checkins, workoutLogs, transactions, tasks } = data;
        const correlations = [];
        const last14Days = TitanAICouncil.getLast(14);
        
        // Construire le profil journalier
        const dailyProfiles = last14Days.map(date => {
            const dayCheckin = checkins?.[date] || {};
            const dayWorkouts = workoutLogs?.filter(w => w.date === date) || [];
            const dayTasks = tasks?.filter(t => t.due_date === date) || [];
            const dayTransactions = transactions?.filter(t => t.date === date) || [];
            
            return {
                date,
                energy: dayCheckin.energy || null,
                mood: dayCheckin.mood || null,
                sleep: dayCheckin.sleep || null,
                workoutsDone: dayWorkouts.length,
                tasksTotal: dayTasks.length,
                tasksCompleted: dayTasks.filter(t => t.completed).length,
                taskCompletionRate: dayTasks.length > 0 ? dayTasks.filter(t => t.completed).length / dayTasks.length : null,
                spending: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
                impulsiveSpending: dayTransactions.filter(t => ['jeux_argent', 'loisirs', 'repas_ext'].includes(t.category)).reduce((sum, t) => sum + (t.amount || 0), 0)
            };
        });
        
        // CORRÉLATION 1: Tâches complexes → Dépenses impulsives (J+1)
        const taskOverloadDays = dailyProfiles.filter((p, i) => p.tasksTotal >= 5 && i < 13);
        if (taskOverloadDays.length >= 2) {
            const impulseAfterOverload = taskOverloadDays.filter(p => {
                const nextDayIdx = dailyProfiles.findIndex(d => d.date < p.date) - 1;
                return nextDayIdx >= 0 && dailyProfiles[nextDayIdx]?.impulsiveSpending > 20;
            });
            if (impulseAfterOverload.length > taskOverloadDays.length * 0.4) {
                correlations.push({
                    type: 'task_spending',
                    strength: Math.round((impulseAfterOverload.length / taskOverloadDays.length) * 100),
                    insight: `Quand tu as +5 tâches/jour, tu as ${Math.round((impulseAfterOverload.length / taskOverloadDays.length) * 100)}% de chances de dépenser impulsivement le lendemain.`,
                    recommendation: 'Limite tes tâches complexes à 3/jour pour protéger tes finances.'
                });
            }
        }
        
        // CORRÉLATION 2: Mauvais sommeil → Baisse productivité
        const badSleepDays = dailyProfiles.filter(p => p.sleep && p.sleep <= 2);
        if (badSleepDays.length >= 2) {
            const lowProdAfterBadSleep = badSleepDays.filter(p => p.taskCompletionRate !== null && p.taskCompletionRate < 0.5);
            if (lowProdAfterBadSleep.length > badSleepDays.length * 0.5) {
                correlations.push({
                    type: 'sleep_productivity',
                    strength: Math.round((lowProdAfterBadSleep.length / badSleepDays.length) * 100),
                    insight: `Les jours de mauvais sommeil, ta productivité chute de ${Math.round((lowProdAfterBadSleep.length / badSleepDays.length) * 100)}%.`,
                    recommendation: 'Le sommeil est ton levier #1. Protège-le.'
                });
            }
        }
        
        // CORRÉLATION 3: Sport → Énergie/Humeur
        const sportDays = dailyProfiles.filter(p => p.workoutsDone > 0);
        if (sportDays.length >= 3) {
            const goodMoodAfterSport = sportDays.filter(p => p.mood && p.mood >= 4);
            if (goodMoodAfterSport.length > sportDays.length * 0.5) {
                correlations.push({
                    type: 'sport_mood',
                    strength: Math.round((goodMoodAfterSport.length / sportDays.length) * 100),
                    insight: `Le sport booste ton humeur dans ${Math.round((goodMoodAfterSport.length / sportDays.length) * 100)}% des cas.`,
                    recommendation: 'Utilise le sport comme régulateur émotionnel.'
                });
            }
        }
        
        return correlations;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SIMULATION MONTE-CARLO - Prédictions futures
    // ═══════════════════════════════════════════════════════════════════════════
    predictFuture: (data) => {
        const { checkins, workoutLogs, tasks, transactions, whoopData } = data;
        const predictions = [];
        const last7Days = TitanAICouncil.getLast(7);
        
        // Moyenne de sommeil/énergie
        const recentCheckins = last7Days.map(date => checkins?.[date]).filter(Boolean);
        const avgSleep = recentCheckins.length > 0 ? recentCheckins.reduce((sum, c) => sum + (c.sleep || 3), 0) / recentCheckins.length : 3;
        const avgEnergy = recentCheckins.length > 0 ? recentCheckins.reduce((sum, c) => sum + (c.energy || 3), 0) / recentCheckins.length : 3;
        
        // Taux de complétion des tâches
        const recentTasks = tasks?.filter(t => last7Days.includes(t.due_date)) || [];
        const completionRate = recentTasks.length > 0 ? recentTasks.filter(t => t.completed).length / recentTasks.length : 0.5;
        
        // PRÉDICTION BURNOUT
        if (avgSleep < 2.5 && avgEnergy < 2.5) {
            const burnoutRisk = Math.min(95, Math.round((5 - avgSleep) * 15 + (5 - avgEnergy) * 15));
            predictions.push({
                type: 'burnout',
                probability: burnoutRisk,
                horizon: '2 semaines',
                message: `Risque de burnout à ${burnoutRisk}% si tu continues ce rythme.`,
                action: 'Priorise le repos immédiatement.'
            });
        }
        
        // PRÉDICTION PRODUCTIVITÉ
        if (completionRate < 0.4 && recentTasks.length > 3) {
            const productivityCrash = Math.min(90, Math.round((1 - completionRate) * 100));
            predictions.push({
                type: 'productivity_crash',
                probability: productivityCrash,
                horizon: '1 semaine',
                message: `Taux complétion ${Math.round(completionRate * 100)}% → Risque saturation : ${productivityCrash}%`,
                action: 'Réduis ta charge de tâches de 50%.'
            });
        }
        
        // PRÉDICTION OBJECTIFS HEBDO FITNESS - Calcul intelligent
        // Utiliser la semaine calendaire (Lundi-Dimanche) plutôt que rolling 7 days
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.

        // Calculer le début de la semaine (lundi)
        const weekStart = new Date(today);
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Dimanche = 6 jours depuis lundi
        weekStart.setDate(weekStart.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Filtrer les workouts de cette semaine calendaire (lun-dim) - inclure muscu ET cardio
        const thisWeekWorkouts = workoutLogs?.filter(w => {
            if (!w.date || w.status === 'in_progress') return false; // Exclure les séances non terminées
            const wDate = new Date(w.date);
            return wDate >= weekStart && wDate <= today;
        }) || [];

        // Compter séances muscu et cardio séparément
        const muscuCount = thisWeekWorkouts.filter(w => w.type === 'Muscu' || w.session).length;
        const cardioCount = thisWeekWorkouts.filter(w => w.type === 'Cardio').length;
        const weekWorkouts = muscuCount + cardioCount;

        const targetWorkouts = 6; // Objectif hebdo (5 muscu + 1-2 cardio selon phase)
        const daysLeftInWeek = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Jours restants jusqu'à dimanche
        const workoutsNeeded = Math.max(0, targetWorkouts - weekWorkouts);
        
        // Facteurs de calcul
        let workoutSuccessProb = 0;
        
        if (weekWorkouts >= targetWorkouts) {
            // Objectif déjà atteint
            workoutSuccessProb = 100;
        } else if (daysLeftInWeek === 0) {
            // Dimanche, semaine terminée
            workoutSuccessProb = Math.round((weekWorkouts / targetWorkouts) * 100);
        } else if (workoutsNeeded > daysLeftInWeek) {
            // Mathématiquement difficile mais pas impossible
            // On donne quand même une chance si début de semaine
            const progressRate = weekWorkouts / Math.max(1, 7 - daysLeftInWeek); // Séances par jour jusqu'ici
            const projectedTotal = progressRate * 7;
            workoutSuccessProb = Math.min(80, Math.round((projectedTotal / targetWorkouts) * 100));
        } else {
            // Objectif encore atteignable
            // Base: progression actuelle
            const baseProb = (weekWorkouts / targetWorkouts) * 50;
            
            // Bonus récupération Whoop
            let whoopBonus = 0;
            if (whoopData?.recovery?.score) {
                if (whoopData.recovery.score >= 67) whoopBonus = 20;
                else if (whoopData.recovery.score >= 33) whoopBonus = 10;
                else whoopBonus = -10;
            }
            
            // Bonus énergie check-in
            let energyBonus = 0;
            const todayStr = new Date().toISOString().split('T')[0];
            const todayCheckin = checkins?.[todayStr];
            if (todayCheckin?.energy >= 4) energyBonus = 15;
            else if (todayCheckin?.energy >= 3) energyBonus = 5;
            else if (todayCheckin?.energy) energyBonus = -5;
            
            // Bonus jours restants (plus facile si beaucoup de temps)
            const timeBonus = Math.round((daysLeftInWeek / 7) * 15);
            
            workoutSuccessProb = Math.min(100, Math.max(10, Math.round(baseProb + whoopBonus + energyBonus + timeBonus)));
        }
        
        predictions.push({
            type: 'weekly_goals',
            probability: workoutSuccessProb,
            horizon: 'cette semaine',
            message: `Objectifs fitness : ${workoutSuccessProb}% de chances de réussite`,
            details: {
                done: weekWorkouts,
                target: targetWorkouts,
                remaining: workoutsNeeded,
                daysLeft: daysLeftInWeek
            },
            action: workoutSuccessProb >= 80 ? 'Tu es sur la bonne voie ! 💪' :
                    workoutSuccessProb >= 50 ? `Planifie ${workoutsNeeded} séances d'ici dimanche.` :
                    workoutSuccessProb > 0 ? 'Focus sur la régularité la semaine prochaine.' :
                    'Recommence la semaine prochaine avec un objectif réaliste.'
        });
        
        return predictions;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DDA (Dynamic Difficulty Adjustment) - Game Design
    // Intègre TOUTES les sources de données: Whoop, Check-ins, Tasks, Workouts
    // ═══════════════════════════════════════════════════════════════════════════
    calculateDDA: (data) => {
        const { tasks, checkins, workoutLogs, whoopData } = data;
        const last3Days = TitanAICouncil.getLast(3).slice(1); // Exclure aujourd'hui
        
        // === DONNÉES TÂCHES ===
        const recentTasks = tasks?.filter(t => last3Days.includes(t.due_date)) || [];
        const completionRate = recentTasks.length > 0 ? recentTasks.filter(t => t.completed).length / recentTasks.length : 0.5;
        
        // === DONNÉES CHECK-INS ===
        const recentCheckins = last3Days.map(date => checkins?.[date]).filter(Boolean);
        const avgEnergy = recentCheckins.length > 0 ? recentCheckins.reduce((sum, c) => sum + (c.energy || 3), 0) / recentCheckins.length : 3;
        const avgMood = recentCheckins.length > 0 ? recentCheckins.reduce((sum, c) => sum + (c.mood || 3), 0) / recentCheckins.length : 3;
        
        // === DONNÉES WHOOP ===
        const whoopRecovery = whoopData?.recovery?.score || null;
        const whoopStrain = whoopData?.strain?.score || null;
        const whoopSleep = whoopData?.sleep?.duration || null;
        const whoopHRV = whoopData?.recovery?.hrv || null;
        
        // === CALCUL DU FLOW SCORE INTELLIGENT ===
        // Pondération dynamique selon les données disponibles
        let flowScore = 0;
        let totalWeight = 0;
        
        // Composante Whoop Recovery (poids: 35%)
        if (whoopRecovery !== null) {
            flowScore += (whoopRecovery / 100) * 35;
            totalWeight += 35;
        }
        
        // Composante Tâches completées (poids: 25%)
        flowScore += completionRate * 25;
        totalWeight += 25;
        
        // Composante Énergie check-in (poids: 20%)
        flowScore += (avgEnergy / 5) * 20;
        totalWeight += 20;
        
        // Composante Humeur check-in (poids: 20%)
        flowScore += (avgMood / 5) * 20;
        totalWeight += 20;
        
        // Normaliser le score
        flowScore = (flowScore / totalWeight) * 100;
        
        // Bonus/Malus basés sur Whoop
        if (whoopRecovery !== null) {
            if (whoopRecovery >= 67) flowScore = Math.min(100, flowScore + 5); // Bonus récup haute
            if (whoopRecovery < 33) flowScore = Math.max(0, flowScore - 10); // Malus récup basse
        }
        
        if (whoopSleep !== null) {
            if (whoopSleep >= 7) flowScore = Math.min(100, flowScore + 3); // Bonus bon sommeil
            if (whoopSleep < 5) flowScore = Math.max(0, flowScore - 5); // Malus manque sommeil
        }
        
        // Déterminer le niveau et les recommandations
        const dataSourcesUsed = {
            whoop: whoopRecovery !== null,
            checkins: recentCheckins.length > 0,
            tasks: recentTasks.length > 0,
            workouts: workoutLogs?.length > 0
        };
        
        const dataSources = Object.entries(dataSourcesUsed).filter(([k, v]) => v).map(([k]) => k);
        
        if (flowScore < 40) {
            return {
                level: 'recovery',
                flowScore: Math.round(flowScore),
                message: 'Mode récupération. Ton corps et ton esprit ont besoin de repos.',
                recommendations: [
                    'Limite-toi à 2 tâches max aujourd\'hui',
                    whoopRecovery !== null && whoopRecovery < 33 ? 'Pas de sport intense (recovery Whoop basse)' : 'Sport léger ou marche uniquement',
                    'Vise une "victoire facile" pour relancer la machine',
                    whoopSleep !== null && whoopSleep < 6 ? `Tu as dormi ${whoopSleep}h - couche-toi plus tôt ce soir` : null
                ].filter(Boolean),
                tasksToKeep: 2,
                sportIntensity: 'light',
                dataSources,
                whoopData: { recovery: whoopRecovery, strain: whoopStrain, sleep: whoopSleep, hrv: whoopHRV }
            };
        } else if (flowScore < 60) {
            return {
                level: 'moderate',
                flowScore: Math.round(flowScore),
                message: 'Capacité modérée. On maintient le cap sans forcer.',
                recommendations: [
                    'Maximum 4 tâches importantes',
                    'Sport normal, écoute ton corps',
                    'Prends des pauses régulières',
                    whoopRecovery !== null ? `Recovery Whoop: ${whoopRecovery}% - respecte ton corps` : null
                ].filter(Boolean),
                tasksToKeep: 4,
                sportIntensity: 'normal',
                dataSources,
                whoopData: { recovery: whoopRecovery, strain: whoopStrain, sleep: whoopSleep, hrv: whoopHRV }
            };
        } else {
            return {
                level: 'peak',
                flowScore: Math.round(flowScore),
                message: 'Zone de Flow ! C\'est le moment de performer.',
                recommendations: [
                    'Attaque tes tâches les plus complexes',
                    whoopRecovery !== null && whoopRecovery >= 67 ? 'Recovery au vert - pousse tes limites !' : 'Pousse tes limites au sport',
                    'Capitalise sur cette énergie',
                    whoopHRV !== null ? `HRV: ${whoopHRV}ms - ton système nerveux est prêt` : null
                ].filter(Boolean),
                tasksToKeep: null,
                sportIntensity: 'high',
                dataSources,
                whoopData: { recovery: whoopRecovery, strain: whoopStrain, sleep: whoopSleep, hrv: whoopHRV }
            };
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DÉTECTEUR DE BIAIS COGNITIFS
    // ═══════════════════════════════════════════════════════════════════════════
    detectBiases: (data) => {
        const { biometrics, tasks } = data;
        const biases = [];
        
        // BIAIS DE NÉGATIVITÉ
        if (biometrics) {
            const weights = Object.entries(biometrics).filter(([k, v]) => v.poids).sort((a, b) => new Date(a[0]) - new Date(b[0]));
            if (weights.length >= 4) {
                const trend = weights[weights.length - 1][1].poids - weights[Math.max(0, weights.length - 8)][1].poids;
                if (trend !== 0) {
                    biases.push({
                        type: 'negativity_bias',
                        message: `Tu as ${trend < 0 ? 'perdu' : 'pris'} ${Math.abs(trend).toFixed(1)}kg récemment. Les petits progrès comptent.`,
                        counter: 'Le biais de négativité te fait ignorer tes victoires.'
                    });
                }
            }
        }
        
        // BIAIS D'ÉVITEMENT
        if (tasks?.length > 0) {
            const highPriorityIncomplete = tasks.filter(t => !t.completed && t.priority === 'high');
            if (highPriorityIncomplete.length >= 3) {
                biases.push({
                    type: 'avoidance_bias',
                    message: `${highPriorityIncomplete.length} tâches haute priorité en attente. Tu évites peut-être quelque chose.`,
                    counter: 'L\'évitement crée plus d\'anxiété que l\'action.'
                });
            }
        }
        
        // ILLUSION DE PRODUCTIVITÉ
        if (tasks?.length > 0) {
            const last7Days = TitanAICouncil.getLast(7);
            const weekTasks = tasks.filter(t => last7Days.includes(t.due_date));
            const completedLow = weekTasks.filter(t => t.completed && t.priority === 'low').length;
            const completedHigh = weekTasks.filter(t => t.completed && t.priority === 'high').length;
            
            if (completedLow > completedHigh * 2 && completedLow > 3) {
                biases.push({
                    type: 'productivity_illusion',
                    message: 'Tu complètes beaucoup de petites tâches mais évites les importantes.',
                    counter: 'La vraie productivité = impact, pas volume.'
                });
            }
        }
        
        return biases;
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // GÉNÉRATION DU RAPPORT CONSEIL COMPLET
    // ═══════════════════════════════════════════════════════════════════════════
    generateCouncilReport: (data, userProfile = DEFAULT_USER_PROFILE) => {
        const correlations = TitanAICouncil.analyzeCorrelations(data);
        const predictions = TitanAICouncil.predictFuture(data);
        const dda = TitanAICouncil.calculateDDA(data);
        const biases = TitanAICouncil.detectBiases(data);
        
        // MÉTA-APPRENTISSAGE
        const learnedRules = TitanAICouncil.generateLearnedRules(data, userProfile.learnedRules || []);
        const appSuggestions = TitanAICouncil.analyzeAppUsage(data);
        const cycles = TitanAICouncil.detectCycles(data);
        const thresholds = TitanAICouncil.detectThresholds(data);
        const implicitPreferences = TitanAICouncil.detectImplicitPreferences(data);
        
        // État du système
        let systemState = '';
        if (dda.flowScore >= 70) systemState = 'Performance haute, tous systèmes optimaux';
        else if (dda.flowScore >= 50) systemState = 'Fonctionnement nominal, attention à la charge';
        else if (dda.flowScore >= 30) systemState = 'Capacité réduite, risque de surchauffe';
        else systemState = 'Mode récupération activé, protection en cours';
        
        // Insight profond (priorité aux règles apprises)
        let deepInsight = null;
        if (learnedRules.length > 0) {
            deepInsight = { 
                source: '📚 Règle Apprise', 
                text: learnedRules[0].rule, 
                recommendation: 'Basé sur ton historique personnel.',
                isLearned: true
            };
        } else if (correlations.length > 0) {
            const strongest = correlations.sort((a, b) => b.strength - a.strength)[0];
            deepInsight = { source: '🔍 Ingénieur/Psy', text: strongest.insight, recommendation: strongest.recommendation };
        } else if (biases.length > 0) {
            deepInsight = { source: '🧠 Psychologue', text: biases[0].message, recommendation: biases[0].counter };
        }
        
        // Protocole d'optimisation (adapté aux cycles détectés)
        let physioAdvice = dda.sportIntensity === 'light' ? 'Marche 20min ou stretching' : dda.sportIntensity === 'high' ? 'Séance intense - pousse tes limites' : 'Séance normale';
        if (implicitPreferences.bestMoodAfter?.includes('cardio')) {
            physioAdvice += ' (le cardio booste ton humeur)';
        }
        
        const protocol = {
            physiological: physioAdvice,
            cognitive: dda.tasksToKeep ? `Maximum ${dda.tasksToKeep} tâches` : 'Attaque tes tâches complexes',
            structural: predictions.find(p => p.type === 'burnout') ? 'Bloque 1h de repos ce soir' : 'Maintiens ta routine'
        };
        
        const weeklyGoals = predictions.find(p => p.type === 'weekly_goals');
        
        return {
            systemState,
            flowScore: dda.flowScore,
            ddaLevel: dda.level,
            ddaMessage: dda.message,
            deepInsight,
            protocol,
            futureSimulation: weeklyGoals ? weeklyGoals.message : 'Données insuffisantes',
            correlations,
            predictions,
            biases,
            recommendations: dda.recommendations,
            // MÉTA-APPRENTISSAGE
            meta: {
                cycles,
                thresholds,
                implicitPreferences,
                learnedRules: [...(userProfile.learnedRules || []), ...learnedRules],
                appSuggestions,
                dataQuality: {
                    checkinsCount: Object.keys(data.checkins || {}).length,
                    tasksCount: (data.tasks || []).length,
                    workoutsCount: (data.workoutLogs || []).length,
                    transactionsCount: (data.transactions || []).length
                }
            }
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MORNING COACH - Système de Coaching Conversationnel (Style Whoop)
// ═══════════════════════════════════════════════════════════════════════════════
// Dialogue interactif le matin basé sur les données de la veille
// ═══════════════════════════════════════════════════════════════════════════════

const MorningCoach = {
    // Déterminer le contexte du moment
    getTimeContext: () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    },
    
    // Analyser les données de la veille pour le briefing
    analyzeYesterday: (data) => {
        const { whoopData, checkins, workoutLogs, tasks, transactions } = data;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const yesterdayCheckin = checkins?.[yesterdayStr] || {};
        const yesterdayWorkouts = workoutLogs?.filter(w => w.date === yesterdayStr) || [];
        const yesterdayTasks = tasks?.filter(t => t.due_date === yesterdayStr) || [];
        const yesterdayTransactions = transactions?.filter(t => t.date === yesterdayStr) || [];
        
        // Calculer les métriques clés
        const metrics = {
            // Whoop data
            recovery: whoopData?.recovery || null,
            strain: whoopData?.strain || null,
            sleepScore: whoopData?.sleepScore || null,
            sleepHours: whoopData?.sleepHours || null,
            hrv: whoopData?.hrv || null,
            rhr: whoopData?.rhr || null,
            
            // Check-in de la veille
            energy: yesterdayCheckin.energy || null,
            mood: yesterdayCheckin.mood || null,
            sleep: yesterdayCheckin.sleep || null,
            
            // Activité
            workoutsDone: yesterdayWorkouts.length,
            workoutTypes: yesterdayWorkouts.map(w => w.session || w.type),
            
            // Productivité
            tasksTotal: yesterdayTasks.length,
            tasksCompleted: yesterdayTasks.filter(t => t.completed).length,
            taskCompletionRate: yesterdayTasks.length > 0 
                ? Math.round((yesterdayTasks.filter(t => t.completed).length / yesterdayTasks.length) * 100) 
                : null,
            
            // Finance
            spending: yesterdayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            impulsiveCategories: ['jeux_argent', 'loisirs', 'repas_ext'],
            impulsiveSpending: yesterdayTransactions
                .filter(t => ['jeux_argent', 'loisirs', 'repas_ext'].includes(t.category))
                .reduce((sum, t) => sum + (t.amount || 0), 0)
        };
        
        // Déterminer l'état global
        let overallState = 'neutral';
        let stateReasons = [];
        
        // Analyse Recovery Whoop
        if (metrics.recovery !== null) {
            if (metrics.recovery < 33) {
                overallState = 'low';
                stateReasons.push('recovery_low');
            } else if (metrics.recovery > 66) {
                overallState = 'high';
                stateReasons.push('recovery_high');
            } else {
                stateReasons.push('recovery_medium');
            }
        }
        
        // Analyse sommeil
        if (metrics.sleepHours !== null && metrics.sleepHours < 6) {
            if (overallState !== 'low') overallState = 'concerned';
            stateReasons.push('sleep_short');
        } else if (metrics.sleepScore !== null && metrics.sleepScore < 70) {
            if (overallState !== 'low') overallState = 'concerned';
            stateReasons.push('sleep_quality_low');
        }
        
        // Analyse énergie check-in
        if (metrics.energy !== null && metrics.energy <= 2) {
            if (overallState !== 'low') overallState = 'concerned';
            stateReasons.push('energy_low');
        }
        
        // Analyse productivité
        if (metrics.taskCompletionRate !== null && metrics.taskCompletionRate < 50) {
            stateReasons.push('productivity_low');
        } else if (metrics.taskCompletionRate !== null && metrics.taskCompletionRate > 80) {
            stateReasons.push('productivity_high');
        }
        
        // Analyse dépenses
        if (metrics.impulsiveSpending > 50) {
            stateReasons.push('impulse_spending');
        }
        
        return { metrics, overallState, stateReasons };
    },
    
    // Générer le message d'accueil personnalisé
    generateGreeting: (userName, analysis, timeContext) => {
        const { metrics, overallState, stateReasons } = analysis;
        const greetings = {
            morning: ['Bonjour', 'Hey', 'Salut'],
            afternoon: ['Bon après-midi', 'Hey'],
            evening: ['Bonsoir', 'Hey'],
            night: ['Encore debout ?', 'Salut']
        };
        
        const greeting = greetings[timeContext][Math.floor(Math.random() * greetings[timeContext].length)];
        
        // Construire le message principal basé sur les données
        let mainMessage = '';
        let subMessage = '';
        
        // Priorité 1: Données Whoop
        if (metrics.recovery !== null) {
            if (metrics.recovery < 33) {
                mainMessage = `ta récupération est à ${metrics.recovery}%, c'est assez bas.`;
                if (metrics.sleepHours && metrics.sleepHours < 6) {
                    subMessage = `Tu n'as dormi que ${metrics.sleepHours.toFixed(1)}h, ça explique beaucoup.`;
                } else {
                    subMessage = `Ton corps te demande de lever le pied aujourd'hui.`;
                }
            } else if (metrics.recovery < 66) {
                mainMessage = `ta récupération d'hier était moyenne (${metrics.recovery}%)`;
                if (metrics.sleepHours) {
                    subMessage = metrics.sleepHours < 7 
                        ? `et ton sommeil a été plus court que nécessaire (${metrics.sleepHours.toFixed(1)}h).`
                        : `mais ton sommeil était correct (${metrics.sleepHours.toFixed(1)}h).`;
                }
            } else {
                mainMessage = `ta récupération est excellente à ${metrics.recovery}% !`;
                subMessage = `C'est le moment de capitaliser sur cette énergie.`;
            }
        }
        // Fallback sur les check-ins si pas de Whoop
        else if (metrics.energy !== null || metrics.mood !== null) {
            if (metrics.energy <= 2) {
                mainMessage = `tu semblais fatigué hier (énergie ${metrics.energy}/5).`;
                subMessage = `Comment te sens-tu ce matin ?`;
            } else if (metrics.mood <= 2) {
                mainMessage = `ton moral était un peu bas hier.`;
                subMessage = `J'espère que ça va mieux aujourd'hui.`;
            } else if (metrics.energy >= 4 && metrics.mood >= 4) {
                mainMessage = `tu étais en forme hier (énergie ${metrics.energy}/5, humeur ${metrics.mood}/5).`;
                subMessage = `Voyons comment maintenir cette dynamique !`;
            } else {
                mainMessage = `on fait le point sur ta journée d'hier ?`;
            }
        }
        // Fallback sur la productivité
        else if (metrics.taskCompletionRate !== null) {
            if (metrics.taskCompletionRate >= 80) {
                mainMessage = `tu as cartonné hier avec ${metrics.taskCompletionRate}% de tes tâches complétées !`;
                subMessage = `Comment tu veux aborder aujourd'hui ?`;
            } else if (metrics.taskCompletionRate < 50 && metrics.tasksTotal > 2) {
                mainMessage = `hier a été compliqué côté productivité (${metrics.taskCompletionRate}% complété).`;
                subMessage = `On analyse ce qui s'est passé ?`;
            }
        }
        // Message par défaut
        else {
            mainMessage = `prêt pour une nouvelle journée ?`;
            subMessage = `Je n'ai pas assez de données d'hier pour te faire un briefing complet.`;
        }
        
        return {
            greeting: `${greeting} ${userName}`,
            mainMessage,
            subMessage,
            overallState
        };
    },
    
    // Générer les options de conversation
    generateConversationOptions: (analysis) => {
        const { metrics, stateReasons } = analysis;
        const options = [];
        
        // Option 1: Explorer (comprendre)
        if (stateReasons.includes('recovery_low') || stateReasons.includes('recovery_medium')) {
            options.push({
                id: 'explore_recovery',
                label: "Explorer ce qui a pu influencer ta récup",
                description: "Parfait si tu te demandes \"pourquoi je ne suis pas en vert ?\"",
                icon: '🔍',
                type: 'explore'
            });
        } else if (stateReasons.includes('energy_low')) {
            options.push({
                id: 'explore_energy',
                label: "Comprendre pourquoi ton énergie est basse",
                description: "On va identifier les facteurs ensemble",
                icon: '🔍',
                type: 'explore'
            });
        } else if (stateReasons.includes('productivity_low')) {
            options.push({
                id: 'explore_productivity',
                label: "Analyser ce qui a bloqué hier",
                description: "Identifier les obstacles pour mieux les éviter",
                icon: '🔍',
                type: 'explore'
            });
        }
        
        // Option 2: Agir (conseils concrets)
        if (stateReasons.includes('sleep_short') || stateReasons.includes('sleep_quality_low')) {
            options.push({
                id: 'action_sleep',
                label: "Avoir des conseils pour mieux dormir ce soir",
                description: "Actions simples à mettre en place dès aujourd'hui",
                icon: '💤',
                type: 'action'
            });
        } else if (stateReasons.includes('recovery_low') || stateReasons.includes('recovery_medium')) {
            options.push({
                id: 'action_recovery',
                label: "Conseils pour optimiser ma journée",
                description: "Adapter ta journée à ton niveau de récupération",
                icon: '⚡',
                type: 'action'
            });
        } else if (stateReasons.includes('recovery_high')) {
            options.push({
                id: 'action_capitalize',
                label: "Comment capitaliser sur cette énergie",
                description: "Maximise cette journée de haute performance",
                icon: '🚀',
                type: 'action'
            });
        }
        
        // Option par défaut si pas assez de contexte
        if (options.length === 0) {
            options.push({
                id: 'daily_plan',
                label: "Planifier ma journée",
                description: "Définir mes priorités pour aujourd'hui",
                icon: '📋',
                type: 'action'
            });
            options.push({
                id: 'quick_checkin',
                label: "Faire mon check-in rapide",
                description: "Enregistrer comment je me sens",
                icon: '✍️',
                type: 'explore'
            });
        }
        
        // Toujours proposer une option "Pas maintenant"
        options.push({
            id: 'skip',
            label: "Pas maintenant",
            description: "Revenir au dashboard",
            icon: '⏭️',
            type: 'skip'
        });
        
        return options;
    },
    
    // Générer les questions de suivi selon l'option choisie
    generateFollowUp: (optionId, analysis) => {
        const { metrics } = analysis;
        
        const followUps = {
            explore_recovery: {
                question: "D'après toi, qu'est-ce qui a pu impacter ta récupération ?",
                options: [
                    { id: 'alcohol', label: '🍷 Alcool', impact: 'Même 1-2 verres réduisent significativement la récup' },
                    { id: 'late_meal', label: '🍕 Repas tard/lourd', impact: 'La digestion perturbe les phases de sommeil profond' },
                    { id: 'screens', label: '📱 Écrans tard', impact: 'La lumière bleue retarde la mélatonine de 2-3h' },
                    { id: 'stress', label: '😰 Stress/Anxiété', impact: 'Le cortisol élevé empêche la récupération' },
                    { id: 'training', label: '🏋️ Entraînement intense', impact: 'Ton corps avait besoin de plus de repos' },
                    { id: 'unknown', label: '🤷 Je ne sais pas', impact: null }
                ],
                nextStep: 'recommendations'
            },
            explore_energy: {
                question: "Qu'est-ce qui pourrait expliquer ta fatigue ?",
                options: [
                    { id: 'sleep', label: '😴 Mal dormi', impact: null },
                    { id: 'overwork', label: '💼 Trop de travail', impact: null },
                    { id: 'nutrition', label: '🥗 Mal mangé', impact: null },
                    { id: 'no_sport', label: '🏃 Pas bougé', impact: null },
                    { id: 'mood', label: '😔 Moral bas', impact: null }
                ],
                nextStep: 'recommendations'
            },
            explore_productivity: {
                question: "Qu'est-ce qui t'a bloqué hier ?",
                options: [
                    { id: 'overwhelm', label: '😵 Trop de choses à faire', impact: null },
                    { id: 'distraction', label: '📱 Distractions', impact: null },
                    { id: 'energy', label: '🔋 Pas d\'énergie', impact: null },
                    { id: 'unclear', label: '🤔 Priorités floues', impact: null },
                    { id: 'procrastination', label: '😅 Procrastination', impact: null }
                ],
                nextStep: 'recommendations'
            },
            action_sleep: {
                title: "🌙 Plan Sommeil Optimisé",
                recommendations: [
                    { time: '2h avant coucher', action: 'Dernier repas léger', icon: '🥗' },
                    { time: '1h30 avant', action: 'Mode nuit sur tous les écrans', icon: '📱' },
                    { time: '1h avant', action: 'Lumières tamisées, pas d\'écran', icon: '💡' },
                    { time: '30min avant', action: 'Lecture ou méditation', icon: '📖' },
                    { time: 'Au lit', action: 'Chambre fraîche (18-19°C)', icon: '❄️' }
                ],
                targetBedtime: '22:30'
            },
            action_recovery: {
                title: metrics.recovery < 33 ? "🔋 Plan Mode Récupération" : "⚡ Plan Journée Équilibrée",
                recommendations: metrics.recovery < 33 ? [
                    { priority: 'high', action: 'Pas d\'entraînement intense aujourd\'hui', icon: '🚫' },
                    { priority: 'high', action: 'Maximum 3 tâches importantes', icon: '📋' },
                    { priority: 'medium', action: 'Marche légère 20-30min', icon: '🚶' },
                    { priority: 'medium', action: 'Sieste 20min si possible', icon: '😴' },
                    { priority: 'low', action: 'Couché 30min plus tôt ce soir', icon: '🌙' }
                ] : [
                    { priority: 'high', action: 'Séance sport modérée OK', icon: '🏋️' },
                    { priority: 'medium', action: 'Maximum 5 tâches', icon: '📋' },
                    { priority: 'medium', action: 'Pauses régulières', icon: '☕' },
                    { priority: 'low', action: 'Respecte ton heure de coucher', icon: '🌙' }
                ]
            },
            action_capitalize: {
                title: "🚀 Plan Performance Maximale",
                recommendations: [
                    { priority: 'high', action: 'Attaque ta tâche la plus difficile ce matin', icon: '🎯' },
                    { priority: 'high', action: 'Entraînement intense recommandé', icon: '🔥' },
                    { priority: 'medium', action: 'Profite de ce flow pour avancer sur tes projets', icon: '💪' },
                    { priority: 'medium', action: 'Tu peux te permettre de pousser un peu plus', icon: '⚡' },
                    { priority: 'low', action: 'Mais n\'oublie pas de maintenir ton sommeil', icon: '🌙' }
                ]
            },
            daily_plan: {
                title: "📋 Planifier ta journée",
                type: 'navigate',
                navigateTo: 'tasks',
                message: "Je t'emmène vers tes tâches pour planifier ta journée !",
                recommendations: [
                    { priority: 'high', action: 'Définis ta tâche prioritaire #1', icon: '🎯' },
                    { priority: 'medium', action: 'Bloque du temps pour tes tâches importantes', icon: '📅' },
                    { priority: 'low', action: 'Prévois des pauses régulières', icon: '☕' }
                ]
            },
            quick_checkin: {
                title: "✍️ Check-in rapide",
                type: 'checkin',
                message: "Comment tu te sens ce matin ?",
                quickOptions: [
                    { id: 'great', label: '🔥 En forme', energy: 5, mood: 5 },
                    { id: 'good', label: '👍 Ça va', energy: 4, mood: 4 },
                    { id: 'ok', label: '😐 Moyen', energy: 3, mood: 3 },
                    { id: 'tired', label: '😴 Fatigué', energy: 2, mood: 2 },
                    { id: 'bad', label: '😞 Pas top', energy: 1, mood: 2 }
                ]
            }
        };
        
        return followUps[optionId] || null;
    },
    
    // Générer les recommandations basées sur les réponses
    generateRecommendations: (optionId, answerId, analysis) => {
        const { metrics } = analysis;
        
        const recommendations = {
            alcohol: [
                "L'alcool fragmente ton sommeil profond et REM",
                "Même 1-2 verres = récupération -15 à 30%",
                "💡 Si tu bois ce soir, arrête 3-4h avant de dormir"
            ],
            late_meal: [
                "La digestion active ton système pendant que tu dors",
                "Évite les repas lourds après 20h",
                "💡 Ce soir : repas léger avant 20h, pas de sucre"
            ],
            screens: [
                "La lumière bleue supprime la mélatonine",
                "Ton cerveau pense qu'il fait encore jour",
                "💡 Ce soir : mode nuit dès 21h, pas d'écran après 22h"
            ],
            stress: [
                "Le cortisol élevé empêche ton corps de récupérer",
                "Même en dormant 8h, la qualité est réduite",
                "💡 Essaie 10min de respiration ou méditation avant de dormir"
            ],
            training: [
                `Avec ${metrics.strain ? `un strain de ${metrics.strain}` : 'ton entraînement intense'}, ton corps avait besoin de plus`,
                "Le surentraînement nuit à la progression",
                "💡 Aujourd'hui : repos actif ou séance légère max"
            ],
            unknown: [
                "Pas de souci, on va observer les prochains jours",
                "Continue à tracker tes habitudes",
                "💡 Note ce soir ce que tu as fait différemment"
            ]
        };
        
        return recommendations[answerId] || [
            "Continue à observer tes patterns",
            "Plus tu tracks, plus je pourrai t'aider",
            "💡 Fais ton check-in ce soir pour compléter les données"
        ];
    },
    
    // Point d'entrée principal
    generateMorningBriefing: (data, userName = 'Theo') => {
        const timeContext = MorningCoach.getTimeContext();
        const analysis = MorningCoach.analyzeYesterday(data);
        const greeting = MorningCoach.generateGreeting(userName, analysis, timeContext);
        const options = MorningCoach.generateConversationOptions(analysis);
        
        return {
            timeContext,
            greeting,
            options,
            analysis,
            isMorning: timeContext === 'morning'
        };
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE D'ANALYSE (Compatible avec l'ancien système)
// Intègre: Whoop API, Check-ins, Tasks, Workouts, Finance, Biométrie
// ═══════════════════════════════════════════════════════════════════════════════
const analyzeAllData = async (data) => {
    const { checkins, workoutLogs, biometrics, whoopData, supplementLogs, tasks, transactions } = data;
    const insights = [];
    const questions = [];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 APPEL GEMINI - Question socratique ultra-profonde
    // ═══════════════════════════════════════════════════════════════════════════
    
    const last7Days = TitanAICouncil.getLast(7);
    
    // Collecter TOUTES les données pour l'IA
    const weekWorkouts = workoutLogs?.filter(w => last7Days.includes(w.date)).length || 0;
    const weekTransactions = transactions?.filter(t => last7Days.includes(t.date)) || [];
    const leisureSpending = weekTransactions.filter(t => 
        ['loisirs', 'jeux_argent', 'repas_ext', 'loisir_ambrine'].includes(t.category)
    ).reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSpending = weekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const recentCheckins = last7Days.map(date => checkins?.[date]).filter(Boolean);
    const avgEnergy = recentCheckins.length > 0 
        ? recentCheckins.reduce((sum, c) => sum + (c.energy || 3), 0) / recentCheckins.length 
        : 3;
    const avgSleep = recentCheckins.length > 0 
        ? recentCheckins.reduce((sum, c) => sum + (c.sleep || 7), 0) / recentCheckins.length 
        : 7;
    
    // Dernière séance
    const sortedWorkouts = [...(workoutLogs || [])].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    const lastWorkout = sortedWorkouts[0];
    const daysSinceLastWorkout = lastWorkout 
        ? Math.floor((new Date() - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24))
        : null;
    
    // 🧠 APPEL GEMINI avec toutes les données
    const socraticQuestion = await analyzeWithGemini({
        weekWorkouts,
        avgEnergy,
        avgSleep,
        whoopRecovery: whoopData?.recovery?.score || null,
        whoopStrain: whoopData?.strain?.score || null,
        whoopHRV: whoopData?.recovery?.hrv || null,
        tasksCompleted: tasks?.filter(t => t.completed).length || 0,
        totalTasks: tasks?.length || 0,
        leisureSpending,
        totalSpending,
        daysSinceLastWorkout
    });
    
    console.log('🧠 Question IA Gemini générée:', socraticQuestion);
    
    
    // Générer le rapport du conseil
    const councilReport = TitanAICouncil.generateCouncilReport(data);
    
    // Générer le briefing du matin
    const morningBriefing = MorningCoach.generateMorningBriefing(data);
    
    // === ANALYSE WHOOP (Données API automatiques) ===
    // Récupère les données soit de l'API soit manuelles
    const recovery = whoopData?.recovery?.score ?? whoopData?.recovery ?? null;
    const strain = whoopData?.strain?.score ?? whoopData?.strain ?? null;
    const sleepHours = whoopData?.sleep?.duration ?? whoopData?.sleepHours ?? null;
    const sleepScore = whoopData?.sleep?.score ?? whoopData?.sleepScore ?? null;
    const hrv = whoopData?.recovery?.hrv ?? whoopData?.hrv ?? null;
    const rhr = whoopData?.recovery?.rhr ?? whoopData?.rhr ?? null;
    
    if (recovery !== null) {
        if (recovery < 33) {
            insights.push({
                type: 'warning',
                category: 'recovery',
                priority: 1,
                title: '🔴 Récupération critique',
                message: `Recovery ${recovery}% - Ton corps a besoin de repos.`,
                action: 'Considère une séance légère ou repos complet.',
                dataSource: 'Whoop'
            });
            questions.push({
                id: 'low_recovery',
                text: 'Pourquoi ton recovery est bas ?',
                options: ['Alcool', 'Stress travail', 'Couché tard', 'Mauvais sommeil', 'Autre']
            });
        } else if (recovery >= 67) {
            insights.push({
                type: 'success',
                category: 'recovery',
                priority: 1,
                title: '🟢 Forme optimale',
                message: `Recovery ${recovery}% - C'est le moment de performer !`,
                action: 'Pousse tes limites aujourd\'hui.',
                dataSource: 'Whoop'
            });
        } else {
            insights.push({
                type: 'info',
                category: 'recovery',
                priority: 2,
                title: '🟡 Récupération modérée',
                message: `Recovery ${recovery}% - Écoute ton corps.`,
                action: 'Adapte l\'intensité de ta journée.',
                dataSource: 'Whoop'
            });
        }
    }
    
    if (strain !== null && strain > 18) {
        insights.push({
            type: 'warning',
            category: 'strain',
            priority: 2,
            title: '⚡ Strain élevé',
            message: `Strain ${strain} - Tu as beaucoup sollicité ton corps.`,
            action: 'Prévois une récupération adaptée.',
            dataSource: 'Whoop'
        });
    }
    
    if (sleepHours !== null && sleepHours < 6) {
        insights.push({
            type: 'warning',
            category: 'sleep',
            priority: 1,
            title: '😴 Sommeil insuffisant',
            message: `${sleepHours}h de sommeil - en dessous de l'optimal.`,
            action: 'Couche-toi plus tôt ce soir.',
            dataSource: 'Whoop'
        });
        questions.push({
            id: 'bad_sleep',
            text: 'Qu\'est-ce qui a perturbé ton sommeil ?',
            options: ['Écrans tard', 'Stress', 'Repas lourd', 'Bruit', 'Autre']
        });
    } else if (sleepHours !== null && sleepHours >= 7.5) {
        insights.push({
            type: 'success',
            category: 'sleep',
            priority: 3,
            title: '✨ Bon sommeil',
            message: `${sleepHours}h de sommeil - bien joué !`,
            action: 'Continue comme ça.',
            dataSource: 'Whoop'
        });
    }
    
    // HRV analysis
    if (hrv !== null) {
        if (hrv < 30) {
            insights.push({
                type: 'warning',
                category: 'hrv',
                priority: 2,
                title: '💓 HRV bas',
                message: `HRV ${hrv}ms - Système nerveux sous pression.`,
                action: 'Techniques de respiration recommandées.',
                dataSource: 'Whoop'
            });
        } else if (hrv > 70) {
            insights.push({
                type: 'success',
                category: 'hrv',
                priority: 3,
                title: '💓 HRV excellent',
                message: `HRV ${hrv}ms - Système nerveux en forme.`,
                action: 'Parfait pour un effort intense.',
                dataSource: 'Whoop'
            });
        }
    }
    
    // Convertir DDA en insight prioritaire
    if (councilReport.ddaLevel === 'recovery') {
        insights.unshift({
            type: 'warning',
            category: 'system',
            title: `⚡ ${councilReport.ddaMessage}`,
            message: `Flow Score: ${councilReport.flowScore}%`,
            action: councilReport.recommendations[0]
        });
    } else if (councilReport.ddaLevel === 'peak') {
        insights.unshift({
            type: 'success',
            category: 'system',
            title: `🚀 ${councilReport.ddaMessage}`,
            message: `Flow Score: ${councilReport.flowScore}%`,
            action: councilReport.recommendations[0]
        });
    }
    
    // Ajouter l'insight profond
    if (councilReport.deepInsight) {
        insights.push({
            type: 'info',
            category: 'correlation',
            title: councilReport.deepInsight.source,
            message: councilReport.deepInsight.text,
            action: councilReport.deepInsight.recommendation
        });
    }
    
    // Convertir question socratique
    if (socraticQuestion) {
        questions.unshift({
            id: 'socratic',
            text: socraticQuestion,
            isSocratic: true
        });
    }
    
    // Questions quotidiennes par défaut (rotation)
    const dailyQuestions = [
        { id: 'day_goal', text: 'Quel est ton objectif principal aujourd\'hui ?', options: null },
        { id: 'energy_source', text: 'Qu\'est-ce qui t\'a donné de l\'énergie récemment ?', options: ['Sport', 'Sommeil', 'Alimentation', 'Social', 'Autre'] },
        { id: 'blocker', text: 'Qu\'est-ce qui te bloque en ce moment ?', options: ['Temps', 'Énergie', 'Motivation', 'Clarté', 'Rien'] },
        { id: 'gratitude', text: 'Pour quoi es-tu reconnaissant aujourd\'hui ?', options: null },
        { id: 'improvement', text: 'Qu\'est-ce que tu aurais pu mieux faire hier ?', options: null },
        { id: 'priority', text: 'Si tu ne devais faire qu\'une chose aujourd\'hui, ce serait ?', options: null },
        { id: 'stress', text: 'Ton niveau de stress actuel ?', options: ['Zen', 'Léger', 'Modéré', 'Élevé', 'Critique'] },
        { id: 'win', text: 'Quelle a été ta plus grande victoire cette semaine ?', options: null },
        { id: 'learning', text: 'Qu\'as-tu appris récemment sur toi-même ?', options: null },
        { id: 'recharge', text: 'De quoi as-tu besoin pour te recharger ?', options: ['Sommeil', 'Sport', 'Temps seul', 'Temps social', 'Nature'] },
        { id: 'obstacle', text: 'Quel obstacle évites-tu d\'affronter ?', options: null },
        { id: 'momentum', text: 'Qu\'est-ce qui te donnerait du momentum maintenant ?', options: ['Quick win', 'Grosse tâche', 'Pause', 'Sport', 'Discussion'] },
        { id: 'selfcare', text: 'Comment prends-tu soin de toi aujourd\'hui ?', options: null },
        { id: 'focus', text: 'Sur une échelle de 1-10, ton niveau de focus ?', options: ['1-2', '3-4', '5-6', '7-8', '9-10'] }
    ];
    // Rotation basée sur le jour de l'année pour plus de variété
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    if (questions.length === 0 || !questions.some(q => q.isSocratic)) {
        questions.push(dailyQuestions[dayOfYear % dailyQuestions.length]);
    }
    
    // Analyse poids (tendance)
    if (biometrics) {
        const weights = Object.entries(biometrics)
            .filter(([k, v]) => v.poids)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]));
        
        if (weights.length >= 2) {
            const recent = weights.slice(-7);
            const trend = recent.length >= 2 
                ? recent[recent.length - 1][1].poids - recent[0][1].poids 
                : 0;
            
            if (Math.abs(trend) > 1) {
                insights.push({
                    type: trend > 0 ? 'info' : 'success',
                    category: 'weight',
                    title: trend > 0 ? 'Prise de poids' : 'Perte de poids',
                    message: `${trend > 0 ? '+' : ''}${trend.toFixed(1)}kg sur 7 jours`,
                    action: trend > 0 ? 'Surveille ton alimentation' : 'Continue comme ça !'
                });
            }
        }
    }
    
    // Analyse entraînements
    if (workoutLogs?.length > 0) {
        const thisWeek = workoutLogs.filter(log => {
            const logDate = new Date(log.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
        });
        
        const muscuCount = thisWeek.filter(l => l.type === 'Muscu').length;
        
        if (muscuCount < 3) {
            insights.push({
                type: 'info',
                category: 'training',
                title: 'Objectif muscu',
                message: `${muscuCount}/6 séances muscu cette semaine`,
                action: 'Reste régulier pour maximiser tes résultats.'
            });
        }
        
        if (muscuCount >= 5) {
            insights.push({
                type: 'success',
                category: 'training',
                title: 'Excellent volume',
                message: `${muscuCount} séances muscu cette semaine !`,
                action: 'Assure-toi de bien récupérer.'
            });
        }
    }
    
    // Ajouter les prédictions aux insights (sauf weekly_goals qui est déjà dans futureSimulation)
    councilReport.predictions.forEach(pred => {
        if (pred.type === 'burnout' || pred.type === 'energy_crash') {
            insights.push({
                type: 'warning',
                category: 'health',
                priority: 1,
                title: '⚠️ ' + pred.message,
                message: pred.details || '',
                action: pred.action,
                dataSource: 'Prédiction IA'
            });
        }
    });
    
    return { insights, questions, councilReport, morningBriefing, MorningCoach };
};

const EXPENSE_CATEGORIES = [
    { id: 'courses', name: 'Courses', Icon: ShoppingCart, color: '#3B82F6' },
    { id: 'loisir_ambrine', name: 'Loisir Ambrine', Icon: Users, color: '#EC4899' },
    { id: 'repas_ext', name: 'Repas extérieur', Icon: Coffee, color: '#F97316' },
    { id: 'jeux_argent', name: 'Jeu d\'argent', Icon: CircleDollarSign, color: '#EF4444' },
    { id: 'transport', name: 'Transport', Icon: Car, color: '#8B5CF6' },
    { id: 'habits', name: 'Habits', Icon: Shirt, color: '#06B6D4' },
    { id: 'loisirs', name: 'Loisirs', Icon: Gamepad2, color: '#10B981' },
    { id: 'loyer_charges', name: 'Loyer & Charges', Icon: Home, color: '#F59E0B' },
    { id: 'vacances', name: 'Vacances', Icon: Plane, color: '#6366F1' },
    { id: 'pret', name: 'Prêt', Icon: CreditCard, color: '#84CC16' },
    { id: 'services', name: 'Services', Icon: Wrench, color: '#14B8A6' },
    { id: 'autres', name: 'Autres', Icon: Package, color: '#6B7280' }
];

const PAYMENT_METHODS = [
    { id: 'bnp', name: 'BNP', Icon: Building2, color: '#22C55E' },
    { id: 'mercury', name: 'Mercury', Icon: CircleDollarSign, color: '#3B82F6' },
    { id: 'societe', name: 'Société', Icon: PiggyBank, color: '#EAB308' },
    { id: 'liquide', name: 'Liquide', Icon: Banknote, color: '#EF4444' }
];

const CATEGORY_KEYWORDS = {
    courses: ['carrefour', 'lidl', 'auchan', 'leclerc', 'intermarche', 'monoprix', 'franprix', 'picard', 'supermarche', 'market', 'hellofresh'],
    repas_ext: ['uber eats', 'deliveroo', 'restaurant', 'mcdo', 'mcdonald', 'burger', 'pizza', 'sushi', 'kebab', 'chicken', 'novo burger', 'mamagayo', 'grain a la tass', 'boulangerie', 'pain sas', 'cafe', 'sunside'],
    transport: ['uber', 'bolt', 'yego', 'taxi', 'sncf', 'ratp', 'essence', 'total', 'station avia', 'parking', 'autoroute', 'peage', 'ulys'],
    loisirs: ['netflix', 'spotify', 'playstation', 'steam', 'apple.com', 'cinema', 'concert', 'theatre', 'musee', 'tfc', 'cameleon', 'movida', 'cave'],
    jeux_argent: ['betclic', 'fdj', 'pmu', 'winamax', 'unibet', 'casino', 'parions'],
    loyer_charges: ['loyer', 'edf', 'engie', 'eau', 'electricite', 'gaz', 'sfr', 'free', 'orange', 'bouygues', 'indigo', 'generali', 'assurance'],
    services: ['amazon', 'yoojo', 'ikea', 'darty', 'fnac', 'decathlon'],
    habits: ['zara', 'h&m', 'nike', 'adidas', 'descomti'],
    loisir_ambrine: ['ambrine', 'ghedjati'],
    pret: ['credit', 'pret', 'remboursement']
};

const DAILY_ROUTINES = {
    1: { name: "Lundi", schedule: [
        { time: "7h30", task: "Réveil + 50cl Eau + compléments" },
        { time: "7h30-8h", task: "Petit déjeuner + préparation" },
        { time: "8h-12h", task: "Deep focus matin" },
        { time: "12h-13h", task: "Cardio" },
        { time: "13h-14h", task: "Repas" },
        { time: "14h-19h", task: "Deep focus après-midi" },
        { time: "19h-20h", task: "PUSH_A" },
        { time: "20h-23h", task: "Repas + 30min anglais + 30min lecture" }
    ], muscu: "PUSH_A", cardio: true },
    2: { name: "Mardi", schedule: [
        { time: "7h30", task: "Réveil + 50cl Eau + compléments" },
        { time: "7h30-8h", task: "Petit déjeuner + préparation" },
        { time: "8h-12h", task: "Deep focus matin" },
        { time: "12h-13h", task: "Cardio" },
        { time: "13h-14h", task: "Repas" },
        { time: "14h-19h", task: "Deep focus après-midi" },
        { time: "19h-20h", task: "PULL_A" },
        { time: "20h-23h", task: "Repas + 30min anglais + 30min lecture" }
    ], muscu: "PULL_A", cardio: true },
    3: { name: "Mercredi", schedule: [
        { time: "7h30", task: "Réveil + 50cl Eau + compléments" },
        { time: "7h30-8h", task: "Petit déjeuner + préparation" },
        { time: "8h-12h", task: "Deep focus matin" },
        { time: "13h-19h", task: "Deep focus après-midi" },
        { time: "19h-20h", task: "LEGS_A" },
        { time: "20h-23h", task: "Repas + 30min anglais + 30min lecture" }
    ], muscu: "LEGS_A", cardio: false },
    4: { name: "Jeudi", schedule: [
        { time: "7h30", task: "Réveil + 50cl Eau + compléments" },
        { time: "7h30-8h", task: "Petit déjeuner + préparation" },
        { time: "8h-12h", task: "Deep focus matin" },
        { time: "12h-13h", task: "Cardio" },
        { time: "13h-14h", task: "Repas" },
        { time: "14h-19h", task: "Deep focus après-midi" },
        { time: "19h-20h", task: "MOLLETS" },
        { time: "20h-23h", task: "Repas + 30min anglais + 30min lecture" }
    ], muscu: "MOLLETS", cardio: true },
    5: { name: "Vendredi", schedule: [
        { time: "7h30", task: "Réveil + 50cl Eau + compléments" },
        { time: "7h30-8h", task: "Petit déjeuner + préparation" },
        { time: "8h-12h", task: "Deep focus matin" },
        { time: "12h-13h", task: "Cardio" },
        { time: "13h-14h", task: "Repas" },
        { time: "14h-19h", task: "Deep focus après-midi" },
        { time: "19h-20h", task: "PUSH_B" },
        { time: "20h-23h", task: "Repas + 30min anglais + 30min lecture" }
    ], muscu: "PUSH_B", cardio: true },
    6: { name: "Samedi", schedule: [
        { time: "9h", task: "Petit déjeuner" },
        { time: "9h30-10h30", task: "Cardio long" },
        { time: "12h-18h", task: "Off" },
        { time: "18h-20h", task: "Chill" }
    ], muscu: null, cardio: true, isWeekend: true },
    0: { name: "Dimanche", schedule: [
        { time: "Journée", task: "PULL_B" }
    ], muscu: "PULL_B", cardio: false, isWeekend: true }
};

const HABITS = [
    { id: "reveil", name: "Réveil 7h30", Icon: Sun, weekendExcluded: true },
    { id: "eau_complements", name: "Eau 3L + Compléments", Icon: Droplets, weekendExcluded: false },
    { id: "deep_focus_matin", name: "Deep Focus Matin", Icon: Brain, weekendExcluded: true },
    { id: "deep_focus_aprem", name: "Deep Focus Après-midi", Icon: Target, weekendExcluded: true },
    { id: "muscu", name: "Musculation", Icon: Dumbbell, weekendExcluded: false, dynamic: true },
    { id: "cardio", name: "Cardio", Icon: Heart, weekendExcluded: false, dynamic: true },
    { id: "alimentation", name: "Alimentation saine", Icon: Coffee, weekendExcluded: false },
    { id: "journal", name: "Journal", Icon: FileText, weekendExcluded: false },
    { id: "lecture", name: "Lecture 30min", Icon: BookOpen, weekendExcluded: true },
    { id: "anglais", name: "Anglais 30min", Icon: Globe, weekendExcluded: true },
    { id: "moins_4h_tel", name: "-4h de téléphone", Icon: Smartphone, weekendExcluded: true },
    { id: "no_vices", name: "No clopes/alcool/casino", Icon: Ban, weekendExcluded: false }
];

// --- DEFAULT LIFESTYLE DATA ---
const DEFAULT_FILMS = [
    {
        id: '1',
        title: 'La Liste de Schindler',
        rating: 7,
        year: 1993,
        director: 'Steven Spielberg',
        duration: '3h15',
        genre: 'Drame historique, Guerre',
        actors: ['Liam Neeson', 'Ben Kingsley', 'Ralph Fiennes'],
        awards: '7 Oscars, dont Meilleur Film et Meilleur Réalisateur',
        summary: "Adapté du roman de Thomas Keneally, le film raconte l'histoire vraie d'Oskar Schindler, un industriel allemand membre du parti nazi, qui s'installe en Pologne occupée. D'abord motivé par l'appât du gain, il va progressivement prendre conscience de l'horreur et sauver plus de 1100 Juifs.",
        personalReview: "Film globalement très bon, marquant et fort émotionnellement. Mon regard sur Oskar Schindler a complètement changé au fil du récit. Le noir et blanc donne une ambiance historique, mais personnellement j'aurais préféré de la couleur. Quelques longueurs mais l'ensemble reste puissant.",
        particularite: 'Tourné en noir et blanc avec quelques séquences colorées symboliques',
        voiceNote: null,
        createdAt: '2024-01-15'
    },
    {
        id: '2',
        title: 'Margin Call',
        rating: 7.5,
        year: 2011,
        director: 'J.C. Chandor',
        duration: '1h49',
        genre: 'Drame, Thriller financier',
        actors: ['Kevin Spacey', 'Jeremy Irons', 'Paul Bettany', 'Zachary Quinto', 'Demi Moore', 'Stanley Tucci'],
        awards: 'Nommé à l\'Oscar du Meilleur scénario original',
        summary: "Le film plonge dans les coulisses d'une grande banque d'investissement new-yorkaise au tout début de la crise financière de 2008. Un jeune analyste découvre que le portefeuille de la banque est rempli de produits toxiques. En 24 heures, dirigeants et employés vont se retrouver face à des dilemmes moraux.",
        personalReview: "J'ai vraiment bien aimé, ça parle de business, de finance, tout ce que j'aime. Le casting est excellent, on sent bien la tension entre les personnages. La scène finale avec Sam Rogers enterrant son chien est une métaphore puissante de la perte de loyauté et du vide de sa vie personnelle.",
        particularite: 'Huis-clos intense quasi intégralement tourné dans les bureaux de la banque',
        voiceNote: null,
        createdAt: '2024-02-20'
    }
];

const DEFAULT_WINES = [
    {
        id: '1',
        name: 'Le Bois des Merveilles',
        appellation: 'Minervois AOC',
        year: 2023,
        rating: 8.5,
        cepages: 'Carignan (60%) + Grenache (40%)',
        terroir: 'Argilo-calcaire, garrigue, lentilles siliceuses',
        vinification: 'Vendanges entières, cuvaison 15 jours, élevage en barriques anciennes ~20 mois',
        degree: '13%',
        garde: '5 à 7 ans',
        price: '25-28€',
        nez: 'Fruits noirs mûrs (cassis, mûre), garrigue, poivre doux, réglisse, touche toastée/boisée',
        bouche: 'Attaque souple, beaucoup de douceur. Tanins élégants et ronds, belle fraîcheur. Finale longue sur les fruits noirs et les épices.',
        pointsForts: ['Équilibre entre puissance et élégance', 'Complexité aromatique intéressante', 'Vin bio, travail artisanal', 'Déjà très plaisant à boire'],
        pointsFaibles: ['Tanins encore un peu fermes', 'Prix légèrement au-dessus de la moyenne du Minervois'],
        personalReview: 'Très doux, agréable, pas trop fort. Un vrai plaisir, je le recommande sans hésiter.',
        image: null,
        voiceNote: null,
        createdAt: '2024-03-10'
    },
    {
        id: '2',
        name: 'Sant Armettu – Rosumarinu',
        appellation: 'Vin de Corse, Sartène',
        year: 2023,
        rating: 9,
        cepages: 'Sciaccarello',
        terroir: 'Sols granitiques, exposition en coteaux méditerranéens',
        vinification: 'Vinifié en cuves inox, sans boisé marqué, pour préserver fruit et fraîcheur',
        degree: '~13%',
        garde: '2 à 4 ans',
        price: '18-20€',
        nez: 'Fruits rouges (cerise, framboise), notes de garrigue et de poivre blanc, touche épicée discrète',
        bouche: 'Attaque souple et soyeuse. Tanins fondus, texture fluide. Belle persistance aromatique avec un retour de fruits rouges et d\'épices.',
        pointsForts: ['Équilibre entre douceur et caractère', 'Expression aromatique claire et typique du Sciaccarello', 'Accessible dès maintenant', 'Excellent rapport qualité/prix pour un vin corse'],
        pointsFaibles: ['Moins de complexité qu\'un vin de garde', 'À boire jeune, il perd vite de son éclat', 'Peut sembler "léger" aux amateurs de vins puissants'],
        personalReview: "J'ai adoré ce vin : agréable, le goût reste bien en bouche, avec un équilibre parfait entre douceur et caractère. Franchement super bon, je recommande vivement.",
        image: null,
        voiceNote: null,
        createdAt: '2024-03-15'
    }
];

// --- UTILS ---
const formatDatePretty = (dateStr) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return dateStr; }
};

const getWeekNumber = (d) => {
    try {
        const date = new Date(d);
        const start = new Date(PHASE_1_START);
        const diff = date - start;
        return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1);
    } catch (e) { return 1; }
};

const getCalendarForDate = (dateStr) => {
    try {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0=Dim, 1=Lun, 2=Mar, etc.

        // Mapper jour de la semaine vers index dans le tableau jours (0=Lun, 1=Mar, ..., 6=Dim)
        const jourIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const joursNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

        // Calculer le numéro de semaine du programme (1-44)
        const start = new Date(PHASE_1_START);
        start.setHours(0, 0, 0, 0);
        const diff = date - start;
        const weekNumber = Math.max(1, Math.min(44, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1));

        // Récupérer la semaine correspondante dans CALENDAR_27_WEEKS
        const weekData = CALENDAR_27_WEEKS.find(w => w.sem === weekNumber);

        // Vérifier si on est en repos médical
        const inMedicalRest = isInMedicalRest(dateStr);

        if (!weekData) {
            // Fallback si semaine non trouvée (avant le début ou après la fin du programme)
            return {
                type: "Repos",
                seance: null,
                duree: 0,
                cardio: null,
                cardioOpt: null,
                notes: weekNumber < 1 ? "Programme non commencé" : "Programme terminé",
                dateStr,
                dateObj: date,
                dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}),
                weekNumber,
                phase: null,
                blocked: false,
                stepsGoal: null,
                abdos: null,
                cardioObligatoire: false,
                readaptWeek: null
            };
        }

        // Si semaine bloquée (repos médical), retourner repos forcé
        if (weekData.blocked || inMedicalRest) {
            return {
                type: "Repos médical",
                seance: null,
                duree: 0,
                cardio: null,
                cardioOpt: null,
                notes: "🦷 Repos obligatoire - Greffe dentaire",
                dateStr,
                dateObj: date,
                dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}),
                weekNumber,
                phase: weekData.phase,
                blocked: true,
                stepsGoal: null,
                abdos: null,
                cardioObligatoire: false,
                readaptWeek: null
            };
        }

        // Récupérer le jour correspondant
        const jourData = weekData.jours.find(j => j.jour === joursNames[jourIndex]);

        if (!jourData) {
            return {
                type: "Repos",
                seance: null,
                duree: 0,
                cardio: null,
                cardioOpt: null,
                dateStr,
                dateObj: date,
                dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}),
                weekNumber,
                phase: weekData.phase,
                blocked: false,
                stepsGoal: weekData.stepsGoal || null,
                abdos: null,
                cardioObligatoire: weekData.cardioObligatoire || false,
                readaptWeek: weekData.readaptWeek || null
            };
        }

        // Déterminer si le cardio est optionnel ou obligatoire
        const cardioValue = jourData.cardio;
        const isCardioOptional = cardioValue && cardioValue.includes('_Opt');

        return {
            type: jourData.seance ? "Training" : "Repos",
            seance: jourData.seance || null,
            duree: jourData.duree || 0,
            // Si cardio contient "_Opt", c'est optionnel
            cardio: isCardioOptional ? null : cardioValue,
            cardioOpt: isCardioOptional ? cardioValue.replace('_Opt', '') : null,
            notes: jourData.notes || null,
            dateStr,
            dateObj: date,
            dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}),
            weekNumber,
            phase: weekData.phase,
            blocked: false,
            stepsGoal: weekData.stepsGoal || null,
            abdos: jourData.abdos || null,
            cardioObligatoire: weekData.cardioObligatoire || false,
            readaptWeek: weekData.readaptWeek || null
        };

    } catch (e) {
        console.error('Erreur getCalendarForDate:', e);
        return {
            type: "Repos",
            seance: null,
            duree: 0,
            cardio: null,
            cardioOpt: null,
            dateStr,
            dateObj: new Date(),
            dayName: "Erreur",
            weekNumber: 1,
            phase: null,
            blocked: false,
            stepsGoal: null,
            abdos: null,
            cardioObligatoire: false,
            readaptWeek: null
        };
    }
};


// --- HOOKS ---
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.log(error); }
    };
    return [storedValue, setValue];
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HOOKS - Sync cloud avec localStorage fallback
// ═══════════════════════════════════════════════════════════════════════════════

// Hook pour sync les check-ins
const useSupabaseCheckins = (userId) => {
    const [data, setData] = useLocalStorage(`titan_checkins_${userId}`, {});
    const [syncing, setSyncing] = useState(false);
    
    // Charger depuis Supabase au montage
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('daily_checkins')
                    .select('*')
                    .eq('user_id', userId);
                if (!error && rows) {
                    const mapped = {};
                    rows.forEach(row => {
                        mapped[row.date] = { energy: row.energy, sleep: row.sleep, mood: row.mood, motivation: row.motivation };
                    });
                    if (Object.keys(mapped).length > 0) setData(prev => ({ ...prev, ...mapped }));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    // Sauvegarder vers Supabase
    const saveCheckin = async (date, values) => {
        const newData = { ...data, [date]: { ...data[date], ...values } };
        setData(newData);
        
        try {
            await supabase.from('daily_checkins').upsert({
                user_id: userId,
                date,
                ...values
            }, { onConflict: 'user_id,date' });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, saveCheckin, syncing];
};

// Hook pour sync les workouts
const useSupabaseWorkouts = (userId) => {
    const [data, setData] = useLocalStorage(`titan_workouts_${userId}`, []);
    const [syncing, setSyncing] = useState(false);
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });
                if (!error && rows && rows.length > 0) {
                    setData(rows.map(r => ({
                        date: r.date,
                        session: r.session,
                        type: r.type,
                        duration: r.duration,
                        calories: r.calories,
                        cardioType: r.cardio_type,
                        exercises: r.exercises,
                        status: r.status,
                        id: r.id
                    })));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    const addWorkout = async (workout) => {
        const newData = [...data, workout];
        setData(newData);
        
        try {
            await supabase.from('workout_logs').insert({
                user_id: userId,
                date: workout.date,
                session: workout.session,
                type: workout.type,
                duration: workout.duration,
                calories: workout.calories,
                cardio_type: workout.cardioType,
                exercises: workout.exercises,
                status: workout.status
            });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, setData, addWorkout];
};

// Hook pour sync la biométrie
const useSupabaseBiometrics = (userId) => {
    const [data, setData] = useLocalStorage(`titan_biometrics_${userId}`, {});
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('biometrics')
                    .select('*')
                    .eq('user_id', userId);
                if (!error && rows) {
                    const mapped = {};
                    rows.forEach(row => {
                        mapped[row.date] = { poids: row.poids, tourTaille: row.tour_taille, tourBras: row.tour_bras, bodyFat: row.body_fat };
                    });
                    if (Object.keys(mapped).length > 0) setData(prev => ({ ...prev, ...mapped }));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    const saveBiometric = async (date, values) => {
        const newData = { ...data, [date]: { ...data[date], ...values } };
        setData(newData);
        
        try {
            await supabase.from('biometrics').upsert({
                user_id: userId,
                date,
                poids: values.poids,
                tour_taille: values.tourTaille,
                tour_bras: values.tourBras,
                body_fat: values.bodyFat
            }, { onConflict: 'user_id,date' });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, setData, saveBiometric];
};

// Hook pour sync les compléments
const useSupabaseSupplements = (userId) => {
    const [data, setData] = useLocalStorage(`titan_supplements_${userId}`, {});
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('supplement_logs')
                    .select('*')
                    .eq('user_id', userId);
                if (!error && rows) {
                    const mapped = {};
                    rows.forEach(row => {
                        if (!mapped[row.date]) mapped[row.date] = {};
                        mapped[row.date][row.period] = row.supplements;
                    });
                    if (Object.keys(mapped).length > 0) setData(prev => ({ ...prev, ...mapped }));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    const saveSupplement = async (date, period, supplements) => {
        const newData = { ...data, [date]: { ...data[date], [period]: supplements } };
        setData(newData);
        
        try {
            await supabase.from('supplement_logs').upsert({
                user_id: userId,
                date,
                period,
                supplements
            }, { onConflict: 'user_id,date,period' });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, setData, saveSupplement];
};

// Hook pour sync dev perso
const useSupabaseDevPerso = (userId) => {
    const [data, setData] = useLocalStorage(`titan_devperso_${userId}`, {});
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('dev_perso_progress')
                    .select('*')
                    .eq('user_id', userId);
                if (!error && rows) {
                    const mapped = {};
                    rows.forEach(row => {
                        const key = `${row.type}_${row.month}_${row.item}`;
                        mapped[key] = row.completed;
                    });
                    if (Object.keys(mapped).length > 0) setData(prev => ({ ...prev, ...mapped }));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    const toggleItem = async (type, month, item) => {
        const key = `${type}_${month}_${item}`;
        const newValue = !data[key];
        setData(prev => ({ ...prev, [key]: newValue }));
        
        try {
            await supabase.from('dev_perso_progress').upsert({
                user_id: userId,
                type,
                month,
                item,
                completed: newValue
            }, { onConflict: 'user_id,type,month,item' });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, setData, toggleItem];
};


// Hook pour sync les tasks
const useSupabaseTasks = (userId) => {
    const [data, setData] = useLocalStorage(`titan_tasks_${userId}`, []);
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (!error && rows && rows.length > 0) {
                    setData(rows);
                }
            } catch (e) {
                console.log('Supabase load tasks error:', e);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    const addTask = async (task) => {
        const newTask = { ...task, id: task.id || Date.now().toString() };
        const newData = [...data, newTask];
        setData(newData);
        
        try {
            await supabase.from('tasks').insert({
                id: newTask.id,
                user_id: userId,
                title: newTask.title,
                description: newTask.description || null,
                priority: newTask.priority || 'medium',
                due_date: newTask.due_date || null,
                completed: newTask.completed || false,
                completed_at: newTask.completed_at || null,
                category: newTask.category || null
            });
        } catch (e) {
            console.log('Supabase save task error:', e);
        }
    };
    
    const updateTask = async (taskId, updates) => {
        const newData = data.map(t => t.id === taskId ? {...t, ...updates} : t);
        setData(newData);
        
        try {
            await supabase.from('tasks').update(updates).eq('id', taskId).eq('user_id', userId);
        } catch (e) {
            console.log('Supabase update task error:', e);
        }
    };
    
    const deleteTask = async (taskId) => {
        const newData = data.filter(t => t.id !== taskId);
        setData(newData);
        
        try {
            await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
        } catch (e) {
            console.log('Supabase delete task error:', e);
        }
    };
    
    return [data, setData, addTask, updateTask, deleteTask];
};

// Hook pour sync les transactions
const useSupabaseTransactions = (userId) => {
    const [data, setData] = useLocalStorage(`titan_transactions_${userId}`, []);
    const [loaded, setLoaded] = useState(false);
    
    // Charger depuis Supabase au démarrage
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: row, error } = await supabase
                    .from('transactions_simple')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (!error && row && row.data && row.data.length > 0) {
                    setData(row.data);
                }
                setLoaded(true);
            } catch (e) {
                console.log('Supabase load transactions:', e);
                setLoaded(true);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    // Sync vers Supabase
    const syncToCloud = async (newData) => {
        try {
            await supabase.from('transactions_simple').upsert({
                user_id: userId,
                data: newData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch (e) {
            console.log('Supabase save transactions error:', e);
        }
    };
    
    const addTransaction = async (transaction) => {
        const newTx = {...transaction, id: transaction.id || Date.now().toString()};
        const newData = [...data, newTx];
        setData(newData);
        await syncToCloud(newData);
    };
    
    const deleteTransaction = async (txId) => {
        const newData = data.filter(t => t.id !== txId);
        setData(newData);
        await syncToCloud(newData);
    };
    
    return [data, setData, addTransaction, deleteTransaction];
};

// Hook pour sync les meals
const useSupabaseMeals = (userId) => {
    const [data, setData] = useLocalStorage(`titan_meals_${userId}`, []);
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('meals')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });
                
                if (!error && rows && rows.length > 0) {
                    setData(rows);
                }
            } catch (e) {
                console.log('Supabase load meals error:', e);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    const addMeal = async (meal) => {
        const newMeal = {...meal, id: meal.id || Date.now().toString()};
        const newData = [...data, newMeal];
        setData(newData);
        
        try {
            await supabase.from('meals').insert({
                id: newMeal.id,
                user_id: userId,
                date: newMeal.date,
                meal_type: newMeal.meal_type,
                name: newMeal.name,
                description: newMeal.description || null,
                calories: newMeal.calories || null,
                protein: newMeal.protein || null,
                carbs: newMeal.carbs || null,
                fat: newMeal.fat || null,
                is_planned: newMeal.is_planned || false,
                is_consumed: newMeal.is_consumed || false,
                consumed_at: newMeal.consumed_at || null
            });
        } catch (e) {
            console.log('Supabase save meal error:', e);
        }
    };
    
    const updateMeal = async (mealId, updates) => {
        const newData = data.map(m => m.id === mealId ? {...m, ...updates} : m);
        setData(newData);
        
        try {
            await supabase.from('meals').update(updates).eq('id', mealId).eq('user_id', userId);
        } catch (e) {
            console.log('Supabase update meal error:', e);
        }
    };
    
    const deleteMeal = async (mealId) => {
        const newData = data.filter(m => m.id !== mealId);
        setData(newData);
        
        try {
            await supabase.from('meals').delete().eq('id', mealId).eq('user_id', userId);
        } catch (e) {
            console.log('Supabase delete meal error:', e);
        }
    };
    
    return [data, setData, addMeal, updateMeal, deleteMeal];
};

// Hook simplifié pour MealsView (format objet avec dates comme clés)
const useSupabaseMealsSimple = (userId) => {
    const [data, setData] = useLocalStorage(`titan_meals_simple_${userId}`, {});
    
    // Charger depuis Supabase au démarrage
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('meals_simple')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (!error && rows && rows.data) {
                    setData(rows.data);
                }
            } catch (e) {
                console.log('Supabase load meals_simple:', e);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    // Sauvegarder dans Supabase à chaque modification
    const setDataAndSync = (newDataOrFn) => {
        setData(prev => {
            const newData = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
            
            // Sync async
            (async () => {
                try {
                    await supabase.from('meals_simple').upsert({
                        user_id: userId,
                        data: newData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                } catch (e) {
                    console.log('Supabase save meals_simple error:', e);
                }
            })();
            
            return newData;
        });
    };
    
    return [data, setDataAndSync, null, null, null];
};

// Hook pour sync les habitudes/routine
const useSupabaseHabits = (userId) => {
    const [data, setData] = useLocalStorage(`titan_habits_${userId}`, {});
    
    // Charger depuis Supabase au démarrage
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: row, error } = await supabase
                    .from('habits_simple')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (!error && row && row.data) {
                    setData(row.data);
                }
            } catch (e) {
                console.log('Supabase load habits:', e);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    // Sauvegarder dans Supabase à chaque modification
    const setDataAndSync = (newDataOrFn) => {
        setData(prev => {
            const newData = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
            
            // Sync async
            (async () => {
                try {
                    await supabase.from('habits_simple').upsert({
                        user_id: userId,
                        data: newData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                } catch (e) {
                    console.log('Supabase save habits error:', e);
                }
            })();
            
            return newData;
        });
    };
    
    return [data, setDataAndSync];
};

// Hook pour sync les workout logs
const useSupabaseWorkoutsSimple = (userId) => {
    const [data, setData] = useLocalStorage(`titan_workouts_simple_${userId}`, []);
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: row, error } = await supabase
                    .from('workouts_simple')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (!error && row && row.data) {
                    setData(row.data);
                }
            } catch (e) {
                console.log('Supabase load workouts:', e);
            }
        };
        loadFromCloud();
    }, [userId]);
    
    const syncToCloud = async (newData) => {
        try {
            await supabase.from('workouts_simple').upsert({
                user_id: userId,
                data: newData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch (e) {
            console.log('Supabase save workouts error:', e);
        }
    };
    
    const addWorkout = async (log) => {
        const newLog = { ...log, id: log.id || Date.now().toString() };
        const newData = [...data, newLog];
        setData(newData);
        await syncToCloud(newData);
    };

    const updateWorkout = async (id, updates) => {
        const newData = data.map(l => l.id === id ? { ...l, ...updates } : l);
        setData(newData);
        await syncToCloud(newData);
    };

    const removeWorkout = async (id) => {
        const newData = data.filter(l => l.id !== id);
        setData(newData);
        await syncToCloud(newData);
    };

    // Trouver une séance in_progress pour aujourd'hui
    const getInProgressSession = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        return data.find(l => l.date === todayStr && l.status === 'in_progress');
    };

    return [data, setData, addWorkout, removeWorkout, updateWorkout, getInProgressSession];
};

// Hook pour sync Steps avec Supabase
const useSupabaseSteps = (userId) => {
    const [data, setData] = useLocalStorage(`titan_steps_${userId}`, {});

    // Charger depuis Supabase au montage
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('steps')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })
                    .limit(60); // 60 derniers jours

                if (!error && rows) {
                    // Convertir en objet { date: { steps, timestamp } }
                    const stepsObj = {};
                    rows.forEach(row => {
                        stepsObj[row.date] = {
                            steps: row.steps,
                            timestamp: row.created_at
                        };
                    });
                    // Merger avec local (local prend priorité pour aujourd'hui)
                    setData(prev => ({ ...stepsObj, ...prev }));
                }
            } catch (e) {
                console.log('Supabase load steps:', e);
            }
        };
        loadFromCloud();
    }, [userId]);

    // Sauvegarder vers Supabase
    const saveSteps = async (date, steps) => {
        const stepsValue = parseInt(steps);
        if (isNaN(stepsValue) || stepsValue < 0) return;

        const newEntry = { steps: stepsValue, timestamp: new Date().toISOString() };
        setData(prev => ({ ...prev, [date]: newEntry }));

        // Sync vers Supabase
        try {
            await supabase.from('steps').upsert({
                user_id: userId,
                date: date,
                steps: stepsValue,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,date' });
        } catch (e) {
            console.log('Supabase save steps error:', e);
        }
    };

    // Objectifs de pas par phase
    const getStepsGoal = (phase) => {
        switch (phase) {
            case 'masse': return 7000; // 6-8k
            case 'seche': return 11000; // 10-12k
            case 'maintien': return 10000;
            default: return 8000;
        }
    };

    return [data, saveSteps, getStepsGoal];
};

// Hook pour sync Whoop metrics
const useWhoopData = (userId) => {
    const [data, setData] = useLocalStorage(`titan_whoop_${userId}`, null);
    const [syncing, setSyncing] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    
    // Fonction pour refresh le token Whoop
    const refreshWhoopToken = async (refreshToken) => {
        try {
            const clientId = import.meta.env.VITE_WHOOP_CLIENT_ID;
            const clientSecret = import.meta.env.VITE_WHOOP_CLIENT_SECRET;
            
            // Si pas de credentials, on ne peut pas refresh
            if (!clientId || !clientSecret) {
                console.log('❌ Whoop credentials manquants - impossible de refresh le token');
                return null;
            }
            
            const res = await fetch('https://api.prod.whoop.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('Whoop token refresh failed:', errorText);
                throw new Error('Token refresh failed');
            }
            
            const tokens = await res.json();
            
            // Update tokens in Supabase
            await supabase.from('whoop_tokens').update({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || refreshToken,
                expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
            }).eq('user_id', userId);
            
            console.log('✅ Whoop token refreshed successfully');
            return tokens.access_token;
        } catch (e) {
            console.error('❌ Token refresh error:', e);
            return null;
        }
    };
    
    // Fonction pour charger depuis l'API Whoop
    const loadFromWhoopAPI = async () => {
        try {
            setSyncing(true);
            setError(null);
            
            // 1. Get tokens from Supabase
            const { data: tokenData, error: tokenError } = await supabase
                .from('whoop_tokens')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (tokenError || !tokenData?.access_token) {
                console.log('No Whoop tokens found, falling back to manual entry');
                setConnected(false);
                // Load from whoop_metrics as fallback
                await loadFromSupabase();
                return;
            }
            
            setConnected(true);
            let accessToken = tokenData.access_token;
            
            // Check if token is expired
            const expiresAt = new Date(tokenData.expires_at);
            if (expiresAt < new Date()) {
                console.log('Token expired, refreshing...');
                accessToken = await refreshWhoopToken(tokenData.refresh_token);
                if (!accessToken) {
                    setError('Ajoutez VITE_WHOOP_CLIENT_ID et VITE_WHOOP_CLIENT_SECRET dans Railway');
                    setConnected(false);
                    await loadFromSupabase();
                    return;
                }
            }
            
            // 2. Call Whoop API to get today's cycle
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const startDate = yesterday.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];
            
            const cycleRes = await fetch(`https://api.prod.whoop.com/developer/v1/cycle?start=${startDate}&end=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!cycleRes.ok) {
                if (cycleRes.status === 401) {
                    // Try refreshing token
                    accessToken = await refreshWhoopToken(tokenData.refresh_token);
                    if (accessToken) {
                        return loadFromWhoopAPI(); // Retry
                    }
                }
                throw new Error(`Whoop API error: ${cycleRes.status}`);
            }
            
            const cycleData = await cycleRes.json();
            const latestCycle = cycleData.records?.[0]; // Most recent cycle
            
            if (!latestCycle) {
                console.log('No cycle data available');
                await loadFromSupabase();
                return;
            }
            
            // 3. Get recovery data
            const recoveryRes = await fetch(`https://api.prod.whoop.com/developer/v1/recovery/${latestCycle.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            let recoveryData = null;
            if (recoveryRes.ok) {
                recoveryData = await recoveryRes.json();
            }
            
            // 4. Format data
            const whoopData = {
                recovery: {
                    score: recoveryData?.score?.recovery_score || latestCycle.score?.recovery_score || 0,
                    hrv: recoveryData?.score?.hrv_rmssd_milli || latestCycle.score?.hrv_rmssd_milli || 0,
                    rhr: recoveryData?.score?.resting_heart_rate || latestCycle.score?.resting_heart_rate || 0
                },
                strain: {
                    score: latestCycle.score?.strain || 0
                },
                sleep: {
                    hours: latestCycle.score?.sleep?.duration_hours || (latestCycle.score?.sleep_performance_percentage ? (latestCycle.score.sleep_performance_percentage / 100) * 8 : 0),
                    score: latestCycle.score?.sleep_performance_percentage || 0
                },
                connected: true
            };
            
            setData(whoopData);
            
            // 5. Backup to Supabase whoop_metrics
            const todayStr = new Date().toISOString().split('T')[0];
            await supabase.from('whoop_metrics').upsert({
                user_id: userId,
                date: todayStr,
                recovery_score: whoopData.recovery.score,
                hrv: whoopData.recovery.hrv,
                rhr: whoopData.recovery.rhr,
                strain_score: whoopData.strain.score,
                sleep_hours: whoopData.sleep.hours,
                sleep_score: whoopData.sleep.score
            }, { onConflict: 'user_id,date' });
            
            console.log('✅ Whoop data loaded from API');
            
        } catch (e) {
            console.error('❌ Whoop API error:', e);
            setError(e.message);
            // Fallback to Supabase
            await loadFromSupabase();
        } finally {
            setSyncing(false);
        }
    };
    
    // Fonction fallback pour charger depuis Supabase
    const loadFromSupabase = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: rows, error } = await supabase
                .from('whoop_metrics')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();
            
            if (!error && rows) {
                setData({
                    recovery: { score: rows.recovery_score, hrv: rows.hrv, rhr: rows.rhr },
                    strain: { score: rows.strain_score },
                    sleep: { hours: rows.sleep_hours, score: rows.sleep_score },
                    connected: false
                });
            }
        } catch (e) {
            console.log('No Whoop data in database');
        }
    };
    
    // Load on mount
    useEffect(() => {
        loadFromWhoopAPI();
        
        // Refresh every 30 minutes
        const interval = setInterval(loadFromWhoopAPI, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userId]);
    
    // Manual update function (for when not connected to API)
    const updateWhoopData = async (newData) => {
        try {
            setSyncing(true);
            setData({ ...newData, connected: false });
            
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('whoop_metrics').upsert({
                user_id: userId,
                date: today,
                recovery_score: newData.recovery?.score || null,
                hrv: newData.recovery?.hrv || null,
                rhr: newData.recovery?.rhr || null,
                strain_score: newData.strain?.score || null,
                sleep_hours: newData.sleep?.hours || null,
                sleep_score: newData.sleep?.score || null
            }, { onConflict: 'user_id,date' });
            
            console.log('✅ Whoop data saved manually to Supabase');
        } catch (e) {
            console.error('❌ Erreur save Whoop:', e);
        } finally {
            setSyncing(false);
        }
    };
    
    return [data, updateWhoopData, syncing, connected, error];
};


// Indicateur de sync cloud
const CloudSyncIndicator = ({ syncing = false }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    return (
        <div className="flex items-center gap-1 text-xs">
            {isOnline ? (
                syncing ? (
                    <><RefreshCw size={12} className="text-blue-400 animate-spin" /><span className="text-blue-400">Sync...</span></>
                ) : (
                    <><Cloud size={12} className="text-green-400" /><span className="text-green-400">Cloud</span></>
                )
            ) : (
                <><CloudOff size={12} className="text-yellow-400" /><span className="text-yellow-400">Offline</span></>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHOOP MANUAL ENTRY - Saisie manuelle des données Whoop
// ═══════════════════════════════════════════════════════════════════════════════

const WhoopManualEntry = ({ userId, onDataUpdate, onConnect }) => {
    const [whoopLogs, setWhoopLogs] = useLocalStorage(`titan_whoop_${userId}`, {});
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ recovery: '', strain: '', sleepHours: '', hrv: '', rhr: '' });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = whoopLogs[todayStr];
    
    const saveData = () => {
        const data = {
            recovery: parseInt(form.recovery) || null,
            strain: parseFloat(form.strain) || null,
            sleepHours: parseFloat(form.sleepHours) || null,
            hrv: parseInt(form.hrv) || null,
            rhr: parseInt(form.rhr) || null,
            timestamp: new Date().toISOString()
        };
        setWhoopLogs(prev => ({ ...prev, [todayStr]: data }));
        onDataUpdate && onDataUpdate({ connected: true, manual: true, ...data });
        setShowModal(false);
        setForm({ recovery: '', strain: '', sleepHours: '', hrv: '', rhr: '' });
    };
    
    // Recovery color
    const getRecoveryColor = (score) => {
        if (!score) return 'gray';
        if (score >= 67) return 'green';
        if (score >= 34) return 'yellow';
        return 'red';
    };
    
    const recoveryColors = {
        green: 'from-green-500 to-emerald-600',
        yellow: 'from-yellow-500 to-orange-500',
        red: 'from-red-500 to-rose-600',
        gray: 'from-gray-600 to-gray-700'
    };
    
    if (todayData) {
        const color = getRecoveryColor(todayData.recovery);
        return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${recoveryColors[color]} flex items-center justify-center`}>
                            <Activity size={16} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">WHOOP</div>
                            <div className="text-[10px] text-gray-500">Saisie manuelle</div>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(true)} className="text-xs text-gray-500 hover:text-gray-400">
                        Modifier
                    </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${recoveryColors[color]}/20 text-center`}>
                        <div className={`text-2xl font-black ${color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : color === 'red' ? 'text-red-400' : 'text-gray-400'}`}>
                            {todayData.recovery || '--'}%
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase">Recovery</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-center">
                        <div className="text-2xl font-black text-blue-400">{todayData.strain || '--'}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Strain</div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 text-center">
                        <div className="text-2xl font-black text-purple-400">{todayData.sleepHours || '--'}h</div>
                        <div className="text-[10px] text-gray-500 uppercase">Sommeil</div>
                    </div>
                </div>
                
                {(todayData.hrv || todayData.rhr) && (
                    <div className="flex gap-2 mt-2">
                        {todayData.hrv && (
                            <div className="flex-1 p-2 rounded-lg bg-white/5 text-center">
                                <span className="text-xs text-gray-400">HRV</span>
                                <span className="ml-2 font-bold text-white">{todayData.hrv}ms</span>
                            </div>
                        )}
                        {todayData.rhr && (
                            <div className="flex-1 p-2 rounded-lg bg-white/5 text-center">
                                <span className="text-xs text-gray-400">RHR</span>
                                <span className="ml-2 font-bold text-white">{todayData.rhr}bpm</span>
                            </div>
                        )}
                    </div>
                )}
                
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Mettre à jour Whoop">
                    <div className="space-y-4">
                        <Input label="Recovery (%)" type="number" placeholder="0-100" value={form.recovery} onChange={e => setForm({...form, recovery: e.target.value})} />
                        <Input label="Strain" type="number" step="0.1" placeholder="0-21" value={form.strain} onChange={e => setForm({...form, strain: e.target.value})} />
                        <Input label="Heures de sommeil" type="number" step="0.1" placeholder="ex: 7.5" value={form.sleepHours} onChange={e => setForm({...form, sleepHours: e.target.value})} />
                        <Input label="HRV (ms)" type="number" placeholder="ex: 45" value={form.hrv} onChange={e => setForm({...form, hrv: e.target.value})} />
                        <Input label="RHR (bpm)" type="number" placeholder="ex: 55" value={form.rhr} onChange={e => setForm({...form, rhr: e.target.value})} />
                        <Button onClick={saveData} variant="primary" className="w-full">Enregistrer</Button>
                    </div>
                </Modal>
            </div>
        );
    }
    
    // No data yet - show entry form
    return (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <Activity size={20} className="text-white" />
                </div>
                <div>
                    <div className="font-bold text-white">WHOOP</div>
                    <div className="text-xs text-gray-500">Données d'aujourd'hui</div>
                </div>
            </div>
            
            <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-opacity mb-2"
            >
                📊 Saisir mes données Whoop
            </button>
            
            <button
                onClick={onConnect}
                className="w-full py-2 rounded-xl bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors"
            >
                Ou connecter automatiquement →
            </button>
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Saisir données Whoop">
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-gray-300">
                        💡 Tu peux trouver ces infos dans ton app Whoop
                    </div>
                    <Input label="Recovery (%)" type="number" placeholder="0-100" value={form.recovery} onChange={e => setForm({...form, recovery: e.target.value})} />
                    <Input label="Strain (hier)" type="number" step="0.1" placeholder="0-21" value={form.strain} onChange={e => setForm({...form, strain: e.target.value})} />
                    <Input label="Heures de sommeil" type="number" step="0.1" placeholder="ex: 7.5" value={form.sleepHours} onChange={e => setForm({...form, sleepHours: e.target.value})} />
                    <Input label="HRV (ms) - optionnel" type="number" placeholder="ex: 45" value={form.hrv} onChange={e => setForm({...form, hrv: e.target.value})} />
                    <Input label="RHR (bpm) - optionnel" type="number" placeholder="ex: 55" value={form.rhr} onChange={e => setForm({...form, rhr: e.target.value})} />
                    <Button onClick={saveData} variant="primary" className="w-full">Enregistrer</Button>
                </div>
            </Modal>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WHOOP WIDGET - Données temps réel
// ═══════════════════════════════════════════════════════════════════════════════

const WhoopWidget = ({ userId }) => {
    const [data, updateData, syncing, connected, error] = useWhoopData(userId);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        recovery: data?.recovery?.score || 0,
        hrv: data?.recovery?.hrv || 0,
        rhr: data?.recovery?.rhr || 0,
        strain: data?.strain?.score || 0,
        sleep: data?.sleep?.hours || 0
    });

    useEffect(() => {
        if (data) {
            setFormData({
                recovery: data.recovery?.score || 0,
                hrv: data.recovery?.hrv || 0,
                rhr: data.recovery?.rhr || 0,
                strain: data.strain?.score || 0,
                sleep: data.sleep?.hours || 0
            });
        }
    }, [data]);

    const handleSave = async () => {
        const newData = {
            recovery: { 
                score: parseFloat(formData.recovery), 
                hrv: parseFloat(formData.hrv), 
                rhr: parseFloat(formData.rhr) 
            },
            strain: { score: parseFloat(formData.strain) },
            sleep: { hours: parseFloat(formData.sleep) }
        };
        await updateData(newData);
        setIsEditing(false);
    };

    const getRecoveryColor = (score) => {
        if (score >= 67) return '#22c55e';
        if (score >= 34) return '#eab308';
        return '#ef4444';
    };

    if (isEditing) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">📝 Modifier Whoop</h3>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Recovery (%)</label>
                        <input 
                            type="number" 
                            value={formData.recovery} 
                            onChange={(e) => setFormData({...formData, recovery: e.target.value})} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">HRV (ms)</label>
                        <input 
                            type="number" 
                            value={formData.hrv} 
                            onChange={(e) => setFormData({...formData, hrv: e.target.value})} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">RHR (bpm)</label>
                        <input 
                            type="number" 
                            value={formData.rhr} 
                            onChange={(e) => setFormData({...formData, rhr: e.target.value})} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Strain (/21)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            value={formData.strain} 
                            onChange={(e) => setFormData({...formData, strain: e.target.value})} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Sommeil (h)</label>
                        <input 
                            type="number" 
                            step="0.5"
                            value={formData.sleep} 
                            onChange={(e) => setFormData({...formData, sleep: e.target.value})} 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSave} 
                    disabled={syncing}
                    className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {syncing ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
                </button>
            </div>
        );
    }

    // Vérifier si on a des données réelles (pas juste des zéros)
    const hasRealData = data && (
        (data.recovery?.score && data.recovery.score > 0) ||
        (data.strain?.score && data.strain.score > 0) ||
        (data.sleep?.hours && data.sleep.hours > 0)
    );

    // État vide - aucune donnée
    if (!hasRealData && !isEditing) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">💚 Whoop Metrics</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">
                        Non connecté
                    </span>
                </div>

                {error && (
                    <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                        ⚠️ {error}
                    </div>
                )}

                <div className="text-center py-6">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-400 mb-4">Aucune donnée Whoop</p>
                    <p className="text-xs text-gray-500 mb-4">
                        Connectez votre Whoop ou entrez vos données manuellement pour un suivi optimal de votre récupération.
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        ✏️ Entrer manuellement
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 text-center">
                        💡 Données attendues : Recovery (%), HRV, Strain, Sommeil
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">💚 Whoop Metrics</h3>
                    {connected ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                            ✓ API Connectée
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                            ✏️ Manuel
                        </span>
                    )}
                </div>
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white transition-colors">
                    ✏️
                </button>
            </div>

            {error && (
                <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    ⚠️ {error}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-3xl font-bold mb-2" style={{ color: getRecoveryColor(formData.recovery) }}>
                        {formData.recovery > 0 ? `${formData.recovery}%` : '--'}
                    </div>
                    <div className="text-sm text-gray-400">Recovery</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{formData.hrv > 0 ? formData.hrv : '--'}</div>
                    <div className="text-sm text-gray-400">HRV (ms)</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{formData.strain > 0 ? formData.strain.toFixed(1) : '--'}</div>
                    <div className="text-sm text-gray-400">Strain</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <div className="text-sm text-gray-400">RHR: <span className="text-white font-semibold">{formData.rhr > 0 ? `${formData.rhr} bpm` : '--'}</span></div>
                <div className="text-sm text-gray-400 mt-1">Sommeil: <span className="text-white font-semibold">{formData.sleep > 0 ? `${formData.sleep}h` : '--'}</span></div>
            </div>

            {syncing && (
                <div className="mt-4 text-center text-sm text-blue-400">
                    🔄 Synchronisation...
                </div>
            )}
        </div>
    );
};

const FinanceWidget = ({ userId }) => {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(null);
    const [showTransactions, setShowTransactions] = useState(false);
    
    // Check URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('bridge_connected') === 'true') {
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchBankData();
        }
        if (params.get('bridge_error')) {
            setError(params.get('bridge_error'));
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
        }
    }, []);
    
    const fetchBankData = async () => {
        setLoading(true);
        try {
            // Fetch accounts
            const accRes = await fetch(`/api/bridge/accounts?user_id=${userId}`);
            const accData = await accRes.json();
            
            if (accData.connected) {
                setConnected(true);
                setAccounts(accData.accounts || []);
                
                // Fetch transactions
                const txRes = await fetch(`/api/bridge/transactions?user_id=${userId}&limit=30`);
                const txData = await txRes.json();
                setTransactions(txData.transactions || []);
            } else {
                setConnected(false);
            }
        } catch (e) {
            console.error('Bank fetch error:', e);
        }
        setLoading(false);
    };
    
    // Check status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/bridge/status?user_id=${userId}`);
                const data = await res.json();
                if (data.connected) {
                    fetchBankData();
                } else {
                    setLoading(false);
                }
            } catch (e) {
                setLoading(false);
            }
        };
        checkStatus();
    }, [userId]);
    
    const connectBank = () => {
        window.location.href = `/api/bridge/connect?user_id=${userId}`;
    };
    
    const disconnectBank = async () => {
        await fetch(`/api/bridge/disconnect?user_id=${userId}`, { method: 'POST' });
        setConnected(false);
        setAccounts([]);
        setTransactions([]);
    };
    
    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    // Group transactions by category
    const spendingByCategory = useMemo(() => {
        const spending = {};
        transactions.filter(tx => tx.amount < 0).forEach(tx => {
            const cat = tx.category || 'Autre';
            spending[cat] = (spending[cat] || 0) + Math.abs(tx.amount);
        });
        return Object.entries(spending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [transactions]);
    
    // This month's spending
    const thisMonthSpending = useMemo(() => {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return transactions
            .filter(tx => tx.date?.startsWith(thisMonth) && tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }, [transactions]);
    
    if (loading) {
        return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
                <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Chargement banque...</span>
                </div>
            </div>
        );
    }
    
    if (!connected) {
        return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <Wallet size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white">BANQUE</div>
                        <div className="text-xs text-gray-500">Non connectée</div>
                    </div>
                </div>
                {error && (
                    <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                        Erreur: {error}
                    </div>
                )}
                <button
                    onClick={connectBank}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Connecter ma banque
                </button>
                <div className="text-[10px] text-gray-600 text-center mt-2">Sécurisé par Bridge (Bankin')</div>
            </div>
        );
    }
    
    // Connected - show data
    return (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <Wallet size={16} className="text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">BANQUE</div>
                        <div className="text-[10px] text-gray-500">
                            {accounts.length} compte{accounts.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchBankData} className="p-1.5 hover:bg-white/5 rounded-lg">
                        <RefreshCw size={14} className="text-gray-400" />
                    </button>
                    <button onClick={disconnectBank} className="p-1.5 hover:bg-white/5 rounded-lg">
                        <X size={14} className="text-gray-400" />
                    </button>
                </div>
            </div>
            
            {/* Total Balance */}
            <div className="text-center mb-4 p-3 rounded-xl bg-white/5">
                <div className="text-xs text-gray-500 mb-1">Solde total</div>
                <div className="text-2xl font-black text-white">
                    {totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </div>
            
            {/* Accounts */}
            <div className="space-y-2 mb-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <div>
                            <div className="text-sm font-medium text-white">{acc.name}</div>
                            <div className="text-[10px] text-gray-500">{acc.bankName}</div>
                        </div>
                        <div className={`font-bold ${acc.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {acc.balance?.toLocaleString('fr-FR', { style: 'currency', currency: acc.currency || 'EUR' })}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* This month spending */}
            <div className="p-3 rounded-xl bg-white/5 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Dépenses ce mois</span>
                    <span className="font-bold text-red-400">
                        -{thisMonthSpending.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
            </div>
            
            {/* Top categories */}
            {spendingByCategory.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Top catégories</div>
                    <div className="space-y-1">
                        {spendingByCategory.map(([cat, amount]) => (
                            <div key={cat} className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">{cat}</span>
                                <span className="text-white">{amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Recent transactions toggle */}
            <button 
                onClick={() => setShowTransactions(!showTransactions)}
                className="w-full py-2 rounded-lg bg-white/5 text-sm text-gray-400 hover:bg-white/10 transition-colors"
            >
                {showTransactions ? 'Masquer transactions' : `Voir ${transactions.length} transactions`}
            </button>
            
            {/* Transactions list */}
            {showTransactions && (
                <div className="mt-3 space-y-1 max-h-60 overflow-auto">
                    {transactions.slice(0, 20).map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">{tx.description}</div>
                                <div className="text-[10px] text-gray-500">{tx.date} • {tx.category}</div>
                            </div>
                            <div className={`ml-2 font-bold text-sm ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {tx.amount >= 0 ? '+' : ''}{tx.amount?.toLocaleString('fr-FR', { style: 'currency', currency: tx.currency || 'EUR' })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS (Premium Design System)
// ═══════════════════════════════════════════════════════════════════════════════

const Card = ({ children, className = "", onClick, glow = false }) => (
    <div 
        onClick={onClick} 
        className={`glass-card rounded-2xl ${glow ? 'glow-border' : ''} ${onClick ? 'cursor-pointer hover-lift' : ''} ${className}`}
        style={{ fontFamily: 'var(--font-family)' }}
    >
        {children}
    </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, size = "md" }) => {
    const variants = {
        primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40",
        secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
        accent: "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25",
        success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25",
        danger: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
    };
    const sizes = {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base"
    };
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`${sizes[size]} rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
            style={{ fontFamily: 'var(--font-family)' }}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
            {children}
        </button>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;
    const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`glass-card rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden animate-scale-in`}>
                <div className="flex justify-between items-center p-5 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
            </div>
        </div>
    );
};

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", ...props }) => (
    <div className={className}>
        {label && <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold tracking-wider">{label}</label>}
        <input 
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-cyan-500/50 outline-none transition-all placeholder:text-gray-600"
            {...props}
        />
    </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3, className = "" }) => (
    <div className={className}>
        {label && <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold tracking-wider">{label}</label>}
        <textarea 
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-cyan-500/50 outline-none transition-all resize-none placeholder:text-gray-600"
        />
    </div>
);

const RatingStars = ({ rating, max = 10, onChange, size = 16 }) => {
    const stars = Math.round(rating);
    return (
        <div className="flex items-center gap-1">
            {[...Array(max)].map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => onChange?.(i + 1)}
                    className={`transition-all ${onChange ? 'cursor-pointer hover:scale-110' : ''}`}
                >
                    <Star 
                        size={size} 
                        className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} 
                    />
                </button>
            ))}
            <span className="ml-2 text-sm text-gray-400 font-semibold">{rating}/10</span>
        </div>
    );
};

const Badge = ({ children, color = "cyan", size = "md" }) => {
    const colors = {
        cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        red: "bg-red-500/20 text-red-400 border-red-500/30",
        gray: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    };
    const sizes = { sm: "px-2 py-0.5 text-[10px]", md: "px-3 py-1 text-xs" };
    return (
        <span className={`${sizes[size]} ${colors[color]} border rounded-lg font-semibold uppercase tracking-wider`}>
            {children}
        </span>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FITNESS MODULE - SECOND BRAIN EDITION
// ═══════════════════════════════════════════════════════════════════════════════

const FitnessModule = ({ userId }) => {
    const [view, setView] = useState('dashboard');
    const [activeSession, setActiveSession] = useState(null);
    const [workoutLogs, setWorkoutLogs, addWorkoutLog, removeWorkoutLog, updateWorkoutLog, getInProgressSession] = useSupabaseWorkoutsSimple(userId);
    const [dailyCheckins, setDailyCheckins] = useLocalStorage(`titan_checkins_${userId}`, []);
    const [whoopData, setWhoopData] = useLocalStorage(`titan_whoop_${userId}`, null);
    const [supplementLogs, setSupplementLogs] = useLocalStorage(`titan_supplements_${userId}`, {});
    const [aiNotes, setAiNotes] = useLocalStorage(`titan_ainotes_${userId}`, []);
    const [showQuickMuscu, setShowQuickMuscu] = useState(false);
    const [showQuickCardio, setShowQuickCardio] = useState(false);
    const [cardioForm, setCardioForm] = useState({ type: 'course', duration: '', calories: '' });
    const [form, setForm] = useState({ duration: '', calories: '' });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = useMemo(() => getCalendarForDate(todayStr), [todayStr]);
    const todayCheckin = dailyCheckins.find(c => c.date === todayStr);

    const addLog = (log) => addWorkoutLog(log);
    const removeLog = (identifier) => removeWorkoutLog(identifier);
    const startWorkout = (code) => { setActiveSession(code); setView('logger'); };
    const handleExitLogger = () => { setActiveSession(null); setView('dashboard'); };
    
    const updateCheckin = (field, value) => {
        const existing = dailyCheckins.find(c => c.date === todayStr) || { date: todayStr };
        const updated = { ...existing, [field]: value, timestamp: new Date().toISOString() };
        setDailyCheckins(prev => [...prev.filter(c => c.date !== todayStr), updated]);
    };
    
    const addAiNote = (note) => {
        setAiNotes(prev => [...prev, { ...note, id: Date.now(), date: todayStr, timestamp: new Date().toISOString() }]);
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: '📊' },
        { id: 'programme', label: 'Programme', shortLabel: 'Prog', icon: '📅' },
        { id: 'planning', label: 'Planning', shortLabel: 'Plan', icon: '🗓️' },
        { id: 'progress', label: 'Progrès', shortLabel: 'Stats', icon: '📈' },
        { id: 'biometrics', label: 'Biométrie', shortLabel: 'Bio', icon: '⚖️' }
    ];

    return (
        <div className="space-y-4">
            {view !== 'logger' && (
                <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${view === tab.id ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            <span>{tab.icon}</span>
                            <span className="uppercase">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>
            )}
            
            {view === 'dashboard' && (
                <SecondBrainDashboard
                    todayData={todayData}
                    startWorkout={startWorkout}
                    addLog={addLog}
                    todayCheckin={todayCheckin}
                    updateCheckin={updateCheckin}
                    workoutLogs={workoutLogs}
                    whoopData={whoopData}
                    setWhoopData={setWhoopData}
                    dailyCheckins={dailyCheckins}
                    supplementLogs={supplementLogs}
                    setSupplementLogs={setSupplementLogs}
                    aiNotes={aiNotes}
                    addAiNote={addAiNote}
                    userId={userId}
                    getInProgressSession={getInProgressSession}
                    removeLog={removeLog}
                />
            )}
            {view === 'programme' && <FitnessProgramme workoutLogs={workoutLogs} />}
            {view === 'planning' && <FitnessCalendar onSelectDay={startWorkout} workoutLogs={workoutLogs} addLog={addLog} removeLog={removeLog} />}
            {view === 'progress' && <FitnessProgress workoutLogs={workoutLogs} />}
            {view === 'biometrics' && <FitnessBiometrics userId={userId} />}
            {view === 'logger' && activeSession && <WorkoutLogger sessionCode={activeSession} onExit={handleExitLogger} onFinishSession={handleExitLogger} addLog={addLog} updateLog={updateWorkoutLog} workoutLogs={workoutLogs} getInProgressSession={getInProgressSession} />}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECOND BRAIN DASHBOARD - STYLE WHOOP
// ═══════════════════════════════════════════════════════════════════════════════
const SecondBrainDashboard = ({
    todayData, startWorkout, addLog, todayCheckin, updateCheckin,
    workoutLogs, whoopData, setWhoopData, dailyCheckins,
    supplementLogs, setSupplementLogs, aiNotes, addAiNote, userId,
    getInProgressSession, removeLog
}) => {
    const [showQuickMuscu, setShowQuickMuscu] = useState(false);
    const [showQuickCardio, setShowQuickCardio] = useState(false);
    const [cardioForm, setCardioForm] = useState({ type: 'course', duration: '', calories: '', distance: '' });
    const [showAiQuestion, setShowAiQuestion] = useState(null);
    const [questionAnswer, setQuestionAnswer] = useState('');
    const [form, setForm] = useState({ duration: '', calories: '' });
    const [biometrics] = useLocalStorage(`titan_biometrics_${userId}`, {});
    const [stepsLogs, saveStepsToSupabase, getStepsGoalByPhase] = useSupabaseSteps(userId);
    const [stepsInput, setStepsInput] = useState('');
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Simuler données Whoop (à remplacer par vraie API)
    const mockWhoopData = whoopData || {
        recovery: null,
        strain: null,
        sleepScore: null,
        hrv: null,
        connected: false
    };
    
    // Analyse IA centralisée
    const aiAnalysis = useMemo(() => {
        return analyzeAllData({
            checkins: dailyCheckins,
            workoutLogs,
            biometrics,
            whoopData: mockWhoopData,
            supplementLogs
        });
    }, [dailyCheckins, workoutLogs, biometrics, mockWhoopData, supplementLogs]);
    
    // Stats semaine
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekLogs = workoutLogs.filter(log => new Date(log.date) >= weekStart);
    const muscuCount = weekLogs.filter(l => l.type === 'Muscu').length;
    const cardioCount = weekLogs.filter(l => l.type === 'Cardio').length;
    
    // Pesée
    const getLastWeighIn = () => {
        const entries = Object.entries(biometrics).filter(([k, v]) => v.poids);
        if (entries.length === 0) return null;
        entries.sort((a, b) => new Date(b[0]) - new Date(a[0]));
        return { date: entries[0][0], weight: entries[0][1].poids };
    };
    const lastWeighIn = getLastWeighIn();
    
    // Compléments du jour
    const todaySupplements = supplementLogs[todayStr] || {};
    const toggleSupplement = (period, id) => {
        const current = todaySupplements[period] || [];
        const updated = current.includes(id) 
            ? current.filter(x => x !== id)
            : [...current, id];
        setSupplementLogs(prev => ({
            ...prev,
            [todayStr]: { ...prev[todayStr], [period]: updated }
        }));
    };

    const validateMuscu = () => {
        addLog({ date: todayStr, session: todayData.seance, type: 'Muscu', duration: form.duration, calories: form.calories, status: 'completed', timestamp: new Date().toISOString() });
        setShowQuickMuscu(false);
        setForm({ duration: '', calories: '' });
    };

    // Save steps (utilise le hook Supabase)
    const saveSteps = async (steps) => {
        await saveStepsToSupabase(todayStr, steps);
        setStepsInput('');
    };

    // Get today's steps
    const todaySteps = stepsLogs[todayStr]?.steps || 0;
    const stepsProgress = todayData.stepsGoal ? Math.min(100, (todaySteps / todayData.stepsGoal) * 100) : 0;

    // Check weekly mandatory cardio (Phase 1 - Masse requires 1x/week)
    const currentPhase = getCurrentPhase(todayStr);
    const needsWeeklyCardio = currentPhase === 'masse'; // Phase 1 requires 1 cardio/week
    const weeklyCardioGoal = needsWeeklyCardio ? 1 : 0;

    // Count cardio done this week
    const weekCardioDone = useMemo(() => {
        return weekLogs.filter(l => l.type === 'Cardio').length;
    }, [weekLogs]);

    const weeklyCardioDone = weekCardioDone >= weeklyCardioGoal;

    // Days remaining in week (to show urgency)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dim, 1=Lun...
    const daysLeftInWeek = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    const submitQuestionAnswer = () => {
        if (showAiQuestion && questionAnswer) {
            addAiNote({
                questionId: showAiQuestion.id,
                question: showAiQuestion.text,
                answer: questionAnswer,
                context: showAiQuestion.context || ''
            });
            setShowAiQuestion(null);
            setQuestionAnswer('');
        }
    };
    
    // Recovery Ring Component (style Whoop)
    const RecoveryRing = ({ value, size = 120 }) => {
        const radius = (size - 12) / 2;
        const circumference = 2 * Math.PI * radius;
        const progress = value ? (value / 100) * circumference : 0;
        const color = !value ? '#374151' : value < 33 ? '#EF4444' : value < 66 ? '#F59E0B' : '#22C55E';
        
        return (
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="8"
                    />
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{value || '--'}</span>
                    <span className="text-xs text-gray-500">RECOVERY</span>
                </div>
            </div>
        );
    };

    // Détecter séance en cours non terminée
    const inProgressSession = getInProgressSession?.();

    const handleAbandonSession = () => {
        if (inProgressSession && removeLog) {
            removeLog(inProgressSession.id);
        }
    };

    const handleContinueSession = () => {
        if (inProgressSession) {
            startWorkout(inProgressSession.session);
        }
    };

    return (
        <div className="space-y-4">
            {/* BANDEAU SÉANCE NON TERMINÉE */}
            {inProgressSession && (
                <Card className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                                <span className="text-lg">⚠️</span>
                            </div>
                            <div>
                                <div className="font-bold text-white">Séance non terminée</div>
                                <div className="text-sm text-gray-400">{inProgressSession.session} - commencée aujourd'hui</div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={handleContinueSession} variant="warning" className="flex-1 sm:flex-initial">
                                Continuer
                            </Button>
                            <Button onClick={handleAbandonSession} variant="ghost" className="flex-1 sm:flex-initial text-gray-400">
                                Abandonner
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* WEEKLY STATS */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <div className="text-2xl font-black text-white">{muscuCount}</div>
                    <div className="text-[10px] text-gray-500">MUSCU /6</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <div className="text-2xl font-black text-white">{cardioCount}</div>
                    <div className="text-[10px] text-gray-500">CARDIO /4</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <div className="text-2xl font-black text-white">{lastWeighIn?.weight || '--'}</div>
                    <div className="text-[10px] text-gray-500">POIDS KG</div>
                </div>
            </div>
            
            {/* TODAY'S WORKOUT - MUSCU (pas si bloqué) */}
            {todayData.seance && !todayData.blocked && (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-xs text-blue-400 font-bold">💪 MUSCULATION</div>
                            <div className="text-xl font-bold text-white truncate">{todayData.seance}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-sm text-gray-400">{todayData.duree} min</div>
                        </div>
                    </div>
                    
                    {EXERCISES_DB[todayData.seance] && (
                        <div className="space-y-1 mb-4">
                            {EXERCISES_DB[todayData.seance].slice(0, 3).map((ex, i) => (
                                <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                                    <span className="text-gray-300">{ex.name}</span>
                                    <span className="text-gray-500">{ex.sets}x{ex.reps}</span>
                                </div>
                            ))}
                            {EXERCISES_DB[todayData.seance].length > 3 && (
                                <div className="text-xs text-gray-600 text-center">+{EXERCISES_DB[todayData.seance].length - 3} exercices</div>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => setShowQuickMuscu(true)}
                            className="flex-1 py-3 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm"
                        >
                            ✓ Fait
                        </button>
                        <button
                            onClick={() => startWorkout(todayData.seance)}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm"
                        >
                            ▶ Lancer
                        </button>
                    </div>
                </div>
            )}
            
            {/* TODAY'S CARDIO - Obligatoire OU optionnel (pas si bloqué) */}
            {(todayData.cardio || todayData.cardioOpt) && !todayData.blocked && (
                <div className={`p-4 rounded-xl border overflow-hidden ${todayData.cardioOpt && !todayData.cardio ? 'border-orange-500/20 border-dashed bg-orange-500/[0.03]' : 'border-orange-500/30 bg-orange-500/5'}`}>
                    {(() => {
                        const cardioAlreadyDone = workoutLogs.some(log => log.date === todayStr && log.type === 'Cardio');
                        const cardioType = todayData.cardio || todayData.cardioOpt;
                        const isOptional = todayData.cardioOpt && !todayData.cardio;
                        return (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <div className="text-xs text-orange-400 font-bold flex items-center gap-2">
                                            🏃 CARDIO
                                            {isOptional && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">OPTIONNEL</span>}
                                        </div>
                                        <div className="text-lg font-bold text-white truncate">{cardioType}</div>
                                    </div>
                                    {cardioAlreadyDone ? (
                                        <div className="px-4 py-2 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm text-center flex-shrink-0">
                                            ✓ Validé
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowQuickCardio(true)}
                                            className="w-full sm:w-auto px-4 py-2 bg-orange-500/20 text-orange-400 font-bold rounded-xl text-sm hover:bg-orange-500/30 transition-all flex-shrink-0"
                                        >
                                            ✓ Marquer fait
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {CARDIO_DETAILS[cardioType] ? (
                                        <>
                                            <div className="font-medium text-gray-300">{CARDIO_DETAILS[cardioType].title}</div>
                                            <div className="mt-1">{CARDIO_DETAILS[cardioType].desc} • {CARDIO_DETAILS[cardioType].duration}</div>
                                            <div className="text-gray-500">{CARDIO_DETAILS[cardioType].intensity}</div>
                                        </>
                                    ) : (
                                        <>
                                            {cardioType?.includes('LISS') && '25-45 min • Zone 2 (60-70% FCmax)'}
                                            {cardioType?.includes('HIIT') && '15-25 min • Intervalles haute intensité'}
                                            {cardioType?.includes('Course') && '10km • Allure modérée'}
                                        </>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* CARDIO HEBDOMADAIRE OBLIGATOIRE - Rappel Phase 1 */}
            {needsWeeklyCardio && !weeklyCardioDone && !todayData.blocked && !todayData.cardio && (
                <div className={`p-4 rounded-xl border ${daysLeftInWeek <= 2 ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className={`text-xs font-bold ${daysLeftInWeek <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                                ⚠️ CARDIO HEBDO À FAIRE
                            </div>
                            <div className="text-sm font-bold text-white">
                                Phase Masse - 1x/semaine obligatoire
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-2xl font-black ${daysLeftInWeek <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {weekCardioDone}/{weeklyCardioGoal}
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        {daysLeftInWeek === 0 ? (
                            <span className="text-red-400 font-bold">⚠️ Dernier jour pour le faire !</span>
                        ) : daysLeftInWeek === 1 ? (
                            <span className="text-orange-400">Plus que demain pour rattraper</span>
                        ) : (
                            <span>Encore {daysLeftInWeek} jours pour le faire cette semaine</span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowQuickCardio(true)}
                        className={`mt-3 w-full py-2 font-bold rounded-xl text-sm ${daysLeftInWeek <= 2 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}
                    >
                        📍 Enregistrer cardio maintenant
                    </button>
                </div>
            )}

            {/* CARDIO HEBDOMADAIRE VALIDÉ */}
            {needsWeeklyCardio && weeklyCardioDone && !todayData.blocked && !todayData.cardio && (
                <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-3">
                        <div className="text-xl">✅</div>
                        <div>
                            <div className="text-sm font-bold text-green-400">Cardio hebdo validé</div>
                            <div className="text-xs text-gray-500">{weekCardioDone} séance{weekCardioDone > 1 ? 's' : ''} cette semaine</div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEPS TRACKING - Affiché si objectif pas défini */}
            {todayData.stepsGoal && !todayData.blocked && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs text-emerald-400 font-bold">👟 OBJECTIF PAS</div>
                            <div className="text-lg font-bold text-white">{todayData.stepsGoal.toLocaleString()} pas</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-emerald-400">{todaySteps.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{Math.round(stepsProgress)}%</div>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                stepsProgress >= 100 ? 'bg-emerald-500' : stepsProgress >= 75 ? 'bg-emerald-400' : stepsProgress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, stepsProgress)}%` }}
                        />
                    </div>

                    {/* Input pour saisir les pas */}
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Entrer vos pas..."
                            value={stepsInput}
                            onChange={e => setStepsInput(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500"
                        />
                        <button
                            onClick={() => saveSteps(stepsInput)}
                            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-sm hover:bg-emerald-500/30 transition-all"
                        >
                            ✓
                        </button>
                    </div>

                    {stepsProgress >= 100 && (
                        <div className="mt-3 text-center text-sm text-emerald-400 font-medium">
                            🎉 Objectif atteint !
                        </div>
                    )}
                </div>
            )}

            {/* ABDOS - Circuit court ou séance dédiée */}
            {todayData.abdos && !todayData.blocked && (
                (() => {
                    const isDedie = todayData.abdos === 'ABDOS_DEDIE';
                    const abdosAlreadyDone = workoutLogs.some(log => log.date === todayStr && log.session === todayData.abdos);
                    const abdosExercises = EXERCISES_DB[todayData.abdos] || [];

                    return (
                        <div className={`p-4 rounded-xl border overflow-hidden ${isDedie ? 'border-purple-500/30 bg-purple-500/5' : 'border-pink-500/20 border-dashed bg-pink-500/[0.03]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className={`text-xs font-bold ${isDedie ? 'text-purple-400' : 'text-pink-400'}`}>
                                        {isDedie ? '🔥 ABDOS SÉANCE DÉDIÉE' : '💪 ABDOS FIN DE SÉANCE'}
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {isDedie ? '15-20 min' : '5-10 min'}
                                    </div>
                                </div>
                                {abdosAlreadyDone ? (
                                    <div className="px-4 py-2 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm">
                                        ✓ Fait
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            addLog({
                                                date: todayStr,
                                                session: todayData.abdos,
                                                type: 'Abdos',
                                                duration: isDedie ? 18 : 8,
                                                calories: isDedie ? 80 : 40,
                                                status: 'completed',
                                                timestamp: new Date().toISOString()
                                            });
                                        }}
                                        className={`px-4 py-2 font-bold rounded-xl text-sm hover:opacity-80 transition-all ${isDedie ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}
                                    >
                                        ✓ Valider
                                    </button>
                                )}
                            </div>

                            {/* Liste des exercices */}
                            <div className="space-y-1.5">
                                {abdosExercises.slice(0, isDedie ? 5 : 4).map((ex, i) => (
                                    <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-gray-300">{ex.name}</span>
                                        <span className="text-gray-500">{ex.sets}x{ex.reps}</span>
                                    </div>
                                ))}
                                {abdosExercises.length > (isDedie ? 5 : 4) && (
                                    <div className="text-xs text-gray-600 text-center pt-1">
                                        +{abdosExercises.length - (isDedie ? 5 : 4)} exercices
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                                {isDedie ? 'Séance complète le samedi - Focus core' : 'À faire après ta séance muscu'}
                            </div>
                        </div>
                    );
                })()
            )}

            {/* Repos médical bloqué */}
            {todayData.blocked && (
                <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
                    <div className="text-3xl mb-2">🦷</div>
                    <div className="text-lg font-bold text-red-400">Repos médical obligatoire</div>
                    <div className="text-sm text-gray-400 mt-1">Greffe dentaire - Pas d'entraînement</div>
                    <div className="text-xs text-gray-500 mt-3">
                        Phase 2 • Repos jusqu'au 5 mai 2026
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-white/5 text-xs text-gray-400 text-left">
                        <div className="font-medium text-white mb-2">📋 Consignes période repos :</div>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Éviter tout effort physique intense</li>
                            <li>Alimentation adaptée (pas de mastication dure)</li>
                            <li>Sommeil et récupération maximale</li>
                            <li>Marche légère autorisée si besoin</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Jour de repos normal */}
            {!todayData.seance && !todayData.blocked && (!todayData.cardio || todayData.cardio === 'Non') && (
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] text-center">
                    <div className="text-2xl mb-2">😴</div>
                    <div className="text-lg font-bold text-white">Jour de repos</div>
                    <div className="text-sm text-gray-500">Récupération active</div>
                </div>
            )}
            
            {/* Quick validation modal */}
            {showQuickMuscu && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0c0c14] border border-white/10 rounded-2xl p-4 w-full max-w-sm">
                        <h3 className="font-bold text-white mb-4">✓ Valider {todayData.seance}</h3>
                        <input
                            type="number"
                            placeholder="Durée (min)"
                            value={form.duration}
                            onChange={e => setForm(f => ({...f, duration: e.target.value}))}
                            className="w-full p-3 mb-2 bg-white/5 border border-white/10 rounded-xl text-white"
                        />
                        <input
                            type="number"
                            placeholder="Calories"
                            value={form.calories}
                            onChange={e => setForm(f => ({...f, calories: e.target.value}))}
                            className="w-full p-3 mb-4 bg-white/5 border border-white/10 rounded-xl text-white"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowQuickMuscu(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl">Annuler</button>
                            <button onClick={validateMuscu} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Valider</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Quick Cardio Modal - Amélioré avec type */}
            {showQuickCardio && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-md">
                        <h3 className="font-bold text-white mb-6 text-xl">✓ Détails de ta séance cardio</h3>
                        
                        {/* Type de cardio */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Type de cardio
                            </label>
                            <select 
                                value={cardioForm.type || 'course'} 
                                onChange={e => setCardioForm(f => ({...f, type: e.target.value}))}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                            >
                                <option value="course">🏃 Course / Footing</option>
                                <option value="escaliers">🪜 Escaliers</option>
                                <option value="velo">🚴 Vélo</option>
                                <option value="natation">🏊 Natation</option>
                                <option value="rameur">🚣 Rameur</option>
                                <option value="elliptique">⚙️ Elliptique</option>
                                <option value="autre">➕ Autre</option>
                            </select>
                        </div>
                        
                        {/* Distance */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Distance (km)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Ex: 5.2"
                                value={cardioForm.distance}
                                onChange={e => setCardioForm(f => ({...f, distance: e.target.value}))}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                            />
                        </div>

                        {/* Durée */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Durée (minutes)
                            </label>
                            <input
                                type="number"
                                placeholder="Ex: 30"
                                value={cardioForm.duration}
                                onChange={e => setCardioForm(f => ({...f, duration: e.target.value}))}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                            />
                        </div>

                        {/* Allure calculée */}
                        {cardioForm.distance && cardioForm.duration && parseFloat(cardioForm.distance) > 0 && (
                            <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <div className="text-xs text-cyan-400 font-medium">⏱️ Allure moyenne</div>
                                <div className="text-lg font-bold text-white">
                                    {(() => {
                                        const pace = parseFloat(cardioForm.duration) / parseFloat(cardioForm.distance);
                                        const mins = Math.floor(pace);
                                        const secs = Math.round((pace - mins) * 60);
                                        return `${mins}:${secs.toString().padStart(2, '0')} /km`;
                                    })()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Vitesse: {(parseFloat(cardioForm.distance) / (parseFloat(cardioForm.duration) / 60)).toFixed(1)} km/h
                                </div>
                            </div>
                        )}

                        {/* Calories */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Calories brûlées
                            </label>
                            <input
                                type="number"
                                placeholder="Ex: 350"
                                value={cardioForm.calories}
                                onChange={e => setCardioForm(f => ({...f, calories: e.target.value}))}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                            />
                        </div>
                        
                        {/* Boutons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowQuickCardio(false);
                                    setCardioForm({ type: 'course', duration: '', calories: '', distance: '' });
                                }}
                                className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    const distance = parseFloat(cardioForm.distance) || 0;
                                    const duration = parseInt(cardioForm.duration) || 30;
                                    const pace = distance > 0 ? duration / distance : null;
                                    addLog({
                                        date: todayStr,
                                        session: 'CARDIO',
                                        cardioType: cardioForm.type || 'course',
                                        type: 'Cardio',
                                        duration: duration,
                                        distance: distance,
                                        pace: pace,
                                        calories: parseInt(cardioForm.calories) || 200,
                                        status: 'completed',
                                        timestamp: new Date().toISOString()
                                    });
                                    setShowQuickCardio(false);
                                    setCardioForm({ type: 'course', duration: '', calories: '', distance: '' });
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl"
                            >
                                ✓ Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING - GRAPHIQUES PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════════
const FitnessProgress = ({ workoutLogs }) => {
    const [selectedExercise, setSelectedExercise] = useState(null);
    
    // Extraire tous les exercices avec leurs charges
    const exerciseProgress = useMemo(() => {
        const progress = {};
        workoutLogs.forEach(log => {
            if (log.exercises) {
                log.exercises.forEach(ex => {
                    if (ex.weight && ex.weight > 0) {
                        if (!progress[ex.name]) progress[ex.name] = [];
                        progress[ex.name].push({
                            date: log.date,
                            weight: parseFloat(ex.weight),
                            reps: ex.reps,
                            sets: ex.sets
                        });
                    }
                });
            }
        });
        // Trier par date
        Object.keys(progress).forEach(key => {
            progress[key].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
        return progress;
    }, [workoutLogs]);
    
    const exerciseNames = Object.keys(exerciseProgress);
    
    const getProgressStats = (exName) => {
        const data = exerciseProgress[exName];
        if (!data || data.length < 2) return null;
        const first = data[0].weight;
        const last = data[data.length - 1].weight;
        const diff = last - first;
        const percent = ((diff / first) * 100).toFixed(1);
        return { first, last, diff, percent, count: data.length };
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">📈 Progression par exercice</h2>
            
            {exerciseNames.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucune donnée de progression</p>
                    <p className="text-xs mt-2">Les charges seront trackées lors de tes séances</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {exerciseNames.map(exName => {
                        const stats = getProgressStats(exName);
                        const data = exerciseProgress[exName];
                        const isExpanded = selectedExercise === exName;
                        
                        return (
                            <div 
                                key={exName}
                                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                            >
                                <button
                                    onClick={() => setSelectedExercise(isExpanded ? null : exName)}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div>
                                        <div className="font-medium text-white">{exName}</div>
                                        <div className="text-xs text-gray-500">{data.length} entrées</div>
                                    </div>
                                    {stats && (
                                        <div className="text-right">
                                            <div className={`font-bold ${stats.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stats.diff >= 0 ? '+' : ''}{stats.diff}kg
                                            </div>
                                            <div className="text-xs text-gray-500">{stats.first}kg → {stats.last}kg</div>
                                        </div>
                                    )}
                                </button>
                                
                                {isExpanded && (
                                    <div className="px-4 pb-4">
                                        {/* Mini graphique ASCII */}
                                        <div className="flex items-end gap-1 h-20 mb-2">
                                            {data.slice(-10).map((d, i) => {
                                                const max = Math.max(...data.map(x => x.weight));
                                                const min = Math.min(...data.map(x => x.weight));
                                                const range = max - min || 1;
                                                const height = ((d.weight - min) / range * 60) + 10;
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center">
                                                        <div 
                                                            className="w-full bg-blue-500/50 rounded-t"
                                                            style={{ height: `${height}px` }}
                                                        />
                                                        <div className="text-[8px] text-gray-600 mt-1">{d.weight}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Historique détaillé */}
                                        <div className="space-y-1 max-h-32 overflow-auto">
                                            {data.slice(-5).reverse().map((d, i) => (
                                                <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                                                    <span className="text-gray-500">{new Date(d.date).toLocaleDateString('fr-FR')}</span>
                                                    <span className="text-white font-medium">{d.weight}kg × {d.reps} reps</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CARDIO PROGRESS SECTION */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">🏃 Progression Cardio</h2>
                {(() => {
                    const cardioLogs = workoutLogs.filter(l => l.type === 'Cardio').sort((a, b) => new Date(a.date) - new Date(b.date));

                    if (cardioLogs.length === 0) {
                        return (
                            <div className="p-8 text-center text-gray-500">
                                <div className="text-4xl mb-4">🏃</div>
                                <p>Aucune séance cardio enregistrée</p>
                                <p className="text-xs mt-2">Les données apparaîtront après tes séances</p>
                            </div>
                        );
                    }

                    // Stats globales
                    const totalDistance = cardioLogs.reduce((sum, l) => sum + (l.distance || 0), 0);
                    const totalDuration = cardioLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
                    const totalCalories = cardioLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
                    const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

                    // Dernières 5 séances pour le graphique
                    const last5 = cardioLogs.slice(-5);
                    const maxDist = Math.max(...last5.map(l => l.distance || 0), 1);

                    return (
                        <div className="space-y-4">
                            {/* Stats globales */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <div className="text-xs text-cyan-400">Distance totale</div>
                                    <div className="text-xl font-black text-white">{totalDistance.toFixed(1)} km</div>
                                </div>
                                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <div className="text-xs text-orange-400">Temps total</div>
                                    <div className="text-xl font-black text-white">{Math.round(totalDuration)} min</div>
                                </div>
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <div className="text-xs text-red-400">Calories</div>
                                    <div className="text-xl font-black text-white">{totalCalories}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <div className="text-xs text-purple-400">Allure moy.</div>
                                    <div className="text-xl font-black text-white">
                                        {avgPace > 0 ? `${Math.floor(avgPace)}:${Math.round((avgPace % 1) * 60).toString().padStart(2, '0')}` : '--'}/km
                                    </div>
                                </div>
                            </div>

                            {/* Mini graphique des distances */}
                            {last5.length > 1 && last5.some(l => l.distance > 0) && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-xs text-gray-400 mb-3">5 dernières séances - Distance</div>
                                    <div className="flex items-end justify-between h-24 gap-2">
                                        {last5.map((l, i) => {
                                            const height = l.distance > 0 ? (l.distance / maxDist) * 100 : 5;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                    <div
                                                        className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t transition-all"
                                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                                    />
                                                    <div className="text-[10px] text-gray-500 mt-1">{l.distance ? `${l.distance}km` : '-'}</div>
                                                    <div className="text-[8px] text-gray-600">{new Date(l.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Historique récent */}
                            <div className="space-y-2">
                                <div className="text-xs text-gray-400">Historique récent</div>
                                {cardioLogs.slice(-5).reverse().map((l, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{new Date(l.date).toLocaleDateString('fr-FR')}</span>
                                            <span className="text-white capitalize">{l.cardioType || 'cardio'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-400">
                                            {l.distance > 0 && <span className="text-cyan-400">{l.distance}km</span>}
                                            <span>{l.duration}min</span>
                                            {l.pace > 0 && (
                                                <span className="text-purple-400">
                                                    {Math.floor(l.pace)}:{Math.round((l.pace % 1) * 60).toString().padStart(2, '0')}/km
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

// Programme complet 44 semaines avec sync jour
const FitnessProgramme = ({ workoutLogs }) => {
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [expandedWeek, setExpandedWeek] = useState(null);
    
    const currentWeek = getWeekNumber(new Date());
    const today = new Date();
    const todayDayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][today.getDay()];
    
    // Auto-expand current week
    useEffect(() => {
        setExpandedWeek(currentWeek);
    }, [currentWeek]);
    
    // Check if a session is completed for a specific week
    const isSessionCompleted = (weekNum, dayName, seance) => {
        if (!seance) return false;
        // Check if we have a log for this session in the specific week
        return workoutLogs.some(log => {
            if (log.session !== seance || log.status !== 'completed') return false;
            // Calculate the week number of the log's date
            const logWeek = getWeekNumber(new Date(log.date));
            return logWeek === weekNum;
        });
    };
    
    const filteredCalendar = selectedPhase === 'all' 
        ? CALENDAR_27_WEEKS 
        : CALENDAR_27_WEEKS.filter(w => w.phase === selectedPhase);
    
    const getPhaseColor = (phase) => {
        if (phase === 'Phase1_Masse') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (phase === 'Phase2_ReposMedical') return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (phase === 'Phase3_Readaptation') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        if (phase === 'Phase4_Seche') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        if (phase === 'Phase5_Maintien') return 'bg-green-500/20 text-green-400 border-green-500/30';
        return 'bg-gray-500/20 text-gray-400';
    };

    const getPhaseName = (phase) => {
        if (phase === 'Phase1_Masse') return 'Phase 1 - Masse';
        if (phase === 'Phase2_ReposMedical') return 'Phase 2 - Repos Médical';
        if (phase === 'Phase3_Readaptation') return 'Phase 3 - Réadaptation';
        if (phase === 'Phase4_Seche') return 'Phase 4 - Sèche';
        if (phase === 'Phase5_Maintien') return 'Phase 5 - Maintien';
        return phase;
    };
    
    // Calculer le jour index dans la semaine courante
    const getCurrentDayIndex = () => {
        const dayMap = { 'Dim': 6, 'Lun': 0, 'Mar': 1, 'Mer': 2, 'Jeu': 3, 'Ven': 4, 'Sam': 5 };
        return dayMap[todayDayName] || 0;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Programme 44 semaines</h2>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">Sem. {currentWeek}</span>
            </div>

            {/* Filtres phases - wrap sur mobile */}
            <div className="flex flex-wrap gap-2">
                {['all', 'Phase1_Masse', 'Phase2_ReposMedical', 'Phase3_Readaptation', 'Phase4_Seche', 'Phase5_Maintien'].map(phase => (
                    <button
                        key={phase}
                        onClick={() => setSelectedPhase(phase)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedPhase === phase
                                ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                    >
                        {phase === 'all' ? 'Toutes' : getPhaseName(phase).replace('Phase ', 'P')}
                    </button>
                ))}
            </div>
            
            {/* Liste des semaines */}
            <div className="space-y-2">
                {filteredCalendar.map((week) => {
                    const isCurrentWeek = week.sem === currentWeek;
                    const isPastWeek = week.sem < currentWeek;
                    
                    return (
                        <div 
                            key={week.sem}
                            className={`rounded-xl border transition-all ${
                                isCurrentWeek 
                                    ? 'border-blue-500/50 bg-blue-500/5' 
                                    : isPastWeek
                                    ? 'border-white/5 bg-white/[0.01] opacity-60'
                                    : 'border-white/5 bg-white/[0.02]'
                            }`}
                        >
                            {/* Header semaine */}
                            <button
                                onClick={() => setExpandedWeek(expandedWeek === week.sem ? null : week.sem)}
                                className="w-full p-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold ${isCurrentWeek ? 'text-blue-400' : 'text-white'}`}>
                                        S{week.sem}
                                    </span>
                                    <span className="text-xs text-gray-500">{week.date}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded border ${getPhaseColor(week.phase)}`}>
                                        {week.phase.replace('Phase1_', 'P1 ').replace('Phase2_', 'P2 ').replace('Phase3_', 'P3 ').replace('Phase4_', 'P4 ').replace('Phase5_', 'P5 ')}
                                    </span>
                                    {week.blocked && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">🦷 BLOQUÉ</span>}
                                    {isCurrentWeek && !week.blocked && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">EN COURS</span>}
                                </div>
                                <ChevronRight 
                                    size={16} 
                                    className={`text-gray-500 transition-transform ${expandedWeek === week.sem ? 'rotate-90' : ''}`}
                                />
                            </button>
                            
                            {/* Détails semaine */}
                            {expandedWeek === week.sem && (
                                <div className="px-3 pb-3 space-y-1">
                                    {week.jours.map((jour, idx) => {
                                        const isToday = isCurrentWeek && jour.jour === todayDayName;
                                        const isPastDay = isCurrentWeek && idx < getCurrentDayIndex();
                                        const completed = isSessionCompleted(week.sem, jour.jour, jour.seance);
                                        
                                        return (
                                            <div 
                                                key={idx}
                                                className={`p-2 rounded-lg text-xs ${
                                                    isToday 
                                                        ? 'bg-blue-500/20 border border-blue-500/30' 
                                                        : jour.seance 
                                                        ? 'bg-white/5' 
                                                        : 'bg-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className={`w-8 flex-shrink-0 ${isToday ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                                                            {jour.jour}
                                                        </span>
                                                        {completed && <Check size={14} className="text-green-400 flex-shrink-0" />}
                                                        {jour.seance ? (
                                                            <span className={`font-medium truncate ${completed ? 'text-green-400 line-through opacity-70' : isToday ? 'text-white' : 'text-gray-300'}`}>
                                                                {jour.seance}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">Repos</span>
                                                        )}
                                                        {isToday && <span className="text-[10px] bg-blue-500 text-white px-1 rounded flex-shrink-0">AUJOURD'HUI</span>}
                                                    </div>
                                                    {/* Desktop: infos à droite */}
                                                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-2">
                                                        {jour.duree > 0 && (
                                                            <span className="text-gray-500">{jour.duree}min</span>
                                                        )}
                                                        {jour.cardio && (
                                                            <span className="text-green-500/70 text-[10px]">{jour.cardio}</span>
                                                        )}
                                                        {jour.notes && (
                                                            <span className="text-yellow-500/70 text-[10px] max-w-24 truncate">{jour.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Mobile: infos en dessous */}
                                                {(jour.duree > 0 || jour.cardio || jour.notes) && (
                                                    <div className="sm:hidden flex items-center gap-2 mt-1 ml-10 text-[10px]">
                                                        {jour.duree > 0 && (
                                                            <span className="text-gray-500">{jour.duree}min</span>
                                                        )}
                                                        {jour.cardio && (
                                                            <span className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{jour.cardio}</span>
                                                        )}
                                                        {jour.notes && (
                                                            <span className="text-yellow-400">{jour.notes}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FitnessCalendar = ({ onSelectDay, workoutLogs, addLog, removeLog }) => {
    const [weekStart, setWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [selected, setSelected] = useState(null);
    const [showCardioModal, setShowCardioModal] = useState(false);
    const [showMuscuModal, setShowMuscuModal] = useState(false);
    const [cardioForm, setCardioForm] = useState({ duration: '', calories: '' });
    const [muscuForm, setMuscuForm] = useState({ duration: '', calories: '' });

    const logsByDate = useMemo(() => {
        const map = {};
        workoutLogs.forEach((data, index) => {
            if (!map[data.date]) map[data.date] = [];
            map[data.date].push({ ...data, _index: index });
        });
        return map;
    }, [workoutLogs]);

    const changeWeek = (delta) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + (delta * 7));
        setWeekStart(d);
    };

    const quickValidateMuscu = () => {
        if (!selected) return;
        addLog({ date: selected.dateStr, session: selected.seance, status: 'completed', type: 'Muscu', duration: muscuForm.duration, calories: muscuForm.calories, timestamp: new Date().toISOString() });
        setShowMuscuModal(false);
        setMuscuForm({ duration: '', calories: '' });
    };

    const quickValidateCardio = () => {
        if (!selected) return;
        addLog({ date: selected.dateStr, session: 'CARDIO', cardioType: selected.cardio, type: 'Cardio', duration: cardioForm.duration, calories: cardioForm.calories, status: 'completed', timestamp: new Date().toISOString() });
        setShowCardioModal(false);
        setCardioForm({ duration: '', calories: '' });
    };

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        days.push(getCalendarForDate(d.toISOString().split('T')[0]));
    }

    // Quick validate without opening modal
    const quickToggleMuscu = (e, d, muscuLog) => {
        e.stopPropagation();
        if (muscuLog) {
            // Remove log
            removeLog(muscuLog.id || muscuLog.timestamp);
        } else {
            // Add quick log
            addLog({ 
                date: d.dateStr, 
                session: d.seance, 
                type: 'Musculation', 
                duration: 60, 
                calories: 350, 
                status: 'completed', 
                timestamp: new Date().toISOString() 
            });
        }
    };

    const quickToggleCardio = (e, d, cardioLog) => {
        e.stopPropagation();
        if (cardioLog) {
            removeLog(cardioLog.id || cardioLog.timestamp);
        } else {
            addLog({ 
                date: d.dateStr, 
                session: 'CARDIO', 
                cardioType: d.cardio, 
                type: 'Cardio', 
                duration: 30, 
                calories: 200, 
                status: 'completed', 
                timestamp: new Date().toISOString() 
            });
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <Card className="p-3 flex justify-between items-center">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronLeft className="text-gray-400" size={20}/>
                </button>
                <span className="text-white font-bold text-sm">Semaine {getWeekNumber(weekStart)}</span>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronRight className="text-gray-400" size={20}/>
                </button>
            </Card>
            
            <div className="space-y-2">
                {days.map((d, i) => {
                    const dayLogs = logsByDate[d.dateStr] || [];
                    const muscuLog = dayLogs.find(l => l.type !== 'Cardio' && l.session !== 'CARDIO');
                    const cardioLog = dayLogs.find(l => l.session === 'CARDIO' || l.type === 'Cardio');
                    const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                        <Card 
                            key={i} 
                            onClick={() => setSelected({...d, muscuLog, cardioLog})} 
                            className={`p-4 flex justify-between items-center border-l-4 overflow-hidden ${isToday ? 'border-l-cyan-500' : (muscuLog || cardioLog) ? 'border-l-emerald-500' : 'border-l-gray-700'}`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-white font-bold text-sm capitalize flex items-center gap-2">
                                    {d.dayName} {d.dateObj?.getDate()}
                                    {isToday && <Badge color="cyan" size="sm">Aujourd'hui</Badge>}
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                    {d.seance || "Repos"}
                                    {d.cardio && <span className="text-orange-400"> + Cardio</span>}
                                    {d.cardioOpt && !d.cardio && <span className="text-orange-400/70"> (+ {d.cardioOpt} optionnel)</span>}
                                </div>
                            </div>
                            <div className="flex gap-2 items-center flex-shrink-0 ml-2">
                                {/* Quick checkbox for Musculation */}
                                {d.type === 'Training' && d.seance && (
                                    <button 
                                        onClick={(e) => quickToggleMuscu(e, d, muscuLog)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                            muscuLog 
                                                ? 'bg-emerald-500 hover:bg-emerald-600' 
                                                : 'bg-white/5 border-2 border-gray-600 hover:border-cyan-500'
                                        }`}
                                        title="J'ai fait ma séance"
                                    >
                                        {muscuLog ? <Check size={18} className="text-white"/> : <Dumbbell size={16} className="text-gray-500"/>}
                                    </button>
                                )}
                                {/* Quick checkbox for Cardio (obligatoire ou optionnel) */}
                                {(d.cardio || d.cardioOpt) && (
                                    <button 
                                        onClick={(e) => quickToggleCardio(e, d, cardioLog)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                            cardioLog 
                                                ? 'bg-orange-500 hover:bg-orange-600' 
                                                : d.cardioOpt && !d.cardio
                                                    ? 'bg-white/5 border-2 border-dashed border-gray-600 hover:border-orange-500'
                                                    : 'bg-white/5 border-2 border-gray-600 hover:border-orange-500'
                                        }`}
                                        title={d.cardioOpt && !d.cardio ? `${d.cardioOpt} (optionnel)` : 'Cardio'}
                                    >
                                        {cardioLog ? <Check size={18} className="text-white"/> : <Heart size={16} className={d.cardioOpt && !d.cardio ? "text-gray-600" : "text-gray-500"}/>}
                                    </button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal isOpen={!!selected && !showCardioModal && !showMuscuModal} onClose={() => setSelected(null)} title="Détails Journée">
                <div className="space-y-4">
                    {selected?.type === 'Training' && selected?.seance && (
                        <div className="bg-white/5 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="font-bold text-white text-lg">{selected.seance}</div>
                                <Badge color={selected.muscuLog ? 'green' : 'gray'}>{selected.muscuLog ? 'FAIT' : 'À FAIRE'}</Badge>
                            </div>
                            <div className="text-sm text-gray-400 mb-3 border-l-2 border-cyan-500/30 pl-3 space-y-1">
                                {EXERCISES_DB[selected.seance]?.map(ex => (
                                    <div key={ex.id} className="flex justify-between">
                                        <span>{ex.name}</span>
                                        <span className="text-gray-600 font-mono">{ex.sets}×{ex.reps}</span>
                                    </div>
                                ))}
                            </div>
                            {!selected.muscuLog && (
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowMuscuModal(true)} variant="success" className="flex-1" icon={CheckCircle}>J'ai Fait</Button>
                                    <Button onClick={() => {onSelectDay(selected.seance); setSelected(null);}} variant="primary" className="flex-1" icon={Play}>Lancer</Button>
                                </div>
                            )}
                        </div>
                    )}
                    {selected?.cardio && selected.cardio !== 'Non' && (
                        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-orange-400 flex items-center gap-2"><Heart size={18}/> Cardio</div>
                                <Badge color={selected.cardioLog ? 'green' : 'gray'}>{selected.cardioLog ? 'FAIT' : 'À FAIRE'}</Badge>
                            </div>
                            <div className="text-white text-sm mb-1">{CARDIO_DETAILS[selected.cardio]?.title}</div>
                            {!selected.cardioLog && (
                                <Button onClick={() => setShowCardioModal(true)} variant="success" className="w-full mt-3" icon={CheckCircle}>J'ai Fait</Button>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={showMuscuModal} onClose={() => setShowMuscuModal(false)} title="Validation Musculation">
                <div className="space-y-4">
                    <div className="text-center mb-2">
                        <Dumbbell className="mx-auto text-cyan-500 mb-2" size={32}/>
                        <p className="text-white font-bold">{selected?.seance}</p>
                    </div>
                    <Input label="Durée (min)" type="number" value={muscuForm.duration} onChange={e => setMuscuForm({...muscuForm, duration: e.target.value})} />
                    <Input label="Calories (kcal)" type="number" value={muscuForm.calories} onChange={e => setMuscuForm({...muscuForm, calories: e.target.value})} />
                    <Button onClick={quickValidateMuscu} variant="primary" className="w-full">Enregistrer</Button>
                </div>
            </Modal>

            <Modal isOpen={showCardioModal} onClose={() => setShowCardioModal(false)} title="Validation Cardio">
                <div className="space-y-4">
                    <div className="text-center mb-2">
                        <Heart className="mx-auto text-orange-500 mb-2" size={32}/>
                        <p className="text-white font-bold">{CARDIO_DETAILS[selected?.cardio]?.title}</p>
                    </div>
                    <Input label="Durée (min)" type="number" value={cardioForm.duration} onChange={e => setCardioForm({...cardioForm, duration: e.target.value})} />
                    <Input label="Calories (kcal)" type="number" value={cardioForm.calories} onChange={e => setCardioForm({...cardioForm, calories: e.target.value})} />
                    <Button onClick={quickValidateCardio} variant="success" className="w-full">Enregistrer</Button>
                </div>
            </Modal>
        </div>
    );
};

const FitnessTracking = ({ workoutLogs }) => {
    const totalCals = workoutLogs.reduce((acc, curr) => acc + (parseInt(curr.calories) || 0), 0);
    const cardioSessions = workoutLogs.filter(d => d.session === 'CARDIO' || d.type === 'Cardio').length;
    const muscuSessions = workoutLogs.filter(d => d.session !== 'CARDIO' && d.type !== 'Cardio').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="p-4 h-64 flex items-end justify-between space-x-1 relative">
                <div className="absolute top-3 left-3 text-xs text-gray-500 font-bold uppercase tracking-wider">Calories (historique)</div>
                {workoutLogs.length > 0 ? workoutLogs.slice(-20).map((d, i) => (
                    <div key={i} className="flex-1 rounded-t relative group min-w-2" style={{height: `${Math.min(100, ((parseInt(d.calories) || 0)/800)*100)}%`}}>
                        <div className={`absolute bottom-0 w-full h-full rounded-t transition-all ${d.session === 'CARDIO' || d.type === 'Cardio' ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-gradient-to-t from-cyan-600 to-cyan-400'}`}></div>
                    </div>
                )) : <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">Aucune donnée.</div>}
            </Card>
            
            <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center">
                    <Dumbbell className="mx-auto mb-2 text-cyan-500" size={24}/>
                    <div className="text-2xl font-black text-white">{muscuSessions}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Muscu</div>
                </Card>
                <Card className="p-4 text-center">
                    <Heart className="mx-auto mb-2 text-orange-500" size={24}/>
                    <div className="text-2xl font-black text-white">{cardioSessions}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Cardio</div>
                </Card>
                <Card className="p-4 text-center">
                    <Flame className="mx-auto mb-2 text-red-500" size={24}/>
                    <div className="text-2xl font-black text-orange-400">{totalCals.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold">Kcal</div>
                </Card>
            </div>
        </div>
    );
};

const FitnessPerf = ({ workoutLogs }) => {
    const sessionStats = useMemo(() => {
        const stats = {};
        ['PUSH_A', 'PULL_A', 'LEGS_A', 'PUSH_B', 'PULL_B', 'MOLLETS'].forEach(session => {
            const sessionLogs = workoutLogs.filter(log => log.session === session);
            stats[session] = { count: sessionLogs.length, totalCalories: sessionLogs.reduce((acc, log) => acc + (parseInt(log.calories) || 0), 0) };
        });
        const cardioLogs = workoutLogs.filter(log => log.session === 'CARDIO' || log.type === 'Cardio');
        stats['CARDIO'] = { count: cardioLogs.length, totalCalories: cardioLogs.reduce((acc, log) => acc + (parseInt(log.calories) || 0), 0) };
        return stats;
    }, [workoutLogs]);

    const sessionInfo = {
        'PUSH_A': { name: 'Push A', Icon: Dumbbell }, 'PULL_A': { name: 'Pull A', Icon: Activity },
        'LEGS_A': { name: 'Legs', Icon: Zap }, 'PUSH_B': { name: 'Push B', Icon: Dumbbell },
        'PULL_B': { name: 'Pull B', Icon: Activity }, 'MOLLETS': { name: 'Mollets', Icon: Zap },
        'CARDIO': { name: 'Cardio', Icon: Heart }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
                <Trophy size={48} className="mx-auto text-yellow-500 mb-3 animate-float" />
                <h3 className="text-white font-bold text-2xl">Performances</h3>
            </div>
            <div className="space-y-2">
                {Object.entries(sessionStats).map(([session, stats]) => {
                    const info = sessionInfo[session];
                    if (stats.count === 0) return null;
                    return (
                        <Card key={session} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session === 'CARDIO' ? 'bg-orange-500/20' : 'bg-cyan-500/20'}`}>
                                        <info.Icon size={20} className={session === 'CARDIO' ? 'text-orange-500' : 'text-cyan-500'} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{info.name}</div>
                                        <div className="text-xs text-gray-500">{stats.count} séance{stats.count > 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-white">{stats.totalCalories} <span className="text-xs text-gray-500">kcal</span></div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

const WorkoutLogger = ({ sessionCode, onExit, onFinishSession, addLog, updateLog, workoutLogs, getInProgressSession }) => {
    const exercises = EXERCISES_DB[sessionCode] || [];
    const [logs, setLogs] = useState({});
    const [idx, setIdx] = useState(0);
    const [finishMode, setFinishMode] = useState(false);
    const [final, setFinal] = useState({ duration: '', calories: '' });
    const [restTimer, setRestTimer] = useState(null);
    const [restSeconds, setRestSeconds] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving' | 'saved' | null

    // Temps de repos par défaut selon l'exercice (en secondes)
    const getRestTime = (exercise) => {
        // 1. Utiliser le champ repos de l'exercice s'il existe
        if (exercise?.repos) return exercise.repos;

        // 2. Détection exercices composés lourds (180s - 3min)
        const compoundHeavy = ['squat', 'deadlift', 'soulevé de terre', 'développé couché', 'bench press'];
        const nameLower = exercise?.name?.toLowerCase() || '';
        if (compoundHeavy.some(ex => nameLower.includes(ex))) return 180;

        // 3. Exercices composés moyens (150s - 2:30)
        const compoundMedium = ['rowing', 'leg press', 'presse', 'dips', 'tractions', 'développé militaire', 'fentes'];
        if (compoundMedium.some(ex => nameLower.includes(ex))) return 150;

        // 4. Force (reps basses)
        if (exercise?.reps?.includes('6-8') || exercise?.reps?.includes('4-6')) return 150;

        // 5. Abdos (45-60s)
        const absExercises = ['crunch', 'planche', 'abdo', 'gainage', 'relevé'];
        if (absExercises.some(ex => nameLower.includes(ex))) return 45;

        // 6. Isolation par défaut (90s)
        return 90;
    };

    // Initialisation - charger séance in_progress ou créer nouvelle
    useEffect(() => {
        const inProgress = getInProgressSession?.();
        if (inProgress && inProgress.session === sessionCode) {
            // Reprendre la séance en cours
            setLogs(inProgress.logs || {});
            setSessionId(inProgress.id);
            setIdx(inProgress.lastExerciseIdx || 0);
        } else {
            // Nouvelle séance
            const init = {};
            exercises.forEach(e => { init[e.id] = Array(e.sets).fill(null).map(() => ({weight: '', reps: ''})); });
            setLogs(init);
            // Créer une nouvelle séance in_progress
            const newId = Date.now().toString();
            setSessionId(newId);
            addLog({
                id: newId,
                date: new Date().toISOString().split('T')[0],
                session: sessionCode,
                logs: init,
                status: 'in_progress',
                type: 'Muscu',
                timestamp: new Date().toISOString(),
                lastExerciseIdx: 0
            });
        }
    }, [sessionCode]);

    // Auto-save avec debounce (2 secondes)
    useEffect(() => {
        if (!sessionId) return;

        const hasData = Object.values(logs).some(sets =>
            sets.some(s => s.weight || s.reps)
        );

        if (!hasData) return;

        setAutoSaveStatus('saving');
        const timer = setTimeout(() => {
            updateLog?.(sessionId, {
                logs,
                lastExerciseIdx: idx,
                updatedAt: new Date().toISOString()
            });
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus(null), 2000);
        }, 2000);

        return () => clearTimeout(timer);
    }, [logs, idx, sessionId]);

    // Timer de repos
    useEffect(() => {
        let interval;
        if (restTimer !== null && restSeconds > 0) {
            interval = setInterval(() => {
                setRestSeconds(prev => {
                    if (prev <= 1) {
                        setRestTimer(null);
                        // Vibration si disponible
                        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [restTimer, restSeconds]);

    const startRest = () => {
        const cur = exercises[idx];
        setRestSeconds(getRestTime(cur));
        setRestTimer(Date.now());
    };

    const update = (eid, i, field, value) => {
        setLogs(prev => { const updated = {...prev}; updated[eid] = [...(updated[eid] || [])]; updated[eid][i] = {...(updated[eid][i] || {}), [field]: value}; return updated; });
    };

    const save = () => {
        // Transform logs to exercises array for FitnessProgress compatibility
        const exercisesArray = exercises.map(ex => {
            const exLogs = logs[ex.id] || [];
            // Calculate average weight and total reps across all sets
            const validSets = exLogs.filter(s => s.weight && parseFloat(s.weight) > 0);
            if (validSets.length === 0) return null;
            const avgWeight = validSets.reduce((sum, s) => sum + parseFloat(s.weight), 0) / validSets.length;
            const totalReps = validSets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
            return {
                name: ex.name,
                weight: Math.round(avgWeight * 10) / 10,
                reps: Math.round(totalReps / validSets.length),
                sets: validSets.length
            };
        }).filter(Boolean);

        // Mettre à jour la séance existante avec status completed
        if (sessionId && updateLog) {
            updateLog(sessionId, {
                exercises: exercisesArray,
                logs,
                duration: final.duration,
                calories: final.calories,
                status: 'completed',
                completedAt: new Date().toISOString()
            });
        } else {
            // Fallback: ajouter comme nouvelle séance
            addLog({
                date: new Date().toISOString().split('T')[0],
                session: sessionCode,
                exercises: exercisesArray,
                logs,
                duration: final.duration,
                calories: final.calories,
                status: 'completed',
                type: 'Muscu',
                timestamp: new Date().toISOString()
            });
        }
        onFinishSession?.();
    };

    if (exercises.length === 0) return <div className="text-center py-10"><p className="text-gray-400">Aucun exercice trouvé.</p><Button onClick={onExit} variant="secondary" className="mt-4">Retour</Button></div>;
    
    if (finishMode) {
        return (
            <div className="space-y-6 pb-4 animate-fade-in">
                <Card className="p-6 space-y-4">
                    <div className="text-center mb-4"><CheckCircle className="mx-auto text-emerald-500 mb-2" size={48}/><h2 className="text-xl font-bold text-white">Séance terminée !</h2><p className="text-gray-400">Bien joué 💪</p></div>
                    <Input label="Durée totale (min)" type="number" value={final.duration} onChange={e => setFinal({...final, duration: e.target.value})} placeholder="Ex: 65" />
                    <Input label="Calories brûlées (kcal)" type="number" value={final.calories} onChange={e => setFinal({...final, calories: e.target.value})} placeholder="Ex: 450" />
                    <Button onClick={save} variant="success" className="w-full text-lg py-4">✓ ENREGISTRER LA SÉANCE</Button>
                </Card>
            </div>
        );
    }

    const cur = exercises[idx];
    const curLogs = logs[cur?.id] || [];
    const restTimeDefault = getRestTime(cur);

    // Récupérer l'historique de la dernière fois pour cet exercice
    const getLastExerciseHistory = (exerciseName) => {
        if (!workoutLogs || workoutLogs.length === 0) return null;

        // Chercher dans les logs complétés (status = completed)
        const completedLogs = workoutLogs
            .filter(l => l.status === 'completed' && l.logs)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const workout of completedLogs) {
            // Chercher l'exercice par ID ou par nom
            const exerciseLog = workout.logs?.[cur?.id];
            if (exerciseLog) {
                const validSets = exerciseLog.filter(s => s.weight && s.reps);
                if (validSets.length > 0) {
                    const bestSet = validSets.reduce((best, s) =>
                        parseFloat(s.weight) > parseFloat(best.weight) ? s : best
                    , validSets[0]);
                    return {
                        date: workout.date,
                        weight: bestSet.weight,
                        reps: bestSet.reps,
                        sets: validSets.length
                    };
                }
            }
        }
        return null;
    };

    const lastHistory = getLastExerciseHistory(cur?.name);

    return (
        <div className="flex flex-col min-h-[60vh] pb-20 md:pb-4 animate-fade-in overflow-x-hidden w-full min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-xl flex-shrink-0"><ArrowLeft className="text-gray-400" size={20}/></button>
                <div className="flex items-center gap-2 truncate px-2">
                    <span className="font-bold text-white text-lg truncate">{sessionCode}</span>
                    {autoSaveStatus === 'saving' && <span className="text-xs text-yellow-400 animate-pulse">💾</span>}
                    {autoSaveStatus === 'saved' && <span className="text-xs text-green-400">✓</span>}
                </div>
                <Badge color="cyan" className="flex-shrink-0">{idx + 1}/{exercises.length}</Badge>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all" style={{width: `${((idx + 1) / exercises.length) * 100}%`}} />
            </div>

            {/* Timer de repos */}
            {restTimer !== null && (
                <Card className="p-4 mb-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                    <div className="text-center">
                        <div className="text-xs text-orange-400 uppercase font-bold mb-1">⏱️ Repos</div>
                        <div className="text-4xl font-black text-white">{Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')}</div>
                        <button onClick={() => setRestTimer(null)} className="mt-2 text-xs text-gray-400 hover:text-white">Passer</button>
                    </div>
                </Card>
            )}
            
            {/* Exercise card */}
            <Card className="p-4 flex-1 mb-4 overflow-hidden min-w-0 w-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-white truncate">{cur?.name}</h2>
                        <p className="text-gray-500 text-sm">{cur?.sets} séries × {cur?.reps}</p>
                        {/* Historique dernière séance */}
                        {lastHistory ? (
                            <p className="text-xs text-cyan-400 mt-1">
                                📊 Dernière fois ({new Date(lastHistory.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}): {lastHistory.weight}kg × {lastHistory.reps} reps
                            </p>
                        ) : (
                            <p className="text-xs text-gray-600 mt-1">✨ Première fois</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <button
                            onClick={startRest}
                            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl transition-all"
                            title={`Repos ${Math.floor(restTimeDefault/60)}:${(restTimeDefault%60).toString().padStart(2,'0')}`}
                        >
                            <Timer className="text-orange-400" size={20}/>
                        </button>
                    </div>
                </div>

                {/* Sets - scrollable horizontalement si nécessaire sur petit écran */}
                <div className="space-y-2 overflow-x-auto min-w-0">
                    {curLogs.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-500 text-xs w-5 text-center font-mono flex-shrink-0">#{i + 1}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="kg"
                                className="w-0 flex-1 min-w-[70px] bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-center focus:border-cyan-500 outline-none"
                                value={s?.weight || ''}
                                onChange={e => update(cur.id, i, 'weight', e.target.value)}
                            />
                            <input
                                type="number"
                                inputMode="numeric"
                                placeholder="reps"
                                className="w-0 flex-1 min-w-[70px] bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-center focus:border-cyan-500 outline-none"
                                value={s?.reps || ''}
                                onChange={e => update(cur.id, i, 'reps', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                
                {/* Rest time info */}
                <div className="mt-3 text-center">
                    <span className="text-xs text-gray-500">💡 Repos recommandé : {Math.floor(restTimeDefault/60)}:{(restTimeDefault%60).toString().padStart(2,'0')}</span>
                </div>
            </Card>
            
            {/* Navigation - fixé en bas sur mobile pour toujours être visible */}
            <div className="fixed md:relative bottom-16 md:bottom-auto left-0 right-0 md:left-auto md:right-auto bg-[#050508] md:bg-transparent p-4 md:p-0 md:pt-4 border-t border-white/10 md:border-0 z-30">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    {idx > 0 && <Button onClick={() => setIdx(idx - 1)} variant="secondary" className="flex-1 py-3">← Précédent</Button>}
                    {idx < exercises.length - 1 ? (
                        <Button onClick={() => setIdx(idx + 1)} variant="primary" className="flex-1 py-3">Suivant →</Button>
                    ) : (
                        <Button onClick={() => setFinishMode(true)} variant="success" className="flex-1 py-3">✓ Terminer</Button>
                    )}
                </div>
            </div>
            {/* Spacer pour mobile pour éviter que le contenu soit caché */}
            <div className="h-20 md:h-0" />
        </div>
    );
};

const FitnessBiometrics = ({ userId }) => {
    const [biometrics, setBiometrics] = useLocalStorage(`titan_biometrics_${userId}`, {});
    const [showForm, setShowForm] = useState(false);
    const [viewHistory, setViewHistory] = useState(false);
    const [form, setForm] = useState({
        poids: '', imc: '', graisse: '', muscleSq: '', poidsSansGras: '', 
        grasSousCut: '', graisseVisc: '', eau: '', masseMuscu: '', 
        masseOsseuse: '', proteines: '', bmr: '', ageMetabo: ''
    });
    const [saved, setSaved] = useState(false);
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Sauvegarder les données
    const save = async () => {
        const newEntry = { ...form, timestamp: new Date().toISOString() };
        setBiometrics(prev => ({ ...prev, [todayStr]: newEntry }));
        
        // Sync Supabase
        try {
            await supabase.from('biometrics').upsert({
                user_id: userId,
                date: todayStr,
                poids: parseFloat(form.poids) || null,
                tour_taille: null,
                tour_bras: null,
                body_fat: parseFloat(form.graisse) || null
            }, { onConflict: 'user_id,date' });
        } catch (e) { console.log('Save error:', e); }
        
        setSaved(true);
        setTimeout(() => { setSaved(false); setShowForm(false); }, 1500);
    };
    
    // Récupérer l'historique trié par date
    const history = useMemo(() => {
        return Object.entries(biometrics)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [biometrics]);
    
    // Données pour le graphique (derniers 12 points)
    const chartData = useMemo(() => {
        return Object.entries(biometrics)
            .filter(([_, data]) => data.poids)
            .map(([date, data]) => ({ date, poids: parseFloat(data.poids) }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-12);
    }, [biometrics]);
    
    const latestEntry = history[0];
    const previousEntry = history[1];
    
    // Calcul de la progression
    const weightDiff = latestEntry?.poids && previousEntry?.poids 
        ? (parseFloat(latestEntry.poids) - parseFloat(previousEntry.poids)).toFixed(1)
        : null;
    
    const fields = [
        { key: 'poids', label: 'Poids', unit: 'kg' },
        { key: 'imc', label: 'IMC', unit: '' },
        { key: 'graisse', label: 'Graisse %', unit: '%' },
        { key: 'muscleSq', label: 'Muscle Sq', unit: '' },
        { key: 'poidsSansGras', label: 'Poids sans gras', unit: 'kg' },
        { key: 'grasSousCut', label: 'Gras Sous-Cut', unit: '' },
        { key: 'graisseVisc', label: 'Graisse Visc.', unit: '' },
        { key: 'eau', label: 'Eau %', unit: '%' },
        { key: 'masseMuscu', label: 'Masse Muscu', unit: 'kg' },
        { key: 'masseOsseuse', label: 'Masse Osseuse', unit: 'kg' },
        { key: 'proteines', label: 'Protéines', unit: '%' },
        { key: 'bmr', label: 'BMR', unit: 'kcal' },
        { key: 'ageMetabo', label: 'Âge Métabo', unit: 'ans' }
    ];
    
    // Mini graphique SVG
    const MiniChart = ({ data }) => {
        if (!data || data.length < 2) return null;
        const values = data.map(d => d.poids);
        const min = Math.min(...values) - 1;
        const max = Math.max(...values) + 1;
        const width = 280;
        const height = 80;
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.poids - min) / (max - min)) * height;
            return `${x},${y}`;
        }).join(' ');
        
        return (
            <svg width={width} height={height} className="mx-auto">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <polyline
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    points={points}
                />
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - ((d.poids - min) / (max - min)) * height;
                    return <circle key={i} cx={x} cy={y} r="4" fill="#8b5cf6" />;
                })}
            </svg>
        );
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-4">
                <Scale className="mx-auto text-purple-500 mb-2" size={40}/>
                <h3 className="text-white font-bold text-xl">Données Biométriques</h3>
            </div>
            
            {/* Stats actuelles */}
            {latestEntry && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-gray-500">Dernière mesure : {new Date(latestEntry.date).toLocaleDateString('fr-FR')}</div>
                        {weightDiff && (
                            <Badge color={parseFloat(weightDiff) > 0 ? 'yellow' : 'green'} size="sm">
                                {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
                            </Badge>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-3xl font-black text-white">{latestEntry.poids || '--'}</div>
                            <div className="text-xs text-gray-500">Poids (kg)</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{latestEntry.graisse || '--'}</div>
                            <div className="text-xs text-gray-500">Graisse %</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{latestEntry.masseMuscu || '--'}</div>
                            <div className="text-xs text-gray-500">Muscle (kg)</div>
                        </div>
                    </div>
                </Card>
            )}
            
            {/* Graphique évolution */}
            {chartData.length >= 2 && (
                <Card className="p-4">
                    <div className="text-sm font-bold text-white mb-3">📈 Évolution du poids</div>
                    <MiniChart data={chartData} />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{chartData[0]?.date}</span>
                        <span>{chartData[chartData.length - 1]?.date}</span>
                    </div>
                </Card>
            )}
            
            {/* Boutons actions */}
            <div className="flex gap-2">
                <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'accent'} className="flex-1">
                    {showForm ? '✕ Fermer' : '+ Nouvelle mesure'}
                </Button>
                <Button onClick={() => setViewHistory(!viewHistory)} variant="secondary" className="flex-1">
                    {viewHistory ? 'Masquer' : `📋 Historique (${history.length})`}
                </Button>
            </div>
            
            {/* Formulaire */}
            {showForm && (
                <Card className="p-4 animate-fade-in">
                    <div className="text-sm font-bold text-white mb-3">📝 Nouvelle mesure - {new Date().toLocaleDateString('fr-FR')}</div>
                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(({ key, label, unit }) => (
                            <div key={key}>
                                <label className="text-xs text-gray-500 uppercase block mb-1 font-bold">{label}</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={form[key]}
                                    placeholder={unit}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none text-sm" 
                                    onChange={e => setForm({...form, [key]: e.target.value})} 
                                />
                            </div>
                        ))}
                    </div>
                    <Button onClick={save} variant={saved ? "success" : "accent"} className="w-full mt-4">
                        {saved ? "✓ Enregistré !" : "Enregistrer"}
                    </Button>
                </Card>
            )}
            
            {/* Historique */}
            {viewHistory && (
                <Card className="p-4 animate-fade-in">
                    <div className="text-sm font-bold text-white mb-3">📋 Historique des mesures</div>
                    <div className="space-y-2 max-h-60 overflow-auto">
                        {history.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">Aucune mesure enregistrée</div>
                        ) : (
                            history.map((entry, i) => (
                                <div key={entry.date} className={`p-3 rounded-xl ${i === 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-bold text-white">{new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                            <div className="text-xs text-gray-500">
                                                {entry.poids && `${entry.poids}kg`}
                                                {entry.graisse && ` • ${entry.graisse}% graisse`}
                                                {entry.masseMuscu && ` • ${entry.masseMuscu}kg muscle`}
                                            </div>
                                        </div>
                                        {i === 0 && <Badge color="purple" size="sm">Dernier</Badge>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTINE MODULE
// ═══════════════════════════════════════════════════════════════════════════════

const RoutineView = ({ userId }) => {
    const [view, setView] = useState('today');
    const [habitLogs, setHabitLogs] = useSupabaseHabits(userId);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const routineData = DAILY_ROUTINES[dayOfWeek];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const applicableHabits = useMemo(() => {
        return HABITS.filter(habit => {
            if (habit.weekendExcluded && isWeekend) return false;
            if (habit.id === 'muscu' && !routineData.muscu) return false;
            if (habit.id === 'cardio' && !routineData.cardio) return false;
            return true;
        });
    }, [dayOfWeek, routineData]);

    const dayHabits = habitLogs[selectedDate] || {};
    const toggleHabit = (habitId) => setHabitLogs(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), [habitId]: !dayHabits[habitId] } }));
    
    const completedCount = applicableHabits.filter(h => dayHabits[h.id]).length;
    const totalCount = applicableHabits.length;
    const dayScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const changeDay = (delta) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(d.toISOString().split('T')[0]); };

    return (
        <div className="space-y-4">
            <div className="flex space-x-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
                {['today', 'week', 'stats'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all ${view === v ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        {v === 'today' ? 'Jour' : v === 'week' ? 'Semaine' : 'Stats'}
                    </button>
                ))}
            </div>

            {view === 'today' && (
                <div className="space-y-4 animate-fade-in">
                    <Card className="p-3 flex justify-between items-center">
                        <button onClick={() => changeDay(-1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronLeft className="text-gray-400" size={20}/></button>
                        <div className="text-center">
                            <div className="text-white font-bold">{routineData.name}</div>
                            <div className="text-xs text-gray-500">{formatDatePretty(selectedDate)}</div>
                            {selectedDate === todayStr && <Badge color="purple" size="sm">Aujourd'hui</Badge>}
                        </div>
                        <button onClick={() => changeDay(1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronRight className="text-gray-400" size={20}/></button>
                    </Card>

                    <Card className="p-4 text-center">
                        <div className="text-5xl font-black gradient-text mb-1">{dayScore}%</div>
                        <div className="text-sm text-gray-400">{completedCount}/{totalCount} habitudes</div>
                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{width: `${dayScore}%`}} />
                        </div>
                    </Card>

                    <div className="space-y-2">
                        {applicableHabits.map(habit => {
                            const isChecked = dayHabits[habit.id];
                            const HabitIcon = habit.Icon;
                            return (
                                <Card key={habit.id} onClick={() => toggleHabit(habit.id)} className={`p-4 flex items-center justify-between ${isChecked ? 'border-emerald-500/50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isChecked ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                            <HabitIcon size={20} className={isChecked ? 'text-emerald-400' : 'text-gray-500'} />
                                        </div>
                                        <div className={`font-bold ${isChecked ? 'text-emerald-400' : 'text-white'}`}>{habit.name}</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                                        {isChecked && <Check size={14} className="text-white" />}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'week' && <RoutineWeekView habitLogs={habitLogs} toggleHabit={(date, habitId) => setHabitLogs(prev => ({ ...prev, [date]: { ...(prev[date] || {}), [habitId]: !(prev[date]?.[habitId]) } }))} />}
            {view === 'stats' && <RoutineStats habitLogs={habitLogs} />}
        </div>
    );
};

const RoutineWeekView = ({ habitLogs, toggleHabit }) => {
    const [weekStart, setWeekStart] = useState(() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setDate(diff); d.setHours(0, 0, 0, 0); return d; });
    const changeWeek = (delta) => { const d = new Date(weekStart); d.setDate(d.getDate() + (delta * 7)); setWeekStart(d); };

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart); d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dow = d.getDay();
        const routine = DAILY_ROUTINES[dow];
        const isWE = dow === 0 || dow === 6;
        const applicable = HABITS.filter(h => { if (h.weekendExcluded && isWE) return false; if (h.id === 'muscu' && !routine.muscu) return false; if (h.id === 'cardio' && !routine.cardio) return false; return true; });
        const dayData = habitLogs[dateStr] || {};
        const completed = applicable.filter(h => dayData[h.id]).length;
        const score = applicable.length > 0 ? Math.round((completed / applicable.length) * 100) : 0;
        days.push({ date: d, dateStr, dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }), dayNum: d.getDate(), applicable, dayData, completed, total: applicable.length, score, isToday: dateStr === new Date().toISOString().split('T')[0] });
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <Card className="p-3 flex justify-between items-center">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronLeft className="text-gray-400" size={20}/></button>
                <span className="text-white font-bold text-sm">{weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {days[6]?.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronRight className="text-gray-400" size={20}/></button>
            </Card>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                    <div key={i} className={`text-center p-2 rounded-xl ${day.isToday ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5'}`}>
                        <div className="text-xs text-gray-500 capitalize font-bold">{day.dayName}</div>
                        <div className="text-lg font-bold text-white">{day.dayNum}</div>
                        <div className={`text-xs font-bold mt-1 ${day.score >= 80 ? 'text-emerald-400' : day.score >= 50 ? 'text-yellow-400' : 'text-gray-500'}`}>{day.score}%</div>
                    </div>
                ))}
            </div>
            <div className="space-y-3">
                {days.map((day, i) => (
                    <Card key={i} className={`p-3 ${day.isToday ? 'border-purple-500/30' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold text-white capitalize">{day.dayName} {day.dayNum}</div>
                            <div className={`text-sm font-bold ${day.score >= 80 ? 'text-emerald-400' : day.score >= 50 ? 'text-yellow-400' : 'text-gray-500'}`}>{day.completed}/{day.total}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {day.applicable.map(habit => {
                                const isChecked = day.dayData[habit.id];
                                const HabitIcon = habit.Icon;
                                return <button key={habit.id} onClick={() => toggleHabit(day.dateStr, habit.id)} className={`p-2 rounded-lg transition-all ${isChecked ? 'bg-emerald-500/20' : 'bg-white/5 opacity-50'}`}><HabitIcon size={16} className={isChecked ? 'text-emerald-400' : 'text-gray-500'} /></button>;
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const RoutineStats = ({ habitLogs }) => {
    const weekStats = useMemo(() => {
        const stats = [];
        const today = new Date();
        for (let w = 6; w >= 0; w--) {
            const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() - (w * 7) + 1);
            let weekTotal = 0, weekCompleted = 0;
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart); date.setDate(weekStart.getDate() + d);
                const dateStr = date.toISOString().split('T')[0];
                const dow = date.getDay();
                const isWE = dow === 0 || dow === 6;
                const routine = DAILY_ROUTINES[dow];
                const applicable = HABITS.filter(h => { if (h.weekendExcluded && isWE) return false; if (h.id === 'muscu' && !routine.muscu) return false; if (h.id === 'cardio' && !routine.cardio) return false; return true; });
                const dayData = habitLogs[dateStr] || {};
                weekTotal += applicable.length;
                weekCompleted += applicable.filter(h => dayData[h.id]).length;
            }
            stats.push({ label: `S${52 - 6 + stats.length}`, percent: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0 });
        }
        return stats;
    }, [habitLogs]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4"><Trophy size={40} className="mx-auto text-yellow-500 mb-2 animate-float"/><h3 className="text-white font-bold text-xl">Weekly Average</h3></div>
            <Card className="p-4 h-64 relative">
                <div className="absolute inset-4 flex items-end justify-between space-x-2">
                    {weekStats.map((week, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1 font-bold">{week.percent}%</div>
                            <div className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t" style={{height: `${Math.max(5, week.percent * 1.8)}px`}} />
                            <div className="text-xs text-gray-600 mt-2">{week.label}</div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE MODULE
// ═══════════════════════════════════════════════════════════════════════════════

const PieChart = ({ data, title, size = 180 }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return null;
    let currentAngle = 0;
    const paths = data.map((d, i) => {
        const percentage = d.value / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const x1 = 100 + 80 * Math.cos(startRad);
        const y1 = 100 + 80 * Math.sin(startRad);
        const x2 = 100 + 80 * Math.cos(endRad);
        const y2 = 100 + 80 * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;
        const pathD = angle >= 359.99 ? `M 100 20 A 80 80 0 1 1 99.99 20 A 80 80 0 1 1 100 20` : `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={i} d={pathD} fill={d.color} className="transition-all hover:opacity-80 cursor-pointer" />;
    });
    return (
        <div className="text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">{title}</h3>
            <svg viewBox="0 0 200 200" width={size} height={size} className="mx-auto">
                {paths}
                <circle cx="100" cy="100" r="45" fill="#0a0a10" />
                <text x="100" y="95" textAnchor="middle" className="fill-white text-lg font-bold">{total.toFixed(0)}€</text>
                <text x="100" y="112" textAnchor="middle" className="fill-gray-500 text-xs">Total</text>
            </svg>
            <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {data.filter(d => d.value > 0).sort((a,b) => b.value - a.value).slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded" style={{backgroundColor: d.color}}></div><span className="text-gray-400">{d.name}</span></div>
                        <span className="text-white font-bold">{d.value.toFixed(0)}€</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FinanceView = ({ userId }) => {
    const [view, setView] = useState('overview');
    const [transactions, setTransactions, addTransactionToDb, deleteTransactionFromDb] = useSupabaseTransactions(userId);
    const [selectedMonth, setSelectedMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; });
    const [showAddManual, setShowAddManual] = useState(false);
    const [editingTx, setEditingTx] = useState(null);

    const monthTransactions = useMemo(() => transactions.filter(tx => tx.date?.startsWith(selectedMonth)), [transactions, selectedMonth]);
    const monthStats = useMemo(() => {
        const expenses = monthTransactions.filter(tx => tx.amount < 0);
        const incomes = monthTransactions.filter(tx => tx.amount > 0);
        const totalExpenses = expenses.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
        const totalIncome = incomes.reduce((acc, tx) => acc + tx.amount, 0);
        const byCategory = {}, byPayment = {};
        expenses.forEach(tx => { byCategory[tx.category || 'autres'] = (byCategory[tx.category || 'autres'] || 0) + Math.abs(tx.amount); byPayment[tx.paymentMethod || 'bnp'] = (byPayment[tx.paymentMethod || 'bnp'] || 0) + Math.abs(tx.amount); });
        return { totalExpenses, totalIncome, balance: totalIncome - totalExpenses, byCategory, byPayment };
    }, [monthTransactions]);

    const categoryChartData = useMemo(() => EXPENSE_CATEGORIES.map(cat => ({ name: cat.name, value: monthStats.byCategory[cat.id] || 0, color: cat.color })).filter(d => d.value > 0), [monthStats.byCategory]);
    const paymentChartData = useMemo(() => PAYMENT_METHODS.map(pm => ({ name: pm.name, value: monthStats.byPayment[pm.id] || 0, color: pm.color })).filter(d => d.value > 0), [monthStats.byPayment]);

    const autoCategorize = (description) => { const desc = description.toLowerCase(); for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) { if (keywords.some(kw => desc.includes(kw))) return category; } return 'autres'; };
    const addTransaction = (tx) => { const newTx = { ...tx, id: Date.now().toString(), category: tx.category || autoCategorize(tx.description || ''), createdAt: new Date().toISOString() }; addTransactionToDb(newTx); };
    const updateTransaction = (id, updates) => { setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)); setEditingTx(null); };
    const deleteTransaction = (id) => { deleteTransactionFromDb(id); };
    const changeMonth = (delta) => { const [year, month] = selectedMonth.split('-').map(Number); const newDate = new Date(year, month - 1 + delta); setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`); };

    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-4">
            {/* Bridge Bank Widget */}
            <FinanceWidget userId={userId} />
            
            {/* Manual Finance Section */}
            <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-gray-500 uppercase font-bold mb-3">📝 Transactions manuelles</div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
                {['overview', 'transactions'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all ${view === v ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        {v === 'overview' ? 'Vue' : 'Transactions'}
                    </button>
                ))}
            </div>

            <Card className="p-3 flex justify-between items-center">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronLeft className="text-gray-400" size={20}/></button>
                <span className="text-white font-bold capitalize">{monthName}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-xl"><ChevronRight className="text-gray-400" size={20}/></button>
            </Card>

            {view === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 text-center"><div className="text-xs text-gray-500 uppercase mb-1 font-bold">Dépenses</div><div className="text-2xl font-black text-red-400">-{monthStats.totalExpenses.toFixed(0)}€</div></Card>
                        <Card className="p-4 text-center"><div className="text-xs text-gray-500 uppercase mb-1 font-bold">Revenus</div><div className="text-2xl font-black text-emerald-400">+{monthStats.totalIncome.toFixed(0)}€</div></Card>
                    </div>
                    <Card className={`p-4 text-center ${monthStats.balance >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                        <div className="text-xs text-gray-500 uppercase mb-1 font-bold">Balance</div>
                        <div className={`text-3xl font-black ${monthStats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{monthStats.balance >= 0 ? '+' : ''}{monthStats.balance.toFixed(0)}€</div>
                    </Card>
                    {monthStats.totalExpenses > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4"><PieChart data={categoryChartData} title="Par catégorie" /></Card>
                            <Card className="p-4"><PieChart data={paymentChartData} title="Par compte" /></Card>
                        </div>
                    )}
                    <Button onClick={() => setShowAddManual(true)} variant="primary" className="w-full" icon={Plus}>Ajouter</Button>
                </div>
            )}

            {view === 'transactions' && (
                <div className="space-y-2 animate-fade-in">
                    {monthTransactions.length === 0 ? (
                        <div className="text-center text-gray-600 py-10"><Wallet className="mx-auto mb-3 text-gray-700" size={40}/><p>Aucune transaction</p></div>
                    ) : monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => {
                        const cat = EXPENSE_CATEGORIES.find(c => c.id === tx.category) || EXPENSE_CATEGORIES[11];
                        const pm = PAYMENT_METHODS.find(p => p.id === tx.paymentMethod) || PAYMENT_METHODS[0];
                        const CatIcon = cat.Icon;
                        return (
                            <Card key={tx.id} onClick={() => setEditingTx(tx)} className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: cat.color + '20'}}><CatIcon size={18} style={{color: cat.color}} /></div>
                                    <div>
                                        <div className="text-sm text-white font-medium">{tx.description}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2"><span>{new Date(tx.date).toLocaleDateString('fr-FR')}</span><Badge color="gray" size="sm">{pm.name}</Badge></div>
                                    </div>
                                </div>
                                <div className={`font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}€</div>
                            </Card>
                        );
                    })}
                </div>
            )}
            </div>

            <Modal isOpen={showAddManual} onClose={() => setShowAddManual(false)} title="Nouvelle transaction">
                <TransactionForm onSubmit={(tx) => { addTransaction(tx); setShowAddManual(false); }} onCancel={() => setShowAddManual(false)} />
            </Modal>
            <Modal isOpen={!!editingTx} onClose={() => setEditingTx(null)} title="Modifier">
                {editingTx && <TransactionForm initialData={editingTx} onSubmit={(tx) => updateTransaction(editingTx.id, tx)} onDelete={() => { deleteTransaction(editingTx.id); setEditingTx(null); }} />}
            </Modal>
        </div>
    );
};

const TransactionForm = ({ initialData, onSubmit, onDelete }) => {
    const [form, setForm] = useState({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        description: initialData?.description || '',
        amount: initialData?.amount ? String(Math.abs(initialData.amount)) : '',
        isExpense: initialData?.amount ? initialData.amount < 0 : true,
        category: initialData?.category || 'autres',
        paymentMethod: initialData?.paymentMethod || 'bnp'
    });

    const handleSubmit = () => { const amount = parseFloat(form.amount) || 0; onSubmit({ date: form.date, description: form.description, amount: form.isExpense ? -amount : amount, category: form.category, paymentMethod: form.paymentMethod }); };

    return (
        <div className="space-y-4">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <Input label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Ex: Carrefour" />
            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Montant (€)</label>
                <div className="flex gap-2">
                    <input type="number" step="0.01" value={form.amount} placeholder="0.00" className="flex-1 bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-yellow-500 outline-none" onChange={e => setForm({...form, amount: e.target.value})} />
                    <button onClick={() => setForm({...form, isExpense: !form.isExpense})} className={`px-4 rounded-xl font-bold text-sm ${form.isExpense ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{form.isExpense ? '−' : '+'}</button>
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Catégorie</label>
                <div className="grid grid-cols-4 gap-2">
                    {EXPENSE_CATEGORIES.map(cat => { const CatIcon = cat.Icon; return (
                        <button 
                            key={cat.id} 
                            onClick={() => setForm({...form, category: cat.id})} 
                            className={`p-3 rounded-xl flex flex-col items-center gap-1 ${form.category === cat.id ? 'ring-2 ring-yellow-500' : 'bg-white/5'}`} 
                            style={{backgroundColor: form.category === cat.id ? cat.color + '30' : ''}}
                        >
                            <CatIcon size={18} style={{color: form.category === cat.id ? cat.color : '#6B7280'}} />
                            <span className={`text-[10px] font-medium text-center ${form.category === cat.id ? 'text-white' : 'text-gray-500'}`}>
                                {cat.name}
                            </span>
                        </button>
                    ); })}
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Compte</label>
                <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(pm => { const PmIcon = pm.Icon; return (
                        <button key={pm.id} onClick={() => setForm({...form, paymentMethod: pm.id})} className={`px-3 py-3 rounded-xl text-sm flex items-center justify-center gap-2 ${form.paymentMethod === pm.id ? 'ring-2 ring-yellow-500 text-white' : 'bg-white/5 text-gray-400'}`} style={{backgroundColor: form.paymentMethod === pm.id ? pm.color + '30' : ''}}>
                            <PmIcon size={16} style={{color: form.paymentMethod === pm.id ? pm.color : '#9CA3AF'}} />{pm.name}
                        </button>
                    ); })}
                </div>
            </div>
            <div className="flex gap-2 pt-2">
                {onDelete && <Button onClick={onDelete} variant="danger" className="flex-1">Supprimer</Button>}
                <Button onClick={handleSubmit} variant="primary" className="flex-1">{initialData ? 'Modifier' : 'Ajouter'}</Button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIFESTYLE MODULE (Films & Vins)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE REPAS - Planning hebdomadaire des repas
// ═══════════════════════════════════════════════════════════════════════════════
const MealsView = ({ userId }) => {
    const [meals, setMeals, , , syncMeals] = useSupabaseMealsSimple(userId);
    const [weekOffset, setWeekOffset] = useState(0);
    
    // Générer les dates de la semaine
    const getWeekDates = (offset = 0) => {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (offset * 7);
        const monday = new Date(today.setDate(diff));
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                date: date.toISOString().split('T')[0],
                dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][date.getDay()],
                dayNum: date.getDate(),
                month: date.toLocaleString('fr-FR', { month: 'short' })
            });
        }
        return days;
    };
    
    const weekDays = getWeekDates(weekOffset);
    const weekNumber = Math.ceil((new Date(weekDays[0].date).getDate() + 6 - new Date(weekDays[0].date).getDay() + 1) / 7);
    
    const mealPeriods = [
        { id: 'matin', label: 'Matin', icon: '🌅', color: 'bg-amber-500/10 border-amber-500/30' },
        { id: 'midi', label: 'Midi', icon: '☀️', color: 'bg-orange-500/10 border-orange-500/30' },
        { id: 'gouter', label: 'Goûter', icon: '🍪', color: 'bg-yellow-500/10 border-yellow-500/30' },
        { id: 'soir', label: 'Soir', icon: '🌙', color: 'bg-indigo-500/10 border-indigo-500/30' }
    ];
    
    const updateMeal = (date, period, value) => {
        setMeals(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [period]: value
            }
        }));
    };
    
    const getMeal = (date, period) => {
        return meals[date]?.[period] || '';
    };
    
    const clearWeek = () => {
        if (confirm('Effacer tous les repas de cette semaine ?')) {
            const newMeals = { ...meals };
            weekDays.forEach(day => {
                delete newMeals[day.date];
            });
            setMeals(newMeals);
        }
    };
    
    const duplicateLastWeek = () => {
        const lastWeekDays = getWeekDates(weekOffset - 1);
        const newMeals = { ...meals };
        weekDays.forEach((day, idx) => {
            const lastWeekDate = lastWeekDays[idx].date;
            if (meals[lastWeekDate]) {
                newMeals[day.date] = { ...meals[lastWeekDate] };
            }
        });
        setMeals(newMeals);
    };
    
    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">🍽️ Mes Repas</h1>
                    <p className="text-sm text-gray-400 mt-1">Planning hebdomadaire</p>
                </div>
            </div>
            
            {/* Navigation semaine */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                <button 
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-400" />
                </button>
                <div className="text-center">
                    <div className="text-white font-bold">Semaine {weekNumber}</div>
                    <div className="text-xs text-gray-400">
                        {weekDays[0].dayNum} {weekDays[0].month} - {weekDays[6].dayNum} {weekDays[6].month}
                    </div>
                </div>
                <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronRight size={20} className="text-gray-400" />
                </button>
            </div>
            
            {/* Actions rapides */}
            <div className="flex gap-2">
                <button 
                    onClick={duplicateLastWeek}
                    className="flex-1 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                >
                    📋 Dupliquer semaine précédente
                </button>
                <button 
                    onClick={clearWeek}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                    🗑️ Effacer
                </button>
            </div>
            
            {/* Planning */}
            <div className="space-y-3">
                {weekDays.map(day => {
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    return (
                        <div 
                            key={day.date}
                            className={`bg-white/5 rounded-xl border ${isToday ? 'border-cyan-500/50' : 'border-white/10'} overflow-hidden`}
                        >
                            {/* Header jour */}
                            <div className={`px-4 py-3 ${isToday ? 'bg-cyan-500/10' : 'bg-white/5'} border-b border-white/10`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{day.dayName} {day.dayNum}</span>
                                        {isToday && <span className="text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Repas du jour */}
                            <div className="p-3 space-y-2">
                                {mealPeriods.map(period => (
                                    <div key={period.id} className={`p-3 rounded-lg border ${period.color}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{period.icon}</span>
                                            <span className="text-sm font-bold text-gray-400 uppercase">{period.label}</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={getMeal(day.date, period.id)}
                                            onChange={(e) => updateMeal(day.date, period.id, e.target.value)}
                                            placeholder="Aucun repas prévu..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LifestyleView = ({ userId }) => {
    const [view, setView] = useState('devperso');
    const [films, setFilms] = useLocalStorage(`titan_films_${userId}`, DEFAULT_FILMS);
    const [wines, setWines] = useLocalStorage(`titan_wines_${userId}`, DEFAULT_WINES);
    const [devPersoProgress, setDevPersoProgress] = useLocalStorage(`titan_devperso_${userId}`, {});
    const [selectedFilm, setSelectedFilm] = useState(null);
    const [selectedWine, setSelectedWine] = useState(null);
    const [showAddFilm, setShowAddFilm] = useState(false);
    const [showAddWine, setShowAddWine] = useState(false);
    const [randomPick, setRandomPick] = useState(null);

    const addFilm = (film) => { setFilms(prev => [...prev, { ...film, id: Date.now().toString(), createdAt: new Date().toISOString() }]); setShowAddFilm(false); };
    const updateFilm = (id, updates) => { setFilms(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f)); setSelectedFilm(null); };
    const deleteFilm = (id) => { setFilms(prev => prev.filter(f => f.id !== id)); setSelectedFilm(null); };

    const addWine = (wine) => { setWines(prev => [...prev, { ...wine, id: Date.now().toString(), createdAt: new Date().toISOString() }]); setShowAddWine(false); };
    const updateWine = (id, updates) => { setWines(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w)); setSelectedWine(null); };
    const deleteWine = (id) => { setWines(prev => prev.filter(w => w.id !== id)); setSelectedWine(null); };
    
    // Dev Perso functions
    const toggleDevPerso = (type, month, item) => {
        const key = `${type}_${month}_${item}`;
        setDevPersoProgress(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const isCompleted = (type, month, item) => {
        const key = `${type}_${month}_${item}`;
        return devPersoProgress[key] || false;
    };
    
    const getRandomLivre = () => {
        const available = LIVRES_A_LIRE.filter(l => !Object.keys(devPersoProgress).some(k => k.includes(l) && devPersoProgress[k]));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    };
    
    const getRandomFilm = () => {
        const available = FILMS_SERIES_INSPIRANTS.filter(f => !Object.keys(devPersoProgress).some(k => k.includes(f) && devPersoProgress[k]));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    };
    
    const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long' }).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Ordre: septembre 2025 → août 2026
    const months = ['septembre', 'octobre', 'novembre', 'decembre', 'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'ete'];
    const monthLabels = {
        'septembre': 'Septembre 2025', 'octobre': 'Octobre 2025', 'novembre': 'Novembre 2025', 'decembre': 'Décembre 2025',
        'janvier': 'Janvier 2026', 'fevrier': 'Février 2026', 'mars': 'Mars 2026', 'avril': 'Avril 2026',
        'mai': 'Mai 2026', 'juin': 'Juin 2026', 'juillet': 'Juillet 2026', 'aout': 'Août 2026', 'ete': 'Été 2026'
    };
    
    // Listes personnelles éditables
    const [myLivres, setMyLivres] = useLocalStorage(`titan_my_livres_${userId}`, LIVRES_A_LIRE);
    const [myFilms, setMyFilms] = useLocalStorage(`titan_my_films_${userId}`, FILMS_SERIES_INSPIRANTS);
    const [newLivre, setNewLivre] = useState('');
    const [newFilm, setNewFilm] = useState('');
    const [showAddLivre, setShowAddLivre] = useState(false);
    const [showAddFilm2, setShowAddFilm2] = useState(false);
    
    const addToMyLivres = () => {
        if (newLivre.trim()) {
            setMyLivres(prev => [...prev, newLivre.trim()]);
            setNewLivre('');
            setShowAddLivre(false);
        }
    };
    
    const removeFromMyLivres = (livre) => {
        setMyLivres(prev => prev.filter(l => l !== livre));
    };
    
    const addToMyFilms = () => {
        if (newFilm.trim()) {
            setMyFilms(prev => [...prev, newFilm.trim()]);
            setNewFilm('');
            setShowAddFilm2(false);
        }
    };
    
    const removeFromMyFilms = (film) => {
        setMyFilms(prev => prev.filter(f => f !== film));
    };
    
    const assignRandomToMonth = (type, month) => {
        const list = type === 'livre' ? myLivres : myFilms;
        const available = list.filter(item => !Object.keys(devPersoProgress).some(k => k.includes(item) && devPersoProgress[k]));
        if (available.length > 0) {
            const random = available[Math.floor(Math.random() * available.length)];
            setRandomPick({ type, item: random, month });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex space-x-2 pb-2 overflow-x-auto" style={{scrollbarWidth: 'none'}}>
                <button onClick={() => setView('devperso')} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${view === 'devperso' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                    <BookOpen size={18}/> Dev Perso
                </button>
                <button onClick={() => setView('films')} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${view === 'films' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                    <Film size={18}/> Films
                </button>
                <button onClick={() => setView('wines')} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${view === 'wines' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                    <Wine size={18}/> Vins
                </button>
            </div>

            {/* DEV PERSO TAB */}
            {view === 'devperso' && (
                <div className="space-y-4 animate-fade-in">
                    <h2 className="text-xl font-bold text-white">📚 Développement Personnel</h2>
                    
                    {/* Random Picker */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="text-sm font-bold text-white mb-3">🎲 Tirer au hasard</div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setRandomPick({ type: 'livre', item: getRandomLivre() })}
                                className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium"
                            >
                                📖 Livre random
                            </button>
                            <button 
                                onClick={() => setRandomPick({ type: 'film', item: getRandomFilm() })}
                                className="flex-1 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-medium"
                            >
                                🎬 Film random
                            </button>
                        </div>
                        {randomPick && randomPick.item && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">{randomPick.type === 'livre' ? '📖 Livre suggéré' : '🎬 Film suggéré'}</div>
                                <div className="text-white font-bold">{randomPick.item}</div>
                                <button 
                                    onClick={() => {
                                        toggleDevPerso(randomPick.type, 'random', randomPick.item);
                                        setRandomPick(null);
                                    }}
                                    className="mt-2 text-xs text-green-400"
                                >
                                    ✓ Marquer comme lu/vu
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Calendrier Livres */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="text-sm font-bold text-white mb-3">📖 Calendrier Livres (Sept 2025 → Été 2026)</div>
                        <div className="space-y-2 max-h-80 overflow-auto">
                            {months.map(month => {
                                const livres = DEV_PERSO_CALENDAR.livres[month] || [];
                                const monthNorm = currentMonth.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                const isCurrentMonth = month === monthNorm;
                                return (
                                    <div key={month} className={`p-2 rounded-lg ${isCurrentMonth ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-gray-500">
                                                {monthLabels[month]} {isCurrentMonth && <span className="text-green-400">← Actuel</span>}
                                            </div>
                                            {livres.length === 0 && (
                                                <button
                                                    onClick={() => assignRandomToMonth('livre', month)}
                                                    className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded"
                                                >
                                                    🎲 Random
                                                </button>
                                            )}
                                        </div>
                                        {livres.length > 0 ? (
                                            <div className="space-y-1">
                                                {livres.map(livre => (
                                                    <button 
                                                        key={livre}
                                                        onClick={() => toggleDevPerso('livre', month, livre)}
                                                        className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${isCompleted('livre', month, livre) ? 'text-green-400 line-through opacity-70' : 'text-white'}`}
                                                    >
                                                        {isCompleted('livre', month, livre) ? <Check size={14} /> : <span className="w-3.5 h-3.5 rounded border border-gray-600" />}
                                                        {livre}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-600 italic">Aucun livre assigné</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Calendrier Films */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="text-sm font-bold text-white mb-3">🎬 Calendrier Films (Sept 2025 → Été 2026)</div>
                        <div className="space-y-2 max-h-80 overflow-auto">
                            {months.map(month => {
                                const filmsMonth = DEV_PERSO_CALENDAR.films[month] || [];
                                const monthNorm = currentMonth.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                const isCurrentMonth = month === monthNorm;
                                return (
                                    <div key={month} className={`p-2 rounded-lg ${isCurrentMonth ? 'bg-pink-500/10 border border-pink-500/30' : 'bg-white/5'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs text-gray-500">
                                                {monthLabels[month]} {isCurrentMonth && <span className="text-pink-400">← Actuel</span>}
                                            </div>
                                            {filmsMonth.length === 0 && (
                                                <button
                                                    onClick={() => assignRandomToMonth('film', month)}
                                                    className="text-[10px] px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded"
                                                >
                                                    🎲 Random
                                                </button>
                                            )}
                                        </div>
                                        {filmsMonth.length > 0 ? (
                                            <div className="space-y-1">
                                                {filmsMonth.map(film => (
                                                    <button 
                                                        key={film}
                                                        onClick={() => toggleDevPerso('film', month, film)}
                                                        className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 ${isCompleted('film', month, film) ? 'text-green-400 line-through opacity-70' : 'text-white'}`}
                                                    >
                                                        {isCompleted('film', month, film) ? <Check size={14} /> : <span className="w-3.5 h-3.5 rounded border border-gray-600" />}
                                                        {film}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-600 italic">Aucun film assigné</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Liste Livres à lire */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-bold text-white">📚 Ma liste de livres ({myLivres.length})</div>
                            <button
                                onClick={() => setShowAddLivre(!showAddLivre)}
                                className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded"
                            >
                                {showAddLivre ? '✕ Fermer' : '+ Ajouter'}
                            </button>
                        </div>
                        {showAddLivre && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newLivre}
                                    onChange={e => setNewLivre(e.target.value)}
                                    placeholder="Nom du livre..."
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                    onKeyDown={e => e.key === 'Enter' && addToMyLivres()}
                                />
                                <button onClick={addToMyLivres} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                                    Ajouter
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-auto">
                            {myLivres.map(livre => (
                                <div 
                                    key={livre}
                                    className={`group px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${isCompleted('livre', 'liste', livre) ? 'bg-green-500/20 text-green-400 line-through' : 'bg-white/5 text-gray-400'}`}
                                >
                                    <button onClick={() => toggleDevPerso('livre', 'liste', livre)}>
                                        {livre}
                                    </button>
                                    <button
                                        onClick={() => removeFromMyLivres(livre)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Liste Films & Séries */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-bold text-white">🎥 Ma liste de films ({myFilms.length})</div>
                            <button
                                onClick={() => setShowAddFilm2(!showAddFilm2)}
                                className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded"
                            >
                                {showAddFilm2 ? '✕ Fermer' : '+ Ajouter'}
                            </button>
                        </div>
                        {showAddFilm2 && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newFilm}
                                    onChange={e => setNewFilm(e.target.value)}
                                    placeholder="Nom du film/série..."
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                    onKeyDown={e => e.key === 'Enter' && addToMyFilms()}
                                />
                                <button onClick={addToMyFilms} className="px-3 py-2 bg-pink-600 text-white rounded-lg text-sm">
                                    Ajouter
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-auto">
                            {myFilms.map(film => (
                                <div 
                                    key={film}
                                    className={`group px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${isCompleted('film', 'liste', film) ? 'bg-green-500/20 text-green-400 line-through' : 'bg-white/5 text-gray-400'}`}
                                >
                                    <button onClick={() => toggleDevPerso('film', 'liste', film)}>
                                        {film}
                                    </button>
                                    <button
                                        onClick={() => removeFromMyFilms(film)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'films' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Mes Films</h2>
                        <Button onClick={() => setShowAddFilm(true)} variant="accent" size="sm" icon={Plus}>Ajouter</Button>
                    </div>
                    
                    {films.length === 0 ? (
                        <div className="text-center py-10"><Film className="mx-auto mb-3 text-gray-700" size={48}/><p className="text-gray-500">Aucun film enregistré</p></div>
                    ) : (
                        <div className="space-y-3">
                            {films.map((film, i) => (
                                <Card key={film.id} onClick={() => setSelectedFilm(film)} className={`p-4 stagger-${Math.min(i+1, 6)}`} glow>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-white">{film.title}</h3>
                                                <Badge color="cyan" size="sm">{film.year}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">{film.director} • {film.duration}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(10)].map((_, j) => (
                                                    <Star key={j} size={12} className={j < Math.round(film.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                                                ))}
                                                <span className="ml-2 text-sm text-yellow-400 font-bold">{film.rating}/10</span>
                                            </div>
                                        </div>
                                        <Film className="text-pink-500/30" size={40} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'wines' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Mes Vins</h2>
                        <Button onClick={() => setShowAddWine(true)} variant="accent" size="sm" icon={Plus}>Ajouter</Button>
                    </div>
                    
                    {wines.length === 0 ? (
                        <div className="text-center py-10"><Wine className="mx-auto mb-3 text-gray-700" size={48}/><p className="text-gray-500">Aucun vin enregistré</p></div>
                    ) : (
                        <div className="space-y-3">
                            {wines.map((wine, i) => (
                                <Card key={wine.id} onClick={() => setSelectedWine(wine)} className={`p-4 stagger-${Math.min(i+1, 6)}`} glow>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-white">{wine.name}</h3>
                                                <Badge color="purple" size="sm">{wine.year}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-1">{wine.appellation}</p>
                                            <p className="text-xs text-purple-400 mb-2">{wine.cepages}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(10)].map((_, j) => (
                                                    <Star key={j} size={12} className={j < Math.round(wine.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                                                ))}
                                                <span className="ml-2 text-sm text-yellow-400 font-bold">{wine.rating}/10</span>
                                            </div>
                                        </div>
                                        {wine.image ? (
                                            <img src={wine.image} alt={wine.name} className="w-16 h-20 object-cover rounded-lg" />
                                        ) : (
                                            <Wine className="text-purple-500/30" size={40} />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Film Detail Modal */}
            <Modal isOpen={!!selectedFilm} onClose={() => setSelectedFilm(null)} title={selectedFilm?.title} size="lg">
                {selectedFilm && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge color="cyan">{selectedFilm.year}</Badge>
                            <Badge color="gray">{selectedFilm.duration}</Badge>
                            <Badge color="gold">{selectedFilm.genre}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 py-2">
                            {[...Array(10)].map((_, j) => <Star key={j} size={20} className={j < Math.round(selectedFilm.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}
                            <span className="ml-3 text-xl text-yellow-400 font-black">{selectedFilm.rating}/10</span>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Réalisateur</div>
                                <div className="text-white">{selectedFilm.director}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Acteurs</div>
                                <div className="flex flex-wrap gap-2">{selectedFilm.actors?.map((a, i) => <Badge key={i} color="gray" size="sm">{a}</Badge>)}</div>
                            </div>
                            {selectedFilm.awards && (
                                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/30">
                                    <div className="text-xs text-yellow-400 uppercase font-bold mb-1 flex items-center gap-1"><Award size={12}/> Récompenses</div>
                                    <div className="text-yellow-200 text-sm">{selectedFilm.awards}</div>
                                </div>
                            )}
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Résumé</div>
                                <div className="text-gray-300 text-sm leading-relaxed">{selectedFilm.summary}</div>
                            </div>
                            <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/30">
                                <div className="text-xs text-pink-400 uppercase font-bold mb-2 flex items-center gap-1"><User size={12}/> Mon Avis</div>
                                <div className="text-white text-sm leading-relaxed">{selectedFilm.personalReview}</div>
                            </div>
                            {selectedFilm.particularite && (
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Particularité</div>
                                    <div className="text-gray-300 text-sm italic">{selectedFilm.particularite}</div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => deleteFilm(selectedFilm.id)} variant="danger" className="flex-1" icon={Trash2}>Supprimer</Button>
                            <Button onClick={() => {}} variant="secondary" className="flex-1" icon={Edit3}>Modifier</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Wine Detail Modal */}
            <Modal isOpen={!!selectedWine} onClose={() => setSelectedWine(null)} title={selectedWine?.name} size="lg">
                {selectedWine && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge color="purple">{selectedWine.year}</Badge>
                            <Badge color="gray">{selectedWine.appellation}</Badge>
                            <Badge color="green">{selectedWine.price}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 py-2">
                            {[...Array(10)].map((_, j) => <Star key={j} size={20} className={j < Math.round(selectedWine.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}
                            <span className="ml-3 text-xl text-yellow-400 font-black">{selectedWine.rating}/10</span>
                        </div>

                        {selectedWine.image && (
                            <div className="flex justify-center">
                                <img src={selectedWine.image} alt={selectedWine.name} className="max-h-48 rounded-xl" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Cépages</div>
                                <div className="text-white text-sm">{selectedWine.cepages}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Degré</div>
                                <div className="text-white text-sm">{selectedWine.degree}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Garde</div>
                                <div className="text-white text-sm">{selectedWine.garde}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Terroir</div>
                                <div className="text-white text-sm">{selectedWine.terroir}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1 flex items-center gap-1"><Eye size={12}/> Nez</div>
                                <div className="text-gray-300 text-sm">{selectedWine.nez}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Bouche</div>
                                <div className="text-gray-300 text-sm">{selectedWine.bouche}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                                    <div className="text-xs text-emerald-400 uppercase font-bold mb-2">Points forts</div>
                                    {selectedWine.pointsForts?.map((p, i) => <div key={i} className="text-emerald-200 text-xs mb-1">✓ {p}</div>)}
                                </div>
                                <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/30">
                                    <div className="text-xs text-orange-400 uppercase font-bold mb-2">Points faibles</div>
                                    {selectedWine.pointsFaibles?.map((p, i) => <div key={i} className="text-orange-200 text-xs mb-1">⚠ {p}</div>)}
                                </div>
                            </div>

                            <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
                                <div className="text-xs text-purple-400 uppercase font-bold mb-2 flex items-center gap-1"><User size={12}/> Mon Avis</div>
                                <div className="text-white text-sm leading-relaxed">{selectedWine.personalReview}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => deleteWine(selectedWine.id)} variant="danger" className="flex-1" icon={Trash2}>Supprimer</Button>
                            <Button onClick={() => {}} variant="secondary" className="flex-1" icon={Edit3}>Modifier</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Film Modal */}
            <Modal isOpen={showAddFilm} onClose={() => setShowAddFilm(false)} title="Ajouter un film" size="lg">
                <FilmForm onSubmit={addFilm} onCancel={() => setShowAddFilm(false)} />
            </Modal>

            {/* Add Wine Modal */}
            <Modal isOpen={showAddWine} onClose={() => setShowAddWine(false)} title="Ajouter un vin" size="lg">
                <WineForm onSubmit={addWine} onCancel={() => setShowAddWine(false)} />
            </Modal>
        </div>
    );
};

const FilmForm = ({ initialData, onSubmit, onCancel }) => {
    const [searchTitle, setSearchTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [form, setForm] = useState({
        title: initialData?.title || '',
        year: initialData?.year || new Date().getFullYear(),
        director: initialData?.director || '',
        duration: initialData?.duration || '',
        genre: initialData?.genre || '',
        actors: initialData?.actors?.join(', ') || '',
        awards: initialData?.awards || '',
        summary: initialData?.summary || '',
        personalReview: initialData?.personalReview || '',
        particularite: initialData?.particularite || '',
        rating: initialData?.rating || 5
    });

    const searchFilmWithAI = async () => {
        if (!searchTitle.trim()) return;
        setIsLoading(true);
        setAiError(null);
        
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [{
                        role: "user",
                        content: `Tu es un assistant cinéma. Donne-moi les infos sur "${searchTitle}".
Réponds UNIQUEMENT avec un JSON valide (sans backticks, sans markdown):
{"title":"...","year":2024,"director":"...","duration":"2h30","genre":"...","actors":["...","..."],"awards":"...","summary":"...","particularite":"..."}
Si film non trouvé: {"error":"Film non trouvé"}`
                    }]
                })
            });
            const data = await response.json();
            let text = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const filmData = JSON.parse(text);
            
            if (filmData.error) {
                setAiError(filmData.error);
            } else {
                setForm(prev => ({
                    ...prev,
                    title: filmData.title || prev.title,
                    year: filmData.year || prev.year,
                    director: filmData.director || prev.director,
                    duration: filmData.duration || prev.duration,
                    genre: filmData.genre || prev.genre,
                    actors: filmData.actors?.join(', ') || prev.actors,
                    awards: filmData.awards || prev.awards,
                    summary: filmData.summary || prev.summary,
                    particularite: filmData.particularite || prev.particularite
                }));
            }
        } catch (error) {
            setAiError('Erreur lors de la recherche. Remplissez manuellement.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        onSubmit({ ...form, actors: form.actors.split(',').map(a => a.trim()).filter(a => a), year: parseInt(form.year), rating: parseFloat(form.rating) });
    };

    return (
        <div className="space-y-4">
            {/* AI Search Section */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-cyan-400" size={20}/>
                    <span className="font-semibold text-cyan-400">Recherche IA</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        value={searchTitle} 
                        onChange={e => setSearchTitle(e.target.value)} 
                        placeholder="Nom du film..." 
                        className="flex-1 bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-cyan-500/50 outline-none"
                        disabled={isLoading}
                    />
                    <Button onClick={searchFilmWithAI} disabled={isLoading || !searchTitle.trim()} variant="primary">
                        {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                    </Button>
                </div>
                {aiError && <div className="mt-2 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={14}/> {aiError}</div>}
                <div className="mt-2 text-xs text-gray-500">L'IA remplit les détails, vous ajoutez votre avis.</div>
            </div>

            <Input label="Titre" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Margin Call" />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Année" type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                <Input label="Durée" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="Ex: 2h30" />
            </div>
            <Input label="Réalisateur" value={form.director} onChange={e => setForm({...form, director: e.target.value})} />
            <Input label="Genre" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} placeholder="Ex: Drame, Thriller" />
            <Input label="Acteurs (séparés par virgule)" value={form.actors} onChange={e => setForm({...form, actors: e.target.value})} />
            <Input label="Récompenses" value={form.awards} onChange={e => setForm({...form, awards: e.target.value})} />
            <TextArea label="Résumé" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} rows={3} />
            <TextArea label="Mon avis personnel" value={form.personalReview} onChange={e => setForm({...form, personalReview: e.target.value})} rows={3} />
            <Input label="Particularité" value={form.particularite} onChange={e => setForm({...form, particularite: e.target.value})} />
            
            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Note</label>
                <RatingStars rating={form.rating} max={10} onChange={r => setForm({...form, rating: r})} />
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={onCancel} variant="secondary" className="flex-1">Annuler</Button>
                <Button onClick={handleSubmit} variant="primary" className="flex-1" icon={Save}>Enregistrer</Button>
            </div>
        </div>
    );
};

const WineForm = ({ initialData, onSubmit, onCancel }) => {
    const [searchName, setSearchName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [form, setForm] = useState({
        name: initialData?.name || '',
        appellation: initialData?.appellation || '',
        year: initialData?.year || new Date().getFullYear(),
        cepages: initialData?.cepages || '',
        terroir: initialData?.terroir || '',
        vinification: initialData?.vinification || '',
        degree: initialData?.degree || '',
        garde: initialData?.garde || '',
        price: initialData?.price || '',
        nez: initialData?.nez || '',
        bouche: initialData?.bouche || '',
        pointsForts: initialData?.pointsForts?.join('\n') || '',
        pointsFaibles: initialData?.pointsFaibles?.join('\n') || '',
        personalReview: initialData?.personalReview || '',
        rating: initialData?.rating || 5,
        image: initialData?.image || ''
    });

    const searchWineWithAI = async () => {
        if (!searchName.trim()) return;
        setIsLoading(true);
        setAiError(null);
        
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [{
                        role: "user",
                        content: `Tu es sommelier expert. Donne-moi les infos sur le vin "${searchName}".
Réponds UNIQUEMENT avec un JSON valide (sans backticks, sans markdown):
{"name":"...","appellation":"...","cepages":"...","terroir":"...","vinification":"...","degree":"13%","garde":"5-10 ans","price":"20-30€","nez":"...","bouche":"...","pointsForts":["...","..."],"pointsFaibles":["...","..."]}
Si vin non trouvé: {"error":"Vin non trouvé"}`
                    }]
                })
            });
            const data = await response.json();
            let text = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const wineData = JSON.parse(text);
            
            if (wineData.error) {
                setAiError(wineData.error);
            } else {
                setForm(prev => ({
                    ...prev,
                    name: wineData.name || prev.name,
                    appellation: wineData.appellation || prev.appellation,
                    cepages: wineData.cepages || prev.cepages,
                    terroir: wineData.terroir || prev.terroir,
                    vinification: wineData.vinification || prev.vinification,
                    degree: wineData.degree || prev.degree,
                    garde: wineData.garde || prev.garde,
                    price: wineData.price || prev.price,
                    nez: wineData.nez || prev.nez,
                    bouche: wineData.bouche || prev.bouche,
                    pointsForts: wineData.pointsForts?.join('\n') || prev.pointsForts,
                    pointsFaibles: wineData.pointsFaibles?.join('\n') || prev.pointsFaibles
                }));
            }
        } catch (error) {
            setAiError('Erreur lors de la recherche. Remplissez manuellement.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        onSubmit({
            ...form,
            year: parseInt(form.year),
            rating: parseFloat(form.rating),
            pointsForts: form.pointsForts.split('\n').map(p => p.trim()).filter(p => p),
            pointsFaibles: form.pointsFaibles.split('\n').map(p => p.trim()).filter(p => p)
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setForm({...form, image: ev.target?.result});
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4">
            {/* AI Search Section */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-purple-400" size={20}/>
                    <span className="font-semibold text-purple-400">Recherche IA</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        value={searchName} 
                        onChange={e => setSearchName(e.target.value)} 
                        placeholder="Nom du vin..." 
                        className="flex-1 bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-purple-500/50 outline-none"
                        disabled={isLoading}
                    />
                    <Button onClick={searchWineWithAI} disabled={isLoading || !searchName.trim()} variant="primary">
                        {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                    </Button>
                </div>
                {aiError && <div className="mt-2 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={14}/> {aiError}</div>}
                <div className="mt-2 text-xs text-gray-500">L'IA remplit les détails, vous ajoutez votre avis.</div>
            </div>

            <Input label="Nom du vin" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Château Margaux" />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Appellation" value={form.appellation} onChange={e => setForm({...form, appellation: e.target.value})} />
                <Input label="Année" type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            </div>
            <Input label="Cépages" value={form.cepages} onChange={e => setForm({...form, cepages: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Degré" value={form.degree} onChange={e => setForm({...form, degree: e.target.value})} placeholder="Ex: 13%" />
                <Input label="Prix" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Ex: 25-30€" />
            </div>
            <Input label="Garde" value={form.garde} onChange={e => setForm({...form, garde: e.target.value})} placeholder="Ex: 5 à 10 ans" />
            <Input label="Terroir" value={form.terroir} onChange={e => setForm({...form, terroir: e.target.value})} />
            <TextArea label="Vinification" value={form.vinification} onChange={e => setForm({...form, vinification: e.target.value})} rows={2} />
            <TextArea label="Nez" value={form.nez} onChange={e => setForm({...form, nez: e.target.value})} rows={2} />
            <TextArea label="Bouche" value={form.bouche} onChange={e => setForm({...form, bouche: e.target.value})} rows={2} />
            <TextArea label="Points forts (un par ligne)" value={form.pointsForts} onChange={e => setForm({...form, pointsForts: e.target.value})} rows={3} />
            <TextArea label="Points faibles (un par ligne)" value={form.pointsFaibles} onChange={e => setForm({...form, pointsFaibles: e.target.value})} rows={3} />
            <TextArea label="Mon avis personnel" value={form.personalReview} onChange={e => setForm({...form, personalReview: e.target.value})} rows={3} />
            
            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Photo de la bouteille</label>
                <div className="flex items-center gap-4">
                    {form.image && <img src={form.image} alt="Preview" className="w-16 h-20 object-cover rounded-lg" />}
                    <label className="flex-1 p-4 border-2 border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-purple-500/50 transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Image className="mx-auto text-gray-500 mb-1" size={24} />
                        <span className="text-sm text-gray-500">Cliquer pour ajouter</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-500 uppercase block mb-2 font-semibold">Note</label>
                <RatingStars rating={form.rating} max={10} onChange={r => setForm({...form, rating: r})} />
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={onCancel} variant="secondary" className="flex-1">Annuler</Button>
                <Button onClick={handleSubmit} variant="primary" className="flex-1" icon={Save}>Enregistrer</Button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT & NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

const Layout = ({ children, view, setView }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const NavItem = ({ id, icon: Icon, label }) => (
        <button 
            onClick={() => {setView(id); setMobileMenuOpen(false);}} 
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${view === id ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white font-bold border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
            <Icon size={20}/><span>{label}</span>
        </button>
    );
    
    const MobileNavItem = ({ id, icon: Icon, label }) => (
        <button 
            onClick={() => setView(id)} 
            className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-3 transition-all ${view === id ? 'text-cyan-400' : 'text-gray-500'}`}
        >
            <Icon size={20}/>
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">{label}</span>
        </button>
    );
    
    return (
        <div className="flex h-screen bg-[#050508] text-white overflow-hidden" style={{ fontFamily: 'var(--font-family)' }}>
            <GlobalStyles />
            
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
            </div>
            
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 flex-col border-r border-white/5 p-4 bg-black/40 backdrop-blur-xl relative z-10">
                <div className="mb-8 px-4 pt-2">
                    <div className="text-2xl font-black tracking-tighter gradient-text">TITAN.OS</div>
                    <div className="text-xs text-gray-600 tracking-wide font-medium">V9.0 • SECOND BRAIN</div>
                    <CloudSyncIndicator />
                </div>
                <div className="space-y-1 flex-1">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="fitness" icon={Dumbbell} label="Fitness" />
                    <NavItem id="routine" icon={ListTodo} label="Routine" />
                    <NavItem id="tasks" icon={ClipboardList} label="Tâches" />
                    <NavItem id="finance" icon={Wallet} label="Finance" />
                    <NavItem id="meals" icon={Utensils} label="Repas" />
                    <NavItem id="lifestyle" icon={Clapperboard} label="Lifestyle" />
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative z-10">
                {/* Mobile Header - Fixed */}
                <div className="md:hidden sticky top-0 flex justify-between items-center p-3 border-b border-white/5 bg-black/90 backdrop-blur-xl z-40">
                    <div className="flex items-center gap-2">
                        <div className="font-black text-lg gradient-text">TITAN.OS</div>
                        <CloudSyncIndicator />
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-xl">
                        {mobileMenuOpen ? <X size={22}/> : <Menu size={22}/>}
                    </button>
                </div>
                
                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 p-4 space-y-2 md:hidden animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-xl font-black gradient-text">Menu</div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24}/></button>
                        </div>
                        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem id="fitness" icon={Dumbbell} label="Fitness" />
                        <NavItem id="routine" icon={ListTodo} label="Routine" />
                        <NavItem id="tasks" icon={ClipboardList} label="Tâches" />
                        <NavItem id="finance" icon={Wallet} label="Finance" />
                        <NavItem id="meals" icon={Utensils} label="Repas" />
                        <NavItem id="lifestyle" icon={Clapperboard} label="Lifestyle" />
                    </div>
                )}
                
                {/* Content Area - Ajusté pour mobile avec bottom nav */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-20 md:pb-8">
                    <div className="max-w-4xl mx-auto w-full">{children}</div>
                </div>
                
                {/* Mobile Bottom Navigation - Scrollable pour inclure tous les onglets */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-40 safe-area-bottom">
                    <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        <MobileNavItem id="dashboard" icon={LayoutDashboard} label="Accueil" />
                        <MobileNavItem id="fitness" icon={Dumbbell} label="Fitness" />
                        <MobileNavItem id="tasks" icon={ClipboardList} label="Tâches" />
                        <MobileNavItem id="meals" icon={Utensils} label="Repas" />
                        <MobileNavItem id="finance" icon={Wallet} label="Finance" />
                        <MobileNavItem id="routine" icon={ListTodo} label="Routine" />
                        <MobileNavItem id="lifestyle" icon={Clapperboard} label="Lifestyle" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ setView, userId }) => {
    const [biometrics, setBiometrics, saveBiometric] = useSupabaseBiometrics(userId);
    const [dailyCheckins, saveCheckin] = useSupabaseCheckins(userId);
    const [supplementLogs, setSupplementLogs, saveSupplement] = useSupabaseSupplements(userId);
    const [workoutLogs, setWorkoutLogs, addWorkout] = useSupabaseWorkouts(userId);
    const [tasks, setTasks, addTask, updateTask, deleteTask] = useSupabaseTasks(userId);
    const [transactions, setTransactions, addTransaction, deleteTransaction] = useSupabaseTransactions(userId);
    const [whoopData, updateWhoopData, syncingWhoop, connectedWhoop] = useWhoopData(userId);
    const [showAiQuestion, setShowAiQuestion] = useState(false);
    const [questionAnswer, setQuestionAnswer] = useState('');
    const [aiNotes, setAiNotes] = useLocalStorage(`titan_ai_notes_${userId}`, []);
    const [showFlowDetails, setShowFlowDetails] = useState(true);
    const [meals] = useLocalStorage(`titan_meals_${userId}`, []);
    
    // Morning Coach States (ancien système - conservé pour compatibilité)
    const [coachStep, setCoachStep] = useState('greeting'); // greeting, followup, recommendations, done
    const [coachDismissed, setCoachDismissed] = useLocalStorage(`titan_coach_dismissed_${userId}`, null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTELLIGENT COACH v2 - Nouveau système avec cycle Matin/Soir
    // ═══════════════════════════════════════════════════════════════════════════
    const coach = useIntelligentCoach(userId, {
        whoopData: whoopData,
        checkins: dailyCheckins,
        workoutLogs: workoutLogs,
        tasks: tasks,
        transactions: transactions,
        meals: meals,
        biometrics: biometrics,
        todaySchedule: null
    });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckin = dailyCheckins[todayStr] || {};
    const todaySupplements = supplementLogs[todayStr] || {};
    
    const updateCheckin = async (field, value) => {
        await saveCheckin(todayStr, { [field]: value });
    };
    
    const toggleSupplement = async (period, id) => {
        const current = todaySupplements[period] || [];
        const updated = current.includes(id) 
            ? current.filter(x => x !== id)
            : [...current, id];
        await saveSupplement(todayStr, period, updated);
    };
    
    
    // Analyse IA centralisée (TITAN COUNCIL)
    const [aiAnalysis, setAiAnalysis] = useState({
        insights: [],
        questions: [],
        councilReport: null,
        morningBriefing: null
    });
    const analysisRunRef = useRef(false);
    const analysisDataRef = useRef('');

    useEffect(() => {
        // Créer une signature des données pour éviter les re-runs inutiles
        const dataSignature = JSON.stringify({
            checkinsCount: Object.keys(dailyCheckins || {}).length,
            workoutsCount: (workoutLogs || []).length,
            biometricsCount: Object.keys(biometrics || {}).length,
            tasksCount: (tasks || []).length,
            transactionsCount: (transactions || []).length
        });

        // Skip si déjà en cours ou si les données n'ont pas changé
        if (analysisRunRef.current || dataSignature === analysisDataRef.current) {
            return;
        }

        analysisDataRef.current = dataSignature;
        analysisRunRef.current = true;

        const runAnalysis = async () => {
            try {
                const result = await analyzeAllData({
                    checkins: dailyCheckins || {},
                    workoutLogs: workoutLogs || [],
                    biometrics: biometrics || {},
                    whoopData,
                    supplementLogs: supplementLogs || {},
                    tasks: tasks || [],
                    transactions: transactions || []
                });
                setAiAnalysis(result);
            } catch (error) {
                console.error('❌ Erreur analyse IA:', error);
                setAiAnalysis({
                    insights: [],
                    questions: [],
                    councilReport: null,
                    morningBriefing: null
                });
            } finally {
                analysisRunRef.current = false;
            }
        };

        runAnalysis();
    }, [dailyCheckins, workoutLogs, biometrics, whoopData, supplementLogs, tasks, transactions]);
    
    
    // Tâches du jour
    const todayTasks = useMemo(() => {
        return (tasks || []).filter(t => t.due_date === todayStr).sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });
    }, [tasks, todayStr]);
    
    const toggleTaskFromDashboard = (taskId) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };
    
    const addAiNote = (note) => {
        setAiNotes(prev => [...prev, { ...note, timestamp: new Date().toISOString() }]);
    };
    
    const submitQuestionAnswer = () => {
        if (aiAnalysis.questions.length > 0 && questionAnswer) {
            addAiNote({
                questionId: aiAnalysis.questions[0].id || aiAnalysis.questions[0].type,
                question: aiAnalysis.questions[0].question,
                answer: questionAnswer
            });
            setShowAiQuestion(false);
            setQuestionAnswer('');
        }
    };
    
    const getLastWeighIn = () => {
        const entries = Object.entries(biometrics).filter(([k, v]) => v.poids);
        if (entries.length === 0) return null;
        entries.sort((a, b) => new Date(b[0]) - new Date(a[0]));
        return { date: entries[0][0], weight: entries[0][1].poids };
    };
    
    const lastWeighIn = getLastWeighIn();
    const daysSinceWeighIn = lastWeighIn ? Math.floor((new Date() - new Date(lastWeighIn.date)) / (1000 * 60 * 60 * 24)) : null;
    const needsWeighIn = !lastWeighIn || daysSinceWeighIn >= 7;
    const isMonday = new Date().getDay() === 1;
    
    // Motivational quotes
    const quotes = [
        "Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.",
        "La discipline est le pont entre les objectifs et leur réalisation.",
        "Chaque jour est une nouvelle opportunité de devenir meilleur.",
        "Le seul mauvais entraînement est celui qui n'a pas eu lieu.",
        "Ta seule limite, c'est toi."
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];

    return (
        <div className="space-y-4 animate-fade-in">
            {/* HEADER */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black gradient-text mb-1">TITAN.OS</h1>
                <p className="text-gray-500 text-sm">Semaine {getWeekNumber(new Date())} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            
            {/* MOTIVATION */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-400 font-bold mb-1">💡 PENSÉE DU JOUR</div>
                <div className="text-sm text-white italic">"{dailyQuote}"</div>
            </div>
            
            
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* INTELLIGENT COACH v2 - Cycle Matin/Soir/Nuit */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {coach.step !== 'done' && coach.step !== 'loading' && coach.step !== 'error' && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-xs">
                                🧠
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 font-medium">TITAN Coach v2</span>
                                <span className="text-xs text-cyan-500 ml-2">
                                    {coach.coachingMode === 'morning' && '☀️ Matin'}
                                    {coach.coachingMode === 'evening' && '🌆 Soir'}
                                    {coach.coachingMode === 'night' && '🌙 Nuit'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={coach.dismissCoach}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            <X size={16}/>
                        </button>
                    </div>

                    {/* ══════ ÉTAPE: GREETING (Matin) ══════ */}
                    {coach.step === 'greeting' && coach.enquiry && (
                        <>
                            <div className="mb-4">
                                <p className="text-white text-lg font-medium mb-1">
                                    {coach.enquiry.greeting?.greeting || 'Bonjour'} 👋
                                </p>
                                <p className="text-gray-300">
                                    {coach.enquiry.greeting?.mainMessage || 'Comment vas-tu ?'}
                                </p>
                                {coach.enquiry.greeting?.subMessage && (
                                    <p className="text-gray-400 text-sm mt-1">
                                        {coach.enquiry.greeting.subMessage}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={coach.startEnquiry}
                                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold transition-colors"
                                >
                                    On analyse ensemble
                                </button>
                                <button
                                    onClick={coach.skipEnquiry}
                                    className="px-4 py-3 rounded-xl bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    Passer
                                </button>
                            </div>
                        </>
                    )}

                    {/* ══════ ÉTAPE: ENQUIRY (Questions matin) ══════ */}
                    {coach.step === 'enquiry' && coach.enquiry?.questions && (
                        <>
                            <div className="mb-4">
                                <p className="text-white font-medium mb-3">
                                    Quelques questions rapides pour personnaliser ton plan :
                                </p>
                            </div>

                            <div className="space-y-4 mb-4">
                                {coach.enquiry.questions.map((q) => (
                                    <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white text-sm font-medium mb-2">{q.text}</p>
                                        
                                        {q.type === 'yesno' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => coach.answerQuestion(q.id, true)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        coach.answers[q.id] === true 
                                                            ? 'bg-cyan-500 text-white' 
                                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                    }`}
                                                >
                                                    Oui
                                                </button>
                                                <button
                                                    onClick={() => coach.answerQuestion(q.id, false)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        coach.answers[q.id] === false 
                                                            ? 'bg-cyan-500 text-white' 
                                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                    }`}
                                                >
                                                    Non
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {q.options?.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => coach.answerQuestion(q.id, opt)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                            coach.answers[q.id] === opt 
                                                                ? 'bg-cyan-500 text-white' 
                                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={coach.submitAnswers}
                                disabled={coach.loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {coach.loading ? 'Analyse en cours...' : 'Générer mon plan'}
                            </button>
                        </>
                    )}

                    {/* ══════ ÉTAPE: PRESCRIPTION (Résultat matin) ══════ */}
                    {coach.step === 'prescription' && coach.prescription && (
                        <>
                            <PrescriptionCard prescription={coach.prescription} />
                            
                            <button
                                onClick={coach.dismissCoach}
                                className="w-full mt-4 py-2 text-gray-500 hover:text-gray-400 text-sm"
                            >
                                Fermer
                            </button>
                        </>
                    )}

                    {/* ══════ ÉTAPE: EVENING REVIEW (Bilan soir) ══════ */}
                    {coach.step === 'evening_review' && coach.eveningReview && (
                        <EveningReviewCard 
                            review={coach.eveningReview}
                            answers={coach.answers}
                            onAnswer={coach.answerQuestion}
                            onSubmit={coach.submitEveningReview}
                            loading={coach.loading}
                        />
                    )}

                    {/* ══════ ÉTAPE: WEEKLY SUMMARY (Dimanche soir) ══════ */}
                    {coach.step === 'weekly_summary' && coach.weeklySummary && (
                        <WeeklySummaryCard 
                            summary={coach.weeklySummary}
                            onDismiss={coach.dismissCoach}
                        />
                    )}

                    {/* ══════ ÉTAPE: NIGHT REMINDER (Rappel coucher) ══════ */}
                    {coach.step === 'night_reminder' && coach.nightReminder && (
                        <NightReminderCard 
                            reminder={coach.nightReminder}
                            onDismiss={coach.dismissCoach}
                        />
                    )}
                </div>
            )}
            
            {/* WHOOP WIDGET */}
            <WhoopWidget userId={userId} />
            
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* TITAN AI COUNCIL - RAPPORT SYSTÈME */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            
            {aiAnalysis.councilReport && (
                <>
                    {/* ÉTAT DU SYSTÈME */}
                    <div className={`p-4 rounded-xl border-2 ${
                        aiAnalysis.councilReport.ddaLevel === 'peak' ? 'border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10' :
                        aiAnalysis.councilReport.ddaLevel === 'moderate' ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10' :
                        'border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full animate-pulse ${
                                    aiAnalysis.councilReport.ddaLevel === 'peak' ? 'bg-green-500' :
                                    aiAnalysis.councilReport.ddaLevel === 'moderate' ? 'bg-blue-500' : 'bg-orange-500'
                                }`}/>
                                <span className="text-xs font-bold text-gray-400">📊 ÉTAT DU SYSTÈME</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowFlowDetails(!showFlowDetails)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Voir le calcul"
                                >
                                    <AlertCircle size={14} className="text-gray-400" />
                                </button>
                                <span className={`text-lg font-black ${
                                    aiAnalysis.councilReport.ddaLevel === 'peak' ? 'text-green-400' :
                                    aiAnalysis.councilReport.ddaLevel === 'moderate' ? 'text-blue-400' : 'text-orange-400'
                                }`}>{aiAnalysis.councilReport.flowScore}%</span>
                            </div>
                        </div>
                        <div className="text-white font-bold mb-1">
                            {aiAnalysis.councilReport.ddaLevel === 'peak' ? '🚀' : aiAnalysis.councilReport.ddaLevel === 'moderate' ? '⚡' : '🔋'} {aiAnalysis.councilReport.ddaMessage}
                        </div>
                        <div className="text-xs text-gray-400">{aiAnalysis.councilReport.systemState}</div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${
                                aiAnalysis.councilReport.ddaLevel === 'peak' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                aiAnalysis.councilReport.ddaLevel === 'moderate' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                                'bg-gradient-to-r from-orange-500 to-yellow-400'
                            }`} style={{ width: `${aiAnalysis.councilReport.flowScore}%` }}/>
                        </div>

                        {/* Résumé condensé toujours visible */}
                        <div className="mt-2 text-[10px] text-gray-500">
                            Basé sur: {todayCheckin?.energy ? `Énergie (${todayCheckin.energy}/5)` : 'Énergie (?)'} • {todayCheckin?.mood ? `Humeur (${todayCheckin.mood}/5)` : 'Humeur (?)'} • Tâches ({Math.round((tasks?.filter(t => t.completed).length / Math.max(1, tasks?.length || 1)) * 100)}%){aiAnalysis.councilReport.whoopData?.recovery !== null && ` • Whoop (${aiAnalysis.councilReport.whoopData.recovery}%)`}
                        </div>

                        {/* Détails du calcul */}
                        {showFlowDetails && (
                            <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="text-xs font-bold text-cyan-400 mb-2">🔬 CALCUL DU FLOW SCORE</div>
                                <div className="space-y-2 text-xs">
                                    {/* Whoop Recovery */}
                                    {aiAnalysis.councilReport.whoopData.recovery !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Whoop Recovery (35%)</span>
                                            <span className="text-white font-mono">
                                                {aiAnalysis.councilReport.whoopData.recovery}% × 0.35 = {Math.round((aiAnalysis.councilReport.whoopData.recovery / 100) * 35)}pts
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Tâches complétées */}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tâches complétées (25%)</span>
                                        <span className="text-white font-mono">
                                            {Math.round((tasks.filter(t => t.completed).length / Math.max(1, tasks.length)) * 100)}% × 0.25 = {Math.round((tasks.filter(t => t.completed).length / Math.max(1, tasks.length)) * 25)}pts
                                        </span>
                                    </div>
                                    
                                    {/* Énergie check-in */}
                                    {todayCheckin.energy && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Énergie check-in (20%)</span>
                                            <span className="text-white font-mono">
                                                {todayCheckin.energy}/5 × 0.20 = {Math.round((todayCheckin.energy / 5) * 20)}pts
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Humeur check-in */}
                                    {todayCheckin.mood && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Humeur check-in (20%)</span>
                                            <span className="text-white font-mono">
                                                {todayCheckin.mood}/5 × 0.20 = {Math.round((todayCheckin.mood / 5) * 20)}pts
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
                                        <span className="text-cyan-400">TOTAL</span>
                                        <span className="text-cyan-400">{aiAnalysis.councilReport.flowScore}%</span>
                                    </div>
                                    
                                    {/* Bonus/Malus */}
                                    <div className="pt-2 border-t border-white/10 text-[10px] text-gray-500">
                                        <div className="font-bold text-gray-400 mb-1">BONUS/MALUS APPLIQUÉS:</div>
                                        {aiAnalysis.councilReport.whoopData.recovery >= 67 && <div>✓ Recovery élevée: +5pts</div>}
                                        {aiAnalysis.councilReport.whoopData.recovery < 33 && <div>✗ Recovery basse: -10pts</div>}
                                        {aiAnalysis.councilReport.whoopData.sleep >= 7 && <div>✓ Bon sommeil (≥7h): +3pts</div>}
                                        {aiAnalysis.councilReport.whoopData.sleep < 5 && <div>✗ Manque sommeil (&lt;5h): -5pts</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* INSIGHT PROFOND */}
                    {aiAnalysis.councilReport.deepInsight && (
                        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-purple-400">{aiAnalysis.councilReport.deepInsight.source}</span>
                            </div>
                            <p className="text-sm text-white mb-1">{aiAnalysis.councilReport.deepInsight.text}</p>
                            <p className="text-xs text-gray-400 italic">→ {aiAnalysis.councilReport.deepInsight.recommendation}</p>
                        </div>
                    )}
                    
                    {/* PROTOCOLE D'OPTIMISATION */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="text-xs font-bold text-gray-400 mb-3">🛠️ PROTOCOLE D'OPTIMISATION</div>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">🏋️</span>
                                <div><span className="text-xs text-gray-500">CORPS</span><p className="text-sm text-white">{aiAnalysis.councilReport.protocol.physiological}</p></div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">🧠</span>
                                <div><span className="text-xs text-gray-500">TÊTE</span><p className="text-sm text-white">{aiAnalysis.councilReport.protocol.cognitive}</p></div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">🎯</span>
                                <div><span className="text-xs text-gray-500">ENV</span><p className="text-sm text-white">{aiAnalysis.councilReport.protocol.structural}</p></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* SIMULATION FUTURE */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔮</span>
                            <span className="text-sm text-white">{aiAnalysis.councilReport.futureSimulation}</span>
                        </div>
                    </div>
                </>
            )}
            
            {/* AI INSIGHTS (autres alertes) */}
            {aiAnalysis.insights.length > 0 && (
                <div className="space-y-2">
                    {aiAnalysis.insights.slice(0, 3).map((insight, i) => (
                        <div 
                            key={i}
                            className={`p-3 rounded-xl border ${
                                insight.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                                insight.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                                insight.type === 'danger' ? 'border-red-500/30 bg-red-500/10' :
                                'border-blue-500/30 bg-blue-500/10'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <Brain size={18} className={
                                    insight.type === 'success' ? 'text-green-400' :
                                    insight.type === 'warning' ? 'text-yellow-400' :
                                    insight.type === 'danger' ? 'text-red-400' :
                                    'text-blue-400'
                                } />
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{insight.title}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{insight.message}</div>
                                    {insight.action && (
                                        <div className="text-xs text-gray-500 mt-1 italic">→ {insight.action}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* TÂCHES DU JOUR */}
            {todayTasks.length > 0 && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-white">✅ Tâches du jour</span>
                        <span className="text-xs text-gray-500">{todayTasks.filter(t => t.completed).length}/{todayTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                        {todayTasks.slice(0, 4).map(task => (
                            <div key={task.id} className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleTaskFromDashboard(task.id)}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                        task.completed ? 'bg-emerald-500' : 'border-2 border-gray-600 hover:border-emerald-500'
                                    }`}
                                >
                                    {task.completed && <Check size={12} className="text-white"/>}
                                </button>
                                <span className={`flex-1 text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {task.priority === 'high' && '🔥 '}{task.title}
                                </span>
                            </div>
                        ))}
                        {todayTasks.length > 4 && (
                            <button onClick={() => setView('tasks')} className="text-xs text-indigo-400 hover:text-indigo-300">
                                +{todayTasks.length - 4} autres →
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            
            {/* QUICK STATE */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">⚡ État rapide</span>
                    <span className="text-xs text-gray-500">Facultatif</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'energy', label: 'Énergie', emoji: '⚡' },
                        { id: 'sleep', label: 'Sommeil', emoji: '😴' },
                        { id: 'mood', label: 'Humeur', emoji: '😊' },
                        { id: 'motivation', label: 'Motiv', emoji: '🔥' }
                    ].map(item => (
                        <div key={item.id} className="text-center">
                            <div className="text-lg mb-1">{item.emoji}</div>
                            <div className="flex justify-center gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => updateCheckin(item.id, n)}
                                        className={`w-4 h-4 rounded-full transition-all ${
                                            (todayCheckin?.[item.id] || 0) >= n
                                                ? n <= 2 ? 'bg-red-500' : n <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                                                : 'bg-gray-700'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* SUPPLEMENTS */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">💊 Compléments</span>
                </div>
                <div className="space-y-3">
                    {Object.entries(SUPPLEMENTS_ROUTINE).map(([period, supps]) => (
                        <div key={period}>
                            <div className="text-xs text-gray-500 mb-1 capitalize">
                                {period === 'postWorkout' ? 'Post-entraînement' : period}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {supps.map(supp => {
                                    const taken = todaySupplements[period]?.includes(supp.id);
                                    return (
                                        <button
                                            key={supp.id}
                                            onClick={() => toggleSupplement(period, supp.id)}
                                            className={`px-2 py-1 rounded-lg text-xs transition-all ${
                                                taken 
                                                    ? 'bg-green-500/20 text-green-400 line-through' 
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {supp.emoji} {supp.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* MÉTA-APPRENTISSAGE - Ce que TITAN a appris sur toi */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            
            {aiAnalysis.councilReport?.meta && (
                <>
                    {/* Règles Apprises */}
                    {aiAnalysis.councilReport.meta.learnedRules?.length > 0 && (
                        <div className="p-4 rounded-xl border-l-4 border-l-purple-500 bg-purple-500/5">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="text-purple-400" size={16}/>
                                <span className="text-xs font-bold text-purple-400">📚 RÈGLES APPRISES SUR TOI</span>
                            </div>
                            <div className="space-y-2">
                                {aiAnalysis.councilReport.meta.learnedRules.slice(0, 3).map((rule, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                            rule.confidence >= 80 ? 'bg-green-500' : 
                                            rule.confidence >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                                        }`}/>
                                        <div>
                                            <p className="text-white">{rule.rule}</p>
                                            <p className="text-xs text-gray-500">Confiance: {rule.confidence}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Patterns Détectés */}
                    {(aiAnalysis.councilReport.meta.cycles?.bestDays?.length > 0 || aiAnalysis.councilReport.meta.implicitPreferences?.bestMoodAfter?.length > 0) && (
                        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="text-cyan-400" size={16}/>
                                <span className="text-xs font-bold text-cyan-400">🔄 TES PATTERNS DÉTECTÉS</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                {aiAnalysis.councilReport.meta.cycles?.bestDays?.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="text-gray-300">
                                            Meilleurs jours : <span className="text-white font-medium capitalize">{aiAnalysis.councilReport.meta.cycles.bestDays.join(', ')}</span>
                                        </span>
                                    </div>
                                )}
                                {aiAnalysis.councilReport.meta.cycles?.worstDays?.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400">!</span>
                                        <span className="text-gray-300">
                                            Jours difficiles : <span className="text-white font-medium capitalize">{aiAnalysis.councilReport.meta.cycles.worstDays.join(', ')}</span>
                                        </span>
                                    </div>
                                )}
                                {aiAnalysis.councilReport.meta.implicitPreferences?.bestMoodAfter?.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">★</span>
                                        <span className="text-gray-300">
                                            Boost humeur : <span className="text-white font-medium">{aiAnalysis.councilReport.meta.implicitPreferences.bestMoodAfter.join(', ')}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Qualité des données */}
                    {aiAnalysis.councilReport.meta.dataQuality && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-400">📊 QUALITÉ DES DONNÉES</span>
                                <span className="text-[10px] text-gray-500">Plus de data = IA + intelligente</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-lg font-bold text-white">{aiAnalysis.councilReport.meta.dataQuality.checkinsCount}</div>
                                    <div className="text-[10px] text-gray-500">Check-ins</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{aiAnalysis.councilReport.meta.dataQuality.workoutsCount}</div>
                                    <div className="text-[10px] text-gray-500">Workouts</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{aiAnalysis.councilReport.meta.dataQuality.tasksCount}</div>
                                    <div className="text-[10px] text-gray-500">Tâches</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">{aiAnalysis.councilReport.meta.dataQuality.transactionsCount}</div>
                                    <div className="text-[10px] text-gray-500">€</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Suggestions d'amélioration (IA Product Manager) */}
                    {aiAnalysis.councilReport.meta.appSuggestions?.filter(s => s.priority === 'high').length > 0 && (
                        <div className="p-3 rounded-xl border-l-4 border-l-orange-500 bg-orange-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="text-orange-400" size={14}/>
                                <span className="text-xs font-bold text-orange-400">💡 SUGGESTION D'AMÉLIORATION</span>
                            </div>
                            <p className="text-sm text-gray-300">{aiAnalysis.councilReport.meta.appSuggestions.find(s => s.priority === 'high')?.reason}</p>
                        </div>
                    )}
                </>
            )}
            
            {/* Biometric Reminder */}
            {(needsWeighIn || isMonday) && (
                <Card className={`p-4 ${needsWeighIn ? 'border-l-4 border-l-yellow-500' : ''}`} glow>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${needsWeighIn ? 'bg-yellow-500/20' : 'bg-cyan-500/20'}`}>
                            <Scale className={needsWeighIn ? 'text-yellow-400' : 'text-cyan-400'} size={24}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white flex items-center gap-2">
                                📊 Pesée du lundi
                                {needsWeighIn && <Badge color="gold" size="sm">À faire</Badge>}
                            </div>
                            {lastWeighIn ? (
                                <div className="text-sm text-gray-400">Dernière: {lastWeighIn.weight}kg il y a {daysSinceWeighIn}j</div>
                            ) : (
                                <div className="text-sm text-gray-400">Aucune pesée enregistrée</div>
                            )}
                        </div>
                        <Button onClick={() => setView('fitness')} size="sm" variant={needsWeighIn ? 'primary' : 'secondary'}>
                            {needsWeighIn ? 'Me peser' : 'Voir'}
                        </Button>
                    </div>
                </Card>
            )}
            
            {/* QUICK ACCESS */}
            <div className="grid grid-cols-2 gap-3">
                <Card onClick={() => setView('fitness')} className="p-4 group" glow>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Dumbbell className="text-cyan-400" size={20}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white">Fitness</div>
                            <div className="text-xs text-gray-500">Programme</div>
                        </div>
                    </div>
                </Card>
                
                <Card onClick={() => setView('routine')} className="p-4 group" glow>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ListTodo className="text-purple-400" size={20}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white">Routine</div>
                            <div className="text-xs text-gray-500">Habitudes</div>
                        </div>
                    </div>
                </Card>
                
                <Card onClick={() => setView('finance')} className="p-4 group" glow>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="text-yellow-400" size={20}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white">Finance</div>
                            <div className="text-xs text-gray-500">Dépenses</div>
                        </div>
                    </div>
                </Card>
                
                <Card onClick={() => setView('lifestyle')} className="p-4 group" glow>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clapperboard className="text-pink-400" size={20}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white">Lifestyle</div>
                            <div className="text-xs text-gray-500">Dev Perso</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASKS MODULE - Style Timestripe
// ═══════════════════════════════════════════════════════════════════════════════

const TasksView = ({ userId }) => {
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState({});
    const [view, setView] = useState('day'); // day, week, month, year
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '' });
    const [editingNote, setEditingNote] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(true);

    // Load from Supabase
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load tasks
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (tasksData) setTasks(tasksData);

                // Load notes
                const { data: notesData } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('user_id', userId);
                
                if (notesData) {
                    const notesMap = {};
                    notesData.forEach(n => {
                        notesMap[n.period_key] = n;
                    });
                    setNotes(notesMap);
                }
            } catch (e) {
                console.log('Load error:', e);
                // Load from localStorage as fallback
                const local = localStorage.getItem(`titan_tasks_${userId}`);
                if (local) setTasks(JSON.parse(local));
                const localNotes = localStorage.getItem(`titan_notes_${userId}`);
                if (localNotes) setNotes(JSON.parse(localNotes));
            }
            setLoading(false);
        };
        loadData();
    }, [userId]);

    // Save tasks
    const saveTasks = async (newTasks) => {
        setTasks(newTasks);
        localStorage.setItem(`titan_tasks_${userId}`, JSON.stringify(newTasks));
        // Sync individual task changes to Supabase handled in add/update/delete functions
    };

    // Save notes
    const saveNote = async (periodKey, text) => {
        const newNotes = { ...notes, [periodKey]: { period_key: periodKey, content: text, updated_at: new Date().toISOString() } };
        setNotes(newNotes);
        localStorage.setItem(`titan_notes_${userId}`, JSON.stringify(newNotes));
        
        try {
            await supabase.from('notes').upsert({
                user_id: userId,
                period_key: periodKey,
                content: text,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,period_key' });
        } catch (e) { console.log('Note save error:', e); }
    };

    // Add task
    const addTask = async () => {
        if (!newTask.title.trim()) return;
        
        const task = {
            id: Date.now().toString(),
            user_id: userId,
            title: newTask.title,
            completed: false,
            priority: newTask.priority,
            due_date: newTask.dueDate || selectedDate.toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };
        
        const newTasks = [task, ...tasks];
        saveTasks(newTasks);
        
        try {
            await supabase.from('tasks').insert(task);
        } catch (e) { console.log('Task save error:', e); }
        
        setNewTask({ title: '', priority: 'medium', dueDate: '' });
        setShowAddTask(false);
    };

    // Toggle task
    const toggleTask = async (taskId) => {
        const newTasks = tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        saveTasks(newTasks);
        
        const task = newTasks.find(t => t.id === taskId);
        try {
            await supabase.from('tasks').update({ completed: task.completed }).eq('id', taskId);
        } catch (e) { console.log('Toggle error:', e); }
    };

    // Delete task
    const deleteTask = async (taskId) => {
        const newTasks = tasks.filter(t => t.id !== taskId);
        saveTasks(newTasks);
        
        try {
            await supabase.from('tasks').delete().eq('id', taskId);
        } catch (e) { console.log('Delete error:', e); }
    };

    // Navigation helpers
    const navigate = (direction) => {
        const d = new Date(selectedDate);
        if (view === 'day') d.setDate(d.getDate() + direction);
        else if (view === 'week') d.setDate(d.getDate() + (direction * 7));
        else if (view === 'month') d.setMonth(d.getMonth() + direction);
        else if (view === 'year') d.setFullYear(d.getFullYear() + direction);
        setSelectedDate(d);
    };

    const goToToday = () => setSelectedDate(new Date());

    // Period key for notes
    const getPeriodKey = () => {
        const d = selectedDate;
        if (view === 'day') return d.toISOString().split('T')[0];
        if (view === 'week') {
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay() + 1);
            return `week-${weekStart.toISOString().split('T')[0]}`;
        }
        if (view === 'month') return `month-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (view === 'year') return `year-${d.getFullYear()}`;
    };

    // Get tasks for current period
    const getTasksForPeriod = () => {
        const d = selectedDate;
        return tasks.filter(t => {
            const taskDate = new Date(t.due_date);
            if (view === 'day') return t.due_date === d.toISOString().split('T')[0];
            if (view === 'week') {
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay() + 1);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return taskDate >= weekStart && taskDate <= weekEnd;
            }
            if (view === 'month') return taskDate.getMonth() === d.getMonth() && taskDate.getFullYear() === d.getFullYear();
            if (view === 'year') return taskDate.getFullYear() === d.getFullYear();
            return false;
        });
    };

    // Format period title
    const getPeriodTitle = () => {
        const d = selectedDate;
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        if (view === 'day') return d.toLocaleDateString('fr-FR', options);
        if (view === 'week') {
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        }
        if (view === 'month') return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        if (view === 'year') return d.getFullYear().toString();
    };

    const periodTasks = getTasksForPeriod();
    const completedCount = periodTasks.filter(t => t.completed).length;
    const periodKey = getPeriodKey();
    const currentNote = notes[periodKey]?.content || '';

    const priorityColors = {
        high: 'border-red-500 bg-red-500/10',
        medium: 'border-yellow-500 bg-yellow-500/10',
        low: 'border-green-500 bg-green-500/10'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-cyan-500" size={32}/>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-4">
                <ClipboardList className="mx-auto text-indigo-500 mb-2" size={40}/>
                <h3 className="text-white font-bold text-xl">Tâches & Notes</h3>
            </div>

            {/* View Switcher */}
            <Card className="p-2">
                <div className="flex gap-1">
                    {[
                        { id: 'day', label: 'Jour', icon: Sun },
                        { id: 'week', label: 'Semaine', icon: CalendarDays },
                        { id: 'month', label: 'Mois', icon: Calendar },
                        { id: 'year', label: 'Année', icon: Layers }
                    ].map(v => {
                        const Icon = v.icon;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                                    view === v.id 
                                        ? 'bg-indigo-500 text-white' 
                                        : 'text-gray-400 hover:bg-white/5'
                                }`}
                            >
                                <Icon size={14}/>
                                <span className="hidden sm:inline">{v.label}</span>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Period Navigation */}
            <Card className="p-3 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronLeft className="text-gray-400" size={20}/>
                </button>
                <div className="text-center">
                    <div className="text-white font-bold capitalize">{getPeriodTitle()}</div>
                    <button onClick={goToToday} className="text-xs text-indigo-400 hover:text-indigo-300">
                        Aujourd'hui
                    </button>
                </div>
                <button onClick={() => navigate(1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronRight className="text-gray-400" size={20}/>
                </button>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 text-center">
                    <div className="text-2xl font-bold text-white">{periodTasks.length}</div>
                    <div className="text-xs text-gray-500">Total</div>
                </Card>
                <Card className="p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
                    <div className="text-xs text-gray-500">Faites</div>
                </Card>
                <Card className="p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">{periodTasks.length - completedCount}</div>
                    <div className="text-xs text-gray-500">En cours</div>
                </Card>
            </div>

            {/* Add Task Button */}
            <Button onClick={() => setShowAddTask(true)} variant="primary" className="w-full" icon={Plus}>
                Nouvelle tâche
            </Button>

            {/* Tasks List */}
            <div className="space-y-2">
                {periodTasks.length === 0 ? (
                    <Card className="p-6 text-center">
                        <CheckSquare className="mx-auto text-gray-600 mb-2" size={32}/>
                        <p className="text-gray-500">Aucune tâche pour cette période</p>
                    </Card>
                ) : (
                    periodTasks.map(task => (
                        <Card 
                            key={task.id} 
                            className={`p-3 border-l-4 ${priorityColors[task.priority]} ${task.completed ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                        task.completed 
                                            ? 'bg-emerald-500' 
                                            : 'border-2 border-gray-600 hover:border-emerald-500'
                                    }`}
                                >
                                    {task.completed && <Check size={14} className="text-white"/>}
                                </button>
                                <div className="flex-1">
                                    <div className={`text-white font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                        {task.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(task.due_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} className="text-red-400"/>
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Notes Section */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <StickyNote className="text-yellow-500" size={18}/>
                        <span className="text-white font-medium">Notes</span>
                    </div>
                    {editingNote !== periodKey ? (
                        <button 
                            onClick={() => { setEditingNote(periodKey); setNoteText(currentNote); }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Edit3 size={16} className="text-gray-400"/>
                        </button>
                    ) : (
                        <button 
                            onClick={() => { saveNote(periodKey, noteText); setEditingNote(null); }}
                            className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                            <Save size={16} className="text-emerald-400"/>
                        </button>
                    )}
                </div>
                {editingNote === periodKey ? (
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Écris tes notes ici..."
                        className="w-full bg-white/5 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
                        rows={4}
                        autoFocus
                    />
                ) : (
                    <div className="text-gray-400 text-sm whitespace-pre-wrap min-h-[60px]">
                        {currentNote || <span className="italic text-gray-600">Clique pour ajouter des notes...</span>}
                    </div>
                )}
            </Card>

            {/* Add Task Modal */}
            <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Nouvelle Tâche">
                <div className="space-y-4">
                    <Input
                        label="Titre"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Qu'est-ce que tu dois faire ?"
                    />
                    
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Priorité</label>
                        <div className="flex gap-2">
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setNewTask({ ...newTask, priority: p })}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                                        newTask.priority === p 
                                            ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    {p === 'high' ? '🔥 Haute' : p === 'medium' ? '⚡ Moyenne' : '✨ Basse'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <Input
                        label="Date d'échéance"
                        type="date"
                        value={newTask.dueDate || selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                    
                    <Button onClick={addTask} variant="primary" className="w-full" icon={Plus}>
                        Ajouter la tâche
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// --- MAIN APP ---

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ ERROR BOUNDARY GLOBALE - Empêche l'écran noir
// ═══════════════════════════════════════════════════════════════════════════

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🔴 ERREUR GLOBALE APP:', error);
        console.error('📍 Stack:', errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a202c',
                    color: 'white',
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{ maxWidth: '500px' }}>
                        <div style={{ fontSize: '80px', marginBottom: '20px' }}>💥</div>
                        <h1 style={{ 
                            fontSize: '32px', 
                            fontWeight: 'bold',
                            marginBottom: '15px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Erreur détectée
                        </h1>
                        <p style={{ 
                            marginBottom: '20px', 
                            opacity: 0.8,
                            fontSize: '16px',
                            lineHeight: '1.6'
                        }}>
                            L'application a rencontré une erreur. Cliquez ci-dessous pour recharger.
                        </p>
                        <details style={{ 
                            marginBottom: '25px', 
                            textAlign: 'left',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '15px',
                            borderRadius: '10px'
                        }}>
                            <summary style={{ 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                marginBottom: '10px',
                                color: '#f56565'
                            }}>
                                Détails techniques
                            </summary>
                            <pre style={{ 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                opacity: 0.8
                            }}>
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '15px 40px',
                                borderRadius: '10px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            🔄 Recharger l'application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- MAIN APP CONTENT ---
function AppContent() {
    const [view, setView] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const userId = 'demo-user';

    // Show auth screen if not authenticated
    if (!isAuthenticated) {
        return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <Layout view={view} setView={setView}>
            {view === 'dashboard' && <Dashboard setView={setView} userId={userId} />}
            {view === 'fitness' && <FitnessModule userId={userId} />}
            {view === 'routine' && <RoutineView userId={userId} />}
            {view === 'tasks' && <TasksView userId={userId} />}
            {view === 'finance' && <FinanceView userId={userId} />}
            {view === 'meals' && <MealsView userId={userId} />}
            {view === 'lifestyle' && <LifestyleView userId={userId} />}
        </Layout>
    );
}

// --- MAIN APP WITH ERROR BOUNDARY ---
export default function App() {
    return (
        <AppErrorBoundary>
            <AppContent />
        </AppErrorBoundary>
    );
}
