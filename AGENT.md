# Glowchi / Glow Protocol - Agent Reference

> Last updated: 2026-02-05

## Three Products

1. **GlowMirror** (Web) - Consumer skin diary & smart mirror. Working, needs polish.
2. **Glowchi App** (React Native) - Wellness companion with AI hamsters, pet, wearables, binaural beats.
3. **Glow Protocol** (NEW, priority) - B2B certified medical photography for clinics.

See `CLAUDE.md` for the Glow Protocol spec (architecture, business model, MVP plan).

### Shared code across products:
- `face-api.js` integration (eye detection, landmarks)
- `utils/verification.ts` (SHA-256 hashing patterns)
- Camera capture patterns from `VerifiedCapture.tsx`
- `PrivacyEditor.tsx` blur approach (needs StackBlur for reliability)
- HealthKit/Health Connect wrappers from Glowchi app
- OpenRouter AI integration from hamster service

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
| `src/components/Procedures/PrivacyEditor.tsx` | Face blur editor (eyes/hair/background toggles, blur strength slider). Uses canvas `ctx.filter` with scale-down fallback. |
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
| `src/utils/verification.ts` | SHA-256 hashing, `createVerificationData`, `verifyImage` |

### Known Issues (Web)
- **Privacy blur may not render** - `ctx.filter = 'blur()'` may need StackBlur fallback for reliability
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
GlowMirror (Web)              Glowchi App (React Native)
├── Skin Mirror (camera)       ├── Home/Pet (Tamagotchi)
├── Privacy Blur (face-api)    ├── Health Dashboard (manual + wearables)
├── Journal (calendar)         ├── ThinkTank (4 AI hamsters)
├── Before/After Compare       ├── Skin Diary (camera grid)
├── Procedure Tracking         ├── Binaural Beats (audio)
└── Profile                    ├── Shield (app blocker)
                               └── Profile
```

**Shared:** Brand colors, skin tracking concept, face-api.js usage
**Not shared:** No data sync between web and mobile. No hamsters on web. No wearables on web.

---

## 5. Dependencies

### Web (`package.json`)
- react 19, react-dom, typescript, vite 7
- @tailwindcss/vite, tailwindcss 4
- motion (motion/react), face-api.js
- lucide-react, clsx, tailwind-merge
- date-fns

### React Native (`glowchi-app/package.json`)
- expo, react-native
- expo-camera, expo-file-system, expo-notifications
- react-native-health (HealthKit)
- react-native-health-connect
- @react-native-async-storage/async-storage
- expo-av (audio)

---

## 6. Quick Reference

**Start web dev server:** `cd ~/Desktop/cursor/kbeauty && pnpm run dev`
**Build web:** `pnpm run build`
**Face-api models:** `public/models/` (TinyFaceDetector + FaceLandmark68)
**localStorage keys:** `procedures`, `progressEntries`, `skinJournal`, `userProfile`
**Plan file:** `~/.claude/plans/rippling-zooming-hellman.md`
