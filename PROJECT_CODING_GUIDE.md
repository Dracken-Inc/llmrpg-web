# LLMRPG MUD – Unified Coding Guide (Arkyv + GoMud + KoboldCPP)

This is the **single coding guide** for the project. It merges the three major reference projects into one cohesive implementation plan and code structure.

**References used:**
- **Arkyv-Engine** → terminal UI + command UX patterns
- **GoMud** → real-time combat patterns + action cooldowns
- **KoboldCPP** → local AI integration for NPC dialogue

**Critical:** This is **NOT** a D&D campaign assistant. No turn-based combat. No initiative tracker.

---

## 0) Non‑Negotiables

- **Keep** [content/](content/) (photos). Do not delete.
- **Local AI only** (KoboldCPP on :5001). No cloud LLMs.
- **Real-time combat** only. No turn-based systems.
- **Async I/O only**. Never block the game loop.
- **TypeScript strict** everywhere.

---

## 0.1) Tooling & Diagnostics (Recommended)

- **VS Code** with ESLint + Prettier
- **DB Browser for SQLite** (inspect schema/data)
- **Docker Desktop** (KoboldCPP container)
- **Node‑gyp build tools** (Windows C++ Build Tools + Python 3.10+)
- **npm scripts** for build/dev (standardized)

---

## 1) Target Architecture (Merged)

### Frontend (Arkyv‑style)
- React + terminal UI
- Streamed text output
- Command input + autocomplete
- NPC portraits from content/

### Backend (GoMud‑style game server)
- Node + Express + Socket.IO
- ECS game loop (30 FPS)
- Real-time combat and NPC scheduling

### AI (KoboldCPP)
- Local LLM wrapper
- Cache-first NPC responses
- Conversation history per NPC/player

---

## 2) Project Structure

```
llmrpg-web/
├── content/                      # Photos (KEEP)
├── database/
│   └── schema.sql
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── core/
│       │   ├── Entity.ts
│       │   ├── System.ts
│       │   └── GameEngine.ts
│       ├── components/
│       │   └── CoreComponents.ts
│       ├── systems/
│       │   ├── CombatSystem.ts
│       │   ├── NPCSchedulingSystem.ts
│       │   └── NarrativeSystem.ts
│       ├── services/
│       │   ├── DatabaseService.ts
│       │   ├── RoomService.ts
│       │   ├── WorldInitializer.ts
│       │   ├── CommandProcessorService.ts
│       │   ├── CachingService.ts
│       │   ├── KoboldCPPService.ts
│       │   ├── ConversationManager.ts
│       │   └── NPCPersonalityBuilder.ts
│       └── network/
│           ├── GameServer.ts
│           └── SessionManager.ts
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.tsx
│       ├── App.tsx
│       └── components/
│           └── ArkyvTerminal.tsx
└── .github/
    └── copilot-instructions.md
```

---

## 3) Phase A – Scaffold (Foundations)

### A1) Create base packages
- **server/package.json** with Express + Socket.IO + TypeScript
- **client/package.json** with React + TypeScript
- **database/schema.sql** with rooms/npcs/exits/characters

### A2) ECS Core
- `Entity.ts`, `System.ts`, `GameEngine.ts`
- Game loop target: 30 FPS

### A3) Base Networking
- `GameServer.ts` + Socket.IO
- Basic `joinSession`, `leaveSession`

---

## 4) Phase B – World + Commands (Core Gameplay)

### B1) DatabaseService (Required)
**Interface:**
```
query<T>(sql: string, params?: unknown[]): Promise<T[]>
queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>
execute(sql: string, params?: unknown[]): Promise<void>
transaction<T>(fn: (db: DatabaseService) => Promise<T>): Promise<T>
```

### B2) RoomService
**Required:**
```
getRoom(roomId: string): Promise<Room & { npcs: NPC[]; exits: Exit[] }>
getNPCsInRoom(roomId: string): Promise<NPC[]>
getExits(roomId: string): Promise<Exit[]>
getRoomState(roomId: string): Promise<RoomState>
moveCharacter(characterId: string, fromId: string, toId: string): Promise<void>
```

### B3) WorldInitializer
- Load 1000 rooms + 50 NPCs at startup
- Validate exit integrity
- Register NPCs into scheduling system

### B4) CommandProcessorService
**Required commands:**
- `look` → room description + NPCs + exits
- `who` → players in room
- movement → `north/south/east/west/up/down/enter/exit`
- `talk <npc> <msg>` → NPC response (cached/AI)
- `attack <npc>` → combat start/resolve
- `say <msg>` → room broadcast
- `whisper <player> <msg>` → private message

**Response format:**
```
{ type: 'system' | 'room' | 'combat' | 'npc', text: string, meta?: Record<string, unknown> }
```

### B5) Socket.IO Wiring
- Client → Server: `playerCommand`, `joinSession`, `leaveSession`
- Server → Client: `commandResult`, `roomUpdate`, `combatLog`, `playerJoined`, `playerLeft`

---

## 5) Phase C – Combat (GoMud Pattern)

**Real-time cooldowns only.**

**Rules:**
- Roundtime = max(0.5, 6 - (DEX / 4)) seconds
- Attack roll = d20 + DEX modifier
- Damage = d8 + STR modifier
- Crit on d20=20 (2x damage)

**Core methods:**
- `startCombat(attacker, defender)`
- `resolveAttack(attacker, defender)`
- `getCombat(combatId)`
- `endCombat(combatId)`

---

## 6) Phase D – NPC Scheduling (GoMud Pattern)

- Time-based routines (0–1440 minutes)
- NPC moves on schedule
- Proximity greetings
- Respawn behavior

---

## 7) Phase E – AI (KoboldCPP)

### E1) KoboldCPPService
```
generateNPCResponse(prompt: string, options?: GenerationOptions): Promise<string>
```

### E2) ConversationManager
- Store last N messages per NPC/player
- Provide history block for prompts

### E3) NPCPersonalityBuilder
- Build system prompt from NPC fields
- Include location + time + context

### E4) Cache Integration
- Always check cache first
- Only call KoboldCPP on miss

**Docker reference:** https://github.com/bartowski1182/koboldcpp-docker

---

## 8) Data Model (Minimum)

**Rooms:** id, name, description, region, coords, flags

**NPCs:** id, name, description, room_id, schedule_id, personality

**Exits:** id, from_room_id, to_room_id, direction, is_locked

**Characters:** id, name, room_id, stats, hp, inventory

**Conversation:** npc_id, character_id, history_json, updated_at

---

## 9) Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| Room queries | <100ms | Smooth “look” |
| Command processing | <500ms | Responsive gameplay |
| NPC AI first response | 2–3s | Feels real-time |
| NPC cached response | <50ms | Fast dialogue |
| Server startup | <5s | Quick iteration |
| Game loop | 30 FPS | Smooth updates |
| Cache hit rate | >80% | Reduce AI calls |

---

## 10) Build Checklist

- [ ] Scaffold client/server/database folders
- [ ] Implement ECS core
- [ ] Implement DatabaseService
- [ ] Implement RoomService
- [ ] Implement WorldInitializer
- [ ] Implement CommandProcessorService
- [ ] Wire Socket.IO events
- [ ] Implement CombatSystem
- [ ] Implement NPCSchedulingSystem
- [ ] Implement KoboldCPPService + AI cache
- [ ] Test multiplayer flow

---

## 11) Validation

**Unit tests:**
- DatabaseService: query/transaction success
- RoomService: getRoom <100ms
- CommandProcessor: look, move, talk

**Integration tests:**
- Two players see each other
- Movement broadcasts to both
- Combat events broadcast

**Performance checks:**
- Room load time <5s
- Command latency <500ms
- Cache hit rate >80%

---

## 12) Execution Order (Summary)

```
Scaffold → ECS → DB → Rooms → World → Commands → Socket.IO → Combat → NPC Schedules → AI
```

---

**This guide replaces all prior implementation guides.**
