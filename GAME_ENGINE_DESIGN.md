# Game Engine Design Document
## Gold Box / Neverwinter Nights AOL Style Turn-Based Text RPG

### Research Summary
Based on analysis of leading open-source projects:
- **Foundry VTT** (JavaScript/Node.js) - Virtual tabletop with turn-based combat
- **Fantasy Map Generator** (JavaScript/D3.js) - World generation and state management
- **Bevy Engine** (Rust) - ECS architecture for game logic
- **Godot Engine** (C++/GDScript) - Networking and multiplayer systems

---

## 1. Architecture Pattern: Entity-Component-System (ECS)

### Why ECS?
- **Data-Oriented Design**: Separates data (Components) from behavior (Systems)
- **Performance**: Cache-friendly memory layout, massively parallel processing
- **Flexibility**: Easy to add/remove features without deep inheritance
- **Proven Pattern**: Used by Bevy, Godot, Unity DOTS

### Core Concepts

#### **Entities**
```javascript
// Lightweight IDs that group components
const player = {
  id: 1,
  name: "Alice",
  components: [Position, Health, Inventory, CharacterStats]
};
```

#### **Components** (Pure Data)
```javascript
// Position Component
class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Health Component
class Health {
  constructor(current, max) {
    this.current = current;
    this.max = max;
  }
}

// CharacterStats Component
class CharacterStats {
  constructor(level, str, dex, con, int, wis, cha) {
    this.level = level;
    this.str = str;
    this.dex = dex;
    this.con = con;
    this.int = int;
    this.wis = wis;
    this.cha = cha;
  }
}
```

#### **Systems** (Pure Logic)
```javascript
// Movement System
class MovementSystem {
  update(entities) {
    entities
      .filter(e => e.has(Position) && e.has(Velocity))
      .forEach(entity => {
        const pos = entity.get(Position);
        const vel = entity.get(Velocity);
        pos.x += vel.x;
        pos.y += vel.y;
      });
  }
}

// Combat System
class CombatSystem {
  processTurn(attacker, defender) {
    const attackRoll = this.rollD20() + attacker.get(CharacterStats).str;
    const defenderAC = 10 + defender.get(CharacterStats).dex;
    
    if (attackRoll >= defenderAC) {
      const damage = this.rollDamage(attacker.get(Weapon));
      defender.get(Health).current -= damage;
      return { hit: true, damage };
    }
    return { hit: false };
  }
}
```

---

## 2. Network Architecture

### Comparison of Approaches

| Architecture | Pros | Cons | Best For |
|-------------|------|------|----------|
| **Peer-to-Peer (P2P)** | No server costs, direct connections | NAT traversal issues, host advantage | Small groups (2-4 players) |
| **Client-Server** | Authoritative, cheat-resistant | Server hosting required | Persistent worlds, larger groups |
| **Hybrid (Server Relay)** | Combines benefits, optional relay | More complex | Flexible deployment |

### Recommended: Socket.IO Client-Server with Optional P2P

#### Server Architecture (Foundry VTT / Godot Pattern)
```javascript
// server/GameServer.js
class GameServer {
  constructor() {
    this.io = require('socket.io')(3001);
    this.sessions = new Map(); // sessionId -> GameSession
    this.players = new Map();   // socketId -> Player
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
      
      // Session management
      socket.on('create-session', (data) => this.createSession(socket, data));
      socket.on('join-session', (data) => this.joinSession(socket, data));
      
      // Turn-based combat
      socket.on('submit-action', (data) => this.handleAction(socket, data));
      socket.on('end-turn', () => this.advanceTurn(socket));
      
      // Chat and narrative
      socket.on('chat-message', (msg) => this.broadcastChat(socket, msg));
      
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
  
  createSession(socket, { sessionName, maxPlayers = 4 }) {
    const sessionId = this.generateSessionId();
    const session = new GameSession(sessionId, sessionName, maxPlayers);
    session.addPlayer(socket.id);
    
    this.sessions.set(sessionId, session);
    this.players.set(socket.id, { sessionId, isHost: true });
    
    socket.emit('session-created', { sessionId, session: session.serialize() });
  }
  
  joinSession(socket, { sessionId, pin }) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return socket.emit('error', { message: 'Session not found' });
    }
    
    if (session.requiresPin && session.pin !== pin) {
      return socket.emit('error', { message: 'Invalid PIN' });
    }
    
    if (session.players.length >= session.maxPlayers) {
      return socket.emit('error', { message: 'Session full' });
    }
    
    session.addPlayer(socket.id);
    this.players.set(socket.id, { sessionId, isHost: false });
    
    // Notify all players
    this.io.to(sessionId).emit('player-joined', {
      playerId: socket.id,
      session: session.serialize()
    });
  }
  
  handleAction(socket, { action, target }) {
    const playerInfo = this.players.get(socket.id);
    const session = this.sessions.get(playerInfo.sessionId);
    
    if (session.currentTurn !== socket.id) {
      return socket.emit('error', { message: 'Not your turn' });
    }
    
    // Process action through combat system
    const result = session.combat.processAction(action, target);
    
    // Broadcast result to all players
    this.io.to(playerInfo.sessionId).emit('action-result', result);
  }
  
  advanceTurn(socket) {
    const playerInfo = this.players.get(socket.id);
    const session = this.sessions.get(playerInfo.sessionId);
    
    session.nextTurn();
    
    this.io.to(playerInfo.sessionId).emit('turn-changed', {
      currentTurn: session.currentTurn,
      round: session.round
    });
  }
}
```

#### Client Connection (Simple)
```javascript
// client/src/services/gameSocket.js
import io from 'socket.io-client';

class GameSocket {
  constructor() {
    this.socket = io('http://localhost:3001');
    this.setupListeners();
  }
  
  setupListeners() {
    this.socket.on('action-result', (result) => {
      // Update UI with combat result
      this.handleActionResult(result);
    });
    
    this.socket.on('turn-changed', ({ currentTurn, round }) => {
      // Update turn indicator
      this.updateTurnDisplay(currentTurn, round);
    });
  }
  
  createSession(sessionName) {
    this.socket.emit('create-session', { sessionName, maxPlayers: 4 });
  }
  
  joinSession(sessionId, pin) {
    this.socket.emit('join-session', { sessionId, pin });
  }
  
  submitAction(action, target) {
    this.socket.emit('submit-action', { action, target });
  }
  
  endTurn() {
    this.socket.emit('end-turn');
  }
}
```

---

## 3. Turn-Based Combat System (Gold Box Style)

### Combat Flow
```
1. Initiative Roll → Determines turn order
2. Player Turn Loop:
   a. Display Available Actions
   b. Wait for Player Input
   c. Execute Action
   d. Display Result Narrative
   e. Check for Combat End
3. Advance to Next Turn
4. Repeat until combat ends
```

### Implementation Pattern (Foundry VTT Inspired)
```javascript
// server/systems/CombatSystem.js
class CombatSystem {
  constructor() {
    this.combatants = [];
    this.currentTurn = 0;
    this.round = 1;
    this.isActive = false;
  }
  
  // Initialize combat with all participants
  initCombat(entities) {
    this.combatants = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      initiative: this.rollInitiative(entity),
      entity: entity
    }));
    
    // Sort by initiative (descending)
    this.combatants.sort((a, b) => b.initiative - a.initiative);
    this.isActive = true;
    this.currentTurn = 0;
    
    return this.combatants;
  }
  
  rollInitiative(entity) {
    const dexMod = Math.floor((entity.get(CharacterStats).dex - 10) / 2);
    return this.d20() + dexMod;
  }
  
  getCurrentCombatant() {
    return this.combatants[this.currentTurn];
  }
  
  nextTurn() {
    this.currentTurn++;
    
    if (this.currentTurn >= this.combatants.length) {
      this.currentTurn = 0;
      this.round++;
    }
    
    // Skip defeated combatants
    while (this.combatants[this.currentTurn].entity.get(Health).current <= 0) {
      this.currentTurn++;
      if (this.currentTurn >= this.combatants.length) {
        this.currentTurn = 0;
        this.round++;
      }
    }
    
    return this.getCurrentCombatant();
  }
  
  processAttack(attackerId, defenderId) {
    const attacker = this.combatants.find(c => c.id === attackerId).entity;
    const defender = this.combatants.find(c => c.id === defenderId).entity;
    
    const attackRoll = this.d20();
    const attackBonus = Math.floor((attacker.get(CharacterStats).str - 10) / 2);
    const totalAttack = attackRoll + attackBonus;
    
    const ac = 10 + Math.floor((defender.get(CharacterStats).dex - 10) / 2);
    
    if (totalAttack >= ac || attackRoll === 20) {
      // Hit! Roll damage
      const damageRoll = this.d6(); // Simplified
      const damageBonus = Math.floor((attacker.get(CharacterStats).str - 10) / 2);
      const totalDamage = damageRoll + damageBonus;
      
      defender.get(Health).current -= totalDamage;
      
      return {
        hit: true,
        critical: attackRoll === 20,
        attackRoll,
        totalAttack,
        damage: totalDamage,
        narrative: `${attacker.name} strikes ${defender.name} for ${totalDamage} damage!`
      };
    } else {
      return {
        hit: false,
        attackRoll,
        totalAttack,
        narrative: `${attacker.name}'s attack misses ${defender.name}!`
      };
    }
  }
  
  d20() { return Math.floor(Math.random() * 20) + 1; }
  d6() { return Math.floor(Math.random() * 6) + 1; }
}
```

---

## 4. UI Architecture (Gold Box Text-First Style)

### Component Structure
```
CombatView
├── CombatLog (scrolling text narrative)
├── ActionMenu (menu-driven commands)
├── PartyRoster (character portraits + HP)
├── TurnIndicator (whose turn it is)
└── TacticalGrid (optional ASCII/simple grid)
```

### Example: Combat Log Component
```jsx
// client/src/components/CombatLog.jsx
import React, { useEffect, useRef } from 'react';
import './CombatLog.css';

export default function CombatLog({ entries }) {
  const logRef = useRef(null);
  
  useEffect(() => {
    // Auto-scroll to bottom on new entry
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);
  
  return (
    <div className="combat-log" ref={logRef}>
      {entries.map((entry, i) => (
        <div key={i} className={`log-entry ${entry.type}`}>
          <span className="log-timestamp">[Round {entry.round}, Turn {entry.turn}]</span>
          <span className="log-text">{entry.narrative}</span>
          {entry.rolls && (
            <span className="log-rolls">
              (Rolled: {entry.rolls.join(', ')})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example: Action Menu Component (Gold Box Style)
```jsx
// client/src/components/ActionMenu.jsx
import React, { useState } from 'react';
import './ActionMenu.css';

export default function ActionMenu({ character, enemies, onAction }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  
  const actions = [
    { id: 'attack', name: 'Attack', requiresTarget: true },
    { id: 'cast-spell', name: 'Cast Spell', requiresTarget: true },
    { id: 'use-item', name: 'Use Item', requiresTarget: false },
    { id: 'defend', name: 'Defend', requiresTarget: false },
    { id: 'end-turn', name: 'End Turn', requiresTarget: false }
  ];
  
  const handleActionSelect = (action) => {
    setSelectedAction(action);
    if (!action.requiresTarget) {
      onAction(action.id, null);
      setSelectedAction(null);
    }
  };
  
  const handleTargetSelect = (target) => {
    if (selectedAction && selectedAction.requiresTarget) {
      onAction(selectedAction.id, target.id);
      setSelectedAction(null);
      setSelectedTarget(null);
    }
  };
  
  return (
    <div className="action-menu">
      <h3>{character.name}'s Turn</h3>
      
      {!selectedAction ? (
        <div className="action-list">
          <p>Select Action:</p>
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action)}
              className="action-button"
            >
              {action.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="target-list">
          <p>Select Target:</p>
          {enemies.map(enemy => (
            <button
              key={enemy.id}
              onClick={() => handleTargetSelect(enemy)}
              className="target-button"
              disabled={enemy.health <= 0}
            >
              {enemy.name} (HP: {enemy.health}/{enemy.maxHealth})
            </button>
          ))}
          <button onClick={() => setSelectedAction(null)} className="cancel-button">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. State Management Pattern

### Recommended: Context + Reducer Pattern
```javascript
// client/src/context/GameContext.jsx
import React, { createContext, useReducer, useEffect } from 'react';
import gameSocket from '../services/gameSocket';

const GameContext = createContext();

const initialState = {
  session: null,
  combat: {
    active: false,
    combatants: [],
    currentTurn: null,
    round: 1
  },
  log: [],
  myCharacter: null
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SESSION_JOINED':
      return { ...state, session: action.payload };
      
    case 'COMBAT_STARTED':
      return {
        ...state,
        combat: {
          active: true,
          combatants: action.payload.combatants,
          currentTurn: action.payload.currentTurn,
          round: 1
        }
      };
      
    case 'TURN_CHANGED':
      return {
        ...state,
        combat: {
          ...state.combat,
          currentTurn: action.payload.currentTurn,
          round: action.payload.round
        }
      };
      
    case 'ACTION_RESULT':
      return {
        ...state,
        log: [...state.log, action.payload]
      };
      
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  useEffect(() => {
    // Connect socket listeners to dispatch
    gameSocket.on('session-joined', (data) => {
      dispatch({ type: 'SESSION_JOINED', payload: data });
    });
    
    gameSocket.on('combat-started', (data) => {
      dispatch({ type: 'COMBAT_STARTED', payload: data });
    });
    
    gameSocket.on('turn-changed', (data) => {
      dispatch({ type: 'TURN_CHANGED', payload: data });
    });
    
    gameSocket.on('action-result', (data) => {
      dispatch({ type: 'ACTION_RESULT', payload: data });
    });
  }, []);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export default GameContext;
```

---

## 6. Data Persistence Strategy

### Database Schema (PostgreSQL Recommended for Production)

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Characters
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(50) NOT NULL,
  level INTEGER DEFAULT 1,
  str INTEGER DEFAULT 10,
  dex INTEGER DEFAULT 10,
  con INTEGER DEFAULT 10,
  int INTEGER DEFAULT 10,
  wis INTEGER DEFAULT 10,
  cha INTEGER DEFAULT 10,
  current_hp INTEGER DEFAULT 10,
  max_hp INTEGER DEFAULT 10,
  inventory JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  host_user_id INTEGER REFERENCES users(id),
  max_players INTEGER DEFAULT 4,
  pin VARCHAR(6),
  state JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session Players
CREATE TABLE session_players (
  session_id UUID REFERENCES sessions(id),
  character_id INTEGER REFERENCES characters(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, character_id)
);
```

### During Development: JSON Files
```javascript
// server/managers/sessionManager.js
const fs = require('fs').promises;
const path = require('path');

class SessionManager {
  constructor() {
    this.sessionsPath = path.join(__dirname, '../db/sessions.json');
  }
  
  async loadSessions() {
    try {
      const data = await fs.readFile(this.sessionsPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return {};
    }
  }
  
  async saveSessions(sessions) {
    await fs.writeFile(this.sessionsPath, JSON.stringify(sessions, null, 2));
  }
}
```

---

## 7. Technology Stack Recommendation

### Core Stack (Validated for Turn-Based Text RPG)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js 18+ | Excellent for I/O-heavy multiplayer, mature ecosystem |
| **Language** | TypeScript | Type safety for complex game state, better IDE support |
| **Server Framework** | Express.js | Lightweight, well-documented, proven at scale |
| **Real-time** | Socket.IO | Automatic reconnection, room support, fallback transports |
| **Client Framework** | React 18 | Component architecture fits UI pattern, hooks for state |
| **State Management** | Context + useReducer | Built-in, no extra dependencies, sufficient for game state |
| **Database (Dev)** | JSON Files | Fast iteration, no setup, easy to inspect |
| **Database (Prod)** | PostgreSQL | ACID compliance, JSONB for flexible schemas, proven |
| **Testing** | Jest + Supertest | Comprehensive, fast, excellent mocking |
| **Build** | Vite (client) | Fast HMR, optimized builds, TypeScript support |

### Alternative Considerations

**If you need offline single-player:**
- Electron wrapper for desktop distribution
- LocalStorage/IndexedDB for save games

**If you need mobile support later:**
- React Native (share business logic)
- Progressive Web App (PWA)

---

## 8. Directory Structure (Refactored)

```
llmrpg-web/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── combat/
│   │   │   │   ├── CombatLog.jsx
│   │   │   │   ├── ActionMenu.jsx
│   │   │   │   ├── TurnIndicator.jsx
│   │   │   │   └── PartyRoster.jsx
│   │   │   ├── session/
│   │   │   │   ├── CreateSession.jsx
│   │   │   │   └── JoinSession.jsx
│   │   │   └── character/
│   │   │       ├── CharacterSheet.jsx
│   │   │       └── CharacterCreator.jsx
│   │   ├── context/
│   │   │   └── GameContext.jsx
│   │   ├── services/
│   │   │   └── gameSocket.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── core/
│   │   │   ├── Entity.ts
│   │   │   ├── Component.ts
│   │   │   └── System.ts
│   │   ├── components/
│   │   │   ├── Position.ts
│   │   │   ├── Health.ts
│   │   │   ├── CharacterStats.ts
│   │   │   └── Inventory.ts
│   │   ├── systems/
│   │   │   ├── CombatSystem.ts
│   │   │   ├── MovementSystem.ts
│   │   │   └── NarrativeSystem.ts
│   │   ├── network/
│   │   │   ├── GameServer.ts
│   │   │   ├── SessionManager.ts
│   │   │   └── PlayerManager.ts
│   │   ├── rules/
│   │   │   ├── DiceRoller.ts
│   │   │   ├── CombatRules.ts
│   │   │   └── ItemRules.ts
│   │   ├── managers/
│   │   │   ├── characterManager.ts
│   │   │   ├── campaignManager.ts
│   │   │   └── userManager.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── sessions.json
│   │   ├── characters.json
│   │   └── users.json
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   └── types/
│       ├── Character.ts
│       ├── Session.ts
│       └── Combat.ts
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── GAME_RULES.md
├── package.json
└── README.md
```

---

## 9. Implementation Phases

### Phase 1: TypeScript Migration (1-2 weeks)
- [ ] Install TypeScript and types
- [ ] Convert core managers to TypeScript
- [ ] Define shared type interfaces
- [ ] Update build process

### Phase 2: ECS Foundation (2-3 weeks)
- [ ] Implement Entity/Component/System base classes
- [ ] Create core components (Position, Health, Stats)
- [ ] Build CombatSystem with turn-based logic
- [ ] Write unit tests for systems

### Phase 3: Socket.IO Multiplayer (2 weeks)
- [ ] Refactor server to GameServer pattern
- [ ] Implement SessionManager
- [ ] Add create/join session flows
- [ ] Test with multiple clients

### Phase 4: Gold Box UI (2-3 weeks)
- [ ] Build CombatLog component
- [ ] Build ActionMenu component
- [ ] Build PartyRoster component
- [ ] Integrate with GameContext

### Phase 5: Combat Flow (2 weeks)
- [ ] Initiative system
- [ ] Turn order tracking
- [ ] Action processing
- [ ] Result narratives

### Phase 6: Polish & Deploy (1-2 weeks)
- [ ] Database migration (JSON → PostgreSQL)
- [ ] Deployment configs (Railway/Render)
- [ ] Error handling and edge cases
- [ ] Documentation

---

## 10. Key Takeaways from Research

### From Foundry VTT (JavaScript)
- **Combat Tracker Pattern**: Separate UI from logic, use events for state changes
- **Document-Based Architecture**: Everything is a "Document" (Actor, Item, Scene) with consistent CRUD
- **Module System**: Extensibility through plugins, hook system for events
- **Socket Architecture**: System-level dedicated channels, relay messages for efficiency

### From Fantasy Map Generator (JavaScript/D3)
- **Procedural Generation**: Use seed-based randomization for reproducibility
- **State Serialization**: Store complete world state as JSONB for save/load
- **Canvas Rendering**: Optimize for many entities with canvas layers
- **Data Structures**: Use typed arrays (Uint8Array, Float32Array) for performance

### From Bevy Engine (Rust)
- **ECS Architecture**: Separate data (Components) from logic (Systems) completely
- **Query Pattern**: Systems query for entities with specific component combinations
- **Schedule/Pipeline**: Systems run in parallel when dependencies allow
- **Resources**: Global state (like GameRules) separate from entity components

### From Godot Engine (C++/GDScript)
- **Scene Tree**: Hierarchical node structure for game objects
- **Multiplayer API**: Unified interface for peer-to-peer and client-server
- **RPC System**: Remote procedure calls for synchronized actions
- **Signal System**: Event-driven architecture for decoupling

---

## 11. Critical Design Decisions

### ✅ Stick with JavaScript/Node.js
**Reasons:**
- Turn-based gameplay doesn't need C++ performance
- Text-heavy UI benefits from web technologies
- Socket.IO perfect for multiplayer messaging
- Faster iteration and deployment
- Larger talent pool for contributors

### ✅ Adopt ECS Architecture
**Reasons:**
- Scales better than inheritance-based OOP
- Easier to add new features (just add components/systems)
- Cleaner separation of concerns
- Proven pattern in game development

### ✅ TypeScript for Type Safety
**Reasons:**
- Complex game state needs type checking
- Better IDE autocomplete and refactoring
- Catches bugs at compile time
- Documentation through types

### ✅ Socket.IO for Networking
**Reasons:**
- Built-in room support for sessions
- Automatic reconnection handling
- Event-based perfect for turn-based games
- Fallback transports for restrictive networks

### ✅ Text-First UI (Gold Box Style)
**Reasons:**
- Matches vision (SSI Gold Box / NWN AOL)
- Lower art requirements
- Faster to implement
- Accessible
- Focus on narrative and mechanics

---

## 12. Next Steps

1. **Review this design** with your team/vision
2. **Start TypeScript migration** (low-risk, high-value)
3. **Prototype ECS pattern** with simple combat scenario
4. **Build multiplayer prototype** with Socket.IO sessions
5. **Iterate UI** based on Gold Box aesthetic

---

## References

- [Foundry VTT GitHub](https://github.com/foundryvtt/foundryvtt) - Virtual Tabletop Architecture
- [Fantasy Map Generator](https://github.com/azgaar/fantasy-map-generator) - World Generation
- [Bevy Engine](https://github.com/bevyengine/bevy) - ECS Architecture
- [Godot Engine](https://github.com/godotengine/godot) - Multiplayer Networking
- [Socket.IO Documentation](https://socket.io/docs/) - Real-time Communication
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type System

---

**Document Version:** 1.0  
**Date:** December 20, 2024  
**Status:** Design Proposal  
**Next Review:** After Phase 1 (TypeScript Migration)
