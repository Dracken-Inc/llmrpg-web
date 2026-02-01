import { Entity } from './Entity';

/**
 * System - Base class for game logic systems
 * All systems operate on entities with specific components
 */
export abstract class System {
	protected entities: Map<string, Entity> = new Map();

	/**
	 * Add an entity to be managed by this system
	 */
	addEntity(entity: Entity): void {
		if (this.canProcess(entity)) {
			this.entities.set(entity.id, entity);
		}
	}

	/**
	 * Remove an entity from this system
	 */
	removeEntity(entityId: string): void {
		this.entities.delete(entityId);
	}

	/**
	 * Check if this system can process the given entity
	 * Override to define required components
	 */
	protected abstract canProcess(entity: Entity): boolean;

	/**
	 * Update system logic (called each game tick)
	 * @param deltaTime - Time elapsed since last update in seconds
	 */
	abstract update(deltaTime: number): Promise<void>;

	/**
	 * Get all entities managed by this system
	 */
	getEntities(): Entity[] {
		return Array.from(this.entities.values());
	}
}
