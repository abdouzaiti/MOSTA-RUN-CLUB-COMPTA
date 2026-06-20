export type DifficultyLevel = 'Facile' | 'Moyen' | 'Difficile';

export interface Runner {
  id: string;
  name: string;
  phone: string;
  email: string;
  bloodType?: string;
  runClubRole?: 'Membre' | 'Coach' | 'Admin';
}

export interface RunParticipant extends Runner {
  bibNumber?: string;          // Numéro de dossard tawa3hom
  useTransport?: boolean;      // Transport ma3na (Oui / Non)
  useAccommodation?: boolean;  // Lmbata / Hébergement  (Oui / Non)
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
