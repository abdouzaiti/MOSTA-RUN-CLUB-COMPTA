import { Run, RunReport } from './types';

export const INITIAL_RUNNERS = [
  { 
    id: 'usr-1', 
    name: 'Abdou Zaiti', 
    phone: '0555123456', 
    email: 'zaitiabdou27@gmail.com', 
    username: 'abdou_z',
    bloodType: 'O+', 
    runClubRole: 'Admin' as const,
    password: 'Abdou Zaiti',
    passwordChanged: true
  }
];

export const INITIAL_RUNS: Run[] = [];

export const INITIAL_REPORTS: RunReport[] = [];

