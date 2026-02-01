# LLMRPG MUD – Arkyv + GoMud + KoboldCPP

**A playable online MUD for you and your son.**

This project is **not** a D&D campaign assistant. It is a **persistent multiplayer MUD** (Multi-User Dungeon) built with:
- **Arkyv-Engine UI** (terminal-style text interface)
- **GoMud combat patterns** (Gemstone IV-style real-time cooldowns)
- **KoboldCPP local AI** (Mistral 7B Q4 on your RTX 4070)

---

## Current Status

✅ **Phase 0 Complete** — Project cleaned, legacy code removed.

⏳ **Phase 1B Ready** — Core services to implement:
- `DatabaseService` (SQLite wrapper)
- `RoomService` (room/NPC/exit queries)
- `WorldInitializer` (load 1000 rooms)
- `CommandProcessorService` (look/who/move/talk/attack)
- Socket.IO handlers (real-time multiplayer)

⏳ **Phase 1C Next** — AI integration:
- `KoboldCPPService`
- `ConversationManager`
- `NPCPersonalityBuilder`
- Wire AI fallback into cache

---

## What This Is

A **persistent online world** with:
- **1000 rooms**
- **50+ NPCs** with daily schedules
- **Real-time combat** (cooldowns, not turn-based)
- **Multiplayer commands** (look, who, move, talk, attack)
- **Local AI dialogue** (KoboldCPP + Mistral 7B)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Arkyv Terminal UI | Text command interface |
| **Backend** | Express.js + Socket.IO | Real-time multiplayer |
| **Game Logic** | TypeScript ECS | Entity-Component-System |
| **Database** | SQLite → PostgreSQL | Persistent world storage |
| **Combat** | Gemstone IV style | Real-time cooldown combat |
| **AI** | KoboldCPP + Mistral 7B Q4 | Local NPC dialogue |
| **Caching** | 4-tier cache | Fast NPC response reuse |

---

## Documentation (Read Order)

1. [.github/copilot-instructions.md](.github/copilot-instructions.md)
2. [README.md](README.md)
3. [BUILD.md](BUILD.md)
4. [PROJECT_CODING_GUIDE.md](PROJECT_CODING_GUIDE.md)
5. [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

---

## Project Structure (Clean Slate)

```
llmrpg-web/
├── content/                      # Photos (KEEP)
├── README.md                     # This file
├── BUILD.md                      # Rebuild guide
├── ARKYV_INTEGRATION_GAPS.md
├── PHASE_1B_IMPLEMENTATION_GUIDE.md
├── PHASE_1B_READY.md
├── PHASE_1B_VISUAL_GUIDE.md
├── PHASE_1B_DOCUMENTATION_INDEX.md
└── .github/
  └── copilot-instructions.md
```

---

## Core Rules (Non‑Negotiable)

- **Do NOT add D&D 5E systems.**
- **No turn-based combat.** Only real-time cooldowns.
- **Use local AI only.** KoboldCPP on :5001.
- **Never delete content/** (photos).
- **Follow Phase order strictly.** Database → Rooms → World → Commands → Socket.IO.

---

## Next Step

Start with [BUILD.md](BUILD.md) and begin Phase 1B implementation.

**Goal:** playable MUD in 10–15 days.
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  (Server entrypoint)
│   │   │
│   │   ├── core/                     (ECS Foundation)
│   │   │   ├── Entity.ts
│   │   │   ├── System.ts
│   │   │   └── GameEngine.ts
│   │   │
│   │   ├── components/               (Entity Data)
│   │   │   └── CoreComponents.ts
│   │   │
│   │   ├── systems/                  (Game Logic - Phase 1A)
│   │   │   ├── CombatSystem.ts       ✅ COMPLETE
│   │   │   ├── NPCSchedulingSystem.ts ✅ COMPLETE
│   │   │   └── NarrativeSystem.ts
│   │   │
│   │   ├── services/                 (Adapters - Phase 1B/1C)
│   │   │   ├── CachingService.ts     ✅ COMPLETE
│   │   │   ├── DatabaseService.ts    ⏳ TODO
│   │   │   ├── RoomService.ts        ⏳ TODO
│   │   │   ├── CommandProcessorService.ts ⏳ TODO
│   │   │   ├── WorldInitializer.ts   ⏳ TODO
│   │   │   ├── KoboldCPPService.ts   ⏳ TODO
│   │   │   └── ConversationManager.ts ⏳ TODO
│   │   │
│   │   ├── network/                  (Networking)
│   │   │   ├── GameServer.ts
│   │   │   └── SessionManager.ts
│   │   │
│   │   └── rules/
│   │       └── CombatRules.ts
│   │
│   └── database/
│       └── schema.sql                ✅ Complete (20+ tables)
│
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── components/               (Arkyv-adapted components)
│   │       ├── ArkyvTerminal.tsx
│   │       ├── ChatPanel.tsx
│   │       └── CombatPanel.tsx
│   │
│   └── public/
│
└── Documentation/
    ├── ARKYV_INTEGRATION_GAPS.md       ← What was missing & why
    ├── PHASE_1B_IMPLEMENTATION_GUIDE.md ← How to code Phase 1B
    ├── PHASE_1B_READY.md               ← Quick reference
    ├── PHASE_1B_VISUAL_GUIDE.md        ← Architecture diagrams
    └── PHASE_1B_DOCUMENTATION_INDEX.md ← Doc navigation
```

---

## Key Features

### Real-Time Combat (Gemstone IV Style)
- **Cooldown-based:** Actions have roundtime (6 - DEX/4 seconds, minimum 0.5s)
- **No turn order:** First player ready attacks wins
- **DEX heavy:** Dexterity controls action speed
- **Damage:** d8 + STR modifier, critical on d20=20

### NPC Intelligence
- **Scheduled routines:** NPCs follow daily schedules (patrol, rest, work, interact)
- **Time-aware:** NPCs change location/behavior based on time of day
- **Proximity triggers:** Only nearby NPCs greet/interact with players
- **Conversation memory:** Multi-turn dialogue tracking per NPC/player

### Persistent World
- **1000+ rooms** indexed for <100ms queries
- **Bidirectional exits** (north/south, enter/exit, climb/descend)
- **Region-based organization** (taverns, forests, dungeons, etc.)
- **Item system** with loot tables
- **Quest framework** (Phase 2)

### Performance Optimizations
- **4-tier caching:** Entity→Room→Template→Database (80%+ cache hit rate)
- **Local AI:** Mistral 7B runs on your GPU (~2-3s first generation, <50ms cached)
- **Asynchronous:** All I/O non-blocking
- **30 FPS server tick:** Smooth real-time gameplay

---

## How to Rebuild From Scratch

See **BUILD.md** for complete step-by-step instructions.

**TL;DR:**
1. Phase 1B (3-5 days): Implement 5 core services (Database, Rooms, Commands, Socket.IO, World)
2. Phase 1C (2-3 days): Add KoboldCPP integration (NPC AI)
3. Phase 1D (2 days): Wire game loop
4. Phase 1E (1 day): Performance testing

**Total:** ~10 days of coding → playable MUD for you and your son

---

## Documentation

All documentation is organized by phase and purpose:

| Doc | Purpose | Read When |
|-----|---------|-----------|
| **BUILD.md** | Step-by-step rebuild guide | Starting implementation |
| **ARKYV_INTEGRATION_GAPS.md** | What's missing & why | Understanding architecture |
| **PHASE_1B_IMPLEMENTATION_GUIDE.md** | Code for all services | Coding Phase 1B |
| **PHASE_1B_READY.md** | Quick reference | Need TL;DR |
| **PHASE_1B_VISUAL_GUIDE.md** | Architecture diagrams | Visual learner |
| **PHASE_1B_DOCUMENTATION_INDEX.md** | Which doc to read | Confused about docs |

---

## Prerequisites

### Hardware
- **RTX 4070 Mobile or better** (8GB VRAM minimum)
  - Mistral 7B Q4 = 4.3GB
  - Buffer for OS/browser/processes = 3.7GB available
  - This is tight but workable

- **32GB RAM** (plenty for 1000 rooms + caches)

- **SSD** (SQLite performance)

### Software
- **Node.js 18+**
- **npm** or **yarn**
- **Git**
- **KoboldCPP** (download from GitHub releases)

### Models
- **Mistral 7B Q4** (4.3GB)
  - Download: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF
  - Use: `mistral-7b-instruct-v0.1.Q4_K_M.gguf`

---

## Next Steps

1. **Read BUILD.md** - Understand the rebuild plan
2. **Prepare environment** - Install Node.js, KoboldCPP, download model
3. **Start Phase 1B** - Implement DatabaseService (first service)
4. **Follow implementation guide** - Each service builds on previous
5. **Test as you go** - Don't wait until end to test

**Estimated time to playable game: 10-15 days of focused development**

---

## Questions?

Check the relevant documentation:
- "How do I rebuild?" → **BUILD.md**
- "Why is Arkyv not working?" → **ARKYV_INTEGRATION_GAPS.md**
- "How do I code Phase 1B?" → **PHASE_1B_IMPLEMENTATION_GUIDE.md**
- "What's the full architecture?" → **PHASE_1B_VISUAL_GUIDE.md**
- "Which doc should I read?" → **PHASE_1B_DOCUMENTATION_INDEX.md**

---

## License

Educational/Personal Use - Build with your son, learn together 🎮