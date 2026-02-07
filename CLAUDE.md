# Glowchi Ecosystem - Project Context

> **Read `AGENT.md` for full file inventory of everything built.**

## What This Project Is

This repo contains three products in the Glowchi ecosystem:
1. **GlowMirror** (Web) - Consumer skin diary with smart mirror, journal, before/after comparison. Working, needs polish.
2. **Glowchi App** (React Native/Expo) - Full wellness companion: AI hamster therapists, pet system, wearables, binaural beats.
3. **Glow Protocol** (NEW, priority) - B2B certified medical photography for aesthetic clinics. The venture-scale play.

## The Pivot: Glow Protocol

### Problem
- AI-generated before/after photos are flooding aesthetic medicine
- Germany banned all unverified before/afters (Oct 2024)
- Japan banning by June 2025, Australia TGA already restricting
- France: 2 years jail + 30K EUR fines for filtered cosmetic surgery photos
- Patients travel for procedures based on fake AI results, get botched, sue
- Clinics face $500K-2M malpractice judgments if they can't produce unedited "before" photos
- No existing solution combines: certified capture + immutable retention + legal admissibility

### Solution
A camera system that **cryptographically certifies** photos at capture, creating legally-admissible proof that an image is real (not AI) and unedited. With mandatory retention for legal evidence.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GLOW PROTOCOL LAYER                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │   E2E    │  │ Hedera   │  │ LSB      │  │ Face   │ │
│  │Encryption│  │Timestamp │  │Watermark │  │Detect  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
└───────┼─────────────┼─────────────┼─────────────┼──────┘
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │   GLOW SDK      │
                    │  (React Native) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌───▼────┐          ┌───▼────┐
   │ Clinic  │          │ Clinic │          │Verify  │
   │ Tablet  │          │Dashboard│         │ API    │
   └─────────┘          └────────┘          └────────┘
```

### Technical Stack (MVP)
1. **Fork Open Camera** (Android) - RAW capture, no beauty filters, locked down
2. **Hedera blockchain** - SHA256 hash per photo (3 sec finality, $0.0001/tx)
3. **LSB steganographic watermark** - patient_id + capture_hash hidden in blue channel pixels
4. **face-api.js** - auto eye detection for privacy blur (reuse from existing code)
5. **Clinic dashboard** (web) - verify any photo by checking blockchain hash
6. **Evidence vault** - S3 Glacier Deep Archive, WORM storage, 7-10 year retention

### Hardware
- $150 Samsung Android tablets, MDM-controlled
- Wall-mounted in clinic, locked to Glow Camera app only
- Not iPhones (cost, lockdown control)

### Business Model
- **B2B SaaS:** $50/month per clinic (tablet lease + software)
- **Per-photo:** $5 per verified "Legal Report" (patients pay for court-admissible copies)
- **Insurance play:** Malpractice carriers give 15% premium discount to clinics using certified photos
- **Enterprise:** $500-1,500/month for legal hold, retention, compliance reports

### Data Retention Requirements
| Country | Retention | Legal Basis |
|---------|-----------|-------------|
| USA | 7 years (adults) / age 21+7 (minors) | HIPAA + state boards |
| Germany | 10 years | BGB §195 |
| UK | 8 years / age 25 (minors) | NHS + Limitation Act |
| Japan | 5-10 years | Medical Care Act |
| Australia | 7 years | AHPRA guidelines |

### Repos Needed
- `glow-vault` - Forked from ente-io/ente (camera + encryption engine only)
- `glow-camera` - Forked from Open Camera (Android certified capture)
- `glow-timestamp` - Hedera notarization service
- `glow-sdk` - White-label SDK for clinic integration
- `glow-clinic` - Verification dashboard (web)

### MVP Sprint (2 weeks)
- Week 1: Fork Open Camera, add Hedera notarization, lock down editing
- Week 2: Build verification dashboard, onboard 1 Berlin clinic

### Competitive Landscape
Nobody combines certified capture + immutable retention + legal hold + insurance backing:
- RXPhoto, Klara, Doxy.me = HIPAA storage but NO cryptographic authenticity
- DICOM viewers = tamper evidence but NO capture-time certification
- Blockchain notary services = exist but NO medical imaging integration

---

## GlowMirror - Web App (`src/`)

Consumer skin diary with smart mirror, face detection, journal, before/after comparison.
**Status:** Core features built. Privacy blur needs StackBlur fix. Branding pass incomplete (some components still purple).
**Key features:** Live camera mirror, face guide overlay, lighting indicator, skin zone mapping, daily journal with calendar, before/after slider, procedure tracking with verified capture.
**Shares with Glow Protocol:** face-api.js eye detection, SHA-256 verification, camera capture patterns, privacy blur approach.

### Glowchi React Native App (`koreanbeauty/glowchi-app/`)

Full wellness companion - the consumer app.
**Status:** In development, separate from web app.
**Key features:**
- **Pet system** - Glowchi pet with 14 moods, XP/levels (1-99), streak tracking
- **Health dashboard** - Steps, sleep, water, food log with wearable sync
- **ThinkTank** - 4 AI hamster therapists (Al, Erik, Cogni, Rocky) with council debates and deep dive roundtables
- **Skin diary** - Camera-only photo tracking
- **Binaural beats** - Delta/Theta/Alpha/Beta brain states with audio player
- **Wearables** - iOS HealthKit + Android Health Connect integration
- **Shield** - App blocker for doomscroll apps

See `AGENT.md` for complete file-by-file inventory of all codebases.

---

## Development Notes
- **Stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4 (web), React Native + Expo (mobile)
- **Tailwind CSS 4:** Uses `@import "tailwindcss"` not directives, requires `@tailwindcss/vite` plugin
- **Animations:** `motion/react` (not `framer-motion`)
- **face-api.js:** Models in `public/models/`, use TinyFaceDetector + FaceLandmark68Net
- **Camera:** `getUserMedia` needs `.play()` fallback, `object-cover` breaks coordinate mapping
- **Canvas blur:** `ctx.filter = 'blur()'` unreliable - use StackBlur for production
