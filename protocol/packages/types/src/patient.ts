/**
 * Patient types for Glow Protocol
 */

export interface Patient {
  id: string;
  clinicId: string;
  encryptedName: string;
  encryptedDob?: string;
  consentSigned?: string; // ISO timestamp
  createdAt: string;
}

export interface PatientCreateRequest {
  name: string; // will be encrypted before storage
  dateOfBirth?: string;
}

export interface Consent {
  patientId: string;
  signedAt: string;
  signatureData: string; // base64 signature image
  consentText: string;
  witnessName?: string;
}

/**
 * Procedure types across aesthetic medicine and dentistry.
 */
export type ProcedureType =
  // Aesthetic medicine
  | "botox"
  | "filler"
  | "rhinoplasty"
  | "blepharoplasty"
  | "facelift"
  | "laser"
  | "chemical_peel"
  | "microneedling"
  | "prp"
  | "hydrafacial"
  | "breast_augmentation"
  | "liposuction"
  | "abdominoplasty"
  // Aesthetic dentistry
  | "veneers"
  | "teeth_whitening"
  | "dental_bonding"
  | "dental_crowns"
  | "dental_implants"
  | "gum_contouring"
  | "smile_makeover"
  // Orthodontics
  | "invisalign"
  | "braces_metal"
  | "braces_ceramic"
  | "braces_lingual"
  | "retainer"
  // General dental
  | "dental_restoration"
  | "root_canal"
  | "extraction"
  | "dental_bridge"
  | "dentures"
  | "other";

/**
 * Clinical specialty — determines which capture angles and grid overlays to show.
 */
export type ClinicalSpecialty =
  | "aesthetic_medicine"
  | "aesthetic_dentistry"
  | "orthodontics"
  | "general_dentistry";

export interface Procedure {
  id: string;
  patientId: string;
  type: ProcedureType;
  customType?: string;
  datePerformed: string;
  provider: string;
  clinic: string;
  notes?: string;
  photoIds: string[];
  createdAt: string;
}

export interface ShareToken {
  id: string;
  photoId: string;
  patientId: string;
  token: string;
  expiresAt?: string;
  accessedCount: number;
  createdAt: string;
}

export interface LegalReport {
  photoId: string;
  sha256Hash: string;
  hederaProof: {
    transactionId: string;
    consensusTimestamp: string;
    topicId: string;
    sequenceNumber: number;
  };
  s3VersionId: string;
  captureDevice: string;
  capturedAt: string;
  clinicName: string;
  qrCodeUrl: string;
  generatedAt: string;
}
