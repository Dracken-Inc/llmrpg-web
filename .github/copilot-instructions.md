# LLMRPG MUD – AI Agent Build Instructions (Authoritative)

**Project Goal:** Build a playable online MUD for father + son using Arkyv terminal UI + GoMud combat patterns + KoboldCPP local AI.

**Critical:** This is **NOT** a D&D campaign assistant. All old D&D/turn-based logic is deprecated.

**Keep:** [content/](content/) (photos). **Do not delete**.

**Do not delete documentation:**
- [README.md](README.md)
- [BUILD.md](BUILD.md)
- [PROJECT_CODING_GUIDE.md](PROJECT_CODING_GUIDE.md)
- [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

---

## 1) System Overview (Target Architecture)

**Frontend:** React + Arkyv terminal UI
- Text command input + streaming output
- NPC portraits using assets in content/
- Command autocomplete

**Backend:** Node + Express + Socket.IO
- Real-time multiplayer
- 30 FPS ECS loop

**Game Engine:** ECS
- Entities + Components + Systems
- Systems: Combat, NPC Scheduling, Narrative, (later) AI

**Database:** SQLite Phase 1 → PostgreSQL Phase 2
- 1000 rooms, 50 NPCs, persistent world

**AI:** KoboldCPP (local) + Mistral 7B Q4
- Runs on :5001
- Cache-first responses

---

## 2) Operating Rules for Agents

### MUST DO
- Follow Phase order strictly (Database → Rooms → World → Commands → Socket.IO).
- Keep TypeScript strict mode.
- Use async I/O only; never block the game loop.
- Maintain performance targets (see Section 8).
- Update documentation if behavior changes.

### MUST NOT DO
- Do not add D&D 5E systems.
- Do not add turn-based combat or initiative trackers.
- Do not call cloud LLMs (KoboldCPP only).
- Do not delete content/ images or core docs.

---

## 3) Toolset Usage (Agent Workflow)

### Code & File Tools
- Use **apply_patch** for file edits.
- Use **create_file** for new files.
- Use **read_file** for context before edits.
- Use **grep_search** for references before deletions.
- Use **file_search** for discovering files.

### Terminal Tools
- Use **run_in_terminal** for installs/builds.
- Avoid editing files with shell commands unless explicitly requested.

### Validation
- After edits, run type-check/build tasks.
- Use **get_errors** if user reports compile errors.

---

## 4) Phase 0 – Scaffold From Scratch (Required)

**Goal:** Create clean folders and base configs while preserving docs and content.

**Target structure:**
```
client/
server/
database/
content/
```

**Minimum configs to create:**
- client/package.json (React + TypeScript)
- server/package.json (Express + Socket.IO + TS)
- server/tsconfig.json (strict)
- client/tsconfig.json (strict)
- database/schema.sql (seed 1000 rooms, 50 NPCs)

**Scaffold workflow:**
1) Create folders.
2) Create package.json files with required deps.
3) Create tsconfig with strict true.
4) Add server/src/index.ts + network/GameServer.ts.
5) Add client/src/index.tsx + App.tsx.
6) Validate TypeScript build succeeds.

---

## 5) Phase 1B – Core Gameplay (Strict Order)

### 5.1 DatabaseService (SQLite wrapper)
**Purpose:** Single entry point for all DB ops with transactions.

**Required interface:**
```
query<T>(sql: string, params?: unknown[]): Promise<T[]>
queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>
execute(sql: string, params?: unknown[]): Promise<void>
transaction<T>(fn: (db: DatabaseService) => Promise<T>): Promise<T>
```

**Implementation rules:**
- Use async/await only.
- All errors must be logged and rethrown.
- Use connection pooling or a single shared connection with serialization.

### 5.2 RoomService
**Purpose:** High-performance room/NPC/exit queries.

**Required methods:**
```
getRoom(roomId: string): Promise<Room & { npcs: NPC[]; exits: Exit[] }>
getNPCsInRoom(roomId: string): Promise<NPC[]>
getExits(roomId: string): Promise<Exit[]>
getRoomState(roomId: string): Promise<RoomState>
moveCharacter(characterId: string, fromId: string, toId: string): Promise<void>
```

**Performance target:** <100ms per query.

### 5.3 WorldInitializer
**Purpose:** Load 1000 rooms + NPCs at startup.

**Required behavior:**
- Validate world integrity (broken exits, missing NPCs).
- Register NPCs in scheduling system.
- Log total load time and counts.

### 5.4 CommandProcessorService
**Purpose:** Parse and route player commands.

**Required commands:**
- `look` → room description + NPCs + exits
- `who` → players in room
- movement → `north/south/east/west/up/down/enter/exit`
- `talk <npc> <msg>` → NPC response (cached/AI)
- `attack <npc>` → Combat start/resolve
- `say <msg>` → room broadcast
- `whisper <player> <msg>` → private message

**Command response format:**
```
{ type: 'system' | 'room' | 'combat' | 'npc', text: string, meta?: Record<string, unknown> }
```

### 5.5 Socket.IO Handlers
**Purpose:** Wire commands to multiplayer clients.

**Required events:**
- Client → Server: `playerCommand`, `joinSession`, `leaveSession`
- Server → Client: `commandResult`, `roomUpdate`, `combatLog`, `playerJoined`, `playerLeft`

**Rule:** Always broadcast room updates to all players in same room.

---

## 6) Phase 1C – AI Integration (Strict Order)

### 6.1 KoboldCPPService
**Purpose:** Local LLM wrapper (HTTP to :5001).

**Required interface:**
```
generateNPCResponse(prompt: string, options?: GenerationOptions): Promise<string>
```

### 6.2 ConversationManager
**Purpose:** Multi-turn NPC/player history tracking.

**Required behavior:**
- Store last N exchanges per NPC/player.
- Provide history block for prompt assembly.

### 6.3 NPCPersonalityBuilder
**Purpose:** Build persona prompt from NPC database fields.

**Required output:**
- System prompt + context prompt + recent history.

### 6.4 Cache Integration
**Rule:** Always check cache first. Only call LLM on miss.

### 6.5 KoboldCPP Docker Reference (User-Approved)
Use this repo as the standard containerized KoboldCPP setup:
- https://github.com/bartowski1182/koboldcpp-docker

**Notes:**
- Supports GPU and CPU builds.
- Exposes HTTP API; configure to run on port :5001.
- Mount your model directory into the container.
- Use docker-compose or docker run per the repo README.

---

## 7) Data Model (Minimum Required)

**Rooms:** id, name, description, region, coords, flags

**NPCs:** id, name, description, room_id, schedule_id, personality

**Exits:** id, from_room_id, to_room_id, direction, is_locked

**Characters:** id, name, room_id, stats, hp, inventory

**Conversation:** npc_id, character_id, history_json, updated_at

---

## 8) Performance Targets

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

## 9) Testing & Validation (Required)

**Unit tests:**
- DatabaseService: query/transaction success
- RoomService: getRoom <100ms
- CommandProcessor: look, move, talk

**Integration tests:**
- Two players in same room see each other
- Movement updates both clients
- Combat events broadcast

**Performance checks:**
- Log time for look command and room load
- Log cache hit rate

---

## 10) Reference Documents

Read in order:
1. [.github/copilot-instructions.md](.github/copilot-instructions.md)
2. [README.md](README.md)
3. [BUILD.md](BUILD.md)
4. [PROJECT_CODING_GUIDE.md](PROJECT_CODING_GUIDE.md)
5. [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

---

## 11) Agent Execution Checklist

- [ ] Read README + BUILD + PROJECT_CODING_GUIDE
- [ ] Scaffold clean client/server/database folders
- [ ] Implement Phase 1B services in order
- [ ] Wire Socket.IO
- [ ] Run tests + smoke checks
- [ ] Begin Phase 1C integration

---

**This file is the single source of truth for AI agents.**
