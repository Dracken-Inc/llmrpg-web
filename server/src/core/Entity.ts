/**
 * Entity - Unique game object with a UUID and component map
 */
export class Entity {
	public readonly id: string;
	private components: Map<string, unknown> = new Map();

	constructor(id: string) {
		this.id = id;
	}

	addComponent<T>(name: string, component: T): void {
		this.components.set(name, component);
	}

	getComponent<T>(name: string): T | undefined {
		return this.components.get(name) as T | undefined;
	}

	hasComponent(name: string): boolean {
		return this.components.has(name);
	}

	removeComponent(name: string): void {
		this.components.delete(name);
	}

	getAllComponents(): Map<string, unknown> {
		return new Map(this.components);
	}
}
