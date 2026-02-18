export type ProcedureType =
  | 'botox'
  | 'laser'
  | 'chemical-peel'
  | 'microneedling'
  | 'filler'
  | 'prp'
  | 'hydrafacial'
  | 'other';

export type PrivacyMode = 'auto-blur' | 'manual' | 'none';

export interface BlurSettings {
  blurEyes: boolean;
  blurHair: boolean;
  blurBackground: boolean;
  blurStrength: number; // 0-100
}

export interface Procedure {
  id: string;
  type: ProcedureType;
  customType?: string;
  datePerformed: string;
  provider?: string;
  clinic?: string;
  notes?: string;
  createdAt: string;
}

export interface PrivacySettings {
  mode: PrivacyMode;
  blur: BlurSettings;
  // Detected face landmarks for applying blur
  faceLandmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    jawline: { x: number; y: number }[];
  };
  // Manual focus area (treatment zone to keep clear)
  focusArea?: { x: number; y: number; width: number; height: number };
}

export type ComplicationSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface AfterCareLog {
  followedInstructions: boolean;
  instructionsNotes?: string;
  productsUsed?: string[];
  activitiesAvoided?: string[];
}

export interface VerificationData {
  hash: string; // SHA-256 hash of original photo
  captureMethod: 'in-app' | 'upload-test'; // in-app = verified, upload = test only
  deviceInfo?: string;
  timestamp: string; // ISO string
  timezone: string;
  // Hedera blockchain notarization
  hedera?: {
    transactionId: string;
    consensusTimestamp: string;
    topicId: string;
    topicSequenceNumber: number;
  };
}

export interface ProgressEntry {
  id: string;
  procedureId: string;
  photoOriginal: string; // base64 - original unmodified
  photoProtected: string; // base64 - with privacy applied
  privacySettings: PrivacySettings;
  timestamp: string;
  daysSinceProcedure: number;
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  verified: boolean; // true if captured in-app (not uploaded)

  // Legal documentation fields
  verification?: VerificationData;
  afterCare?: AfterCareLog;
  complication?: {
    severity: ComplicationSeverity;
    description?: string;
    reportedToProvider: boolean;
  };
}

export interface ProcedureWithProgress {
  procedure: Procedure;
  entries: ProgressEntry[];
  latestEntry?: ProgressEntry;
}

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  'botox': 'Botox / Dysport',
  'laser': 'Laser Treatment',
  'chemical-peel': 'Chemical Peel',
  'microneedling': 'Microneedling',
  'filler': 'Dermal Filler',
  'prp': 'PRP / Vampire Facial',
  'hydrafacial': 'HydraFacial',
  'other': 'Other'
};

export const PROCEDURE_ICONS: Record<ProcedureType, string> = {
  'botox': '💉',
  'laser': '✨',
  'chemical-peel': '🧪',
  'microneedling': '📍',
  'filler': '💋',
  'prp': '🩸',
  'hydrafacial': '💧',
  'other': '🏥'
};
