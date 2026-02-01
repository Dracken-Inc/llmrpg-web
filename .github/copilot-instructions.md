# LLMRPG MUD – AI Agent Instructions

## Project snapshot
- Goal: playable online MUD (not a D&D assistant) using Arkyv-style terminal UI, GoMud combat patterns, and local KoboldCPP AI.
- Current state: Phase 0 done, Phase 1B ready (services pending). See [README.md](README.md).

## Non‑negotiables
- Keep [content/](content/) photos. Do not delete core docs: [README.md](README.md), [BUILD.md](BUILD.md), [PROJECT_CODING_GUIDE.md](PROJECT_CODING_GUIDE.md), [VISUAL_GUIDE.md](VISUAL_GUIDE.md).
- Local AI only (KoboldCPP on :5001). No cloud LLMs.
- No turn‑based combat or D&D 5E systems.
- TypeScript strict mode, async I/O only, never block the 30 FPS game loop.

## Architecture & data flow (see [VISUAL_GUIDE.md](VISUAL_GUIDE.md))
- Client (React terminal UI) → Socket.IO → `CommandProcessorService` → `RoomService` → `DatabaseService` → SQLite.
- AI dialogue: `CachingService` → (miss) `KoboldCPPService.generateNPCResponse()` → `ConversationManager` history.

## Execution order (do not reorder)
Scaffold → ECS → Database → Rooms → World → Commands → Socket.IO → Combat → NPC Scheduling → AI.

## Required interfaces & protocols
- Command response shape: `{ type: 'system' | 'room' | 'combat' | 'npc', text: string, meta?: Record<string, unknown> }`.
- Socket.IO events: client → server `playerCommand`, `joinSession`, `leaveSession`; server → client `commandResult`, `roomUpdate`, `combatLog`, `playerJoined`, `playerLeft`.

## Game rules (GoMud pattern)
- Real‑time cooldowns only. Roundtime $=\max(0.5,\ 6 - \frac{DEX}{4})$ seconds.
- Attack roll: d20 + DEX mod; damage: d8 + STR mod; crit on natural 20.

## Build & run workflow (see [BUILD.md](BUILD.md))
- Server dev: `npm run dev` from server/.
- Client dev: `npm run dev` from client/.
- Initialize DB: `sqlite3 database/world.db < database/schema.sql`.

## Service order (Phase 1B)
- Implement: `DatabaseService` → `RoomService` → `WorldInitializer` → `CommandProcessorService` → Socket.IO wiring.
- Performance targets: room queries <100ms; command processing <500ms.
