export type DifficultyLevel = 'Facile' | 'Moyen' | 'Difficile';

export interface Runner {
  id: string;
  name: string;
  phone: string;
  email: string;
  username?: string;            // Identifiant de connexion unique (ex. abdou_z)
  bloodType?: string;
  runClubRole?: 'Membre' | 'Coach' | 'Admin';
  password?: string;            // Le mot de passe (Initialement identique au Nom de l'athlète ou username)
  passwordChanged?: boolean;    // Flag pour forcer la mise à jour au premier login
  avatarUrl?: string;           // Photo de profil ou avatar URL choisi
}

export interface RunParticipant extends Runner {
  bibNumber?: string;          // Numéro de dossard tawa3hom
  useTransport?: boolean;      // Transport ma3na (Oui / Non)
  useAccommodation?: boolean;  // Lmbata / Hébergement  (Oui / Non)
  accommodationType?: 'room1' | 'room2' | 'room3'; // Type de chambre (Chambre pour 1, 2, 3)
  roomNumber?: string;         // Numéro de chambre ou groupement (ex: "Chambre 27", "A1")
  isPaid?: boolean;            // Versement / payé (Oui / Non)
  customPrice?: number;        // Prix ajusté manuellement (Algerian DA)
}

export interface Run {
  id: string;
  title: string;
  date: string;
  time: string;
  distance: number; // in km
  elevationGain?: number; // in meters
  pace: string; // e.g., "5:30 min/km"
  difficulty: DifficultyLevel;
  startPoint: string;
  description: string;
  maxParticipants?: number;
  participants: RunParticipant[];
  completed: boolean;
  
  // Spécifications de sorties Hors Wilaya (Kharjat Or Wilaya)
  isOrWilaya?: boolean;
  destinationWilaya?: string;
  transportPrice?: number;       // Prix de transport en DA
  accommodationPrice?: number;   // Prix de lmbata standard en DA
  priceRoom1?: number;           // Chambre pour 1 pers (DA)
  priceRoom2?: number;           // Chambre pour 2 pers (DA)
  priceRoom3?: number;           // Chambre pour 3 pers (DA)
}

export interface RunnerFeedback {
  id: string;
  runnerName: string;
  text: string;
  rating: number; // 1 to 5 stars
  avatarColor: string;
  dateStr: string;
}

export interface RunReport {
  id: string;
  runId: string;
  title: string;
  date: string;
  totalDistanceKm: number; // collective or average
  participantsCount: number;
  averagePace: string;
  tempCelsius?: number;
  highlights: string;
  routeMapDescription?: string;
  galleryUrls: string[];
  feedback: RunnerFeedback[];
}

export interface CustomColumn {
  id: string;
  name: string;
  type: 'boolean' | 'text'; // 'boolean' for "cbn ou nn" checkmarks, 'text' for editable comments/notes
}

export interface CustomRow {
  runnerId: string;
  runnerName: string;
  values: { [columnId: string]: any };
}

export interface CustomList {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  columns: CustomColumn[];
  rows: CustomRow[];
}

export interface AnnouncementComment {
  author: string;
  text: string;
}

export interface Announcement {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole: string;
  authorInitials: string;
  timeFr: string;
  timeAr: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[]; // List of runner IDs who liked the post
  comments: AnnouncementComment[];
  createdAt?: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  receiverId: string;
  text: string;
  timestamp: string; // ISO String
  read?: boolean;
}

