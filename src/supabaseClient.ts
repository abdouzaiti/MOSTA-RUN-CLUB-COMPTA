import { createClient } from '@supabase/supabase-js';
import { Runner, Run, RunReport, CustomList, Announcement, SupportMessage } from './types';

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
  avatar_url TEXT,
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

-- Activez l'accès en lecture/écriture publique temporaire (ou configurez vos règles RLS)
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
CREATE POLICY "Allow public write on announcements" ON announcements FOR ALL USING (true);

-- 6. Table des messages de support (Support)
CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  sender_name TEXT,
  sender_avatar TEXT,
  reactions JSONB DEFAULT '{}',
  type TEXT DEFAULT 'text',
  media_url TEXT,
  duration TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table des messages du Chat Premium (Global/Canaux)
CREATE TABLE IF NOT EXISTS mrc_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT DEFAULT 'Membre',
  avatar_url TEXT,
  text TEXT,
  time TEXT,
  type TEXT DEFAULT 'text',
  media_url TEXT,
  file_size TEXT,
  duration TEXT,
  reply_to JSONB,
  reactions JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mrc_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on mrc_messages" ON mrc_messages;
DROP POLICY IF EXISTS "Allow public write on mrc_messages" ON mrc_messages;
CREATE POLICY "Allow public read on mrc_messages" ON mrc_messages FOR SELECT USING (true);
CREATE POLICY "Allow public write on mrc_messages" ON mrc_messages FOR ALL USING (true);
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
    passwordChanged: dbItem.password_changed !== undefined ? Boolean(dbItem.password_changed) : undefined,
    avatarUrl: dbItem.avatar_url || undefined
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
    password_changed: item.passwordChanged ?? false,
    avatar_url: item.avatarUrl || null
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
    accommodationPrice: dbItem.accommodation_price ? Number(dbItem.accommodation_price) : undefined,
    priceRoom1: dbItem.price_room1 ? Number(dbItem.price_room1) : undefined,
    priceRoom2: dbItem.price_room2 ? Number(dbItem.price_room2) : undefined,
    priceRoom3: dbItem.price_room3 ? Number(dbItem.price_room3) : undefined
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
    accommodation_price: item.accommodationPrice,
    price_room1: item.priceRoom1,
    price_room2: item.priceRoom2,
    price_room3: item.priceRoom3
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

function mapCustomListFromDb(dbItem: any): CustomList {
  return {
    id: dbItem.id,
    title: dbItem.title,
    description: dbItem.description || undefined,
    createdAt: dbItem.created_at_str || '',
    columns: Array.isArray(dbItem.columns) ? dbItem.columns : [],
    rows: Array.isArray(dbItem.rows) ? dbItem.rows : []
  };
}

function mapCustomListToDb(item: CustomList): any {
  return {
    id: item.id,
    title: item.title,
    description: item.description || null,
    created_at_str: item.createdAt,
    columns: item.columns,
    rows: item.rows
  };
}

function mapAnnouncementFromDb(dbItem: any): Announcement {
  return {
    id: dbItem.id,
    authorName: dbItem.author_name,
    authorAvatarUrl: dbItem.author_avatar_url || undefined,
    authorRole: dbItem.author_role,
    authorInitials: dbItem.author_initials,
    timeFr: dbItem.time_fr,
    timeAr: dbItem.time_ar,
    content: dbItem.content,
    imageUrl: dbItem.image_url || undefined,
    likes: Number(dbItem.likes || 0),
    likedBy: Array.isArray(dbItem.liked_by) ? dbItem.liked_by : [],
    comments: Array.isArray(dbItem.comments) ? dbItem.comments : [],
    createdAt: dbItem.created_at
  };
}

function mapAnnouncementToDb(item: Announcement): any {
  return {
    id: item.id,
    author_name: item.authorName,
    author_avatar_url: item.authorAvatarUrl || null,
    author_role: item.authorRole,
    author_initials: item.authorInitials,
    time_fr: item.timeFr,
    time_ar: item.timeAr,
    content: item.content,
    image_url: item.imageUrl || null,
    likes: item.likes,
    liked_by: item.likedBy,
    comments: item.comments
  };
}

function mapSupportMessageFromDb(dbItem: any): SupportMessage {
  const msg = {
    id: dbItem.id,
    senderId: dbItem.sender_id,
    senderName: dbItem.sender_name || 'Runner',
    senderAvatar: dbItem.sender_avatar || null,
    receiverId: dbItem.receiver_id,
    text: dbItem.text,
    timestamp: dbItem.timestamp,
    read: Boolean(dbItem.read),
    reactions: dbItem.reactions || {}
  };
  
  // Add optional fields
  if (dbItem.type) (msg as any).type = dbItem.type;
  if (dbItem.media_url) (msg as any).mediaUrl = dbItem.media_url;
  if (dbItem.duration) (msg as any).duration = dbItem.duration;
  if (dbItem.file_size) (msg as any).fileSize = dbItem.file_size;
  
  return msg;
}

function mapSupportMessageToDb(item: SupportMessage): any {
  const dbItem = {
    id: item.id,
    sender_id: item.senderId,
    sender_name: item.senderName,
    sender_avatar: item.senderAvatar || null,
    receiver_id: item.receiverId,
    text: item.text,
    timestamp: item.timestamp,
    read: item.read ?? false,
    reactions: item.reactions || {}
  };

  // Add optional fields
  if ((item as any).type) (dbItem as any).type = (item as any).type;
  if ((item as any).mediaUrl) (dbItem as any).media_url = (item as any).mediaUrl;
  if ((item as any).duration) (dbItem as any).duration = (item as any).duration;
  if ((item as any).fileSize) (dbItem as any).file_size = (item as any).fileSize;

  return dbItem;
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
  },

  // --- CUSTOM LISTS ---
  async getCustomLists(): Promise<CustomList[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('custom_lists')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching custom lists:', error.message);
        throw error;
      }
      return (data || []).map(mapCustomListFromDb);
    } catch (e) {
      console.error('Db service getCustomLists failed:', e);
      throw e;
    }
  },

  async upsertCustomList(list: CustomList): Promise<void> {
    if (!supabase) return;
    const dbList = mapCustomListToDb(list);
    const { error } = await supabase
      .from('custom_lists')
      .upsert(dbList);

    if (error) {
      console.error('Error upserting custom list:', error.message);
      throw error;
    }
  },

  async deleteCustomList(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('custom_lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting custom list:', error.message);
      throw error;
    }
  },

  // --- ANNOUNCEMENTS (POSTS) ---
  async getAnnouncements(): Promise<Announcement[] | null> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If the table doesn't exist, return null to signify a missing table
        if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          console.warn("Table 'announcements' does not exist in Supabase yet. This is normal. Use the SQL Editor inside Admin settings to create it.");
          return null;
        }
        console.error('Error fetching announcements:', error.message);
        throw error;
      }
      return (data || []).map(mapAnnouncementFromDb);
    } catch (e: any) {
      console.warn('Db service getAnnouncements failed or table does not exist yet:', e?.message || e);
      return null; // Return null so the UI fallback knows NOT to write/seed
    }
  },

  async upsertAnnouncement(announcement: Announcement): Promise<void> {
    if (!supabase) return;
    try {
      const dbAnnouncement = mapAnnouncementToDb(announcement);
      const { error } = await supabase
        .from('announcements')
        .upsert(dbAnnouncement);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          console.warn("Table 'announcements' does not exist. Cannot upsert announcement.");
          return;
        }
        console.error('Error upserting announcement:', error.message);
        throw error;
      }
    } catch (e: any) {
      console.warn('Upsert announcement failed, table likely missing:', e?.message || e);
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          console.warn("Table 'announcements' does not exist. Cannot delete announcement.");
          return;
        }
        console.error('Error deleting announcement:', error.message);
        throw error;
      }
    } catch (e: any) {
      console.warn('Delete announcement failed, table likely missing:', e?.message || e);
    }
  },

  // --- SUPPORT MESSAGES ---
  async getSupportMessages(): Promise<SupportMessage[]> {
    if (!supabase) return [];
    try {
      // Limit to last 100 messages to avoid timeout with large base64 videos
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          console.warn("Table 'support_messages' does not exist.");
          return [];
        }
        console.error('Error fetching support messages:', error.message);
        throw error;
      }
      
      // Reverse to get chronological order back
      const msgs = (data || []).map(mapSupportMessageFromDb);
      return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (e) {
      console.error('Db service getSupportMessages failed:', e);
      return [];
    }
  },

  async sendSupportMessage(message: SupportMessage): Promise<void> {
    if (!supabase) return;
    const dbMsg = mapSupportMessageToDb(message);
    const { error } = await supabase
      .from('support_messages')
      .insert(dbMsg);

    if (error) {
      console.error('Error sending support message:', error.message);
      throw error;
    }
  },

  async markSupportMessageAsRead(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('support_messages')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking support message as read:', error.message);
      throw error;
    }
  },

  async updateSupportMessageReactions(id: string, reactions: { [key: string]: string[] }): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('support_messages')
      .update({ reactions })
      .eq('id', id);

    if (error) {
      console.error('Error updating support message reactions:', error.message);
      throw error;
    }
  },

  async deleteSupportMessage(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('support_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting support message:', error.message);
      throw error;
    }
  }
};
