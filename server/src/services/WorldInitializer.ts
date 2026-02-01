import { GameEngine } from '../core/GameEngine';
import { Entity } from '../core/Entity';
import { DatabaseService } from './DatabaseService';
import { RoomService, Room, NPC } from './RoomService';
import { WorldDataService } from './WorldDataService';
import {
	PositionComponent,
	CharacterComponent,
	NPCComponent,
	StatsComponent,
	HealthComponent,
	ComponentTypes,
} from '../components/CoreComponents';

/**
 * WorldInitializer - Loads world data from database into ECS
 * Validates room integrity and registers NPCs
 */
export class WorldInitializer {
	constructor(
		private gameEngine: GameEngine,
		private db: DatabaseService,
		private roomService: RoomService,
		private worldDataService?: WorldDataService
	) {}

	/**
	 * Initialize the game world
	 * - Load all rooms
	 * - Load all NPCs
	 * - Validate exit integrity
	 * - Create entities for NPCs
	 */
	async initialize(): Promise<void> {
		console.log('Starting world initialization...');

		const startTime = Date.now();

		// Seed world data (optional remote static data)
		if (this.worldDataService) {
			console.log('Seeding world data from remote source...');
			await this.worldDataService.seedDatabase(this.db);
			console.log('World data seeded from remote source');
		}

		// Load rooms
		const rooms = await this.loadRooms();
		console.log(`Loaded ${rooms.length} rooms`);

		// Validate exits
		await this.validateExits();
		console.log('Exit integrity validated');

		// Load NPCs
		const npcs = await this.loadNPCs();
		console.log(`Loaded ${npcs.length} NPCs`);

		const elapsed = Date.now() - startTime;
		console.log(`World initialization complete in ${elapsed}ms`);

		// Verify performance target (<5s)
		if (elapsed > 5000) {
			console.warn(`World initialization took ${elapsed}ms (target: <5000ms)`);
		}
	}

	/**
	 * Load all rooms from database
	 */
	private async loadRooms(): Promise<Room[]> {
		const rooms = await this.roomService.getAllRooms();

		if (rooms.length === 0) {
			console.warn('No rooms found in database. Creating starter room...');
			await this.createStarterRoom();
			return this.roomService.getAllRooms();
		}

		return rooms;
	}

	/**
	 * Load all NPCs from database and create entities
	 */
	private async loadNPCs(): Promise<NPC[]> {
		const npcs = await this.roomService.getAllNPCs();

		for (const npc of npcs) {
			this.createNPCEntity(npc);
		}

		return npcs;
	}

	/**
	 * Create an entity for an NPC
	 */
	private createNPCEntity(npc: NPC): Entity {
		const entity = new Entity(npc.id);

		// Position component
		const position: PositionComponent = {
			roomId: npc.room_id,
		};
		entity.addComponent(ComponentTypes.POSITION, position);

		// Character component
		const character: CharacterComponent = {
			name: npc.name,
			description: npc.description,
			isPlayer: false,
			level: npc.level || 1,
		};
		entity.addComponent(ComponentTypes.CHARACTER, character);

		// NPC component
		const npcComponent: NPCComponent = {
			personality: npc.personality || '',
			scheduleId: npc.schedule_id,
			greetRadius: npc.greet_radius || 0,
			respawnRoomId: npc.respawn_room_id || npc.room_id,
		};
		entity.addComponent(ComponentTypes.NPC, npcComponent);

		// Stats component (parse from JSON or use defaults)
		let stats: StatsComponent;
		if (npc.stats) {
			try {
				stats = JSON.parse(npc.stats);
			} catch {
				stats = this.getDefaultStats();
			}
		} else {
			stats = this.getDefaultStats();
		}
		entity.addComponent(ComponentTypes.STATS, stats);

		// Health component
		const health: HealthComponent = {
			current: npc.hp || 100,
			max: npc.max_hp || 100,
			isDead: false,
		};
		entity.addComponent(ComponentTypes.HEALTH, health);

		// Add entity to game engine
		this.gameEngine.addEntity(entity);

		return entity;
	}

	/**
	 * Validate that all exits point to valid rooms
	 */
	private async validateExits(): Promise<void> {
		const exits = await this.db.query<{ from_room_id: string; to_room_id: string; direction: string }>(
			'SELECT from_room_id, to_room_id, direction FROM exits'
		);

		const rooms = await this.roomService.getAllRooms();
		const roomIds = new Set(rooms.map((r) => r.id));

		const invalidExits: string[] = [];

		for (const exit of exits) {
			if (!roomIds.has(exit.from_room_id)) {
				invalidExits.push(`Exit from non-existent room: ${exit.from_room_id}`);
			}
			if (!roomIds.has(exit.to_room_id)) {
				invalidExits.push(`Exit to non-existent room: ${exit.to_room_id} (from ${exit.from_room_id}, direction: ${exit.direction})`);
			}
		}

		if (invalidExits.length > 0) {
			console.error('Invalid exits found:');
			invalidExits.forEach((msg) => console.error(`  - ${msg}`));
			throw new Error(`Found ${invalidExits.length} invalid exits`);
		}
	}

	/**
	 * Create a starter room if database is empty
	 */
	private async createStarterRoom(): Promise<void> {
		const roomId = 'room_start';
		await this.db.execute(
			`INSERT INTO rooms (id, name, description, region) VALUES (?, ?, ?, ?)`,
			[
				roomId,
				'The Town Square',
				'You stand in the center of a bustling town square. A fountain gurgles nearby, and cobblestone paths lead in various directions.',
				'Town',
			]
		);

		// Create a starter NPC
		await this.db.execute(
			`INSERT INTO npcs (id, name, description, room_id, personality) VALUES (?, ?, ?, ?, ?)`,
			[
				'npc_guard',
				'Town Guard',
				'A stern-looking guard keeps watch over the square.',
				roomId,
				'Serious and protective, the guard is dedicated to keeping the town safe.',
			]
		);

		console.log('Created starter room and NPC');
	}

	/**
	 * Get default stats for NPCs
	 */
	private getDefaultStats(): StatsComponent {
		return {
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10,
		};
	}
}
