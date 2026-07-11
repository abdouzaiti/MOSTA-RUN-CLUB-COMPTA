import React, { useState, useEffect } from 'react';
import InscriptionsAndProfile from './components/InscriptionsAndProfile';
import OutingsPlanning from './components/OutingsPlanning';
import ReportsSummary from './components/ReportsSummary';
import ClubStats from './components/ClubStats';
import LoginScreen from './components/LoginScreen';
import CustomLists from './components/CustomLists';
import Sidebar from './components/Sidebar';
import UserProfileSettings from './components/UserProfileSettings';
import DashboardSocial from './components/DashboardSocial';
import MessageriePremium from './components/MessageriePremium';
import NotificationsPanel from './components/NotificationsPanel';
import AdminSupportChat from './components/AdminSupportChat';

import { Run, Runner, RunReport, RunnerFeedback, CustomList } from './types';
import { INITIAL_RUNNERS, INITIAL_RUNS, INITIAL_REPORTS } from './initialData';
import { isSupabaseConfigured, dbService } from './supabaseClient';
import { translations, Language } from './translations';
import {
  Sparkles, Activity, Clock, Award, ShieldAlert, CheckCircle, RefreshCw,
  Database, AlertTriangle, Terminal, Cpu, Info, Copy, Check, Globe,
  MessageSquare, Settings, HelpCircle, Compass, Calendar, Users, Bell, Camera,
  ArrowLeft, Headphones
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language | null>(() => {
    const saved = localStorage.getItem('mrc_language');
    return saved as Language || null;
  });

  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollTop = React.useRef(0);

  useEffect(() => {
    setShowBottomNav(true);
  }, [activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Check if we reached near the bottom (within 40px)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    
    if (scrollTop > lastScrollTop.current && scrollTop > 50) {
      // Scrolling down
      setShowBottomNav(false);
    } else if (scrollTop < lastScrollTop.current) {
      // Scrolling up
      setShowBottomNav(true);
    }
    
    lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
  };

  const [girlMode, setGirlMode] = useState<boolean>(() => {
    return localStorage.getItem('mrc_girl_mode') === 'true';
  });

  const handleSetGirlMode = (enabled: boolean) => {
    setGirlMode(enabled);
    localStorage.setItem('mrc_girl_mode', enabled ? 'true' : 'false');
  };

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

  const [customLists, setCustomLists] = useState<CustomList[]>(() => {
    const saved = localStorage.getItem('mrc_custom_lists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing custom lists:", e);
      }
    }
    // Default initial custom checklist
    return [
      {
        id: 'list-init-1',
        title: 'Cotisation Maillot 2026',
        description: 'Suivi de paiement et taille des maillots officiels du club pour la nouvelle saison.',
        createdAt: '22 Juin 2026',
        columns: [
          { id: 'col-paid', name: 'Payé (Cbn)', type: 'boolean' },
          { id: 'col-size', name: 'Taille Maillot', type: 'text' },
          { id: 'col-remise', name: 'Date de remise', type: 'text' }
        ],
        rows: [
          {
            runnerId: 'usr-1',
            runnerName: 'Abdou Zaiti',
            values: {
              'col-paid': true,
              'col-size': 'M',
              'col-remise': '20/06/2026'
            }
          }
        ]
      }
    ];
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
  const [isSupportChatOpen, setIsSupportChatOpen] = useState<boolean>(false);

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
        const [loadedRunners, loadedRuns, loadedReports, loadedCustomLists] = await Promise.all([
          dbService.getRunners(),
          dbService.getRuns(),
          dbService.getReports(),
          dbService.getCustomLists()
        ]);

        setRunners(loadedRunners);
        setRuns(loadedRuns);
        setReports(loadedReports);
        setCustomLists(loadedCustomLists.length > 0 ? loadedCustomLists : customLists);

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
    localStorage.setItem('mrc_custom_lists', JSON.stringify(customLists));
  }, [customLists]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mrc_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mrc_current_user');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSaveCustomList = async (updatedList: CustomList) => {
    setCustomLists(prev => {
      const idx = prev.findIndex(l => l.id === updatedList.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedList;
        return copy;
      } else {
        return [...prev, updatedList];
      }
    });

    if (isSupabaseConfigured) {
      try {
        await dbService.upsertCustomList(updatedList);
      } catch (err: any) {
        console.error("Error saving custom list to Supabase:", err);
      }
    }
  };

  const handleDeleteCustomList = async (listId: string) => {
    setCustomLists(prev => prev.filter(l => l.id !== listId));

    if (isSupabaseConfigured) {
      try {
        await dbService.deleteCustomList(listId);
      } catch (err: any) {
        console.error("Error deleting custom list from Supabase:", err);
      }
    }
  };

  const isAdminOrCoach = (user: Runner): boolean => {
    return user.runClubRole === 'Admin' || user.runClubRole === 'Coach';
  };

  // Handle run registration (S'inscrire / Se désinscrire)
  const handleToggleRegister = async (runId: string) => {
    if (!currentUser) return;
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    if (targeted.completed) {
      alert("Cette sortie est clôturée.");
      return;
    }

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
    if (!currentUser) return;
    
    // Normal users can only update their own details (and they can't change 'isPaid' or 'customPrice' unless we explicitly restricted it, but for simplicity we allow self-update and just restrict admin actions below).
    // Specifically, if not admin/coach, verify runnerId === currentUser.id
    if (!isAdminOrCoach(currentUser) && currentUser.id !== runnerId) {
      alert("Accès refusé : Vous ne pouvez modifier que vos propres informations.");
      return;
    }

    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    if (targeted.completed) {
      alert("Cette sortie est clôturée. Les modifications ne sont plus autorisées.");
      return;
    }

    const updatedParticipants = targeted.participants.map(p => {
      if (p.id === runnerId) {
        // Prevent normal users from altering financial states
        if (!isAdminOrCoach(currentUser)) {
          const safeUpdates = { ...updates };
          delete safeUpdates.isPaid;
          delete safeUpdates.customPrice;
          delete safeUpdates.roomNumber;
          return { ...p, ...safeUpdates };
        }
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

  const handleDeleteRun = async (runId: string) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent supprimer des sorties.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette sortie ?")) {
      setRuns(prev => prev.filter(r => r.id !== runId));
      if (isSupabaseConfigured) {
        try {
          await dbService.deleteRun(runId);
        } catch (err: any) {
          console.error("Error deleting run:", err);
        }
      }
    }
  };

  const handleCompleteRun = async (runId: string) => {
    if (!currentUser || !isAdminOrCoach(currentUser)) {
      alert("Accès refusé : Seuls les administrateurs et coachs peuvent clôturer des sorties.");
      return;
    }
    const targeted = runs.find(r => r.id === runId);
    if (!targeted) return;

    if (window.confirm("Confirmer la clôture de la sortie ? Plus personne ne pourra s'inscrire ou se désinscrire.")) {
      const updatedRun = { ...targeted, completed: true };
      setRuns(prev => prev.map(r => r.id === runId ? updatedRun : r));
      if (isSupabaseConfigured) {
        try {
          await dbService.upsertRun(updatedRun);
        } catch (err: any) {
          console.error("Error completing run in Supabase:", err);
        }
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

    if (targeted.completed) {
      alert("Cette sortie est clôturée. Les modifications ne sont plus autorisées.");
      return;
    }

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

    if (targeted.completed) {
      alert("Cette sortie est clôturée. Les modifications ne sont plus autorisées.");
      return;
    }

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
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table runners existe déjà d'une ancienne version, on lui rajoute les nouvelles colonnes :
ALTER TABLE runners ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE runners ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE runners ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;
ALTER TABLE runners ADD COLUMN IF NOT EXISTS avatar_url TEXT;

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

-- 4. Table des listes personnalisées (Custom Lists)
CREATE TABLE IF NOT EXISTS custom_lists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at_str TEXT NOT NULL,
  columns JSONB DEFAULT '[]'::jsonb,
  rows JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactivez l'accès restrictif par défaut temporairement pour l'édition publique (ou configurez vos règles RLS)
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Allow public write on reports" ON reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read on custom_lists" ON custom_lists;
DROP POLICY IF EXISTS "Allow public write on custom_lists" ON custom_lists;
CREATE POLICY "Allow public read on custom_lists" ON custom_lists FOR SELECT USING (true);
CREATE POLICY "Allow public write on custom_lists" ON custom_lists FOR ALL USING (true);

-- 5. Table des annonces (Announcements)
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  author_role TEXT NOT NULL,
  author_initials TEXT,
  time_fr TEXT NOT NULL,
  time_ar TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes INT DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activez l'accès en lecture/écriture publique temporaire
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on announcements" ON announcements;
DROP POLICY IF EXISTS "Allow public write on announcements" ON announcements;
CREATE POLICY "Allow public read on announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Allow public write on announcements" ON announcements FOR ALL USING (true);`;

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
      className={`min-h-screen text-natural-text font-sans selection:bg-natural-sage-light selection:text-natural-olive bg-white ${language === 'ar' ? 'font-arabic' : ''} ${girlMode ? 'girl-mode' : ''}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {!currentUser ? (
        <>
          {/* Global Loading state spinner for DB */}
          {isLoadingDb ? (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen flex items-center justify-center">
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
            </div>
          ) : (
            <LoginScreen
              runners={runners}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
              }}
              onUpdateRunner={handleUpdateCurrentUser}
              language={language}
              setLanguage={setLanguage}
              girlMode={girlMode}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F3F6FF] text-slate-800 overflow-hidden antialiased">
          {/* Main Floating Left Sidebar Nav */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onLogout={handleLogout}
            language={language}
            setLanguage={setLanguage}
            girlMode={girlMode}
            setGirlMode={handleSetGirlMode}
          />

          {/* Right Main Scrollable View Panel */}
          <div 
            onScroll={handleScroll}
            className={`flex-1 flex flex-col h-full relative ${
              activeTab === 'messagerie'
                ? 'overflow-hidden p-0' 
                : 'overflow-y-auto pt-4 pb-4 pr-4 pl-2 lg:pt-6 lg:pb-6 lg:pr-6 lg:pl-3 lg:no-scrollbar'
            }`}
          >
            
            {!isLoadingDb && currentUser && (
              <>
                {/* Main page views router */}
                <main className={`flex-1 flex flex-col w-full h-full ${
                  activeTab === 'messagerie' ? 'pb-16 lg:pb-0' :
                  'pb-24 lg:pb-6'
                }`}>
                  {/* TAB 0: DASHBOARD SOCIAL */}
                  {activeTab === 'dashboard' && (
                    <DashboardSocial
                      runners={runners}
                      runs={runs}
                      currentUser={currentUser}
                      onToggleRegister={handleToggleRegister}
                      setActiveTab={setActiveTab}
                      language={language || 'fr'}
                      onOpenSupportChat={() => {
                        setActiveTab('help');
                        setIsSupportChatOpen(true);
                      }}
                    />
                  )}

                  {/* TAB 1: PLANNING (Matches columns exact layout) */}
                  {activeTab === 'planning' && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      {/* Left: Main outings listings */}
                      <div className="xl:col-span-8">
                        <OutingsPlanning
                          runs={runs}
                          currentUser={currentUser}
                          onToggleRegister={handleToggleRegister}
                          onAddRun={handleAddRun}
                          onDeleteRun={handleDeleteRun}
                          onCompleteRun={handleCompleteRun}
                          onUpdateParticipant={handleUpdateParticipant}
                          runners={runners}
                          onAddParticipantByAdmin={handleAddParticipantByAdmin}
                          onRemoveParticipantByAdmin={handleRemoveParticipantByAdmin}
                          language={language}
                        />
                      </div>

                      {/* Right: Personal profile Emergency and statistics */}
                      <div className="xl:col-span-4 space-y-6">
                        <InscriptionsAndProfile
                          currentUser={currentUser}
                          setCurrentUser={handleUpdateCurrentUser}
                          runs={runs}
                          runners={runners}
                          language={language}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LISTS OF COMPLETED RUNS */}
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

                  {/* TAB 4: RUNNER DIRECTORY LISTING */}
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

                  {/* TAB 5: CUSTOM SPREADSHEET checklists */}
                  {activeTab === 'lists' && (
                    <div className="space-y-6">
                      <CustomLists
                        runners={runners}
                        currentUser={currentUser}
                        lists={customLists}
                        onSaveList={handleSaveCustomList}
                        onDeleteList={handleDeleteCustomList}
                        language={language}
                      />
                    </div>
                  )}

                  {/* TAB 6: MESSAGING WORKSPACE */}
                  {activeTab === 'messagerie' && (
                    <MessageriePremium
                      currentUser={currentUser}
                      runners={runners}
                      language={language || 'fr'}
                    />
                  )}

                  {/* TAB 6.5: NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <NotificationsPanel
                      currentUser={currentUser}
                      language={language || 'fr'}
                    />
                  )}

                  {/* TAB 7: SETTINGS WORKSPACE */}
                  {activeTab === 'settings' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Active profile & quick customization settings */}
                      <UserProfileSettings
                        currentUser={currentUser}
                        onUpdateCurrentUser={handleUpdateCurrentUser}
                        language={language || 'fr'}
                        setLanguage={setLanguage}
                        girlMode={girlMode}
                        setGirlMode={handleSetGirlMode}
                      />


                    </div>
                  )}

                  {/* TAB 8: HELP & EMERGENCY SUPPORT WORKSPACE */}
                  {activeTab === 'help' && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs space-y-6 animate-fade-in">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-black text-[#1034A6] font-serif italic">Aide, Support & Guides de Survie</h3>
                      </div>

                      {!isSupportChatOpen ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-xs">
                            {/* Emergency kit card details */}
                            <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                              <h4 className="font-bold text-xs text-rose-800 flex items-center gap-1.5 font-serif italic">
                                🚨 URGENCE : QUE FAIRE EN CAS D'INCIDENT ?
                              </h4>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                Durant les sorties du club Mosta Run, le respect de la chaîne de secours est primordial. Si un coureur se blesse :
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-[11.5px] text-slate-700">
                                <li>Sécurisez immédiatement le lieu et signalez l'arrêt à l'admin ou au coach de queue.</li>
                                <li>Identifiez la victime et le groupe sanguin mentionné sur sa fiche d'athlète (onglet Roster/Membres!).</li>
                                <li>Contactez le numéro d'urgence disponible sur sa fiche personnelle.</li>
                              </ol>
                            </div>

                            {/* Survival guidelines rules */}
                            <div className="p-5 bg-blue-50/40 border border-blue-100/30 rounded-2xl space-y-2">
                              <h4 className="font-bold text-xs text-blue-800 flex items-center gap-1.5 font-serif italic">
                                🎒 VESTIAIRE ET MAILLOTS OFFICIELS
                              </h4>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                Nous courons aux couleurs de la wilaya de Mostaganem. Le port du maillot de course bleu roi ou blanc oficialisé par MRC est exigé.
                              </p>
                              <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-700">
                                <li>Tours de ville : Maillot officiel exigé.</li>
                                <li>Trails Hors Wilaya (Ex: Alger, Oran) : Maillot officiel exigé.</li>
                                <li>Hydratation : Emportez au moins 1.5L d'eau pour toute sortie dépassant 15 KMs.</li>
                              </ul>
                            </div>
                          </div>

                          {/* Beautiful Interactive Support Chat Trigger Card */}
                          <div className="bg-gradient-to-br from-[#1034A6] via-[#1E56A0] to-[#2F89FC] text-white p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative z-10 space-y-3.5 flex-1 max-w-xl">
                              <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase backdrop-blur-xs w-fit">
                                <Headphones className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                <span>{language === 'ar' ? 'مساعدة فورية' : 'Support Live MRC'}</span>
                              </div>
                              <h4 className="text-lg sm:text-xl font-serif italic font-black leading-tight">
                                {language === 'ar' ? 'هل لديك أي سؤال أو واجهتك مشكلة؟' : "Besoin d'aide technique ou de conseils sur le Club ?"}
                              </h4>
                              <p className="text-white/85 text-[11px] sm:text-xs leading-relaxed font-medium">
                                {language === 'ar' 
                                  ? 'تواصل مباشرة مع الكابتن عبدو الزايتي وطاقم المشرفين لحل مشاكلك في الحساب، العضوية، أو الاستفسار عن التجهيزات.'
                                  : "Démarrez une session d'assistance privée avec le Captain Abdou Zaiti. Signalez un bug, posez vos questions sur les cotisations, maillots ou sorties."
                                }
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-white/35"></span>
                                <span className="text-[10px] text-white/90 font-mono font-bold">
                                  {language === 'ar' ? 'المدير عبدو الزايتي متصل حالياً' : "Abdou Zaiti (Fondateur) est disponible en ligne"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsSupportChatOpen(true)}
                              className="relative z-10 px-6 py-3.5 bg-white text-[#1034A6] hover:bg-slate-50 active:scale-[0.98] transition font-black text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
                            >
                              <MessageSquare className="w-4 h-4 shrink-0" />
                              <span>{language === 'ar' ? 'بدء محادثة الدعم' : 'Démarrer le Chat de Secours'}</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          {/* Back to Guides Trigger */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setIsSupportChatOpen(false)}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1034A6] transition bg-slate-50 hover:bg-blue-50 border border-slate-150 rounded-xl px-4 py-2 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'رجوع إلى دليل المساعدة' : 'Retour aux Guides'}</span>
                            </button>
                            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                              🎟️ Ticket ID: SUPPORT-{currentUser.id.toUpperCase()}
                            </span>
                          </div>

                          {/* Admin support live tchat window */}
                          <AdminSupportChat 
                            currentUser={currentUser} 
                            runners={runners} 
                            language={language || 'fr'} 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </main>
              </>
            )}

          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-3 py-2 flex items-center justify-around bg-white/95 border-slate-100/90 transition-all duration-300 ${
            showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                activeTab === 'planning' ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{language === 'ar' ? 'الخرجات' : 'Sorties'}</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                activeTab === 'roster' ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{language === 'ar' ? 'النادي' : 'Club'}</span>
            </button>
            <button
              onClick={() => setActiveTab('messagerie')}
              className={`flex flex-col items-center gap-1 p-2 transition-all relative cursor-pointer ${
                activeTab === 'messagerie' ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{language === 'ar' ? 'الرسائل' : 'Tchat'}</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                activeTab === 'settings' ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-tight">{language === 'ar' ? 'الملف' : 'Profil'}</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
