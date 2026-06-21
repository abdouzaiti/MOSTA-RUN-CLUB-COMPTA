import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InscriptionsAndProfile from './components/InscriptionsAndProfile';
import OutingsPlanning from './components/OutingsPlanning';
import ReportsSummary from './components/ReportsSummary';
import ClubStats from './components/ClubStats';
import LoginScreen from './components/LoginScreen';

import { Run, Runner, RunReport, RunnerFeedback } from './types';
import { INITIAL_RUNNERS, INITIAL_RUNS, INITIAL_REPORTS } from './initialData';
import { isSupabaseConfigured, dbService } from './supabaseClient';
import { translations, Language } from './translations';
import {
  Sparkles, Activity, Clock, Award, ShieldAlert, CheckCircle, RefreshCw,
  Database, AlertTriangle, Terminal, Cpu, Info, Copy, Check, Globe
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('planning');
  const [language, setLanguage] = useState<Language | null>(() => {
    const saved = localStorage.getItem('mrc_language');
    return saved as Language || null;
  });

  const t = (key: string) => {
    if (!language) return key;
    return (translations[language] as any)[key] || (translations['fr'] as any)[key] || key;
  };

  // Load from localStorage or initial configuration
  const [runners, setRunners] = useState<Runner[]>(() => {
    const saved = localStorage.getItem('mrc_runners');
    return saved ? JSON.parse(saved) : INITIAL_RUNNERS;
  });

  const [runs, setRuns] = useState<Run[]>(() => {
    const saved = localStorage.getItem('mrc_runs');
    return saved ? JSON.parse(saved) : INITIAL_RUNS;
  });

  const [reports, setReports] = useState<RunReport[]>(() => {
    const saved = localStorage.getItem('mrc_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [currentUser, setCurrentUser] = useState<Runner | null>(() => {
    const saved = localStorage.getItem('mrc_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // DB Sync Status States
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(isSupabaseConfigured);
  useEffect(() => {
    if (language) {
      localStorage.setItem('mrc_language', language);
      document.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
  };
  const [dbError, setDbError] = useState<string | null>(null);
  const [showSqlSetup, setShowSqlSetup] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Load asynchronously from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingDb(false);
      return;
    }

    async function loadSupabaseData() {
      try {
        setIsLoadingDb(true);
        setDbError(null);

        // Fetch everything in parallel
        const [loadedRunners, loadedRuns, loadedReports] = await Promise.all([
          dbService.getRunners(),
          dbService.getRuns(),
          dbService.getReports()
        ]);

        setRunners(loadedRunners);
        setRuns(loadedRuns);
        setReports(loadedReports);

        // Synchronize Active/Logged User Profile
        if (loadedRunners.length > 0) {
          const savedUser = localStorage.getItem('mrc_current_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              const matched = loadedRunners.find(r => r.id === parsed.id);
              if (matched) {
                setCurrentUser(matched);
              } else {
                setCurrentUser(null);
              }
            } catch {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          // Empty DB? Let's seed Abdou as the default owner
          const defaultAdmin: Runner = {
            id: 'usr-1',
            name: 'Abdou Zaiti',
            phone: '0555123456',
            email: 'zaitiabdou27@gmail.com',
            username: 'abdou_z',
            bloodType: 'O+',
            runClubRole: 'Admin',
            password: 'Abdou Zaiti',
            passwordChanged: true
          };
          await dbService.upsertRunner(defaultAdmin);
          setRunners([defaultAdmin]);
          setCurrentUser(null);
        }
      } catch (err: any) {
        console.error("Supabase load error:", err);
        setDbError(err.message || String(err));
      } finally {
        setIsLoadingDb(false);
      }
    }

    loadSupabaseData();
  }, []);

  // Offline Sync Backup to localstorage
  useEffect(() => {
    localStorage.setItem('mrc_runners', JSON.stringify(runners));
  }, [runners]);

  useEffect(() => {
    localStorage.setItem('mrc_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('mrc_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mrc_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mrc_current_user');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('planning');
  };

  const isAdminOrCoach = (user: Runner): boolean => {
    return user.runClubRole === 'Admin' || user.runClubRole === 'Coach';
  };

  // Handle run registration (S'inscrire / Se désinscrire)
  const handleToggleRegister = async (runId: string) => {
    if (!currentUser) return;
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    const isRegistered = targeted.participants.some(p => p.id === currentUser.id);
    let updatedParticipants: Runner[];

    if (isRegistered) {
      updatedParticipants = targeted.participants.filter(p => p.id !== currentUser.id);
    } else {
      updatedParticipants = [...targeted.participants, currentUser];
    }

    const updatedRun = { ...targeted, participants: updatedParticipants };

    // Update state locally (responsive feedback)
    setRuns(prev => prev.map(r => r.id === runId ? updatedRun : r));

    // Save to Supabase if linked
    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRun(updatedRun);
      } catch (err: any) {
        console.error("Error toggling run registration on Supabase:", err);
        alert("Erreur de sauvegarde: " + err.message);
      }
    }
  };

  // Update specific participant properties (bib assignment, transport, lodging)
  const handleUpdateParticipant = async (runId: string, runnerId: string, updates: any) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent modifier les informations des participants.");
      return;
    }
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    const updatedParticipants = targeted.participants.map(p => {
      if (p.id === runnerId) {
        return { ...p, ...updates };
      }
      return p;
    });

    const updatedRun = { ...targeted, participants: updatedParticipants };

    setRuns(prev => prev.map(r => r.id === runId ? updatedRun : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRun(updatedRun);
      } catch (err: any) {
        console.error("Error saving participant options in Supabase:", err);
      }
    }
  };

  // Handle adding new runs proposed by admins
  const handleAddRun = async (newRunData: Omit<Run, 'participants' | 'completed'>) => {
    if (!currentUser) return;
    const freshRun: Run = {
      ...newRunData,
      participants: [currentUser], // Register current planner by default
      completed: false
    };

    setRuns(prev => [freshRun, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRun(freshRun);
      } catch (err: any) {
        console.error("Error creating run in Supabase:", err);
        alert("Erreur de création: " + err.message);
      }
    }
  };

  // Add athlete participant directly as administrator/coach
  const handleAddParticipantByAdmin = async (runId: string, runner: Runner) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent ajouter des participants.");
      return;
    }
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    const isAlready = targeted.participants.some(p => p.id === runner.id);
    if (isAlready) return;

    const newParticipant = {
      ...runner,
      useTransport: true,       // Default to auto transport
      useAccommodation: false,  // Default to false lodging
      isPaid: false
    };

    const updatedParticipants = [...targeted.participants, newParticipant];
    const updatedRun = { ...targeted, participants: updatedParticipants };

    setRuns(prev => prev.map(r => r.id === runId ? updatedRun : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRun(updatedRun);
      } catch (err: any) {
        console.error("Error adding participant by admin in Supabase:", err);
      }
    }
  };

  // Unregister athlete participant directly as administrator/coach
  const handleRemoveParticipantByAdmin = async (runId: string, runnerId: string) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent supprimer des participants.");
      return;
    }
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    const updatedParticipants = targeted.participants.filter(p => p.id !== runnerId);
    const updatedRun = { ...targeted, participants: updatedParticipants };

    setRuns(prev => prev.map(r => r.id === runId ? updatedRun : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRun(updatedRun);
      } catch (err: any) {
        console.error("Error removing participant by admin in Supabase:", err);
      }
    }
  };

  // Handle adding comments & feedback to report articles
  const handleAddFeedback = async (
    reportId: string,
    newFeedback: Omit<RunnerFeedback, 'id' | 'dateStr' | 'avatarColor'>
  ) => {
    const colors = ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500', 'bg-blue-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const feedbackWithMeta: RunnerFeedback = {
      id: 'fb-' + Date.now(),
      runnerName: newFeedback.runnerName,
      text: newFeedback.text,
      rating: newFeedback.rating,
      avatarColor: randomColor,
      dateStr: new Date().toISOString().split('T')[0]
    };

    const targeted = reports.find(r => r.id === reportId);
    if (!targeted) return;

    const updatedReport: RunReport = {
      ...targeted,
      feedback: [feedbackWithMeta, ...targeted.feedback],
      participantsCount: targeted.participantsCount + 1
    };

    setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertReport(updatedReport);
      } catch (err: any) {
        console.error("Error rendering feedback on Supabase:", err);
        alert("Erreur d'envoi du feedback: " + err.message);
      }
    }
  };

  // Handle profile current athlete license saving
  const handleUpdateCurrentUser = async (updatedUser: Runner) => {
    setCurrentUser(updatedUser);
    setRunners(prev => prev.map(r => r.id === updatedUser.id ? updatedUser : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRunner(updatedUser);
      } catch (err: any) {
        console.error("Error saving profile to Supabase:", err);
      }
    }
  };

  // Handle adding a runner/athlete to the club roster
  const handleAddRunner = async (newRunner: Runner) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent ajouter des athlètes.");
      return;
    }
    setRunners(prev => [...prev, newRunner]);

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRunner(newRunner);
      } catch (err: any) {
        console.error("Error adding runner to Supabase:", err);
        alert("Erreur de roster: " + err.message);
      }
    }
  };

  // Handle suspending a runner
  const handleDeleteRunner = async (id: string) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent supprimer des athlètes.");
      return;
    }
    setRunners(prev => prev.filter(r => r.id !== id));

    if (isSupabaseConfigured) {
      try {
        await dbService.deleteRunner(id);
      } catch (err: any) {
        console.error("Error deleting runner from Supabase:", err);
        alert("Erreur de suppression: " + err.message);
      }
    }
  };

  // Handle updating runner information (Admin/Coach)
  const handleUpdateRunner = async (updatedRunner: Runner) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent modifier les informations des athlètes.");
      return;
    }
    setRunners(prev => prev.map(r => r.id === updatedRunner.id ? updatedRunner : r));

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertRunner(updatedRunner);
      } catch (err: any) {
        console.error("Error updating runner in Supabase:", err);
        alert("Erreur de mise à jour: " + err.message);
      }
    }
    
    // If we updated the currently logged in user, sync that state too
    if (currentUser?.id === updatedRunner.id) {
      setCurrentUser(updatedRunner);
    }
  };

  // Vider les données (Remove mock info for real inputs, requested by user)
  const handleClearDemoData = () => {
    const confirmMsg = isSupabaseConfigured
      ? "Voulez-vous vraiment vider toutes les tables dans Supabase pour commencer à blanc ?"
      : "Voulez-vous vraiment retirer toutes les données de simulation pour saisir vos vraies données du club ?";

    if (window.confirm(confirmMsg)) {
      // Clear local states
      const clearedRunners: Runner[] = [{
        id: 'usr-1',
        name: currentUser.name || 'Abdou Zaiti',
        phone: currentUser.phone || '0555123456',
        email: currentUser.email || 'zaitiabdou27@gmail.com',
        bloodType: currentUser.bloodType || 'O+',
        runClubRole: 'Admin'
      }];

      setRunners(clearedRunners);
      setRuns([]);
      setReports([]);
      setCurrentUser(clearedRunners[0]);

      // If Supabase is active, clean DB recursively or instruct
      if (isSupabaseConfigured) {
        alert("Supabase est connecté ! Vous pouvez maintenant introduire directement de réels membres, runs et rapports depuis l'interface.");
      }
    }
  };

  // Reset ALL app data back to simulation presets
  const handleResetToSimulationDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser l\'application avec les données de simulation d\'origine ?')) {
      localStorage.removeItem('mrc_runners');
      localStorage.removeItem('mrc_runs');
      localStorage.removeItem('mrc_reports');
      localStorage.removeItem('mrc_current_user');

      setRunners(INITIAL_RUNNERS);
      setRuns(INITIAL_RUNS);
      setReports(INITIAL_REPORTS);
      setCurrentUser(INITIAL_RUNNERS[0]);
      setDbError(null);
    }
  };

  const sqlQueryText = `-- SQL SCRIPT FOR SUPABASE SQL EDITOR
-- Copiez-collez ce script pour créer vos tables en 1 clic :

-- 1. Table des coureurs (Athlètes)
CREATE TABLE IF NOT EXISTS runners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  blood_type TEXT,
  run_club_role TEXT DEFAULT 'Membre',
  password TEXT,
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table runners existe déjà d'une ancienne version, on lui rajoute les nouvelles colonnes :
ALTER TABLE runners ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE runners ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE runners ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- 2. Table des sorties (Runs)
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  distance NUMERIC NOT NULL,
  elevation_gain NUMERIC,
  pace TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  start_point TEXT NOT NULL,
  description TEXT NOT NULL,
  max_participants INT,
  participants JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  is_or_wilaya BOOLEAN DEFAULT FALSE,
  destination_wilaya TEXT,
  transport_price NUMERIC DEFAULT 0,
  accommodation_price NUMERIC DEFAULT 0,
  price_room1 NUMERIC DEFAULT 0,
  price_room2 NUMERIC DEFAULT 0,
  price_room3 NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table runs existe déjà d'une ancienne version, on lui rajoute les nouvelles colonnes :
ALTER TABLE runs ADD COLUMN IF NOT EXISTS is_or_wilaya BOOLEAN DEFAULT FALSE;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS destination_wilaya TEXT;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS transport_price NUMERIC DEFAULT 0;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS accommodation_price NUMERIC DEFAULT 0;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS price_room1 NUMERIC DEFAULT 0;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS price_room2 NUMERIC DEFAULT 0;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS price_room3 NUMERIC DEFAULT 0;

-- 3. Table des rapports de course (Reports mlih)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  total_distance_km NUMERIC NOT NULL,
  participants_count INT NOT NULL,
  average_pace TEXT NOT NULL,
  temp_celsius INT,
  highlights TEXT NOT NULL,
  route_map_description TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  feedback JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactivez l'accès restrictif par défaut temporairement pour l'édition publique (ou configurez vos règles RLS)
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent déjà pour éviter les erreurs
DROP POLICY IF EXISTS "Allow public read on runners" ON runners;
DROP POLICY IF EXISTS "Allow public write on runners" ON runners;
CREATE POLICY "Allow public read on runners" ON runners FOR SELECT USING (true);
CREATE POLICY "Allow public write on runners" ON runners FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read on runs" ON runs;
DROP POLICY IF EXISTS "Allow public write on runs" ON runs;
CREATE POLICY "Allow public read on runs" ON runs FOR SELECT USING (true);
CREATE POLICY "Allow public write on runs" ON runs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read on reports" ON reports;
DROP POLICY IF EXISTS "Allow public write on reports" ON reports;
CREATE POLICY "Allow public read on reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow public write on reports" ON reports FOR ALL USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlQueryText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  if (!language) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6 bg-white"
      >
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-natural-border overflow-hidden animate-fade-in relative z-10">
          <div className="bg-natural-olive p-10 text-center relative overflow-hidden">
            <Globe className="absolute -right-6 -top-6 w-32 h-32 text-white/10" />
            <Sparkles className="absolute -left-4 -bottom-4 w-20 h-20 text-white/5" />
            <div className="relative z-10">
              <h1 className="text-3xl font-serif italic font-black text-white">MOSTA RUN CLUB</h1>
              <p className="text-natural-accent text-sm font-bold tracking-[0.2em] mt-1 uppercase">Choose your language</p>
            </div>
          </div>
          
          <div className="p-8 space-y-4">
            <button 
              onClick={() => handleSelectLanguage('ar')}
              className="w-full group flex items-center justify-between p-5 rounded-2xl bg-natural-bone hover:bg-natural-olive transition-all duration-300 border border-natural-border hover:border-natural-olive cursor-pointer"
            >
              <span className="text-xl font-bold text-natural-text group-hover:text-white transition-colors">العربية</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-natural-olive group-hover:bg-natural-accent group-hover:text-white transition-all transform group-hover:scale-110">AR</span>
            </button>

            <button 
              onClick={() => handleSelectLanguage('fr')}
              className="w-full group flex items-center justify-between p-5 rounded-2xl bg-natural-bone hover:bg-natural-olive transition-all duration-300 border border-natural-border hover:border-natural-olive cursor-pointer"
            >
              <span className="text-xl font-bold text-natural-text group-hover:text-white transition-colors">Français</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-natural-olive group-hover:bg-natural-accent group-hover:text-white transition-all transform group-hover:scale-110">FR</span>
            </button>

            <button 
              onClick={() => handleSelectLanguage('en')}
              className="w-full group flex items-center justify-between p-5 rounded-2xl bg-natural-bone hover:bg-natural-olive transition-all duration-300 border border-natural-border hover:border-natural-olive cursor-pointer"
            >
              <span className="text-xl font-bold text-natural-text group-hover:text-white transition-colors">English</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-natural-olive group-hover:bg-natural-accent group-hover:text-white transition-all transform group-hover:scale-110">EN</span>
            </button>
          </div>

          <div className="px-8 pb-8 text-center border-t border-natural-divider pt-4">
            <p className="text-natural-sage text-[10px] uppercase font-bold tracking-[0.1em]">© 2026 Mostaganem Run Club • Bahr & Sahara</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen text-natural-text font-sans selection:bg-natural-sage-light selection:text-natural-olive bg-white ${language === 'ar' ? 'font-arabic' : ''}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Database setup SQL assistance Accordion */}
        {showSqlSetup && (
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 space-y-3 animate-fade-in shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="text-natural-accent w-5 h-5" />
                <span className="font-mono text-xs font-bold text-natural-accent">Configurateur SQL Universel</span>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold transition cursor-pointer"
              >
                {sqlCopied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier le Script
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Pour initialiser les tables automatiquement dans votre compte Supabase, ouvrez votre projet, allez sur l'onglet <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">SQL Editor</strong>, cliquez sur <strong className="text-white">New Query</strong>, collez le script ci-dessous, puis cliquez sur <strong className="text-emerald-400">Run</strong> :
            </p>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-[160px] border border-slate-800/60 leading-normal">
              {sqlQueryText}
            </pre>
          </div>
        )}

        {/* Database Setup Error Notice */}
        {dbError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Erreur d'initialisation de la base de données
                </h4>
                <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                  La connexion Supabase a échoué car les tables nécessaires ne sont probablement pas encore générées dans votre espace. ({dbError})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <button
                onClick={() => setShowSqlSetup(true)}
                className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold font-mono text-[10px] rounded-lg px-3 py-1.5 transition cursor-pointer border border-rose-300"
              >
                👉 Afficher le script de création SQL
              </button>
              <button
                onClick={() => {
                  setDbError(null);
                  setIsLoadingDb(false);
                }}
                className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Ignorer et passer en mode local
              </button>
            </div>
          </div>
        )}

        {/* Global Loading state spinner for DB */}
        {isLoadingDb && (
          <div className="p-16 text-center bg-white rounded-3xl border border-natural-border shadow-xs flex flex-col items-center justify-center space-y-4">
            <Cpu className="w-10 h-10 text-natural-olive animate-spin" />
            <div className={language === 'ar' ? 'font-arabic' : ''}>
              <p className="text-sm font-bold text-natural-olive font-serif italic">
                {language === 'ar' ? 'جاري مزامنة قاعدة البيانات...' : 'Synchronisation Supabase en cours...'}
              </p>
              <p className="text-xs text-natural-sage mt-1">
                {language === 'ar' ? 'استرجاع قائمة العداءين والبرنامج المخطط له.' : 'Récupération sécurisée du roster de course et des planifications réelles.'}
              </p>
            </div>
          </div>
        )}

        {!isLoadingDb && !currentUser && (
          <LoginScreen
            runners={runners}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
            }}
            onUpdateRunner={handleUpdateCurrentUser}
            language={language}
            setLanguage={setLanguage}
          />
        )}

        {!isLoadingDb && currentUser && (
          <>
            {/* Navigation & Header summary */}
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              runs={runs}
              currentUser={currentUser}
              onLogout={handleLogout}
              language={language}
            />

            {/* Dynamic Inner Layout Router */}
            <main className="min-h-[500px]">
              {activeTab === 'planning' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Main outings list (2/3 width) */}
                  <div className="lg:col-span-2">
                    <OutingsPlanning
                      runs={runs}
                      currentUser={currentUser}
                      onToggleRegister={handleToggleRegister}
                      onAddRun={handleAddRun}
                      onUpdateParticipant={handleUpdateParticipant}
                      runners={runners}
                      onAddParticipantByAdmin={handleAddParticipantByAdmin}
                      onRemoveParticipantByAdmin={handleRemoveParticipantByAdmin}
                      language={language}
                    />
                  </div>

                  {/* Sidebar profile and loyalty license card (1/3 width) */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-natural-olive uppercase tracking-widest font-mono mb-2">
                        {language === 'ar' ? 'ملفي الشخصي' : language === 'en' ? 'My Profile' : 'Mon Profil'}
                      </h3>
                      <InscriptionsAndProfile
                        currentUser={currentUser}
                        setCurrentUser={handleUpdateCurrentUser}
                        runs={runs}
                        language={language}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <ReportsSummary
                    reports={reports}
                    runs={runs}
                    currentUser={currentUser}
                    onAddFeedback={handleAddFeedback}
                    language={language}
                  />
                </div>
              )}

              {activeTab === 'roster' && (
                <div className="space-y-6">
                  <ClubStats
                    runners={runners}
                    currentUser={currentUser}
                    onAddRunner={handleAddRunner}
                    onDeleteRunner={handleDeleteRunner}
                    onUpdateRunner={handleUpdateRunner}
                    language={language}
                  />
                </div>
              )}
            </main>
          </>
        )}

        {/* Humble system credits */}
      </div>
    </div>
  );
}
