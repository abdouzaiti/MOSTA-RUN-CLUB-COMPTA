import { Run, RunReport } from './types';

export const INITIAL_RUNNERS = [
  { id: 'usr-1', name: 'Abdou Zaiti', phone: '0555123456', email: 'zaitiabdou27@gmail.com', bloodType: 'O+', runClubRole: 'Admin' as const },
  { id: 'usr-2', name: 'Sid Ahmed', phone: '0661987654', email: 'sidahmed.m@gmail.com', bloodType: 'A+', runClubRole: 'Coach' as const },
  { id: 'usr-3', name: 'Meriem Benali', phone: '0770456789', email: 'meriem.run@gmail.com', bloodType: 'B+', runClubRole: 'Membre' as const },
  { id: 'usr-4', name: 'Amine Mosta', phone: '0552334455', email: 'amine.mosta@gmail.com', bloodType: 'AB+', runClubRole: 'Membre' as const },
  { id: 'usr-5', name: 'Yasmine Driss', phone: '0663778899', email: 'yasmine.d@gmail.com', bloodType: 'O-', runClubRole: 'Membre' as const },
  { id: 'usr-6', name: 'Sofiane El Wahran', phone: '0551221144', email: 'sofiane@gmail.com', bloodType: 'A-', runClubRole: 'Membre' as const }
];

export const INITIAL_RUNS: Run[] = [
  {
    id: 'run-1',
    title: 'Footing Matinal de la Salamandre',
    date: '2026-06-21',
    time: '06:00',
    distance: 10,
    elevationGain: 45,
    pace: '5:45 min/km',
    difficulty: 'Facile',
    startPoint: 'Port de de Plaisance de la Salamandre (Près des cafés)',
    description: 'Une sortie plate et agréable le long de la corniche jusqu\'aux Sablettes. Allure d\'échauffement, idéale pour démarrer le weekend du bon pied en profitant du lever de soleil sur la mer.',
    maxParticipants: 40,
    participants: [
      INITIAL_RUNNERS[1], // Sid Ahmed
      INITIAL_RUNNERS[2], // Meriem
      INITIAL_RUNNERS[4], // Yasmine
    ],
    completed: false
  },
  {
    id: 'run-2',
    title: 'Trail Technique Falaises de Kharouba',
    date: '2026-06-25',
    time: '18:15',
    distance: 12.5,
    elevationGain: 280,
    pace: '6:15 min/km',
    difficulty: 'Difficile',
    startPoint: 'Rond-point du Phare de Kharouba',
    description: 'Une sortie trail technique avec des dénivelés sur les sentiers côtiers de Kharouba. On monte vers le plateau pour redescendre vers des criques. Chaussures de trail recommandées !',
    maxParticipants: 20,
    participants: [
      INITIAL_RUNNERS[0], // Abdou (the user)
      INITIAL_RUNNERS[1], // Sid Ahmed
      INITIAL_RUNNERS[3], // Amine
      INITIAL_RUNNERS[5], // Sofiane
    ],
    completed: false
  },
  {
    id: 'run-3',
    title: 'Intervalles & VMA - Piste Sayada',
    date: '2026-06-28',
    time: '19:00',
    distance: 8,
    elevationGain: 10,
    pace: 'Allure spécifique VMA',
    difficulty: 'Moyen',
    startPoint: 'Ancien Aérodrome de Sayada',
    description: 'Séance fractionnée dirigée par Coach Sid Ahmed. Au programme : 2x (10x 30/30) pour travailler sa vitesse de pointe et son endurance cardiovasculaire.',
    maxParticipants: 30,
    participants: [
      INITIAL_RUNNERS[0],
      INITIAL_RUNNERS[1],
      INITIAL_RUNNERS[2],
      INITIAL_RUNNERS[3],
      INITIAL_RUNNERS[4],
    ],
    completed: false
  },
  // Inactive / Completed runs (for reports)
  {
    id: 'run-completed-1',
    title: 'Sortie Semi-Marathon d\'Ouréah',
    date: '2026-06-12',
    time: '05:30',
    distance: 21.1,
    elevationGain: 120,
    pace: '5:30 min/km',
    difficulty: 'Difficile',
    startPoint: 'Forêt de Ouréah (Entrée principale)',
    description: 'Sortie longue de préparation pour le semi-marathon. Traversée de la forêt de pins de Ouréah et retour par la route côtière sous une belle brise.',
    maxParticipants: 50,
    participants: [
      INITIAL_RUNNERS[0],
      INITIAL_RUNNERS[1],
      INITIAL_RUNNERS[2],
      INITIAL_RUNNERS[3],
      INITIAL_RUNNERS[4],
      INITIAL_RUNNERS[5]
    ],
    completed: true
  },
  {
    id: 'run-completed-2',
    title: 'Running Solidaire Aïd El-Fitr / Tobana',
    date: '2026-05-30',
    time: '07:00',
    distance: 6.5,
    elevationGain: 150,
    pace: '6:30 min/km',
    difficulty: 'Moyen',
    startPoint: 'Place de l\'Horloge (Centre-ville Mostaganem)',
    description: 'Course conviviale à travers les ruelles historiques du quartier de Tobana et El Arrsa. Des montées de marches amusantes et une superbe photo de groupe à la fin.',
    maxParticipants: 100,
    participants: [
      INITIAL_RUNNERS[0],
      INITIAL_RUNNERS[1],
      INITIAL_RUNNERS[2],
      INITIAL_RUNNERS[3],
      INITIAL_RUNNERS[4],
    ],
    completed: true
  }
];

export const INITIAL_REPORTS: RunReport[] = [
  {
    id: 'rep-1',
    runId: 'run-completed-1',
    title: 'Le Défi Vert de l\'Ouréah : 21km de Pure Énergie',
    date: '2026-06-12',
    totalDistanceKm: 21.1,
    participantsCount: 22,
    averagePace: '5:38 min/km',
    tempCelsius: 19,
    highlights: 'Un franc succès pour ce run de préparation ! Malgré les chemins meubles et sablonneux dans la forêt de Ouréah, la forme était au rendez-vous. Nous avons terminé la sortie avec des dattes et de l\'eau fraîche offertes par les organisateurs. Félicitations spéciales à Meriem qui a couru sa plus longue distance à ce jour !',
    routeMapDescription: 'Forêt de Ouréah ➔ Boucle de la Dune blanche ➔ Autoroute côtière ➔ Entrée Ouréah.',
    galleryUrls: [
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80'
    ],
    feedback: [
      {
        id: 'fb-1',
        runnerName: 'Abdou Zaiti',
        text: 'Une ambiance incroyable ! Courir sous l\'ombre des pins à Ouréah d\'abord puis finir face à la mer, c\'est magique. Merci pour les dattes !',
        rating: 5,
        avatarColor: 'bg-emerald-500',
        dateStr: '2026-06-12'
      },
      {
        id: 'fb-2',
        runnerName: 'Meriem Benali',
        text: 'Trop fière de mes premiers 21km ! Merci infiniment au Coach Sid Ahmed d\'avoir calé l\'allure et m\'avoir encouragée dans les 3 derniers kilomètres.',
        rating: 5,
        avatarColor: 'bg-indigo-500',
        dateStr: '2026-06-12'
      },
      {
        id: 'fb-3',
        runnerName: 'Amine Mosta',
        text: 'Superbe tracé, l\'organisation était impeccable. À refaire absolument le mois prochain !',
        rating: 4,
        avatarColor: 'bg-amber-500',
        dateStr: '2026-06-13'
      }
    ]
  },
  {
    id: 'rep-2',
    runId: 'run-completed-2',
    title: 'À travers l\'Histoire : Le Run de Tobana & Centre-ville',
    date: '2026-05-30',
    totalDistanceKm: 6.5,
    participantsCount: 45,
    averagePace: '6:42 min/km',
    tempCelsius: 24,
    highlights: 'Une course inoubliable ! Le passage par les escaliers abrupts du quartier historique de Tobana a fait chauffer les cuisses, mais quel plaisir de voir les habitants nous applaudir et encourager. On a fini par une session d\'étirements géante sur la Place de l\'Horloge et un bon thé à la menthe traditionnel.',
    routeMapDescription: 'Place de l\'Horloge - Tobana - Quartier El-Arsa - Boulevard de la Soummam - Retour Place de l\'Horloge.',
    galleryUrls: [
      'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80'
    ],
    feedback: [
      {
        id: 'fb-4',
        runnerName: 'Sid Ahmed',
        text: 'Excellent travail de tout le monde sur les escaliers. C\'est l\'esprit originel du club, sport et patrimoine réunis !',
        rating: 5,
        avatarColor: 'bg-teal-500',
        dateStr: '2026-05-30'
      },
      {
        id: 'fb-5',
        runnerName: 'Yasmine Driss',
        text: 'Un peu difficile avec la chaleur et les marches, mais l\'accueil chaleureux des habitants de Tobana nous a donné des ailes ! Le thé à la fin était parfait.',
        rating: 5,
        avatarColor: 'bg-rose-500',
        dateStr: '2026-05-30'
      }
    ]
  }
];
