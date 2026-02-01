import { Entity } from '../core/Entity';
import { GameEngine } from '../core/GameEngine';
import {
	CharacterComponent,
	PositionComponent,
	SessionComponent,
	StatsComponent,
	HealthComponent,
	ComponentTypes,
} from '../components/CoreComponents';

/**
 * Player session data
 */
export interface PlayerSession {
	entityId: string;
	socketId: string;
	name: string;
	connectedAt: number;
}

/**
 * SessionManager - Manages player sessions and entities
 */
export class SessionManager {
	private sessions: Map<string, PlayerSession> = new Map(); // socketId -> session

	constructor(private gameEngine: GameEngine) {}

	/**
	 * Create a new player session and entity
	 * @param socketId - Socket.IO socket ID
	 * @param playerName - Player name
	 * @param startRoomId - Starting room ID
	 */
	createSession(socketId: string, playerName: string, startRoomId: string): PlayerSession {
		// Create player entity
		const entityId = `player_${socketId}`;
		const entity = new Entity(entityId);

		// Add Position component
		const position: PositionComponent = {
			roomId: startRoomId,
		};
		entity.addComponent(ComponentTypes.POSITION, position);

		// Add Character component
		const character: CharacterComponent = {
			name: playerName,
			description: 'An adventurer',
			isPlayer: true,
			level: 1,
			experience: 0,
		};
		entity.addComponent(ComponentTypes.CHARACTER, character);

		// Add Session component
		const session: SessionComponent = {
			socketId,
			connectedAt: Date.now(),
			lastCommandTime: Date.now(),
		};
		entity.addComponent(ComponentTypes.SESSION, session);

		// Add default Stats
		const stats: StatsComponent = {
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10,
		};
		entity.addComponent(ComponentTypes.STATS, stats);

		// Add Health
		const health: HealthComponent = {
			current: 100,
			max: 100,
			isDead: false,
		};
		entity.addComponent(ComponentTypes.HEALTH, health);

		// Add entity to game engine
		this.gameEngine.addEntity(entity);

		// Store session
		const playerSession: PlayerSession = {
			entityId,
			socketId,
			name: playerName,
			connectedAt: Date.now(),
		};
		this.sessions.set(socketId, playerSession);

		console.log(`Session created for ${playerName} (${socketId})`);

		return playerSession;
	}

	/**
	 * Remove a player session
	 * @param socketId - Socket.IO socket ID
	 */
	removeSession(socketId: string): void {
		const session = this.sessions.get(socketId);
		if (!session) return;

		// Remove entity from game engine
		this.gameEngine.removeEntity(session.entityId);

		// Remove session
		this.sessions.delete(socketId);

		console.log(`Session removed for ${session.name} (${socketId})`);
	}

	/**
	 * Get a session by socket ID
	 */
	getSession(socketId: string): PlayerSession | undefined {
		return this.sessions.get(socketId);
	}

	/**
	 * Get a player entity by socket ID
	 */
	getPlayerEntity(socketId: string): Entity | undefined {
		const session = this.sessions.get(socketId);
		if (!session) return undefined;
		return this.gameEngine.getEntity(session.entityId);
	}

	/**
	 * Get all active sessions
	 */
	getAllSessions(): PlayerSession[] {
		return Array.from(this.sessions.values());
	}

	/**
	 * Get player count
	 */
	getPlayerCount(): number {
		return this.sessions.size;
	}
}
