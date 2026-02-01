# BUILD – Full Rebuild Instructions (Actionable)

This guide contains **step‑by‑step commands and file contents** to rebuild the project from a clean slate. Follow in order.

**Keep:** [content/](content/) photos. **Do not delete.**

**Read order:**
1) .github/copilot-instructions.md
2) README.md
3) BUILD.md (this file)
4) PROJECT_CODING_GUIDE.md
5) VISUAL_GUIDE.md

---

## 0) Technical Prep & Setup (Required)

Install these first:
- Node.js 18+ (LTS)
- npm 9+
- Git
- SQLite3 CLI
- VS Code (recommended)
- (Optional) Docker Desktop for KoboldCPP container

Windows build prerequisites (required for native deps like `sqlite3`):
- **Microsoft C++ Build Tools** (Desktop development with C++)
- **Python 3.10+** (for node-gyp)

Verify installs:
```
node -v
npm -v
git --version
sqlite3 --version
```

Recommended VS Code extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- SQLite Viewer (optional)

---

## 1) Create Project Folders

From the repo root:

```
mkdir server
mkdir database
```

---

## 2) Server Setup (Node + Express + Socket.IO + TS)

### 2.1 Initialize
```
cd server
npm init -y
```

### 2.2 Install Dependencies
```
npm install express socket.io sqlite3
npm install -D typescript ts-node ts-node-dev @types/node @types/express
```

### 2.3 Add tsconfig.json
Create `server/tsconfig.json`:
```
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "CommonJS",
		"lib": ["ES2020"],
		"outDir": "dist",
		"rootDir": "src",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true
	},
	"include": ["src"]
}
```

### 2.4 Add Scripts
Edit `server/package.json` to include:
```
"scripts": {
	"build": "tsc",
	"dev": "ts-node-dev --respawn --transpile-only src/index.ts",
	"start": "node dist/index.js"
}
```

### 2.5 Create Server Skeleton
Create folders:
```
mkdir src
mkdir src\core
mkdir src\components
mkdir src\systems
mkdir src\services
mkdir src\network
```

Create `server/src/index.ts`:
```
import { GameServer } from './network/GameServer';

const server = new GameServer(3001);
server.start();
```

Create `server/src/network/GameServer.ts`:
```
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

export class GameServer {
	private app = express();
	private httpServer = http.createServer(this.app);
	private io = new Server(this.httpServer, { cors: { origin: 'http://localhost:3000' } });

	constructor(private port: number) {}

	start() {
		this.io.on('connection', (socket) => {
			socket.on('joinSession', () => {
				socket.emit('commandResult', { type: 'system', text: 'Session joined.' });
			});
		});

		this.httpServer.listen(this.port, () => {
			console.log(`Server running on http://localhost:${this.port}`);
		});
	}
}
```

---

## 3) Client Setup (React + TypeScript via Vite)

### 3.1 Scaffold with Vite
From repo root:
```
npm create vite@latest client -- --template react-ts
```

### 3.2 Install Dependencies
```
cd client
npm install
npm install socket.io-client
```

### 3.3 Minimal Terminal UI
Replace `client/src/App.tsx` with:
```
import React, { useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export const App: React.FC = () => {
	const [log, setLog] = useState<string[]>([]);

	const sendCommand = (command: string) => {
		socket.emit('joinSession');
		setLog((prev) => [...prev, `> ${command}`]);
	};

	return (
		<div style={{ fontFamily: 'monospace', padding: 16 }}>
			<h1>LLMRPG MUD</h1>
			<button onClick={() => sendCommand('look')}>look</button>
			<pre>{log.join('\n')}</pre>
		</div>
	);
};
```

---

## 4) Database Setup

### 4.1 Create Schema
Create `database/schema.sql`:
```
CREATE TABLE rooms (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	region TEXT,
	coords TEXT,
	flags TEXT
);

CREATE TABLE npcs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	room_id TEXT NOT NULL,
	schedule_id TEXT,
	personality TEXT
);

CREATE TABLE exits (
	id TEXT PRIMARY KEY,
	from_room_id TEXT NOT NULL,
	to_room_id TEXT NOT NULL,
	direction TEXT NOT NULL,
	is_locked INTEGER DEFAULT 0
);

CREATE TABLE characters (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	room_id TEXT NOT NULL,
	stats TEXT,
	hp INTEGER,
	inventory TEXT
);

CREATE TABLE conversation (
	npc_id TEXT NOT NULL,
	character_id TEXT NOT NULL,
	history_json TEXT NOT NULL,
	updated_at INTEGER NOT NULL,
	PRIMARY KEY (npc_id, character_id)
);
```

### 4.2 Initialize Database
```
sqlite3 database/world.db < database/schema.sql
```

---

## 5) Run Smoke Test

### 5.1 Server
```
cd server
npm run dev
```

### 5.2 Client
```
cd ..\client
npm run dev
```

---

## 6) Developer Tooling (Recommended)

- **DB Browser for SQLite** (inspect data quickly)
- **Postman/Insomnia** (if you add REST endpoints)
- **ESLint + Prettier** (formatting + lint)
- **ts-node-dev** (already used for server dev)

---

## 7) Next Steps (Implementation)

Now follow **PROJECT_CODING_GUIDE.md** to implement:
- ECS core
- Combat system
- NPC scheduling
- Command processor
- Socket.IO command flow
- KoboldCPP integration

---

**This BUILD.md is the only build guide.**
