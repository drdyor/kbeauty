/**
 * Certified photo types for Glow Protocol
 */

export interface CaptureMetadata {
  deviceModel: string;
  deviceOS: string;
  sensorInfo?: string;
  serialNumber?: string;
  captureAngle: CaptureAngle;
  lightingScore: number; // 0-100
  alignmentScore: number; // 0-100
  resolution: { width: number; height: number };
}

/**
 * Capture angles for clinical photography.
 * Covers plastic surgery (face + body), aesthetic medicine, and dentistry.
 *
 * Based on standardized clinical photography series:
 * - Plastic surgery: 5-view (frontal, both profiles, both obliques) + specialty angles
 * - Rhinoplasty: adds basal (submental) + bird's eye + nasal close-ups
 * - Body: adds posterior + lateral body views
 * - Dentistry: extraoral (smile, retracted) + intraoral (occlusal, buccal)
 */
export type CaptureAngle =
  // ── Face: Standard 5-view series (used by ALL facial procedures) ──
  | "face_frontal"            // AP view, Frankfort plane horizontal
  | "face_left_profile"       // True 90° left (ear visible, no nostril)
  | "face_right_profile"      // True 90° right
  | "face_left_oblique"       // 45° left (both eyes visible, far ear hidden)
  | "face_right_oblique"      // 45° right

  // ── Face: Extended views (rhinoplasty, chin, neck procedures) ──
  | "face_basal"              // Submental vertex — looking up at nose/chin from below
  | "face_birds_eye"          // Superior view — looking down at nose bridge
  | "face_left_lateral_smile" // Profile with natural smile
  | "face_right_lateral_smile"
  | "face_frontal_smile"      // Frontal with natural smile (lip line assessment)
  | "face_frontal_animation"  // Frontal during expression (for Botox assessment)

  // ── Face: Close-ups ──
  | "face_nose_closeup"       // Nasal close-up frontal
  | "face_nose_basal_closeup" // Nasal close-up from below
  | "face_eyes_closeup"       // Periorbital close-up (blepharoplasty)
  | "face_lips_closeup"       // Lip close-up (filler assessment)
  | "face_ears_left"          // Ear close-up (otoplasty)
  | "face_ears_right"

  // ── Body: Standard views ──
  | "body_frontal"            // Full body or torso, frontal
  | "body_left_lateral"       // True 90° left
  | "body_right_lateral"      // True 90° right
  | "body_left_oblique"       // 45° left
  | "body_right_oblique"      // 45° right
  | "body_posterior"           // Back view

  // ── Dentistry: Extraoral ──
  | "dental_frontal_smile"       // Natural smile, lips relaxed
  | "dental_frontal_retracted"   // Retractors in, full dentition visible
  | "dental_left_lateral"        // Profile view for bite/occlusion
  | "dental_right_lateral"
  | "dental_frontal_rest"        // Lips at rest (lip line assessment)

  // ── Dentistry: Intraoral (with mirror/retractors) ──
  | "dental_occlusal_upper"      // Mirror shot, upper arch
  | "dental_occlusal_lower"      // Mirror shot, lower arch
  | "dental_buccal_left"         // Side bite, left
  | "dental_buccal_right"        // Side bite, right
  | "dental_anterior_closeup"    // Front teeth close-up
  | "dental_lingual"             // Behind teeth (tongue side)

  // ── Custom ──
  | "custom";

/**
 * Standard photo series by procedure category.
 * The app uses these to guide the physician through the required angles.
 */
export const PHOTO_SERIES: Record<string, { label: string; angles: CaptureAngle[] }> = {
  // Standard 5-view facial series (baseline for most face procedures)
  face_standard: {
    label: "Face — Standard 5-View",
    angles: [
      "face_frontal",
      "face_left_profile",
      "face_right_profile",
      "face_left_oblique",
      "face_right_oblique",
    ],
  },
  // Rhinoplasty: 5-view + basal + bird's eye + close-ups
  rhinoplasty: {
    label: "Rhinoplasty Series",
    angles: [
      "face_frontal",
      "face_left_profile",
      "face_right_profile",
      "face_left_oblique",
      "face_right_oblique",
      "face_basal",
      "face_birds_eye",
      "face_nose_closeup",
      "face_nose_basal_closeup",
    ],
  },
  // Blepharoplasty / periorbital
  blepharoplasty: {
    label: "Blepharoplasty Series",
    angles: [
      "face_frontal",
      "face_left_oblique",
      "face_right_oblique",
      "face_eyes_closeup",
    ],
  },
  // Facelift / neck lift
  facelift: {
    label: "Facelift / Neck Lift Series",
    angles: [
      "face_frontal",
      "face_left_profile",
      "face_right_profile",
      "face_left_oblique",
      "face_right_oblique",
      "face_basal",
    ],
  },
  // Lip filler
  lip_filler: {
    label: "Lip Filler Series",
    angles: [
      "face_frontal",
      "face_frontal_smile",
      "face_left_oblique",
      "face_right_oblique",
      "face_lips_closeup",
    ],
  },
  // Botox
  botox: {
    label: "Botox Series",
    angles: [
      "face_frontal",
      "face_frontal_animation",
      "face_left_oblique",
      "face_right_oblique",
    ],
  },
  // Body contouring (lipo, abdominoplasty, breast)
  body_contouring: {
    label: "Body Contouring Series",
    angles: [
      "body_frontal",
      "body_left_lateral",
      "body_right_lateral",
      "body_left_oblique",
      "body_right_oblique",
      "body_posterior",
    ],
  },
  // Dental: Aesthetic smile makeover
  dental_aesthetic: {
    label: "Dental Aesthetic Series",
    angles: [
      "dental_frontal_smile",
      "dental_frontal_retracted",
      "dental_frontal_rest",
      "dental_left_lateral",
      "dental_right_lateral",
      "face_frontal_smile",
      "face_left_lateral_smile",
      "face_right_lateral_smile",
    ],
  },
  // Dental: Orthodontic progress
  dental_ortho: {
    label: "Orthodontic Series",
    angles: [
      "dental_frontal_retracted",
      "dental_buccal_left",
      "dental_buccal_right",
      "dental_occlusal_upper",
      "dental_occlusal_lower",
      "face_frontal",
      "face_left_profile",
      "face_right_profile",
    ],
  },
  // Dental: Full documentation
  dental_full: {
    label: "Full Dental Documentation",
    angles: [
      "dental_frontal_smile",
      "dental_frontal_retracted",
      "dental_frontal_rest",
      "dental_left_lateral",
      "dental_right_lateral",
      "dental_occlusal_upper",
      "dental_occlusal_lower",
      "dental_buccal_left",
      "dental_buccal_right",
      "dental_anterior_closeup",
      "face_frontal",
      "face_frontal_smile",
      "face_left_profile",
      "face_right_profile",
    ],
  },
};

export interface HederaProof {
  transactionId: string;
  consensusTimestamp: string;
  topicId: string;
  sequenceNumber: number;
}

export interface WatermarkData {
  hash: string;
  clinicId: string;
  patientId: string;
  topicId: string;
  hederaSeq: number;
  timestamp: string;
}

export interface VerificationResult {
  status: "certified" | "modified" | "unknown";
  hash: string;
  hedera?: HederaProof;
  s3VersionId?: string;
  capturedAt?: string;
  clinicName?: string;
  message: string;
}

export interface CertifiedPhoto {
  id: string;
  clinicId: string;
  patientId: string;
  photographerId: string;

  // Cryptographic proof
  sha256Hash: string;
  hedera: HederaProof;
  s3Key: string;
  s3VersionId: string;

  // Capture info
  captureDevice: CaptureMetadata;
  captureAngle?: CaptureAngle;
  watermarkData?: WatermarkData;
  procedureType?: string;
  privacyApplied: boolean;

  createdAt: string;
}

export interface PhotoUploadRequest {
  imageData: string; // base64
  sha256Hash: string;
  patientId: string;
  captureDevice: CaptureMetadata;
  captureAngle?: CaptureAngle;
  procedureType?: string;
}

export interface PhotoUploadResponse {
  photoId: string;
  hederaTimestamp: string;
  s3VersionId: string;
  hedera: HederaProof;
}
