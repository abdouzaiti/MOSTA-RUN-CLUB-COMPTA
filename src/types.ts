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
}

export interface RunParticipant extends Runner {
  bibNumber?: string;          // Numéro de dossard tawa3hom
  useTransport?: boolean;      // Transport ma3na (Oui / Non)
  useAccommodation?: boolean;  // Lmbata / Hébergement  (Oui / Non)
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
  accommodationPrice?: number;   // Prix de lmbata en DA
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
