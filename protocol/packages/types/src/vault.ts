/**
 * Evidence vault types for Glow Protocol
 */

export interface VaultEntry {
  photoId: string;
  s3Key: string;
  s3VersionId: string;
  sha256Hash: string;
  retentionExpiresAt: string;
  litigationHold: boolean;
  createdAt: string;
}

export type HoldStatus = "active" | "released";

export interface LitigationHold {
  id: string;
  clinicId: string;
  patientId: string;
  caseReference: string;
  holdStart: string;
  holdEnd?: string; // null = indefinite
  placedBy: string;
  status: HoldStatus;
  createdAt: string;
}

export interface LitigationHoldRequest {
  patientId: string;
  caseReference: string;
}

export interface LitigationHoldRelease {
  holdId: string;
  releasedBy: string;
  authorizedBy: string; // dual authorization
  reason: string;
}

export type RetentionRule = {
  country: string;
  retentionYears: number;
  legalBasis: string;
  notes?: string;
};

export const RETENTION_RULES: RetentionRule[] = [
  {
    country: "US",
    retentionYears: 7,
    legalBasis: "HIPAA + state medical boards",
    notes: "Minors: until age 21 + 7 years",
  },
  {
    country: "DE",
    retentionYears: 10,
    legalBasis: "BGB §195",
  },
  {
    country: "GB",
    retentionYears: 8,
    legalBasis: "NHS + Limitation Act 1980",
    notes: "Minors: until age 25",
  },
  {
    country: "JP",
    retentionYears: 10,
    legalBasis: "Medical Care Act",
  },
  {
    country: "AU",
    retentionYears: 7,
    legalBasis: "AHPRA guidelines",
  },
  {
    country: "FR",
    retentionYears: 10,
    legalBasis: "Code de la santé publique",
    notes: "2 years jail + 30K EUR for filtered cosmetic surgery photos",
  },
];

export type AuditAction =
  | "created"
  | "accessed"
  | "shared"
  | "hold_placed"
  | "hold_released"
  | "privacy_applied"
  | "report_generated"
  | "deleted";

export type ActorType = "clinician" | "patient" | "system" | "legal";

export interface AuditLogEntry {
  id: string;
  entityType: "photo" | "patient" | "clinic" | "hold";
  entityId: string;
  action: AuditAction;
  actorId: string;
  actorType: ActorType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
