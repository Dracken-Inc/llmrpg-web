import { DatabaseService } from './DatabaseService';
import { SessionStateService } from './SessionStateService';

/**
 * Room data structure
 */
export interface Room {
	id: string;
	name: string;
	description: string;
	region?: string;
	coords?: string;
	flags?: string;
}

/**
 * NPC data structure
 */
export interface NPC {
	id: string;
	name: string;
	description: string;
	room_id: string;
	schedule_id?: string;
	personality?: string;
	stats?: string;
	hp?: number;
	max_hp?: number;
	level?: number;
	respawn_room_id?: string;
	greet_radius?: number;
}

/**
 * Exit data structure
 */
export interface Exit {
	id: string;
	from_room_id: string;
	to_room_id: string;
	direction: string;
	is_locked: number;
	key_item_id?: string;
}

/**
 * Complete room state with NPCs and exits
 */
export interface RoomState {
	room: Room;
	npcs: NPC[];
	exits: Exit[];
	players: string[]; // Player entity IDs
}

/**
 * RoomService - Manages room queries and character movement
 * Performance target: <100ms for room queries
 */
export class RoomService {
	constructor(private db: DatabaseService, private sessionState?: SessionStateService) {}

	/**
	 * Get a room with NPCs and exits
	 * @param roomId - Room ID to fetch
	 */
	async getRoom(roomId: string): Promise<Room & { npcs: NPC[]; exits: Exit[] }> {
		const room = await this.db.queryOne<Room>(
			'SELECT * FROM rooms WHERE id = ?',
			[roomId]
		);

		if (!room) {
			throw new Error(`Room not found: ${roomId}`);
		}

		const npcs = await this.getNPCsInRoom(roomId);
		const exits = await this.getExits(roomId);

		return { ...room, npcs, exits };
	}

	/**
	 * Get all NPCs currently in a room
	 * @param roomId - Room ID
	 */
	async getNPCsInRoom(roomId: string): Promise<NPC[]> {
		const npcs = await this.db.query<NPC>(
			'SELECT * FROM npcs WHERE room_id = ?',
			[roomId]
		);

		if (!this.sessionState) {
			return npcs;
		}

		return npcs.filter((npc) => !this.sessionState!.isNpcDead(npc.id));
	}

	/**
	 * Get all exits from a room
	 * @param roomId - Room ID
	 */
	async getExits(roomId: string): Promise<Exit[]> {
		return this.db.query<Exit>(
			'SELECT * FROM exits WHERE from_room_id = ?',
			[roomId]
		);
	}

	/**
	 * Get complete room state (for command processing)
	 * @param roomId - Room ID
	 * @param playerIds - Player entity IDs in the room (from ECS)
	 */
	async getRoomState(roomId: string, playerIds: string[] = []): Promise<RoomState> {
		const room = await this.db.queryOne<Room>(
			'SELECT * FROM rooms WHERE id = ?',
			[roomId]
		);

		if (!room) {
			throw new Error(`Room not found: ${roomId}`);
		}

		const npcs = await this.getNPCsInRoom(roomId);
		const exits = await this.getExits(roomId);

		return {
			room,
			npcs,
			exits,
			players: playerIds,
		};
	}

	/**
	 * Move a character from one room to another
	 * Updates database for persistence
	 * @param characterId - Character entity ID
	 * @param fromId - Current room ID
	 * @param toId - Destination room ID
	 */
	async moveCharacter(characterId: string, fromId: string, toId: string): Promise<void> {
		// Verify destination room exists
		const targetRoom = await this.db.queryOne<Room>(
			'SELECT id FROM rooms WHERE id = ?',
			[toId]
		);

		if (!targetRoom) {
			throw new Error(`Destination room not found: ${toId}`);
		}

		// Update character location in database
		await this.db.execute(
			'UPDATE characters SET room_id = ? WHERE id = ?',
			[toId, characterId]
		);
	}

	/**
	 * Move an NPC from one room to another
	 * @param npcId - NPC ID
	 * @param toId - Destination room ID
	 */
	async moveNPC(npcId: string, toId: string): Promise<void> {
		// Verify destination room exists
		const targetRoom = await this.db.queryOne<Room>(
			'SELECT id FROM rooms WHERE id = ?',
			[toId]
		);

		if (!targetRoom) {
			throw new Error(`Destination room not found: ${toId}`);
		}

		// Update NPC location
		await this.db.execute(
			'UPDATE npcs SET room_id = ? WHERE id = ?',
			[toId, npcId]
		);
	}

	/**
	 * Get a room by direction from current room
	 * @param fromRoomId - Current room ID
	 * @param direction - Direction to move (north, south, east, west, up, down, etc.)
	 */
	async getRoomByDirection(fromRoomId: string, direction: string): Promise<Room | null> {
		const exit = await this.db.queryOne<Exit>(
			'SELECT * FROM exits WHERE from_room_id = ? AND direction = ?',
			[fromRoomId, direction.toLowerCase()]
		);

		if (!exit) {
			return null;
		}

		if (exit.is_locked) {
			throw new Error(`The ${direction} exit is locked`);
		}

		return this.db.queryOne<Room>(
			'SELECT * FROM rooms WHERE id = ?',
			[exit.to_room_id]
		);
	}

	/**
	 * Get all rooms (for world initialization)
	 */
	async getAllRooms(): Promise<Room[]> {
		return this.db.query<Room>('SELECT * FROM rooms');
	}

	/**
	 * Get all NPCs (for world initialization)
	 */
	async getAllNPCs(): Promise<NPC[]> {
		const npcs = await this.db.query<NPC>('SELECT * FROM npcs');

		if (!this.sessionState) {
			return npcs;
		}

		return npcs.filter((npc) => !this.sessionState!.isNpcDead(npc.id));
	}
}
