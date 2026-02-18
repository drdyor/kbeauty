# Glowchi / Glow Protocol - Agent Reference

> Last updated: 2026-02-10

## Four Products

1. **GlowMirror** (Web) - Consumer skin diary & smart mirror. Working, needs polish.
2. **Glowchi App** (React Native) - Wellness companion with AI hamsters, pet, wearables, binaural beats.
3. **Glow Protocol** (NEW, priority) - B2B certified medical photography for clinics. Plastic surgery + dentistry.
4. **Glow Protocol Dashboard** (Web) - Clinic verification dashboard (not yet built).

See `CLAUDE.md` for the Glow Protocol business spec.
See `~/.claude/plans/silly-jumping-hennessy.md` for the full architecture plan.

### Shared code across products:
- `face-api.js` integration (eye detection, landmarks)
- `utils/verification.ts` → wrapped by `@glow/crypto` (SHA-256 hashing)
- Camera capture patterns from `VerifiedCapture.tsx`
- `PrivacyEditor.tsx` blur approach → wrapped by `@glow/face` (privacy regions)
- `hederaService.ts` → wrapped by `@glow/hedera` (blockchain notarization)
- HealthKit/Health Connect wrappers from Glowchi app
- OpenRouter AI integration from hamster service

---

## 0. Glow Protocol — Certified Medical Photography (PRIORITY)

**Location:** `~/Desktop/cursor/kbeauty/protocol/`
**Stack:** TypeScript monorepo (pnpm workspaces + Turborepo), React Native (Expo), Hedera HCS, S3 Object Lock
**Verticals:** Aesthetic medicine (plastic surgery) + Dentistry (aesthetics, orthodontics)
**Business:** $50/month SaaS per clinic + $5/verified legal report + insurance partnerships
**Plan file:** `~/.claude/plans/silly-jumping-hennessy.md`

### Workspace Config (root level)
| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Connects `protocol/packages/*`, `protocol/apps/*`, `protocol/dashboard`, `protocol/infra` |
| `turbo.json` | Build/dev/lint/typecheck task orchestration |
| `tsconfig.json` | Root tsconfig — `include: ["src/**"]`, `exclude: ["protocol/**", "koreanbeauty/**"]` so web app doesn't compile protocol |

### Packages (`protocol/packages/`)

#### @glow/types (`protocol/packages/types/`)
Shared TypeScript interfaces for the entire protocol.

| File | Exports |
|------|---------|
| `src/photo.ts` | `CaptureMetadata`, `CaptureAngle` (17 face + 6 body + 11 dental + custom), `HederaProof`, `WatermarkData`, `VerificationResult`, `CertifiedPhoto`, `PhotoUploadRequest`, `PhotoUploadResponse`, `PHOTO_SERIES` (10 preset angle series: rhinoplasty, blepharoplasty, facelift, botox, lip filler, body contouring, dental aesthetic, ortho, full dental) |
| `src/patient.ts` | `Patient`, `PatientCreateRequest`, `Consent`, `ProcedureType` (14 aesthetic + 7 aesthetic dental + 4 ortho + 5 general dental + other), `ClinicalSpecialty`, `Procedure`, `ShareToken`, `LegalReport` |
| `src/clinic.ts` | `Clinic` (with `specialty` field), `ClinicSpecialty` (aesthetic_medicine, aesthetic_dentistry, orthodontics, general_dentistry, multi_specialty), `ClinicRegistration`, `ClinicStaff` (roles: admin, physician, dentist, orthodontist, nurse, hygienist, technician), `Country`, `RETENTION_BY_COUNTRY` (US 7yr, DE 10yr, GB 8yr, JP 10yr, AU 7yr, FR 10yr, KR 5yr, BR 20yr, CA 10yr) |
| `src/vault.ts` | `VaultEntry`, `LitigationHold`, `LitigationHoldRequest`, `LitigationHoldRelease`, `RetentionRule`, `RETENTION_RULES` (6 countries with legal basis), `AuditLogEntry`, `AuditAction`, `ActorType` |
| `src/index.ts` | Re-exports all |

#### @glow/crypto (`protocol/packages/crypto/`)
SHA-256 hashing + AES-256-GCM encryption. Wraps `src/utils/verification.ts`.

| File | Exports |
|------|---------|
| `src/hash.ts` | `hashBytes(Uint8Array)`, `hashBase64Image(string)`, `verifyHash(image, expected)`, `hashString(text)` — all use Web Crypto API `crypto.subtle.digest` |
| `src/encrypt.ts` | `generateKey()`, `exportKey()`, `importKey()`, `encrypt(data, key)`, `decrypt(data, key)`, `encryptImage(base64, key)`, `decryptImage(encrypted, key)` — AES-256-GCM, IV prepended to ciphertext |
| `src/index.ts` | Re-exports all |

#### @glow/hedera (`protocol/packages/hedera/`)
Hedera HCS blockchain notarization + Mirror Node verification. Wraps `src/services/hederaService.ts`.

| File | Exports |
|------|---------|
| `src/client.ts` | `initClient(config)`, `getClient()`, `getNetwork()`, `getMirrorNodeUrl()`, `createTopic(memo?)`, `getTopicId()`, `setTopicId()`, `isReady()` — auto-detects key type (DER/ECDSA/ED25519) |
| `src/notarize.ts` | `notarizePhoto(payload)` → submits hash to HCS topic, returns `HederaProof`. Payload: `{ version, hash, clinicId, patientId, photographerId, captureAngle?, procedureType?, deviceInfo?, timestamp }` |
| `src/verify.ts` | `verifyOnChain(topicId, seqNum, expectedHash)` → queries Mirror Node REST API. `buildVerificationResult(hash, hedera, s3VersionId?, clinicName?)` → returns full `VerificationResult` (certified/modified/unknown) |
| `src/index.ts` | Re-exports all + types |

**Dep:** `@hashgraph/sdk ^2.80.0`

#### @glow/watermark (`protocol/packages/watermark/`)
LSB steganographic watermarking — hides verification metadata in blue channel pixels.

| File | Exports |
|------|---------|
| `src/embed.ts` | `embedWatermark(pixels, data)` — encodes `WatermarkData` in blue channel LSBs. Format: `GLOW` magic header (4 bytes) + length (4 bytes, big-endian) + JSON payload. Works with raw RGBA `Uint8Array` (no DOM canvas dependency). |
| `src/extract.ts` | `extractWatermark(pixels)` → `WatermarkData | null` — reads magic header, length, then payload from blue channel LSBs. Returns null if no watermark or invalid. |
| `src/spread.ts` | `generatePixelSequence(hashSeed, pixelCount, seqLength)` — xorshift32 PRNG for deterministic pixel selection. `embedSpreadBit(pixels, indices, bit)`, `extractSpreadBit(pixels, indices)` — majority voting across redundant pixels for JPEG resilience. **TODO: full spread-spectrum post-MVP.** |
| `src/index.ts` | Re-exports all |

#### @glow/face (`protocol/packages/face/`)
Face detection, clinical alignment scoring, and privacy blur region calculation.

| File | Exports |
|------|---------|
| `src/detect.ts` | `FaceDetector` interface (init, detect, isReady), `FaceDetection`, `DetectionConfig`, `DEFAULT_CONFIG` (inputSize 224, score 0.5, withLandmarks true). Platform-specific implementations (web vs RN) implement this interface. |
| `src/landmarks.ts` | `LANDMARK_REGIONS` (jawline, eyes, brows, nose, mouth — index ranges for 68-point model), `getRegionPoints()`, `getRegionCenter()`, `getBoundingBox()`, `getInterPupillaryDistance()`, `getFaceEllipse()`, `getEyeEllipses()` |
| `src/alignment.ts` | `scoreAlignment(landmarks, frameW, frameH)` → `AlignmentScore { overall, tilt, centering, faceRatio, feedback }`. Tilt from eye corners (Frankfort plane approximation), centering from nose bridge, face ratio from bounding box. Score weights: tilt 40%, centering 30%, ratio 30%. Feedback strings: "Tilt head", "Center face", "Move closer/further", "Ready to capture". |
| `src/privacy.ts` | `generateBlurRegions(landmarks, w, h, config)` → `BlurRegion[]` with `shouldBlur(x, y)` hit-test functions. `createBlurMask(regions, w, h)` → `Uint8Array` binary mask. Supports eyes (tight ellipses), hair (band above face), background (outside face ellipse). `DEFAULT_PRIVACY_CONFIG` (eyes=true, hair=false, bg=false, strength=40). |
| `src/index.ts` | Re-exports all + types |

### Apps (`protocol/apps/`)

#### Glow Pro — Physician App (`protocol/apps/pro/`)
**Stack:** React Native + Expo 52 + expo-router 4
**Deps:** All @glow/* packages + expo-camera, react-native-svg
**Bundle ID:** `com.glowprotocol.pro`

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root Stack layout |
| `app/(tabs)/_layout.tsx` | 4-tab navigation (Capture, Patients, Vault, Settings). Active color `#FF6FAE`. |
| `app/(tabs)/capture.tsx` | Certified capture screen — series selector → angle picker → CertifiedCamera. Inits Hedera on mount, shows connection status. Uses `PHOTO_SERIES` from @glow/types for guided capture. Alert on certification with hash + Hedera seq. |
| `app/(tabs)/patients.tsx` | Patient management — placeholder empty state |
| `app/(tabs)/vault.tsx` | Evidence vault browser — stats cards (certified photos count, active holds count) |
| `app/(tabs)/settings.tsx` | Clinic settings — Hedera network, topic ID, retention policy, subscription tier |
| `components/CertifiedCamera.tsx` | Locked-down camera using expo-camera `CameraView`. Back-facing, max quality, no EXIF. Shows clinical grid overlay, angle badge, pipeline progress indicator, "Certified" badge with hash + Hedera seq on success. Handles permission requests. |
| `components/ClinicalGrid.tsx` | React Native SVG port of `ClinicalGridOverlay.tsx`. Rule of thirds, vertical midline (#FF6FAE), Frankfort plane (#4FC3F7), center crosshair, corner brackets. Uses `react-native-svg`. |
| `services/captureService.ts` | Full certification pipeline: `initCapturePipeline(config)` inits Hedera client + creates topic. `certifyCapture(input, onProgress?)` runs SHA-256 → Hedera notarize → watermark data → AES-256-GCM encrypt. Returns `CertificationResult` with hash, HederaProof, WatermarkData, encrypted image + key. |
| `metro.config.js` | Fixes pnpm workspace root detection (`EXPO_NO_METRO_WORKSPACE_ROOT`), sets watchFolders for protocol packages + root node_modules |
| `app.json` | Expo config: camera permissions, scheme `glowpro` |
| `tsconfig.json` | Extends `expo/tsconfig.base`, paths `@glow/*` → `../../packages/*/src` |
| `package.json` | Workspace deps on all @glow/* packages |

**Components to build next:**
- `components/AlignmentScorer.tsx` — real-time Frankfort plane scoring using `@glow/face`
- `components/PatientCard.tsx` — patient list item
- `components/VaultBrowser.tsx` — photo grid with verification badges

#### Glow — Patient App (`protocol/apps/patient/`)
**Stack:** React Native + Expo 52 + expo-router 4
**Deps:** `@glow/crypto`, `@glow/types`
**Bundle ID:** `com.glowprotocol.patient`

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root Stack layout |
| `app/(tabs)/_layout.tsx` | 4-tab navigation (Photos, Verify, Share, Profile). Active color `#FF6FAE`. |
| `app/(tabs)/photos.tsx` | Read-only photo gallery — placeholder empty state |
| `app/(tabs)/verify.tsx` | Photo verification — dashed border dropzone, SHA-256 check against blockchain |
| `app/(tabs)/share.tsx` | Share & Reports — legal report card ($5/report) |
| `app/(tabs)/profile.tsx` | Profile — name, connected clinic, photo count |
| `app.json` | Expo config: scheme `glow` |
| `tsconfig.json` | Extends `expo/tsconfig.base` |
| `package.json` | Workspace deps |

**Components to build next:**
- `components/PhotoViewer.tsx` — read-only with verification badge
- `components/VerificationChain.tsx` — visual blockchain proof display
- `components/ShareSheet.tsx` — legal report PDF generation

### Not Yet Built
- `protocol/dashboard/` — Clinic web dashboard (React + Vite). Verify page, patient timelines, compliance reports, billing.
- `protocol/infra/` — AWS CDK stacks (API Gateway, Lambda, Aurora PostgreSQL, S3 Object Lock, Cognito).
- Backend API (15+ endpoints — see plan file for full spec).
- Database migrations (6 tables — see plan file for SQL schema).

### Capture Angle Reference

**10 preset photo series** in `PHOTO_SERIES` constant (see `@glow/types` photo.ts):

| Series | Angle Count | Key Angles |
|--------|------------|------------|
| Face Standard 5-View | 5 | frontal, both profiles (90°), both obliques (45°) |
| Rhinoplasty | 9 | 5-view + basal, bird's eye, nose close-ups |
| Blepharoplasty | 4 | frontal, obliques, eye close-up |
| Facelift | 6 | 5-view + basal (neck assessment) |
| Lip Filler | 5 | frontal, smile, obliques, lip close-up |
| Botox | 4 | frontal, animation (expression), obliques |
| Body Contouring | 6 | frontal, both laterals, both obliques, posterior |
| Dental Aesthetic | 8 | smile + retracted + rest + laterals + face profiles |
| Orthodontic | 8 | retracted, buccal L/R, occlusal U/L + face profiles |
| Full Dental | 14 | complete intraoral + extraoral documentation |

**All capture angles (35 total):**
- Face: frontal, L/R profile, L/R oblique, basal, bird's eye, L/R lateral smile, frontal smile, frontal animation, nose close-up, nose basal close-up, eyes close-up, lips close-up, ears L/R (17)
- Body: frontal, L/R lateral, L/R oblique, posterior (6)
- Dental extraoral: frontal smile, frontal retracted, L/R lateral, frontal rest (5)
- Dental intraoral: occlusal upper/lower, buccal L/R, anterior close-up, lingual (6)
- Custom (1)

### How Existing Code Connects to Protocol Packages

The protocol packages **wrap and re-export** existing code patterns:

| Existing File | Lines | Wrapped By | Relationship |
|--------------|-------|-----------|-------------|
| `src/utils/verification.ts` | 122 | `@glow/crypto` | Hash functions ported, localStorage/navigator removed |
| `src/services/hederaService.ts` | 188 | `@glow/hedera` | Split into client/notarize/verify, env-based config |
| `src/services/hederaSetup.ts` | 67 | `@glow/hedera` | Merged into client.ts |
| `src/components/Mirror/ClinicalGridOverlay.tsx` | 76 | Future: `ClinicalGrid.tsx` in pro app | Will port SVG to react-native-svg |
| `src/components/Procedures/PrivacyEditor.tsx` | 407 | `@glow/face` (privacy.ts) | Blur region logic extracted, actual blur is platform-specific |
| `src/components/Mirror/GlowMirror.tsx` | ~500 | Future: `CertifiedCamera.tsx` | Camera patterns reused |
| `src/components/Procedures/VerifiedCapture.tsx` | 282 | `@glow/crypto` | SHA-256 capture flow |

**Existing web app (`src/`) is UNTOUCHED.** `pnpm run dev` still works at `localhost:5173`.

---

## 1. GlowMirror - Web App

**Location:** `~/Desktop/cursor/kbeauty/src/`
**Stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4 (`@tailwindcss/vite`) + motion/react + face-api.js + lucide-react
**Brand colors:** Pink `#FF6FAE`, Rose `#FF5994`, Lavender `#E9D5FF`, Soft BG `#FFF5F7`
**Run:** `pnpm run dev` → `http://localhost:5173`

### Architecture
- Tab-based app (Mirror / Journal / Profile) - no React Router, internal view state
- `useAppData` hook = single source of truth for all localStorage state
- `motion/react` for animations (NOT `framer-motion`)
- face-api.js TinyFaceDetector + FaceLandmark68Net for face detection
- Models served from `public/models/`

### File Map

#### Infrastructure
| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + React + Tailwind CSS 4 + `@` path alias |
| `src/index.css` | `@import "tailwindcss"` + CSS custom properties |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/components/ui/button.tsx` | Branded Button component |
| `index.html` | Mobile meta tags, no CDN Tailwind |

#### App Shell
| File | Purpose |
|------|---------|
| `src/App.tsx` | Tab shell with AnimatePresence transitions |
| `src/hooks/useAppData.ts` | Shared localStorage state (procedures, journal, progress, profile) |
| `src/components/Navigation/BottomNav.tsx` | 3-tab nav (Scan/BookOpen/User) |
| `src/types/index.ts` | SkinJournalEntry, AppTab, MoodValue, SkinConcernTag, ComparisonPair, SkinZone, UserProfile |
| `src/types/procedures.ts` | Procedure, ProgressEntry, PrivacySettings, VerificationData |

#### Mirror (Hero Feature)
| File | Purpose |
|------|---------|
| `src/components/Mirror/GlowMirror.tsx` | Full-screen camera, face detection loop, torch/fill-light, capture flow (live → review → privacy → quick-details / procedure-flow) |
| `src/components/Mirror/FaceGuideOverlay.tsx` | Static SVG oval guide (pink→lavender gradient), fades on face detect |
| `src/components/Mirror/SkinZoneOverlay.tsx` | 5 face zones (forehead, cheeks, nose, chin) via landmarks |
| `src/components/Mirror/LightingIndicator.tsx` | Brightness score, Sun icon, color-coded amber/green |
| `src/components/Mirror/CaptureControls.tsx` | Mode toggle (Quick Check / Procedure), shutter button, camera flip |
| `src/components/Mirror/GlowchiCompanion.tsx` | Small streak badge in top bar (cat emoji + streak text) |

#### Journal
| File | Purpose |
|------|---------|
| `src/components/Journal/JournalTab.tsx` | Calendar/timeline views, filters, compare link |
| `src/components/Journal/SkinJournalDetails.tsx` | Post-capture form: mood (5 emojis), concern tags, notes |
| `src/components/Journal/CalendarGrid.tsx` | Monthly calendar with photo thumbnails on entry dates |
| `src/components/Journal/JournalEntryCard.tsx` | Timeline card with thumbnail, date, mood, concerns |

#### Compare
| File | Purpose |
|------|---------|
| `src/components/Compare/BeforeAfterSlider.tsx` | Drag slider with `clip-path: inset()`, date labels |
| `src/components/Compare/PhotoStrip.tsx` | Horizontal scrollable photo thumbnails |
| `src/components/Compare/CompareView.tsx` | Photo selection + slider/side-by-side toggle |

#### Procedures (original, pre-GlowMirror)
| File | Purpose |
|------|---------|
| `src/components/Procedures/ProcedureTracker.tsx` | Procedure tracking flow (timeline → add → capture → privacy → notes). Accepts `initialImage` from mirror, `externalProcedures`/`externalProgressEntries` for shared state, `onDone` callback. |
| `src/components/Procedures/VerifiedCapture.tsx` | Camera capture with SHA-256 verification |
| `src/components/Procedures/PrivacyEditor.tsx` | Face blur editor (eyes/hair/background toggles, blur strength slider). Uses StackBlur (`canvasRGBA` from stackblur-canvas). |
| `src/components/Procedures/AddProcedure.tsx` | Add new procedure form |
| `src/components/Procedures/ProgressTimeline.tsx` | Visual timeline of procedure progress |

#### Profile
| File | Purpose |
|------|---------|
| `src/components/Profile/ProfileTab.tsx` | Name, skin type, stats, clear data |

#### Utilities
| File | Purpose |
|------|---------|
| `src/utils/storage.ts` | `saveToStorage` / `loadFromStorage` localStorage wrapper |
| `src/utils/verification.ts` | SHA-256 hashing, `createVerificationData`, `verifyImage`, `createAndNotarize` |

#### Services
| File | Purpose |
|------|---------|
| `src/services/hederaService.ts` | Full Hedera HCS integration: `initHedera()`, `createTopic()`, `notarizePhoto()`, `verifyOnChain()` |
| `src/services/hederaSetup.ts` | Auto-setup from env vars, topic management in localStorage |

### Known Issues (Web)
- **Pre-existing build errors** - Some components import missing modules (`../ui/card`, `../ui/radio-group`, `../ui/label`, `../ui/textarea`, `framer-motion`). These are NOT caused by protocol changes. Vite dev server works fine (no strict TS checking).
- **Branding incomplete** - ProcedureTracker, AddProcedure, ProgressTimeline still use old purple palette
- **ThinkTank hamsters not ported** - only exist in React Native app
- **No wearable integration** - only in React Native app

### Key Technical Notes
- Tailwind CSS 4: uses `@import "tailwindcss"` (not `@tailwind` directives)
- Camera `getUserMedia` needs explicit `.play()` fallback on some browsers
- `object-cover` on video breaks face-api coordinate mapping → face guide is static (not tracking)
- `max-w-lg` on camera viewport prevents stretching on desktop
- Torch API: `track.applyConstraints({ advanced: [{ torch: true }] })` for mobile flash

---

## 2. Glowchi App - React Native (Expo)

**Location:** `~/Desktop/cursor/kbeauty/koreanbeauty/glowchi-app/`
**Stack:** React Native + Expo + TypeScript
**Constants:** `glowchi-app/constants/index.ts`
**Design Spec:** `GLOWCHI_ONBOARDING_SPEC.md`

### 6-Tab Navigation

#### Tab 1: Home / Pet (`app/(tabs)/index.tsx`)
- Glowchi pet with breathing animation
- 14 moods: happy, neutral, sluggish, stressed, sick, glowing, foggy, overwhelmed, blocked, low-battery, hidden, spark, clingy, order
- Stats: Energy, Skin Clarity, Happiness (0-100)
- XP/Level progression (1-99), 100 XP per level
- Daily checklist (add/delete custom items)
- Breakout risk alerts
- Yoga flow animation (Downward Dog, Plank, Bridge)
- Streak tracking with badge

#### Tab 2: Health Dashboard (`app/(tabs)/health.tsx`)
- Steps tracker (progress bar, goal 10k)
- Sleep picker (5-10 hours)
- Water intake (8 glasses visual)
- Food log: Dairy, Sugar, Fried, Alcohol, Caffeine, Vegetables
- Warning alerts for low sleep

#### Tab 3: ThinkTank / Hamsters (`app/(tabs)/thinktank.tsx`)
**4 AI Hamster Therapists:**

| Name | School | Signature Tool | Color | Focus |
|------|--------|---------------|-------|-------|
| Al | Adlerian | BelongingMap | Red #E74C3C | Connection, belonging, courage |
| Erik | Eriksonian | ChapterTitle | Blue #3498DB | Life stages, meaning, legacy |
| Cogni | CBT | ThoughtFlip | Green #2ECC71 | Thought patterns, logic, structure |
| Rocky | Behavioral | TenMinuteCut | Purple #9B59B6 | Immediate action, physical |

**3 Interaction Modes:**
1. **Single Session** - 1-on-1 with one hamster + their signature tool
2. **Council Consensus** - All 4 debate, Cogni synthesizes (3 stages: independent → debate → synthesis)
3. **Deep Dive Roundtable** - 4-round investigation for major life decisions (pragmatic/psychological/analytical/social threads)

**AI Backend:** OpenRouter API, free models (DeepSeek R1, Mistral Devstral)
**Safety:** Crisis keyword detection → redirect to professional help
**Economy:** Nibbles currency earned per session

**Key Files:**
- `services/hamsterService.ts` - AI integration, session management
- `services/roundtableService.ts` - Deep dive 4-round investigation
- `config/hamsters.config.ts` - Prompts, tools, personality config, crisis keywords
- `components/thinktank/HamsterCouncilView.tsx` - Council UI
- `components/thinktank/HamsterSession.tsx` - 1-on-1 UI
- `components/thinktank/RoundtableView.tsx` - Deep dive UI
- `components/thinktank/CouncilDebate.tsx` - Debate visualization
- `components/thinktank/SignatureTools.tsx` - Tool input forms
- `components/thinktank/HypothesesView.tsx` - Hypothesis display
- `components/thinktank/NibblesLog.tsx` - Session history

#### Tab 4: Skin Diary / Glow (`app/(tabs)/glow.tsx`)
- Camera-only photo tracking (no filters, no imports)
- 3-column photo grid with date badges
- Delete, modal view, metadata
- Stats: total photos, days tracked

#### Tab 5: Binaural Beats (`app/(tabs)/binaural.tsx`)
- Brain states: Delta, Theta, Alpha, Beta (with Hz values)
- Focus modes: Deep Work, Study, Calm Nervous System, Sleep Induction
- Waveform visualization + audio scrubber
- Premium locked tracks
- Now Playing floating bar
- Glassmorphism UI

#### Tab 6: Profile (`app/(tabs)/profile.tsx`)

### Services

#### Pet Engine (`services/petEngine.ts`)
- Calculates pet state from health data
- Steps impact: 10k+ = +30 energy, +20 happiness
- Sleep: 7-9h optimal = +25 clarity, -30 breakout risk; <6h = dark circles
- Water: 8 glasses = +15 clarity, -15 breakout risk
- HRV/stress correlation
- Menstrual cycle: ovulation glow bonus, pre-menstrual +50 breakout risk
- XP: base 20 + bonuses, streak multipliers (7d = 1.5x, 30d = 2x)
- Dynamic context-aware pet messages

#### Wearable Integration
| File | Platform | Metrics |
|------|----------|---------|
| `services/healthKit.ts` | iOS (HealthKit) | Steps, sleep, HRV, heart rate, active energy, distance |
| `services/healthConnect.ts` | Android (Health Connect) | Same metrics |
| `services/healthService.ts` | Unified wrapper | Auto-syncs on app open |

#### Shield Service (`services/shieldService.ts`)
- App blocker for "doomscroll" apps
- iOS: FamilyControls + ManagedSettings
- Android: AccessibilityService
- Currently placeholder implementation

#### Notifications (`services/notifications.ts`)
- Daily check-in reminders
- Streak warnings
- Level up alerts
- Breakout risk warnings

### Data / Storage
**AsyncStorage Keys:**
- `pet:state`, `pet:lastCheckIn`
- `health:YYYY-MM-DD`, `food:YYYY-MM-DD`
- `glowchi:skinPhotos`, `glowchi:dailyChecklist`, `glowchi:checklistDate`
- `thinktank:sessions`, `thinktank:roundtable:sessions`, `thinktank:roundtable:active`

**File System:** `{documentDirectory}/skin_photos/` for photos

### Training Data (`training-data/`)
- 38 synthetic council debate examples (`debate_001` - `debate_038`)
- DPO training pairs, tree DPO structure
- Mental dumps (raw user thoughts)
- Structured propositions
- Agent mappings

### Types (`types/index.ts`)
- `PetState` - mood, energy, skinClarity, breakoutRisk, happiness, level, experience, streak, darkCircles, shieldActive
- `HealthData` - steps, sleepHours, waterIntake, hrv, restingHR, activeMinutes
- `FoodLog` - date + 6 boolean categories
- `UserProfile` - id, name, email, cycle tracking, skin type/concerns, onboarding
- `DailyCheckIn` - composite of health + food + mood + skin photo + notes
- `SkinAnalysis` - 7 metrics (hydration, redness, breakouts, etc.)
- `RoundtableSession`, `Thread`, `Exchange`, `Hypothesis`, `ThreadProfile`

---

## 3. Other Project Assets

| Location | What |
|----------|------|
| `koreanbeauty/wellness-tracker/` | Separate web dashboard: charts, wearable device connections, automations, OAuth |
| `koreanbeauty/OKComputer_Tamagotchi Wellness Cat Game/` | Tamagotchi reference implementation |
| `koreanbeauty/guardian-ios/` | iOS implementation reference |
| `koreanbeauty/guardian-design/` | Design specs and prototypes |
| `koreanbeauty/GUARDIAN_VISION_V2.md` | Vision document |
| `koreanbeauty/COLOR CONCEPTS/` | Design color system |
| `koreanbeauty/binaural_preview.html` | Binaural beats web demo |
| `koreanbeauty/wellness-tracker-demo.html` | Wellness tracker web demo |

---

## 4. What Connects / What's Separate

```
GlowMirror (Web)              Glowchi App (RN)           Glow Protocol (RN + Web)
├── Skin Mirror (camera)       ├── Home/Pet               ├── Glow Pro (physician)
├── Privacy Blur (face-api)    ├── Health Dashboard        │   ├── Certified Capture
├── Journal (calendar)         ├── ThinkTank (AI)          │   ├── Patient Mgmt
├── Before/After Compare       ├── Skin Diary              │   ├── Evidence Vault
├── Procedure Tracking         ├── Binaural Beats          │   └── Settings
└── Profile                    ├── Shield                  ├── Glow (patient)
                               └── Profile                 │   ├── Photo Viewer
                                                           │   ├── Verify
                                                           │   └── Share/Reports
                                                           └── Dashboard (web)
                                                               ├── Verify Dropzone
                                                               ├── Compliance
                                                               └── Billing
```

**Shared:** Brand colors (`#FF6FAE`), face-api.js, SHA-256 verification, camera patterns, Hedera integration
**Protocol wraps existing code:** `@glow/crypto` ← `verification.ts`, `@glow/hedera` ← `hederaService.ts`, `@glow/face` ← `PrivacyEditor.tsx`
**Not shared:** No data sync between products. Hamsters only in Glowchi. Wearables only in Glowchi.

---

## 5. Dependencies

### Web (`package.json`)
- react 19, react-dom, typescript 5.9, vite 7
- @tailwindcss/vite, tailwindcss 4
- @hashgraph/sdk 2.80 (Hedera)
- motion (motion/react), face-api.js
- stackblur-canvas 3.0, zod 4.1
- lucide-react, clsx, tailwind-merge, date-fns

### React Native (`glowchi-app/package.json`)
- expo, react-native
- expo-camera, expo-file-system, expo-notifications
- react-native-health (HealthKit)
- react-native-health-connect
- @react-native-async-storage/async-storage
- expo-av (audio)

### Protocol Packages
- `@glow/types` — no runtime deps
- `@glow/crypto` — no runtime deps (uses Web Crypto API)
- `@glow/hedera` — `@hashgraph/sdk ^2.80.0`
- `@glow/watermark` — no runtime deps
- `@glow/face` — no runtime deps (consumers provide face-api.js)

### Protocol Apps
- `@glow/pro` — expo 52, expo-camera 16, expo-router 4, react-native-svg 15, all @glow/* packages
- `@glow/patient` — expo 52, expo-router 4, `@glow/crypto`, `@glow/types`

---

## 6. Quick Reference

**Start web dev server:** `cd ~/Desktop/cursor/kbeauty && pnpm run dev`
**Build web:** `pnpm run build` (has pre-existing TS errors in src/ — Vite dev works fine)
**Face-api models:** `public/models/` (TinyFaceDetector + FaceLandmark68)
**localStorage keys:** `procedures`, `progressEntries`, `skinJournal`, `userProfile`
**Architecture plan:** `~/.claude/plans/silly-jumping-hennessy.md`
**Workspace config:** `pnpm-workspace.yaml` + `turbo.json` (root level)

### Protocol Quick Start
```bash
# Existing web app (untouched)
cd ~/Desktop/cursor/kbeauty && pnpm run dev

# Protocol packages (not yet installable — need pnpm install in protocol/)
cd ~/Desktop/cursor/kbeauty/protocol/packages/types && pnpm typecheck

# Physician app (needs expo deps installed)
cd ~/Desktop/cursor/kbeauty/protocol/apps/pro && npx expo start

# Patient app
cd ~/Desktop/cursor/kbeauty/protocol/apps/patient && npx expo start
```
