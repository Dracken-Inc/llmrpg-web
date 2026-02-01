import { DatabaseService } from './DatabaseService';
import { Exit, NPC, Room } from './RoomService';

export interface WorldSchedule {
	id: string;
	name: string;
	routines: unknown;
}

export interface WorldData {
	rooms: Room[];
	npcs: NPC[];
	exits: Exit[];
	schedules?: WorldSchedule[];
}

/**
 * WorldDataService - Loads static lore/world data from a remote URL
 * This data is used to seed the session database on startup.
 */
export class WorldDataService {
	constructor(private url: string) {}

	async load(): Promise<WorldData> {
		const response = await fetch(this.url, {
			method: 'GET',
			headers: { 'Accept': 'application/json' },
		});

		if (!response.ok) {
			throw new Error(`World data fetch failed: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as WorldData;

		if (!data || !Array.isArray(data.rooms) || !Array.isArray(data.npcs) || !Array.isArray(data.exits)) {
			throw new Error('World data is missing required arrays: rooms, npcs, exits');
		}

		return data;
	}

	/**
	 * Seed the session database with remote world data
	 * This resets all world tables to the default static data.
	 */
	async seedDatabase(db: DatabaseService): Promise<void> {
		const data = await this.load();

		await db.transaction(async (tx) => {
			// Clear existing session data
			await tx.execute('DELETE FROM conversation');
			await tx.execute('DELETE FROM combat_log');
			await tx.execute('DELETE FROM cache');
			await tx.execute('DELETE FROM characters');
			await tx.execute('DELETE FROM npcs');
			await tx.execute('DELETE FROM exits');
			await tx.execute('DELETE FROM schedules');
			await tx.execute('DELETE FROM rooms');

			// Insert rooms
			for (const room of data.rooms) {
				await tx.execute(
					`INSERT INTO rooms (id, name, description, region, coords, flags) VALUES (?, ?, ?, ?, ?, ?)`,
					[
						room.id,
						room.name,
						room.description,
						room.region || null,
						room.coords || null,
						room.flags || null,
					]
				);
			}

			// Insert schedules
			if (data.schedules && Array.isArray(data.schedules)) {
				for (const schedule of data.schedules) {
					await tx.execute(
						`INSERT INTO schedules (id, name, routines) VALUES (?, ?, ?)`,
						[
							schedule.id,
							schedule.name,
							JSON.stringify(schedule.routines ?? []),
						]
					);
				}
			}

			// Insert NPCs
			for (const npc of data.npcs) {
				await tx.execute(
					`INSERT INTO npcs (id, name, description, room_id, schedule_id, personality, stats, hp, max_hp, level, respawn_room_id, greet_radius)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						npc.id,
						npc.name,
						npc.description,
						npc.room_id,
						npc.schedule_id || null,
						npc.personality || null,
						npc.stats || null,
						npc.hp ?? null,
						npc.max_hp ?? null,
						npc.level ?? null,
						npc.respawn_room_id || null,
						npc.greet_radius ?? null,
					]
				);
			}

			// Insert exits
			for (const exit of data.exits) {
				await tx.execute(
					`INSERT INTO exits (id, from_room_id, to_room_id, direction, is_locked, key_item_id) VALUES (?, ?, ?, ?, ?, ?)`,
					[
						exit.id,
						exit.from_room_id,
						exit.to_room_id,
						exit.direction,
						exit.is_locked ?? 0,
						exit.key_item_id || null,
					]
				);
			}
		});
	}
}
