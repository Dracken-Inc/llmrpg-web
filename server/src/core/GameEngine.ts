import { Entity } from './Entity';
import { System } from './System';

/**
 * GameEngine - Core ECS game loop running at 30 FPS
 */
export class GameEngine {
	private entities: Map<string, Entity> = new Map();
	private systems: System[] = [];
	private running = false;
	private lastUpdate = 0;
	private readonly targetFPS = 30;
	private readonly targetDelta = 1000 / this.targetFPS; // ~33.33ms

	/**
	 * Add an entity to the game world
	 */
	addEntity(entity: Entity): void {
		this.entities.set(entity.id, entity);
		
		// Register entity with all systems
		for (const system of this.systems) {
			system.addEntity(entity);
		}
	}

	/**
	 * Remove an entity from the game world
	 */
	removeEntity(entityId: string): void {
		const entity = this.entities.get(entityId);
		if (!entity) return;

		// Remove from all systems
		for (const system of this.systems) {
			system.removeEntity(entityId);
		}

		this.entities.delete(entityId);
	}

	/**
	 * Get an entity by ID
	 */
	getEntity(entityId: string): Entity | undefined {
		return this.entities.get(entityId);
	}

	/**
	 * Get all entities
	 */
	getAllEntities(): Entity[] {
		return Array.from(this.entities.values());
	}

	/**
	 * Register a system with the game engine
	 */
	registerSystem(system: System): void {
		this.systems.push(system);

		// Add existing entities to the new system
		for (const entity of this.entities.values()) {
			system.addEntity(entity);
		}
	}

	/**
	 * Start the game loop
	 */
	start(): void {
		if (this.running) return;

		this.running = true;
		this.lastUpdate = Date.now();
		this.gameLoop();
		console.log(`GameEngine started (${this.targetFPS} FPS target)`);
	}

	/**
	 * Stop the game loop
	 */
	stop(): void {
		this.running = false;
		console.log('GameEngine stopped');
	}

	/**
	 * Main game loop - runs at 30 FPS
	 */
	private async gameLoop(): Promise<void> {
		if (!this.running) return;

		const now = Date.now();
		const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
		this.lastUpdate = now;

		// Update all systems
		try {
			await this.updateSystems(deltaTime);
		} catch (error) {
			console.error('Error in game loop:', error);
		}

		// Schedule next tick
		const elapsed = Date.now() - now;
		const delay = Math.max(0, this.targetDelta - elapsed);
		setTimeout(() => this.gameLoop(), delay);
	}

	/**
	 * Update all registered systems
	 */
	private async updateSystems(deltaTime: number): Promise<void> {
		for (const system of this.systems) {
			try {
				await system.update(deltaTime);
			} catch (error) {
				console.error(`Error updating system ${system.constructor.name}:`, error);
			}
		}
	}

	/**
	 * Get current FPS (diagnostic)
	 */
	getCurrentFPS(): number {
		return this.targetFPS;
	}
}
