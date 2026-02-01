import path from 'path';
import { GameEngine } from './core/GameEngine';
import { DatabaseService } from './services/DatabaseService';
import { RoomService } from './services/RoomService';
import { WorldInitializer } from './services/WorldInitializer';
import { CommandProcessorService } from './services/CommandProcessorService';
import { CachingService } from './services/CachingService';
import { KoboldCPPService } from './services/KoboldCPPService';
import { ConversationManager } from './services/ConversationManager';
import { NPCPersonalityBuilder } from './services/NPCPersonalityBuilder';
import { SessionStateService } from './services/SessionStateService';
import { WorldDataService } from './services/WorldDataService';
import { GameServer } from './network/GameServer';
import { CombatSystem } from './systems/CombatSystem';
import { NPCSchedulingSystem } from './systems/NPCSchedulingSystem';

/**
 * Main entry point for LLMRPG MUD server
 * Execution order: Scaffold → ECS → Database → Rooms → World → Commands → Socket.IO → Combat → NPC Scheduling → AI
 */
async function main() {
	console.log('=== LLMRPG MUD Server ===');
	console.log('Starting server initialization...\n');

	try {
		// 1. Initialize Database
		console.log('[1/10] Connecting to database...');
		const dbPath = path.join(__dirname, '../../database/world.db');
		const db = new DatabaseService(dbPath);
		await db.connect();

		// 2. Initialize Services
		console.log('[2/10] Initializing services...');
		const sessionState = new SessionStateService();
		const roomService = new RoomService(db, sessionState);
		const cachingService = new CachingService(db);
		const koboldService = new KoboldCPPService(); // localhost:5001
		const conversationManager = new ConversationManager(db);
		const personalityBuilder = new NPCPersonalityBuilder();

		const worldDataUrl = process.env.WORLD_DATA_URL?.trim();
		const worldDataService = worldDataUrl ? new WorldDataService(worldDataUrl) : undefined;
		if (worldDataService) {
			console.log(`  ✓ Remote world data enabled: ${worldDataUrl}`);
		} else {
			console.log('  ℹ Using local database world data');
		}

		// Check KoboldCPP availability (non-blocking)
		const koboldAvailable = await koboldService.healthCheck();
		if (koboldAvailable) {
			console.log('  ✓ KoboldCPP connection successful');
		} else {
			console.warn('  ⚠ KoboldCPP not available (AI features disabled)');
		}

		// 3. Initialize Game Engine
		console.log('[3/10] Initializing game engine...');
		const gameEngine = new GameEngine();

		// 4. Initialize Systems
		console.log('[4/10] Registering systems...');
		const combatSystem = new CombatSystem(sessionState);
		const npcSchedulingSystem = new NPCSchedulingSystem(roomService);

		gameEngine.registerSystem(combatSystem);
		gameEngine.registerSystem(npcSchedulingSystem);

		// 5. Initialize World
		console.log('[5/10] Loading world data...');
		const worldInitializer = new WorldInitializer(gameEngine, db, roomService, worldDataService);
		await worldInitializer.initialize();

		// 6. Initialize Command Processor
		console.log('[6/10] Initializing command processor...');
		const commandProcessor = new CommandProcessorService(gameEngine, roomService);

		// 7. Initialize Game Server
		console.log('[7/10] Initializing game server...');
		const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
		const gameServer = new GameServer(port, gameEngine, commandProcessor);

		// 8. Start Game Engine
		console.log('[8/10] Starting game engine (30 FPS)...');
		gameEngine.start();

		// 9. Start Game Server
		console.log('[9/10] Starting game server...');
		gameServer.start();

		// 10. Server Ready
		console.log('[10/10] Server initialization complete!\n');
		console.log('======================');
		console.log(`Server running on: http://localhost:${port}`);
		console.log(`Game engine: 30 FPS`);
		console.log(`KoboldCPP: ${koboldAvailable ? 'Connected' : 'Disconnected'}`);
		console.log('======================\n');
		console.log('Ready for connections...');

		// Graceful shutdown
		process.on('SIGINT', async () => {
			console.log('\nShutting down gracefully...');
			gameEngine.stop();
			gameServer.stop();
			await db.close();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			console.log('\nShutting down gracefully...');
			gameEngine.stop();
			gameServer.stop();
			await db.close();
			process.exit(0);
		});
	} catch (error) {
		console.error('Fatal error during server initialization:', error);
		process.exit(1);
	}
}

// Start the server
main();
