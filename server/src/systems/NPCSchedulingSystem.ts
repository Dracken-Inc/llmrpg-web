import { System } from '../core/System';
import { Entity } from '../core/Entity';
import {
	PositionComponent,
	ScheduleComponent,
	NPCComponent,
	CharacterComponent,
	ComponentTypes,
} from '../components/CoreComponents';
import { RoomService } from '../services/RoomService';

/**
 * NPCSchedulingSystem - Time-based NPC movement and greeting
 * - NPCs move based on schedules (0-1440 minutes)
 * - Proximity greetings
 * - Respawn behavior
 */
export class NPCSchedulingSystem extends System {
	private currentGameMinute = 0; // 0-1440 (one day cycle)
	private lastUpdateTime = Date.now();
	private timeScale = 60; // 1 real second = 60 game seconds (1 real min = 1 game hour)

	constructor(private roomService: RoomService) {
		super();
	}

	protected canProcess(entity: Entity): boolean {
		return (
			entity.hasComponent(ComponentTypes.NPC) &&
			entity.hasComponent(ComponentTypes.POSITION)
		);
	}

	async update(deltaTime: number): Promise<void> {
		// Update game time
		this.updateGameTime(deltaTime);

		// Process all NPCs
		for (const entity of this.getEntities()) {
			await this.processNPC(entity);
		}
	}

	/**
	 * Update game time (scaled)
	 */
	private updateGameTime(deltaTime: number): void {
		const now = Date.now();
		const realSecondsPassed = (now - this.lastUpdateTime) / 1000;
		this.lastUpdateTime = now;

		// Add scaled time to game clock
		const gameMinutesPassed = (realSecondsPassed * this.timeScale) / 60;
		this.currentGameMinute += gameMinutesPassed;

		// Wrap at 1440 minutes (24 hours)
		if (this.currentGameMinute >= 1440) {
			this.currentGameMinute = this.currentGameMinute % 1440;
		}
	}

	/**
	 * Process a single NPC
	 */
	private async processNPC(entity: Entity): Promise<void> {
		const schedule = entity.getComponent<ScheduleComponent>(ComponentTypes.SCHEDULE);
		const position = entity.getComponent<PositionComponent>(ComponentTypes.POSITION);
		const npc = entity.getComponent<NPCComponent>(ComponentTypes.NPC);

		if (!schedule || !position || !npc) return;

		// Find current routine
		const currentRoutine = schedule.routines.find(
			(routine) =>
				this.currentGameMinute >= routine.startMinute &&
				this.currentGameMinute < routine.endMinute
		);

		if (!currentRoutine) return;

		// Check if NPC needs to move
		if (position.roomId !== currentRoutine.roomId) {
			await this.moveNPCToRoom(entity, currentRoutine.roomId);
		}

		// Check for proximity greetings
		if (npc.greetRadius && npc.greetRadius > 0) {
			await this.checkProximityGreeting(entity);
		}
	}

	/**
	 * Move an NPC to a specific room
	 */
	private async moveNPCToRoom(entity: Entity, targetRoomId: string): Promise<void> {
		const position = entity.getComponent<PositionComponent>(ComponentTypes.POSITION);
		const character = entity.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);

		if (!position || !character) return;

		try {
			// Update room service
			await this.roomService.moveNPC(entity.id, targetRoomId);

			// Update position component
			position.roomId = targetRoomId;

			console.log(`[NPC] ${character.name} moved to ${targetRoomId}`);

			// TODO: Broadcast NPC movement to players in room
		} catch (error) {
			console.error(`Failed to move NPC ${entity.id}:`, error);
		}
	}

	/**
	 * Check if NPC should greet nearby players
	 */
	private async checkProximityGreeting(entity: Entity): Promise<void> {
		const position = entity.getComponent<PositionComponent>(ComponentTypes.POSITION);
		const npc = entity.getComponent<NPCComponent>(ComponentTypes.NPC);
		const character = entity.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);

		if (!position || !npc || !character) return;

		const now = Date.now();
		const greetCooldown = 60000; // 1 minute cooldown

		// Check if enough time has passed since last greeting
		if (npc.lastGreetTime && now - npc.lastGreetTime < greetCooldown) {
			return;
		}

		// TODO: Check if players are in the room
		// TODO: Generate greeting using AI service

		// Update last greet time
		npc.lastGreetTime = now;
	}

	/**
	 * Get current game time (for debugging)
	 */
	getCurrentGameTime(): { hours: number; minutes: number } {
		const totalMinutes = Math.floor(this.currentGameMinute);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return { hours, minutes };
	}

	/**
	 * Set game time (for testing)
	 */
	setGameTime(hours: number, minutes: number): void {
		this.currentGameMinute = hours * 60 + minutes;
	}

	/**
	 * Set time scale (default: 60 = 1 real second = 1 game minute)
	 */
	setTimeScale(scale: number): void {
		this.timeScale = scale;
	}
}
