import { createClient } from '@supabase/supabase-js';
import { Runner, Run, RunReport } from './types';

// Read Supabase credentials from client-side environment variables
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Safely instantiate Supabase client if keys are present
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * SQL SCHEMA QUERY
 * 
 * Copiez-collez ce script SQL dans l'onglet "SQL Editor" de votre tableau de bord Supabase :
 * 
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Activez l'accès en lecture/écriture publique temporaire (ou configurez vos règles RLS)
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
CREATE POLICY "Allow public write on reports" ON reports FOR ALL USING (true);
 */

// Helper to handle conversion from snake_case database schema to camelCase front-end TypeScript interfaces
function mapRunnerFromDb(dbItem: any): Runner {
  return {
    id: dbItem.id,
    name: dbItem.name,
    phone: dbItem.phone,
    email: dbItem.email,
    username: dbItem.username || undefined,
    bloodType: dbItem.blood_type,
    runClubRole: dbItem.run_club_role,
    password: dbItem.password || undefined,
    passwordChanged: dbItem.password_changed !== undefined ? Boolean(dbItem.password_changed) : undefined
  };
}

function mapRunnerToDb(item: Runner): any {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    username: item.username || null,
    blood_type: item.bloodType,
    run_club_role: item.runClubRole,
    password: item.password || null,
    password_changed: item.passwordChanged ?? false
  };
}

function mapRunFromDb(dbItem: any): Run {
  return {
    id: dbItem.id,
    title: dbItem.title,
    date: dbItem.date,
    time: dbItem.time,
    distance: Number(dbItem.distance),
    elevationGain: dbItem.elevation_gain ? Number(dbItem.elevation_gain) : undefined,
    pace: dbItem.pace,
    difficulty: dbItem.difficulty as any,
    startPoint: dbItem.start_point,
    description: dbItem.description,
    maxParticipants: dbItem.max_participants ? Number(dbItem.max_participants) : undefined,
    participants: Array.isArray(dbItem.participants) ? dbItem.participants : [],
    completed: Boolean(dbItem.completed),
    isOrWilaya: dbItem.is_or_wilaya !== undefined ? Boolean(dbItem.is_or_wilaya) : undefined,
    destinationWilaya: dbItem.destination_wilaya || undefined,
    transportPrice: dbItem.transport_price ? Number(dbItem.transport_price) : undefined,
    accommodationPrice: dbItem.accommodation_price ? Number(dbItem.accommodation_price) : undefined
  };
}

function mapRunToDb(item: Run): any {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    time: item.time,
    distance: item.distance,
    elevation_gain: item.elevationGain,
    pace: item.pace,
    difficulty: item.difficulty,
    start_point: item.startPoint,
    description: item.description,
    max_participants: item.maxParticipants,
    participants: item.participants,
    completed: item.completed,
    is_or_wilaya: item.isOrWilaya,
    destination_wilaya: item.destinationWilaya,
    transport_price: item.transportPrice,
    accommodation_price: item.accommodationPrice
  };
}

function mapReportFromDb(dbItem: any): RunReport {
  return {
    id: dbItem.id,
    runId: dbItem.run_id,
    title: dbItem.title,
    date: dbItem.date,
    totalDistanceKm: Number(dbItem.total_distance_km),
    participantsCount: Number(dbItem.participants_count),
    averagePace: dbItem.average_pace,
    tempCelsius: dbItem.temp_celsius ? Number(dbItem.temp_celsius) : undefined,
    highlights: dbItem.highlights,
    routeMapDescription: dbItem.route_map_description,
    galleryUrls: Array.isArray(dbItem.gallery_urls) ? dbItem.gallery_urls : [],
    feedback: Array.isArray(dbItem.feedback) ? dbItem.feedback : []
  };
}

function mapReportToDb(item: RunReport): any {
  return {
    id: item.id,
    run_id: item.runId,
    title: item.title,
    date: item.date,
    total_distance_km: item.totalDistanceKm,
    participants_count: item.participantsCount,
    average_pace: item.averagePace,
    temp_celsius: item.tempCelsius,
    highlights: item.highlights,
    route_map_description: item.routeMapDescription,
    gallery_urls: item.galleryUrls,
    feedback: item.feedback
  };
}

export const dbService = {
  // --- RUNNERS ---
  async getRunners(): Promise<Runner[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching runners:', error.message);
        throw error;
      }
      return (data || []).map(mapRunnerFromDb);
    } catch (e) {
      console.error('Db service getRunners failed:', e);
      throw e;
    }
  },

  async upsertRunner(runner: Runner): Promise<void> {
    if (!supabase) return;
    const dbRunner = mapRunnerToDb(runner);
    const { error } = await supabase
      .from('runners')
      .upsert(dbRunner);

    if (error) {
      console.error('Error upserting runner:', error.message);
      throw error;
    }
  },

  async deleteRunner(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('runners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting runner:', error.message);
      throw error;
    }
  },

  // --- RUNS ---
  async getRuns(): Promise<Run[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching runs:', error.message);
        throw error;
      }
      return (data || []).map(mapRunFromDb);
    } catch (e) {
      console.error('Db service getRuns failed:', e);
      throw e;
    }
  },

  async upsertRun(run: Run): Promise<void> {
    if (!supabase) return;
    const dbRun = mapRunToDb(run);
    const { error } = await supabase
      .from('runs')
      .upsert(dbRun);

    if (error) {
      console.error('Error upserting run:', error.message);
      throw error;
    }
  },

  async deleteRun(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting run:', error.message);
      throw error;
    }
  },

  // --- REPORTS ---
  async getReports(): Promise<RunReport[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error.message);
        throw error;
      }
      return (data || []).map(mapReportFromDb);
    } catch (e) {
      console.error('Db service getReports failed:', e);
      throw e;
    }
  },

  async upsertReport(report: RunReport): Promise<void> {
    if (!supabase) return;
    const dbReport = mapReportToDb(report);
    const { error } = await supabase
      .from('reports')
      .upsert(dbReport);

    if (error) {
      console.error('Error upserting report:', error.message);
      throw error;
    }
  },

  async deleteReport(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting report:', error.message);
      throw error;
    }
  }
};
