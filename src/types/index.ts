export interface SkinProfile {
  id: string;
  timestamp: Date;
  score: number;
  concerns: string[];
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  image?: string;
  notes: string[];
}

export interface RoutineStep {
  id: string;
  title: string;
  description: string;
  time: 'morning' | 'evening';
  glowState: 'optimal' | 'recovering' | 'overloaded';
  product?: {
    name: string;
    description: string;
  };
}

export interface GlowMilestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  date?: Date;
}

export interface DailyCheckIn {
  date: Date;
  mood: 'happy' | 'neutral' | 'sad';
  notes: string;
  weather?: string;
  sleep?: number;
  stress?: number;
}

// ---- App Navigation ----
export type AppTab = 'mirror' | 'journal' | 'verify' | 'profile';

// ---- Skin Journal (daily checks without procedure) ----
export type SkinConcernTag =
  | 'dryness' | 'oiliness' | 'redness' | 'acne'
  | 'texture' | 'dark-spots' | 'puffiness' | 'fine-lines'
  | 'dullness' | 'sensitivity';

export type MoodValue = 'great' | 'good' | 'okay' | 'meh' | 'bad';

export const MOOD_EMOJI: Record<MoodValue, string> = {
  great: '✨',
  good: '😊',
  okay: '😐',
  meh: '😕',
  bad: '😞',
};

export const CONCERN_LABELS: Record<SkinConcernTag, string> = {
  dryness: 'Dryness',
  oiliness: 'Oiliness',
  redness: 'Redness',
  acne: 'Acne',
  texture: 'Texture',
  'dark-spots': 'Dark Spots',
  puffiness: 'Puffiness',
  'fine-lines': 'Fine Lines',
  dullness: 'Dullness',
  sensitivity: 'Sensitivity',
};

export interface SkinJournalEntry {
  id: string;
  photo: string;
  photoProtected?: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for calendar grouping
  mood?: MoodValue;
  concerns: SkinConcernTag[];
  notes?: string;
  lightingQuality?: number; // 0-100
  verified: boolean;
}

// ---- Before/After Comparison ----
export interface ComparisonPair {
  beforeId: string;
  afterId: string;
  beforePhoto: string;
  afterPhoto: string;
  beforeDate: string;
  afterDate: string;
  daysBetween: number;
}

// ---- Skin Zones ----
export type SkinZone = 'forehead' | 'left-cheek' | 'right-cheek' | 'nose' | 'chin';

// ---- User Profile ----
export interface UserProfile {
  name: string;
  skinType: SkinProfile['skinType'];
}