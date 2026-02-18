/**
 * Clinic types for Glow Protocol
 */

export type SubscriptionTier = "basic" | "enterprise";

export type Country =
  | "US"
  | "DE"
  | "GB"
  | "JP"
  | "AU"
  | "FR"
  | "KR"
  | "BR"
  | "CA";

/**
 * Retention years by country regulation
 */
export const RETENTION_BY_COUNTRY: Record<Country, number> = {
  US: 7, // HIPAA + state boards
  DE: 10, // BGB §195
  GB: 8, // NHS + Limitation Act
  JP: 10, // Medical Care Act (conservative)
  AU: 7, // AHPRA guidelines
  FR: 10, // Code de la santé publique
  KR: 5, // Medical Service Act
  BR: 20, // CFM Resolution
  CA: 10, // Provincial colleges
};

/**
 * Clinic specialty determines which capture angles, grid overlays,
 * and procedure types are available in the physician app.
 */
export type ClinicSpecialty =
  | "aesthetic_medicine"
  | "aesthetic_dentistry"
  | "orthodontics"
  | "general_dentistry"
  | "multi_specialty";

export interface Clinic {
  id: string;
  name: string;
  country: Country;
  specialty: ClinicSpecialty;
  retentionYears: number;
  subscription: SubscriptionTier;
  hederaTopicId: string;
  createdAt: string;
}

export interface ClinicRegistration {
  name: string;
  country: Country;
  specialty: ClinicSpecialty;
  adminEmail: string;
  adminName: string;
}

export interface ClinicStaff {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  role: "admin" | "physician" | "dentist" | "orthodontist" | "nurse" | "hygienist" | "technician";
  canCapture: boolean;
  canPlaceHold: boolean;
  createdAt: string;
}
