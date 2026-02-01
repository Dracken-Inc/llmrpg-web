# VISUAL_GUIDE – Unified Architecture Diagrams

This guide provides visual structure for the unified Arkyv + GoMud + KoboldCPP MUD.

---

## 1) High‑Level Architecture

```
┌────────────────────────────────────────────┐
│                 CLIENT (React)             │
│  Arkyv Terminal UI                          │
│  - Command input + autocomplete             │
│  - Output stream                             │
│  - NPC portraits from content/              │
└───────────────────┬────────────────────────┘
                    │ Socket.IO
┌───────────────────▼────────────────────────┐
│                SERVER (Node)               │
│  Express + Socket.IO                        │
│  30 FPS GameEngine                          │
└───────────────┬───────────────┬────────────┘
                │               │
       ┌────────▼──────┐  ┌────▼──────────┐
       │   Systems     │  │   Services     │
       │ - Combat      │  │ - Database     │
       │ - NPC Sched   │  │ - RoomService  │
       │ - Narrative   │  │ - Commands     │
       └───────┬───────┘  └──────┬─────────┘
               │                │
          ┌────▼────┐       ┌───▼──────────┐
          │ SQLite   │       │ KoboldCPP    │
          │ Database │       │ (local LLM)  │
          └──────────┘       └──────────────┘
```

---

## 2) Command Flow

```
Player types: "look"
        │
        ▼
Socket.IO: playerCommand
        │
        ▼
CommandProcessorService
        │
        ├─ RoomService.getRoom()
        ├─ NPCSchedulingSystem.getNPCsInRoom()
        └─ Build response
        │
        ▼
Socket.IO: commandResult → Client
```

---

## 3) Combat Flow (GoMud Pattern)

```
attack <npc>
   │
   ▼
CombatSystem.startCombat()
   │
   ▼
resolveAttack() every time roundtime expires
   │
   ├─ d20 + DEX vs AC
   ├─ d8 + STR damage
   └─ log combat events
   │
   ▼
combatLog broadcast
```

---

## 4) NPC Scheduling Flow

```
NPC schedule (0–1440 minutes)
   │
   ▼
NPCSchedulingSystem tick
   │
   ├─ move NPC room
   ├─ check proximity to players
   └─ greet if conditions met
```

---

## 5) AI Response Flow

```
Player: "talk archie hello"
   │
   ▼
CachingService (check cache)
   │
   ├─ HIT → return response
   └─ MISS → KoboldCPPService.generateNPCResponse()
                     │
                     ▼
            ConversationManager (store history)
                     │
                     ▼
            response broadcast to room
```

---

## 6) Data Access Flow

```
CommandProcessorService
        │
        ▼
RoomService → DatabaseService → SQLite
```

---

This visual guide complements BUILD.md and PROJECT_CODING_GUIDE.md.
