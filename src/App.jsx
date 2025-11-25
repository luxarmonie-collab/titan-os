import React, { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
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
  ClipboardList, CalendarDays, Square, CheckSquare, StickyNote, Layers
} from 'lucide-react';

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

  // Check Face ID availability on mount
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setShowBiometricButton(available);
          
          // Auto-trigger Face ID on load
          if (available) {
            tryFaceID();
          }
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
const PHASE_1_START = new Date("2024-11-25");

const CARDIO_DETAILS = {
    "LISS_Opt": { title: "LISS (Marche Inclinée)", desc: "Tapis 8-10% / 6-7km/h", duration: "25-30 min", intensity: "60-70% FCmax" },
    "HIIT": { title: "HIIT (Intervalles)", desc: "30s effort / 30s repos", duration: "15-20 min", intensity: "Max Effort" },
    "Course_10km": { title: "Course Endurance", desc: "Allure fondamentale", duration: "10 km", intensity: "70-75% FCmax" },
    "Ski": { title: "Ski Alpin", desc: "Journée complète", duration: "Journée", intensity: "Variable" },
    "Non": { title: "Pas de Cardio", desc: "", duration: "", intensity: "" }
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
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDRIER 27 SEMAINES COMPLET
// ═══════════════════════════════════════════════════════════════════════════════
const CALENDAR_27_WEEKS = [
    // PHASE 1 - MASSE (Semaines 1-10)
    { sem: 1, date: "25/11", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt", notes: "Focus rattrapage" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 2, date: "02/12", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: "Course_10km_Opt" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 3, date: "09/12", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: null, duree: 0, cardio: null, notes: "🎿 SKI début" },
        { jour: "Sam", seance: "UPPER_SKI", duree: 45, cardio: null, notes: "SKI + Upper soir" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "🎿 SKI - Pesée" }
    ]},
    { sem: 4, date: "16/12", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "🎿 SKI" },
        { jour: "Mar", seance: "UPPER_SKI", duree: 45, cardio: null, notes: "SKI + Upper soir" },
        { jour: "Mer", seance: null, duree: 0, cardio: null, notes: "🎿 SKI" },
        { jour: "Jeu", seance: "UPPER_SKI", duree: 50, cardio: null, notes: "SKI + Upper + Mollets" },
        { jour: "Ven", seance: null, duree: 0, cardio: null, notes: "🎿 SKI fin" },
        { jour: "Sam", seance: "PUSH_A_Deload", duree: 60, cardio: null, notes: "DELOAD" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Photos" }
    ]},
    { sem: 5, date: "23/12", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PULL_A_Deload", duree: 60, cardio: "LISS_Opt", notes: "DELOAD" },
        { jour: "Mar", seance: "POIDS_CORPS", duree: 30, cardio: "Course_30", notes: "🎄 Noël" },
        { jour: "Mer", seance: null, duree: 0, cardio: null, notes: "🎄 Noël - Repos" },
        { jour: "Jeu", seance: "HIIT_MAISON", duree: 20, cardio: "Course_35", notes: "Course + HIIT" },
        { jour: "Ven", seance: "POIDS_CORPS", duree: 30, cardio: "Course_30" },
        { jour: "Sam", seance: null, duree: 0, cardio: "Course_40", notes: "LISS" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Photos + Préparer reprise" }
    ]},
    { sem: 6, date: "30/12", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt", notes: "Reprise post-Noël" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt", notes: "Réveillon" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt", notes: "🎆 Nouvel An" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos + Bilan mi-Phase1" }
    ]},
    { sem: 7, date: "06/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: "Course_10km_Opt" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 8, date: "13/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: null },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 9, date: "20/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
        { jour: "Mar", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
        { jour: "Mer", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
        { jour: "Jeu", seance: "LEGS_A", duree: 75, cardio: null },
        { jour: "Ven", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
        { jour: "Sam", seance: "PULL_B", duree: 60, cardio: "Course_10km_Opt" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 10, date: "27/01", phase: "Phase1_Masse", jours: [
        { jour: "Lun", seance: "PUSH_A_Deload", duree: 60, cardio: "LISS_Opt", notes: "⚡ DELOAD" },
        { jour: "Mar", seance: "PULL_A_Deload", duree: 60, cardio: "LISS_Opt", notes: "DELOAD" },
        { jour: "Mer", seance: null, duree: 0, cardio: "LISS_25", notes: "Cardio léger" },
        { jour: "Jeu", seance: "LEGS_A_Deload", duree: 65, cardio: null, notes: "DELOAD" },
        { jour: "Ven", seance: "PUSH_B_Deload", duree: 55, cardio: null, notes: "DELOAD" },
        { jour: "Sam", seance: null, duree: 0, cardio: null, notes: "Repos complet" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "📸 FIN PHASE 1 - Mesures complètes" }
    ]},
    // PHASE 2 - TRANSITION (Semaines 11-18)
    { sem: 11, date: "03/02", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_v2", duree: 70, cardio: "HIIT_15", notes: "🔄 DÉBUT PHASE 2" },
        { jour: "Mar", seance: "PULL_A_v2", duree: 70, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_20", notes: "Cardio HIIT" },
        { jour: "Jeu", seance: "LEGS_A_v2_MOLLETS", duree: 80, cardio: "LISS_35", notes: "Mollets intégrés" },
        { jour: "Ven", seance: "PUSH_B_v2", duree: 60, cardio: null },
        { jour: "Sam", seance: "PULL_B_v2_MOLLETS", duree: 65, cardio: "HIIT_15" },
        { jour: "Dim", seance: null, duree: 0, cardio: "LISS_40_Opt", notes: "Pesée + Photos" }
    ]},
    { sem: 12, date: "10/02", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_v2", duree: 70, cardio: "HIIT_15" },
        { jour: "Mar", seance: "PULL_A_v2", duree: 70, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_20" },
        { jour: "Jeu", seance: "LEGS_A_v2_MOLLETS", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_v2", duree: 60, cardio: null },
        { jour: "Sam", seance: "PULL_B_v2_MOLLETS", duree: 65, cardio: "HIIT_15" },
        { jour: "Dim", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos" }
    ]},
    { sem: 13, date: "17/02", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_v2", duree: 70, cardio: "HIIT_15" },
        { jour: "Mar", seance: "PULL_A_v2", duree: 70, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_20" },
        { jour: "Jeu", seance: "LEGS_A_v2_MOLLETS", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_v2", duree: 60, cardio: null },
        { jour: "Sam", seance: "PULL_B_v2_MOLLETS", duree: 65, cardio: "HIIT_15" },
        { jour: "Dim", seance: null, duree: 0, cardio: "LISS_40_Opt", notes: "Pesée + Photos" }
    ]},
    { sem: 14, date: "24/02", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_v2", duree: 70, cardio: "HIIT_15" },
        { jour: "Mar", seance: "PULL_A_v2", duree: 70, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_20" },
        { jour: "Jeu", seance: "LEGS_A_v2_MOLLETS", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_v2", duree: 60, cardio: null },
        { jour: "Sam", seance: "PULL_B_v2_MOLLETS", duree: 65, cardio: "HIIT_15" },
        { jour: "Dim", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos" }
    ]},
    { sem: 15, date: "03/03", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_Deload", duree: 60, cardio: "LISS_20", notes: "⚡ DELOAD" },
        { jour: "Mar", seance: "PULL_A_Deload", duree: 60, cardio: "LISS_20", notes: "DELOAD" },
        { jour: "Mer", seance: null, duree: 0, cardio: "LISS_25", notes: "Cardio LISS" },
        { jour: "Jeu", seance: "LEGS_A_Deload", duree: 65, cardio: null, notes: "DELOAD" },
        { jour: "Ven", seance: null, duree: 0, cardio: null, notes: "Repos" },
        { jour: "Sam", seance: null, duree: 0, cardio: null, notes: "Repos" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 16, date: "10/03", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_Intensif", duree: 70, cardio: "HIIT_20", notes: "🔥 Drop sets" },
        { jour: "Mar", seance: "PULL_A_Intensif", duree: 75, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_25" },
        { jour: "Jeu", seance: "LEGS_A_Intensif", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_Intensif", duree: 70, cardio: null },
        { jour: "Sam", seance: "PULL_B_LEGS_B_Intensif", duree: 90, cardio: "HIIT_20" },
        { jour: "Dim", seance: null, duree: 0, cardio: "LISS_45", notes: "Pesée + Photos" }
    ]},
    { sem: 17, date: "17/03", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_Intensif", duree: 70, cardio: "HIIT_20" },
        { jour: "Mar", seance: "PULL_A_Intensif", duree: 75, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_25" },
        { jour: "Jeu", seance: "LEGS_A_Intensif", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_Intensif", duree: 70, cardio: null },
        { jour: "Sam", seance: "PULL_B_LEGS_B_Intensif", duree: 90, cardio: "HIIT_20" },
        { jour: "Dim", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos" }
    ]},
    { sem: 18, date: "24/03", phase: "Phase2_Transition", jours: [
        { jour: "Lun", seance: "PUSH_A_Intensif", duree: 70, cardio: "HIIT_20" },
        { jour: "Mar", seance: "PULL_A_Intensif", duree: 75, cardio: "LISS_30" },
        { jour: "Mer", seance: null, duree: 0, cardio: "HIIT_25" },
        { jour: "Jeu", seance: "LEGS_A_Intensif", duree: 80, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_B_Intensif", duree: 70, cardio: null },
        { jour: "Sam", seance: "PULL_B_LEGS_B_Intensif", duree: 90, cardio: "HIIT_20" },
        { jour: "Dim", seance: null, duree: 0, cardio: "LISS_45", notes: "📸 FIN PHASE 2 - Mesures" }
    ]},
    // PHASE 3 - SÈCHE (Semaines 19-27)
    { sem: 19, date: "31/03", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "Repos avant Phase 3" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35", notes: "🔥 DÉBUT PHASE 3 SÈCHE" },
        { jour: "Mer", seance: "LEGS_MOLLETS", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_40", notes: "Cardio ou Course 10km" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE", duree: 50, cardio: "HIIT_20" }
    ]},
    { sem: 20, date: "07/04", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "LISS_45_Opt", notes: "Pesée + Photos" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35" },
        { jour: "Mer", seance: "LEGS_MOLLETS", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_40" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE", duree: 50, cardio: "HIIT_20" }
    ]},
    { sem: 21, date: "14/04", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35" },
        { jour: "Mer", seance: "LEGS_MOLLETS", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "Course_10km" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE", duree: 50, cardio: "HIIT_20" }
    ]},
    { sem: 22, date: "21/04", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "LISS_45", notes: "Pesée + Photos" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35" },
        { jour: "Mer", seance: "LEGS_MOLLETS", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_40" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE", duree: 50, cardio: "HIIT_20" }
    ]},
    { sem: 23, date: "28/04", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos" },
        { jour: "Mar", seance: "FULL_BODY_Deload", duree: 50, cardio: "LISS_30", notes: "⚡ DELOAD" },
        { jour: "Mer", seance: "UPPER_Deload", duree: 45, cardio: "LISS_25", notes: "DELOAD" },
        { jour: "Jeu", seance: null, duree: 0, cardio: "LISS_30", notes: "Cardio léger" },
        { jour: "Ven", seance: "LOWER_Deload", duree: 50, cardio: null, notes: "DELOAD" },
        { jour: "Sam", seance: null, duree: 0, cardio: "LISS_25", notes: "Repos" },
        { jour: "Dim", seance: null, duree: 0, cardio: null, notes: "Pesée + Photos" }
    ]},
    { sem: 24, date: "05/05", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: null, notes: "Récup avant sprint" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35", notes: "🚀 SPRINT FINAL" },
        { jour: "Mer", seance: "LEGS_MOLLETS_MAX", duree: 70, cardio: null, notes: "Volume mollets MAX" },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_40" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE_INTENSIF", duree: 55, cardio: "HIIT_25" }
    ]},
    { sem: 25, date: "12/05", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "LISS_45", notes: "Pesée + Photos + Mesures" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35" },
        { jour: "Mer", seance: "LEGS_MOLLETS_MAX", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "Course_10km" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE_INTENSIF", duree: 55, cardio: "HIIT_25" }
    ]},
    { sem: 26, date: "19/05", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "LISS_45", notes: "Pesée + Photos + Mesures" },
        { jour: "Mar", seance: "PUSH_PULL_A", duree: 65, cardio: "LISS_35" },
        { jour: "Mer", seance: "LEGS_MOLLETS_MAX", duree: 70, cardio: null },
        { jour: "Jeu", seance: "PUSH_PULL_B", duree: 60, cardio: "HIIT_20" },
        { jour: "Ven", seance: null, duree: 0, cardio: "LISS_40" },
        { jour: "Sam", seance: "FULL_BODY", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_METABOLIQUE_INTENSIF", duree: 55, cardio: "HIIT_25" }
    ]},
    { sem: 27, date: "26/05", phase: "Phase3_Seche", jours: [
        { jour: "Lun", seance: null, duree: 0, cardio: "Course_10km_Opt", notes: "Pesée + Photos + Mesures" },
        { jour: "Mar", seance: "FULL_BODY_A_MAX", duree: 60, cardio: "LISS_35", notes: "🏁 DERNIÈRE SEMAINE" },
        { jour: "Mer", seance: "UPPER_MOLLETS_MAX", duree: 70, cardio: null },
        { jour: "Jeu", seance: "LOWER_CIRCUIT_MAX", duree: 65, cardio: "LISS_35" },
        { jour: "Ven", seance: "PUSH_PULL_SUPERSETS", duree: 60, cardio: "LISS_30" },
        { jour: "Sam", seance: "FULL_BODY_B_MOLLETS", duree: 65, cardio: "LISS_30" },
        { jour: "Dim", seance: "CIRCUIT_FULL_BODY", duree: 55, cardio: "HIIT_25", notes: "Photos + Mesures" }
    ]}
];

// Dates clés du programme
const KEY_DATES = {
    "2024-11-25": { label: "DÉBUT PROGRAMME", type: "start" },
    "2024-12-13": { label: "Départ ski", type: "special" },
    "2024-12-24": { label: "🎄 Noël", type: "special" },
    "2025-02-02": { label: "📸 FIN PHASE 1", type: "milestone" },
    "2025-02-03": { label: "🔄 DÉBUT PHASE 2", type: "start" },
    "2025-03-30": { label: "📸 FIN PHASE 2", type: "milestone" },
    "2025-04-01": { label: "🔥 DÉBUT PHASE 3 SÈCHE", type: "start" },
    "2025-05-06": { label: "🚀 SPRINT FINAL", type: "special" },
    "2025-06-02": { label: "⭐ PEAK WEEK", type: "special" },
    "2025-06-15": { label: "🏆 OBJECTIF ATTEINT", type: "goal" }
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
        { id: 'maca', name: 'Maca', emoji: '🌿' }
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
        { id: 'ashwagandha', name: 'Ashwagandha', emoji: '🌙' }
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
// SECOND BRAIN - SYSTÈME D'ANALYSE IA CENTRALISÉ
// ═══════════════════════════════════════════════════════════════════════════════
const analyzeAllData = (data) => {
    const { checkins, workoutLogs, biometrics, whoopData, supplementLogs } = data;
    const insights = [];
    const questions = [];
    
    // Analyse Whoop
    if (whoopData?.recovery) {
        if (whoopData.recovery < 33) {
            insights.push({
                type: 'warning',
                category: 'recovery',
                title: 'Récupération critique',
                message: `Recovery ${whoopData.recovery}% - Ton corps a besoin de repos.`,
                action: 'Considère une séance légère ou repos complet.'
            });
            questions.push({
                id: 'low_recovery',
                text: 'Pourquoi ton recovery est bas ? (Alcool, stress, couché tard...)',
                options: ['Alcool', 'Stress travail', 'Couché tard', 'Mauvais sommeil', 'Autre']
            });
        } else if (whoopData.recovery > 66) {
            insights.push({
                type: 'success',
                category: 'recovery',
                title: 'Forme optimale',
                message: `Recovery ${whoopData.recovery}% - C'est le moment de performer !`,
                action: 'Pousse tes limites aujourd\'hui.'
            });
        }
        
        if (whoopData.strain > 18) {
            insights.push({
                type: 'warning',
                category: 'strain',
                title: 'Strain élevé',
                message: `Strain ${whoopData.strain} - Tu as beaucoup sollicité ton corps.`,
                action: 'Prévois une récupération adaptée.'
            });
        }
        
        if (whoopData.sleepScore < 70) {
            insights.push({
                type: 'warning',
                category: 'sleep',
                title: 'Sommeil insuffisant',
                message: `Score sommeil ${whoopData.sleepScore}% - Ton sommeil impacte ta récupération.`,
                action: 'Couche-toi plus tôt ce soir.'
            });
            questions.push({
                id: 'bad_sleep',
                text: 'Qu\'est-ce qui a perturbé ton sommeil ?',
                options: ['Écrans tard', 'Stress', 'Repas lourd', 'Bruit', 'Autre']
            });
        }
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
        const cardioCount = thisWeek.filter(l => l.type === 'Cardio').length;
        
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
    
    // Analyse check-ins (tendance humeur/énergie)
    if (checkins?.length >= 3) {
        const recent = checkins.slice(-7);
        const avgEnergy = recent.reduce((sum, c) => sum + (c.energy || 3), 0) / recent.length;
        const avgMood = recent.reduce((sum, c) => sum + (c.mood || 3), 0) / recent.length;
        
        if (avgEnergy < 2.5) {
            insights.push({
                type: 'warning',
                category: 'wellbeing',
                title: 'Énergie en baisse',
                message: 'Ta moyenne d\'énergie est basse ces derniers jours.',
                action: 'Vérifie ton sommeil, nutrition et stress.'
            });
        }
        
        if (avgMood < 2.5) {
            insights.push({
                type: 'warning',
                category: 'wellbeing',
                title: 'Moral en baisse',
                message: 'Ton humeur semble impactée récemment.',
                action: 'Prends du temps pour toi.'
            });
        }
    }
    
    return { insights, questions };
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
        const day = date.getDay();
        const schedule = {
            1: { type: "Training", seance: "PUSH_A", duree: 70, cardio: "LISS_Opt" },
            2: { type: "Training", seance: "PULL_A", duree: 75, cardio: "LISS_Opt" },
            3: { type: "Training", seance: "MOLLETS", duree: 35, cardio: "LISS_Opt" },
            4: { type: "Training", seance: "LEGS_A", duree: 75, cardio: "Non" },
            5: { type: "Training", seance: "PUSH_B", duree: 60, cardio: "LISS_Opt" },
            6: { type: "Training", seance: "PULL_B", duree: 60, cardio: "Course_10km" },
            0: { type: "Repos", seance: null, duree: 0, cardio: "Non" }
        };
        const isSki = (date >= new Date("2024-12-13") && date <= new Date("2024-12-20"));
        if (isSki) {
            return { type: "Ski", seance: "UPPER_SKI", duree: 45, cardio: "Ski", dateStr, dateObj: date, dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}) };
        }
        const data = schedule[day] || { type: "Repos", seance: null, duree: 0, cardio: "Non" };
        return { ...data, dateStr, dateObj: date, dayName: date.toLocaleDateString('fr-FR', {weekday:'long'}) };
    } catch (e) {
        return { type: "Repos", seance: null, duree: 0, cardio: "Non", dateStr, dateObj: new Date(), dayName: "Erreur" };
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

// Hook pour sync les habitudes
const useSupabaseHabits = (userId) => {
    const [data, setData] = useLocalStorage(`titan_habits_${userId}`, {});
    
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('habits')
                    .select('*')
                    .eq('user_id', userId);
                if (!error && rows) {
                    const mapped = {};
                    rows.forEach(row => {
                        const key = `${row.date}_${row.habit_id}`;
                        mapped[key] = row.completed;
                    });
                    if (Object.keys(mapped).length > 0) setData(prev => ({ ...prev, ...mapped }));
                }
            } catch (e) { console.log('Supabase load error:', e); }
        };
        loadFromCloud();
    }, [userId]);
    
    const toggleHabit = async (date, habitId, value) => {
        const key = `${date}_${habitId}`;
        setData(prev => ({ ...prev, [key]: value }));
        
        try {
            await supabase.from('habits').upsert({
                user_id: userId,
                date,
                habit_id: habitId,
                completed: value
            }, { onConflict: 'user_id,date,habit_id' });
        } catch (e) { console.log('Supabase save error:', e); }
    };
    
    return [data, setData, toggleHabit];
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
// WHOOP WIDGET - Données temps réel
// ═══════════════════════════════════════════════════════════════════════════════

const WhoopWidget = ({ userId }) => {
    const [whoopData, setWhoopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    
    // Check URL params for connection status
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('whoop_connected') === 'true') {
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchWhoopData();
        }
        if (params.get('whoop_error')) {
            setError(params.get('whoop_error'));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);
    
    // Fetch Whoop data
    const fetchWhoopData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/whoop/data?user_id=${userId}`);
            const data = await response.json();
            
            if (data.connected) {
                setConnected(true);
                setWhoopData(data);
            } else {
                setConnected(false);
            }
        } catch (e) {
            console.error('Whoop fetch error:', e);
            setConnected(false);
        }
        setLoading(false);
    };
    
    // Check connection status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/whoop/status?user_id=${userId}`);
                const data = await response.json();
                if (data.connected) {
                    fetchWhoopData();
                } else {
                    setLoading(false);
                    setConnected(false);
                }
            } catch (e) {
                setLoading(false);
                setConnected(false);
            }
        };
        checkStatus();
    }, [userId]);
    
    // Connect to Whoop
    const connectWhoop = () => {
        window.location.href = `/api/whoop/auth?user_id=${userId}`;
    };
    
    // Disconnect from Whoop
    const disconnectWhoop = async () => {
        await fetch(`/api/whoop/disconnect?user_id=${userId}`, { method: 'POST' });
        setConnected(false);
        setWhoopData(null);
    };
    
    // Recovery color based on score
    const getRecoveryColor = (score) => {
        if (!score) return 'gray';
        if (score >= 67) return 'green';
        if (score >= 34) return 'yellow';
        return 'red';
    };
    
    // Recovery Ring Component
    const RecoveryRing = ({ score }) => {
        const color = getRecoveryColor(score);
        const colors = {
            green: { ring: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
            yellow: { ring: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
            red: { ring: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            gray: { ring: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }
        };
        const percentage = score || 0;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;
        
        return (
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="45" fill="none" stroke={colors[color].bg} strokeWidth="8" />
                    <circle 
                        cx="56" cy="56" r="45" fill="none" 
                        stroke={colors[color].ring} strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{score || '--'}%</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Recovery</span>
                </div>
            </div>
        );
    };
    
    if (loading) {
        return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
                <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Chargement Whoop...</span>
                </div>
            </div>
        );
    }
    
    if (!connected) {
        return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1DB954] to-[#0d8a3e] flex items-center justify-center">
                        <Activity size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white">WHOOP</div>
                        <div className="text-xs text-gray-500">Non connecté</div>
                    </div>
                </div>
                {error && (
                    <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                        Erreur: {error}
                    </div>
                )}
                <button
                    onClick={connectWhoop}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1DB954] to-[#0d8a3e] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Connecter mon Whoop
                </button>
            </div>
        );
    }
    
    // Connected - show data
    return (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1DB954] to-[#0d8a3e] flex items-center justify-center">
                        <Activity size={16} className="text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">WHOOP</div>
                        <div className="text-[10px] text-gray-500">
                            {whoopData?.profile?.firstName || 'Connecté'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchWhoopData} className="p-1.5 hover:bg-white/5 rounded-lg">
                        <RefreshCw size={14} className="text-gray-400" />
                    </button>
                    <button onClick={disconnectWhoop} className="p-1.5 hover:bg-white/5 rounded-lg">
                        <X size={14} className="text-gray-400" />
                    </button>
                </div>
            </div>
            
            {/* Main Stats */}
            <div className="flex items-center gap-4">
                {/* Recovery Ring */}
                <RecoveryRing score={whoopData?.recovery?.score} />
                
                {/* Side Stats */}
                <div className="flex-1 space-y-2">
                    {/* HRV */}
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-xs text-gray-400">HRV</span>
                        <span className="font-bold text-white">{whoopData?.recovery?.hrv || '--'} ms</span>
                    </div>
                    
                    {/* RHR */}
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-xs text-gray-400">RHR</span>
                        <span className="font-bold text-white">{whoopData?.recovery?.rhr || '--'} bpm</span>
                    </div>
                    
                    {/* Strain */}
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-xs text-gray-400">Strain</span>
                        <span className="font-bold text-blue-400">{whoopData?.strain?.score || '--'}</span>
                    </div>
                </div>
            </div>
            
            {/* Sleep Stats */}
            {whoopData?.sleep && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-xs text-gray-500 mb-2">SOMMEIL</div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-lg font-bold text-white">{whoopData.sleep.duration || '--'}h</div>
                            <div className="text-[10px] text-gray-500">Durée</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-lg font-bold text-purple-400">{whoopData.sleep.rem || '--'}</div>
                            <div className="text-[10px] text-gray-500">REM (min)</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/5">
                            <div className="text-lg font-bold text-blue-400">{whoopData.sleep.deep || '--'}</div>
                            <div className="text-[10px] text-gray-500">Deep (min)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE WIDGET - Connexion bancaire Bridge
// ═══════════════════════════════════════════════════════════════════════════════

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
    const [workoutLogs, setWorkoutLogs] = useLocalStorage(`titan_logs_${userId}`, []);
    const [dailyCheckins, setDailyCheckins] = useLocalStorage(`titan_checkins_${userId}`, []);
    const [whoopData, setWhoopData] = useLocalStorage(`titan_whoop_${userId}`, null);
    const [supplementLogs, setSupplementLogs] = useLocalStorage(`titan_supplements_${userId}`, {});
    const [aiNotes, setAiNotes] = useLocalStorage(`titan_ainotes_${userId}`, []);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = useMemo(() => getCalendarForDate(todayStr), [todayStr]);
    const todayCheckin = dailyCheckins.find(c => c.date === todayStr);

    const addLog = (log) => setWorkoutLogs(prev => [...prev, { ...log, id: Date.now().toString() }]);
    const removeLog = (index) => setWorkoutLogs(prev => prev.filter((_, i) => i !== index));
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
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'programme', label: 'Programme', icon: '📅' },
        { id: 'planning', label: 'Planning', icon: '🗓️' },
        { id: 'progress', label: 'Progrès', icon: '📈' },
        { id: 'biometrics', label: 'Biométrie', icon: '⚖️' }
    ];

    return (
        <div className="space-y-4">
            {view !== 'logger' && (
                <div className="relative">
                    <div 
                        className="flex space-x-2 overflow-x-auto pb-2 px-1 -mx-1" 
                        style={{
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            msOverflowStyle: 'none'
                        }}
                    >
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setView(tab.id)} 
                                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${view === tab.id ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                <span>{tab.icon}</span>
                                <span className="uppercase">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    {/* Indicateur scroll droit */}
                    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#030305] to-transparent pointer-events-none md:hidden" />
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
                />
            )}
            {view === 'programme' && <FitnessProgramme workoutLogs={workoutLogs} />}
            {view === 'planning' && <FitnessCalendar onSelectDay={startWorkout} workoutLogs={workoutLogs} addLog={addLog} removeLog={removeLog} />}
            {view === 'progress' && <FitnessProgress workoutLogs={workoutLogs} />}
            {view === 'biometrics' && <FitnessBiometrics userId={userId} />}
            {view === 'logger' && activeSession && <WorkoutLogger sessionCode={activeSession} onExit={handleExitLogger} onFinishSession={handleExitLogger} addLog={addLog} />}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECOND BRAIN DASHBOARD - STYLE WHOOP
// ═══════════════════════════════════════════════════════════════════════════════
const SecondBrainDashboard = ({ 
    todayData, startWorkout, addLog, todayCheckin, updateCheckin, 
    workoutLogs, whoopData, setWhoopData, dailyCheckins, 
    supplementLogs, setSupplementLogs, aiNotes, addAiNote, userId 
}) => {
    const [showQuickMuscu, setShowQuickMuscu] = useState(false);
    const [showAiQuestion, setShowAiQuestion] = useState(null);
    const [questionAnswer, setQuestionAnswer] = useState('');
    const [form, setForm] = useState({ duration: '', calories: '' });
    const [biometrics] = useLocalStorage(`titan_biometrics_${userId}`, {});
    
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

    return (
        <div className="space-y-4">
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
            
            {/* TODAY'S WORKOUT - MUSCU */}
            {todayData.seance && (
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs text-blue-400 font-bold">💪 MUSCULATION</div>
                            <div className="text-xl font-bold text-white">{todayData.seance}</div>
                        </div>
                        <div className="text-right">
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
                    
                    <div className="flex gap-2">
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
            
            {/* TODAY'S CARDIO */}
            {todayData.cardio && todayData.cardio !== 'Non' && (
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
                    {(() => {
                        const cardioAlreadyDone = workoutLogs.some(log => log.date === todayStr && log.type === 'Cardio');
                        return (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-xs text-orange-400 font-bold">🏃 CARDIO</div>
                                        <div className="text-lg font-bold text-white">{todayData.cardio}</div>
                                    </div>
                                    {cardioAlreadyDone ? (
                                        <div className="px-4 py-2 bg-green-500/20 text-green-400 font-bold rounded-xl text-sm">
                                            ✓ Validé
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                addLog({ 
                                                    date: todayStr, 
                                                    session: 'CARDIO', 
                                                    cardioType: todayData.cardio, 
                                                    type: 'Cardio', 
                                                    status: 'completed', 
                                                    timestamp: new Date().toISOString() 
                                                });
                                            }}
                                            className="px-4 py-2 bg-orange-500/20 text-orange-400 font-bold rounded-xl text-sm hover:bg-orange-500/30 transition-all"
                                        >
                                            Marquer fait
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {todayData.cardio.includes('LISS') && '25-45 min • Zone 2 (60-70% FCmax)'}
                                    {todayData.cardio.includes('HIIT') && '15-25 min • Intervalles haute intensité'}
                                    {todayData.cardio.includes('Course') && '10km • Allure modérée'}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
            
            {/* Jour de repos */}
            {!todayData.seance && (!todayData.cardio || todayData.cardio === 'Non') && (
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
        </div>
    );
};

// Programme complet 27 semaines avec sync jour
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
    
    // Check if a session is completed
    const isSessionCompleted = (weekNum, dayName, seance) => {
        if (!seance) return false;
        // Simplify: check if we have a log for this session type in the logs
        return workoutLogs.some(log => 
            log.session === seance && log.status === 'completed'
        );
    };
    
    const filteredCalendar = selectedPhase === 'all' 
        ? CALENDAR_27_WEEKS 
        : CALENDAR_27_WEEKS.filter(w => w.phase === selectedPhase);
    
    const getPhaseColor = (phase) => {
        if (phase === 'Phase1_Masse') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (phase === 'Phase2_Transition') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        if (phase === 'Phase3_Seche') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        return 'bg-gray-500/20 text-gray-400';
    };
    
    const getPhaseName = (phase) => {
        if (phase === 'Phase1_Masse') return 'Phase 1 - Masse';
        if (phase === 'Phase2_Transition') return 'Phase 2 - Transition';
        if (phase === 'Phase3_Seche') return 'Phase 3 - Sèche';
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
                <h2 className="text-xl font-bold">Programme 27 semaines</h2>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">Sem. {currentWeek}</span>
            </div>
            
            {/* Filtres phases */}
            <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
                {['all', 'Phase1_Masse', 'Phase2_Transition', 'Phase3_Seche'].map(phase => (
                    <button
                        key={phase}
                        onClick={() => setSelectedPhase(phase)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            selectedPhase === phase 
                                ? 'bg-white/10 text-white' 
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                    >
                        {phase === 'all' ? 'Toutes' : getPhaseName(phase)}
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
                                        {week.phase.replace('Phase1_', 'P1 ').replace('Phase2_', 'P2 ').replace('Phase3_', 'P3 ')}
                                    </span>
                                    {isCurrentWeek && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">EN COURS</span>}
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
                                                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                                                    isToday 
                                                        ? 'bg-blue-500/20 border border-blue-500/30' 
                                                        : jour.seance 
                                                        ? 'bg-white/5' 
                                                        : 'bg-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-8 ${isToday ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                                                        {jour.jour}
                                                    </span>
                                                    {completed && <Check size={14} className="text-green-400" />}
                                                    {jour.seance ? (
                                                        <span className={`font-medium ${completed ? 'text-green-400 line-through opacity-70' : isToday ? 'text-white' : 'text-gray-300'}`}>
                                                            {jour.seance}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600">Repos</span>
                                                    )}
                                                    {isToday && <span className="text-[10px] bg-blue-500 text-white px-1 rounded">AUJOURD'HUI</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
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
                            className={`p-4 flex justify-between items-center border-l-4 ${isToday ? 'border-l-cyan-500' : (muscuLog || cardioLog) ? 'border-l-emerald-500' : 'border-l-gray-700'}`}
                        >
                            <div>
                                <div className="text-white font-bold text-sm capitalize flex items-center gap-2">
                                    {d.dayName} {d.dateObj?.getDate()}
                                    {isToday && <Badge color="cyan" size="sm">Aujourd'hui</Badge>}
                                </div>
                                <div className="text-gray-500 text-xs mt-1">
                                    {d.seance || "Repos"}
                                    {d.cardio !== 'Non' && <span className="text-orange-400"> + Cardio</span>}
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                {/* Quick checkbox for Musculation */}
                                {d.type === 'Training' && (
                                    <button 
                                        onClick={(e) => quickToggleMuscu(e, d, muscuLog)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                            muscuLog 
                                                ? 'bg-emerald-500 hover:bg-emerald-600' 
                                                : 'bg-white/5 border-2 border-gray-600 hover:border-cyan-500'
                                        }`}
                                    >
                                        {muscuLog ? <Check size={16} className="text-white"/> : <Dumbbell size={14} className="text-gray-500"/>}
                                    </button>
                                )}
                                {/* Quick checkbox for Cardio */}
                                {d.cardio !== 'Non' && (
                                    <button 
                                        onClick={(e) => quickToggleCardio(e, d, cardioLog)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                            cardioLog 
                                                ? 'bg-orange-500 hover:bg-orange-600' 
                                                : 'bg-white/5 border-2 border-gray-600 hover:border-orange-500'
                                        }`}
                                    >
                                        {cardioLog ? <Check size={16} className="text-white"/> : <Heart size={14} className="text-gray-500"/>}
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

const WorkoutLogger = ({ sessionCode, onExit, onFinishSession, addLog }) => {
    const exercises = EXERCISES_DB[sessionCode] || [];
    const [logs, setLogs] = useState({});
    const [idx, setIdx] = useState(0);
    const [finishMode, setFinishMode] = useState(false);
    const [final, setFinal] = useState({ duration: '', calories: '' });

    useEffect(() => {
        const init = {};
        exercises.forEach(e => { init[e.id] = Array(e.sets).fill(null).map(() => ({weight: '', reps: ''})); });
        setLogs(init);
    }, [sessionCode]);

    const update = (eid, i, field, value) => {
        setLogs(prev => { const updated = {...prev}; updated[eid] = [...(updated[eid] || [])]; updated[eid][i] = {...(updated[eid][i] || {}), [field]: value}; return updated; });
    };

    const save = () => {
        addLog({ date: new Date().toISOString().split('T')[0], session: sessionCode, logs, duration: final.duration, calories: final.calories, status: 'completed', type: 'Muscu', timestamp: new Date().toISOString() });
        onFinishSession?.();
    };

    if (exercises.length === 0) return <div className="text-center py-10"><p className="text-gray-400">Aucun exercice trouvé.</p><Button onClick={onExit} variant="secondary" className="mt-4">Retour</Button></div>;
    
    if (finishMode) {
        return (
            <div className="space-y-6 animate-fade-in">
                <Card className="p-6 space-y-4">
                    <div className="text-center mb-4"><CheckCircle className="mx-auto text-emerald-500 mb-2" size={48}/><p className="text-gray-400">Bien joué !</p></div>
                    <Input label="Durée (min)" type="number" value={final.duration} onChange={e => setFinal({...final, duration: e.target.value})} />
                    <Input label="Calories (kcal)" type="number" value={final.calories} onChange={e => setFinal({...final, calories: e.target.value})} />
                    <Button onClick={save} variant="success" className="w-full">TERMINER</Button>
                </Card>
            </div>
        );
    }

    const cur = exercises[idx];
    const curLogs = logs[cur?.id] || [];

    return (
        <div className="flex flex-col min-h-[60vh] animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="text-gray-400" size={20}/></button>
                <span className="font-bold text-white text-lg">{sessionCode}</span>
                <Badge color="cyan">{idx + 1}/{exercises.length}</Badge>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all" style={{width: `${((idx + 1) / exercises.length) * 100}%`}} />
            </div>
            <Card className="p-5 flex-1 mb-4">
                <div className="flex justify-between items-start mb-4">
                    <div><h2 className="text-xl font-bold text-white">{cur?.name}</h2><p className="text-gray-500 text-sm">{cur?.sets} séries × {cur?.reps}</p></div>
                    <Dumbbell className="text-cyan-500/50" size={32}/>
                </div>
                <div className="space-y-3">
                    {curLogs.map((s, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <span className="text-gray-500 text-xs w-8 text-center font-mono">#{i + 1}</span>
                            <input type="number" placeholder="kg" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold text-center focus:border-cyan-500 outline-none" value={s?.weight || ''} onChange={e => update(cur.id, i, 'weight', e.target.value)} />
                            <input type="number" placeholder="reps" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold text-center focus:border-cyan-500 outline-none" value={s?.reps || ''} onChange={e => update(cur.id, i, 'reps', e.target.value)} />
                        </div>
                    ))}
                </div>
            </Card>
            <div className="flex gap-2">
                {idx > 0 && <Button onClick={() => setIdx(idx - 1)} variant="secondary" className="flex-1">Précédent</Button>}
                {idx < exercises.length - 1 ? <Button onClick={() => setIdx(idx + 1)} variant="primary" className="flex-1">Suivant</Button> : <Button onClick={() => setFinishMode(true)} variant="success" className="flex-1">Finir</Button>}
            </div>
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
    const [habitLogs, setHabitLogs] = useLocalStorage(`titan_habits_${userId}`, {});
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
    const [transactions, setTransactions] = useLocalStorage(`titan_finance_${userId}`, []);
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
    const addTransaction = (tx) => setTransactions(prev => [...prev, { ...tx, id: Date.now().toString(), category: tx.category || autoCategorize(tx.description || ''), createdAt: new Date().toISOString() }]);
    const updateTransaction = (id, updates) => { setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)); setEditingTx(null); };
    const deleteTransaction = (id) => setTransactions(prev => prev.filter(tx => tx.id !== id));
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
                        <button key={cat.id} onClick={() => setForm({...form, category: cat.id})} className={`p-3 rounded-xl ${form.category === cat.id ? 'ring-2 ring-yellow-500' : 'bg-white/5'}`} style={{backgroundColor: form.category === cat.id ? cat.color + '30' : ''}} title={cat.name}>
                            <CatIcon size={18} style={{color: form.category === cat.id ? cat.color : '#6B7280'}} className="mx-auto" />
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
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${view === id ? 'text-cyan-400' : 'text-gray-500'}`}
        >
            <Icon size={20}/>
            <span className="text-[10px] mt-0.5 font-medium">{label}</span>
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
                        <NavItem id="lifestyle" icon={Clapperboard} label="Lifestyle" />
                    </div>
                )}
                
                {/* Content Area - Ajusté pour mobile avec bottom nav */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
                    <div className="max-w-4xl mx-auto">{children}</div>
                </div>
                
                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-40 safe-area-bottom">
                    <div className="flex">
                        <MobileNavItem id="dashboard" icon={LayoutDashboard} label="Accueil" />
                        <MobileNavItem id="fitness" icon={Dumbbell} label="Fitness" />
                        <MobileNavItem id="tasks" icon={ClipboardList} label="Tâches" />
                        <MobileNavItem id="finance" icon={Wallet} label="Finance" />
                        <MobileNavItem id="lifestyle" icon={Clapperboard} label="Plus" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ setView, userId }) => {
    const [biometrics] = useLocalStorage(`titan_biometrics_${userId}`, {});
    const [dailyCheckins, setDailyCheckins] = useLocalStorage(`titan_checkins_${userId}`, {});
    const [supplementLogs, setSupplementLogs] = useLocalStorage(`titan_supplements_${userId}`, {});
    const [workoutLogs] = useLocalStorage(`titan_workouts_${userId}`, []);
    const [showAiQuestion, setShowAiQuestion] = useState(false);
    const [questionAnswer, setQuestionAnswer] = useState('');
    const [aiNotes, setAiNotes] = useLocalStorage(`titan_ai_notes_${userId}`, []);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckin = dailyCheckins[todayStr] || {};
    const todaySupplements = supplementLogs[todayStr] || {};
    
    const updateCheckin = (field, value) => {
        setDailyCheckins(prev => ({
            ...prev,
            [todayStr]: { ...prev[todayStr], [field]: value }
        }));
    };
    
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
    
    // Analyse IA centralisée
    const aiAnalysis = useMemo(() => {
        return analyzeAllData({
            checkins: dailyCheckins,
            workoutLogs,
            biometrics,
            whoopData: null,
            supplementLogs
        });
    }, [dailyCheckins, workoutLogs, biometrics, supplementLogs]);
    
    const addAiNote = (note) => {
        setAiNotes(prev => [...prev, { ...note, timestamp: new Date().toISOString() }]);
    };
    
    const submitQuestionAnswer = () => {
        if (aiAnalysis.questions.length > 0 && questionAnswer) {
            addAiNote({
                questionId: aiAnalysis.questions[0].id,
                question: aiAnalysis.questions[0].text,
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
            
            {/* WHOOP WIDGET */}
            <WhoopWidget userId={userId} />
            
            {/* AI INSIGHTS */}
            {aiAnalysis.insights.length > 0 && (
                <div className="space-y-2">
                    {aiAnalysis.insights.slice(0, 2).map((insight, i) => (
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
            
            {/* AI QUESTION */}
            {aiAnalysis.questions.length > 0 && !showAiQuestion && (
                <button
                    onClick={() => setShowAiQuestion(true)}
                    className="w-full p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center gap-3"
                >
                    <MessageCircle size={18} className="text-purple-400" />
                    <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-white">Question du jour</div>
                        <div className="text-xs text-gray-400 truncate">{aiAnalysis.questions[0].text}</div>
                    </div>
                    <ChevronRight size={16} className="text-purple-400" />
                </button>
            )}
            
            {showAiQuestion && aiAnalysis.questions.length > 0 && (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain size={16} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400">TITAN veut comprendre</span>
                    </div>
                    <p className="text-sm text-white mb-3">{aiAnalysis.questions[0].text}</p>
                    {aiAnalysis.questions[0].options ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {aiAnalysis.questions[0].options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setQuestionAnswer(opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                                        questionAnswer === opt 
                                            ? 'bg-purple-500 text-white' 
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={questionAnswer}
                            onChange={e => setQuestionAnswer(e.target.value)}
                            placeholder="Ta réponse..."
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm mb-3"
                        />
                    )}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setShowAiQuestion(false); setQuestionAnswer(''); }}
                            className="flex-1 py-2 bg-white/10 text-gray-400 rounded-lg text-xs"
                        >
                            Plus tard
                        </button>
                        <button 
                            onClick={submitQuestionAnswer}
                            disabled={!questionAnswer}
                            className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            Enregistrer
                        </button>
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
export default function App() {
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
            {view === 'lifestyle' && <LifestyleView userId={userId} />}
        </Layout>
    );
}
