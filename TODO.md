# Glow Protocol - What Needs To Be Done

> Last updated: 2026-02-07

## Phase 1: Web Demo MVP (capture + notarize + verify)

### Done
- [x] SHA-256 hashing of unfiltered photos at capture (`src/utils/verification.ts`)
- [x] Face detection with face-api.js (TinyFaceDetector + FaceLandmark68Net)
- [x] Privacy blur - eyes, hair, background (`src/components/Procedures/PrivacyEditor.tsx`)
- [x] StackBlur fix (replaced broken `ctx.filter` with `canvasRGBA`)
- [x] Camera capture with verification badge (`VerifiedCapture.tsx`)
- [x] Hedera HCS service scaffold (`src/services/hederaService.ts`)
- [x] Auto-setup from env vars (`src/services/hederaSetup.ts`)
- [x] Notarize-on-save wired into ProcedureTracker
- [x] Blockchain fields added to VerificationData type
- [x] Verification certificate export includes Hedera data
- [x] Branding pass - ProcedureTracker updated to pink (#FF6FAE)

### To Do
- [ ] **Plug in Hedera testnet credentials** - Create `.env` with `VITE_HEDERA_OPERATOR_ID` and `VITE_HEDERA_OPERATOR_KEY` from https://portal.hedera.com
- [ ] **Test the full capture → notarize flow** end to end on testnet
- [ ] **Hash generated BEFORE privacy blur** - audit that the original unfiltered image is what gets hashed (currently correct, but needs explicit test)
- [ ] **Timestamp watermark on original** - visible timestamp burned into the photo canvas

### Recently Completed
- [x] **"Verify on Hedera" button** on entry cards in ProgressTimeline - re-hashes photo, compares against stored hash + Mirror Node
- [x] **Verification page** - new "Verify" tab in bottom nav, upload photo or paste hash, check against Hedera blockchain
- [x] **Clinical grid overlay** - rule of thirds, center crosshair, Frankfort plane, corner brackets, toggle via crosshair button
- [x] **Branding pass** - ProgressTimeline + ProcedureTracker updated from purple to pink (#FF6FAE)

---

## Phase 2: Glow Protocol Core (certified capture system)

### Cryptographic Integrity
- [ ] **LSB steganographic watermark** - embed `patient_id + capture_hash` in blue channel pixels, invisible to eye but extractable for verification
- [ ] **PRNU sensor fingerprinting** - device-specific noise pattern to prove which physical camera took the photo
- [ ] **AI detection layer** - frequency domain analysis to flag AI-generated/deepfake images
- [ ] **Filter detection** - reject images that show signs of beauty filter processing

### Camera App (Android)
- [ ] **Fork Open Camera** (https://github.com/niccokunzmann/open-camera) - RAW/DNG capture, no beauty filters
- [ ] **Lock down editing** - remove all post-capture editing, crop, filter features
- [ ] **Force RAW+JPEG** - capture both for legal evidence
- [ ] **Disable screenshot** - `FLAG_SECURE` on Android
- [ ] **Auto-notarize on capture** - hash + Hedera submission happens at shutter press
- [ ] **Clinical capture mode** - guided workflow: frontal → left profile → right profile → oblique views
- [ ] **Distance indicator** - use AR/depth sensor to enforce 30cm capture distance

### Evidence Vault (Backend)
- [ ] **S3 Glacier Deep Archive** - WORM (Write Once Read Many) storage
- [ ] **Object Lock** - compliance mode, cannot be deleted even by root
- [ ] **Retention policies** - USA 7yr, Germany 10yr, UK 8yr, Japan 5-10yr, Australia 7yr
- [ ] **Legal hold API** - freeze specific photos from deletion when litigation is pending
- [ ] **Encryption at rest** - AES-256, clinic holds key, we hold encrypted blob
- [ ] **Audit trail** - every access logged, who viewed what and when

### Tablet Hardware
- [ ] **Samsung Galaxy Tab A9** - $150, good camera, MDM-compatible
- [ ] **MDM enrollment** - lock tablet to Glow Camera app only (Knox or third-party)
- [ ] **Wall mount bracket** - standardized mounting for consistent positioning
- [ ] **Kiosk mode** - no home button, no notification bar, no app switching
- [ ] **Auto-update** - OTA updates to camera app without clinic IT involvement

---

## Phase 3: Clinic Dashboard (B2B web app)

### Verification Dashboard
- [ ] **Photo verification page** - upload any photo, check hash against Hedera
- [ ] **Batch verification** - verify entire patient folder at once
- [ ] **QR code on printed reports** - scan to verify online
- [ ] **Verification certificate PDF** - downloadable, court-admissible document with blockchain proof

### Clinic Management
- [ ] **Patient records** - link photos to patient IDs (anonymized)
- [ ] **Procedure timeline** - before/during/after photo series per patient
- [ ] **Provider accounts** - which doctor took which photo
- [ ] **Compliance dashboard** - retention status, upcoming expirations, legal hold status
- [ ] **Export for legal** - package all photos + verification certificates for legal proceedings

### Authentication & Security
- [ ] **Clinic onboarding** - signup, billing, tablet provisioning
- [ ] **Role-based access** - admin, doctor, nurse, front desk (view-only)
- [ ] **2FA** - mandatory for all clinic accounts
- [ ] **HIPAA BAA** - business associate agreement infrastructure
- [ ] **Audit logs** - all actions tracked, exportable

---

## Phase 4: Business & Revenue

### Monetization
- [ ] **Stripe integration** - $50/month per clinic subscription
- [ ] **Per-report billing** - $5 per "Verified Legal Report" (patient pays)
- [ ] **Enterprise tier** - $500-1,500/month for legal hold, extended retention, compliance reports
- [ ] **Insurance API** - integrate with malpractice carriers for 15% premium discount

### Compliance & Legal
- [ ] **HIPAA compliance** - full audit, BAA templates, encryption requirements
- [ ] **GDPR compliance** - right to deletion vs. legal retention obligations
- [ ] **Germany HWG** - Heilmittelwerbegesetz compliance for medical advertising
- [ ] **Japan Medical Care Act** - June 2025 deadline compliance
- [ ] **Australia TGA** - Therapeutic Goods Administration advertising rules
- [ ] **France Loi Photoshop** - filtered photo disclosure requirements

### Go-to-Market
- [ ] **Onboard 1 Berlin clinic** - first pilot customer
- [ ] **Case study** - document results, time saved, legal protection value
- [ ] **Insurance partnership** - get one malpractice carrier to offer discount
- [ ] **Conference demo** - AMWC (Aesthetic Medicine World Congress) or similar

---

## Phase 5: Scale & Differentiation

### Triple Notarization (redundancy)
- [ ] **Hedera HCS** - primary (done in scaffold)
- [ ] **Polygon zkEVM** - secondary blockchain anchor
- [ ] **AWS QLDB** - centralized ledger backup for enterprises that don't trust blockchain

### Advanced Features
- [ ] **Before/after comparison with alignment** - auto-register two photos for pixel-accurate comparison
- [ ] **Healing progress analytics** - ML-based tracking of swelling, bruising, results over time
- [ ] **Multi-clinic chain support** - franchise/chain management with centralized compliance
- [ ] **White-label SDK** - let EMR systems (Epic, Cerner) integrate certified capture
- [ ] **Insurance claim auto-fill** - generate documentation packages for claims

---

## Repos Needed

| Repo | Purpose | Status |
|------|---------|--------|
| `glow-protocol` (this repo) | Web app + Hedera integration | Active |
| `glow-camera` | Forked Open Camera (Android) | Not started |
| `glow-vault` | Evidence vault backend (S3 + API) | Not started |
| `glow-sdk` | White-label SDK for clinic integration | Not started |
| `glow-clinic` | Clinic dashboard (could be part of this repo) | Not started |

---

## Immediate Next Steps (this week)

1. Get Hedera testnet credentials into `.env`
2. Test capture → notarize → verify flow end to end
3. Add "Verify on Hedera" button to entry cards
4. Build standalone verification page
5. Commit everything to GitHub
