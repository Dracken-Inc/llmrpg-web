import { Entity } from './Entity';
import { System } from './System';
import { CombatSystem } from '../systems/CombatSystem';
import { NarrativeSystem } from '../systems/NarrativeSystem';
import { IsPlayer, IsNPC } from '../components/CoreComponents';

export class GameEngine {
  private entities = new Map<number, Entity>();
  private systems: System[] = [];
  private nextEntityId = 1;

  private combatSystem: CombatSystem;
  private narrativeSystem: NarrativeSystem;

  private isRunning = false;
  private lastUpdateTime = 0;
  private targetFPS = 30;
  private targetFrameTime = 1000 / this.targetFPS;

  constructor() {
    // Initialize all systems
    this.combatSystem = new CombatSystem();
    this.narrativeSystem = new NarrativeSystem();

    this.systems = [this.combatSystem, this.narrativeSystem];
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
    this.lastUpdateTime = now;

    // Update all systems
    for (const system of this.systems) {
      system.update(deltaTime);
    }

    // Schedule next frame
    setTimeout(() => this.gameLoop(), this.targetFrameTime);
  }

  createEntity(name?: string): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);

    // Register entity with all systems
    for (const system of this.systems) {
      system.addEntity(entity);
    }

    return entity;
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  removeEntity(id: number): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    // Unregister from all systems
    for (const system of this.systems) {
      system.removeEntity(id);
    }

    this.entities.delete(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  // System access
  getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  getNarrativeSystem(): NarrativeSystem {
    return this.narrativeSystem;
  }

  // Utility methods
  getPlayerEntities(): Entity[] {
    return this.getAllEntities().filter((e) => {
      return !!e.getComponent(IsPlayer);
    });
  }

  getNPCEntities(): Entity[] {
    return this.getAllEntities().filter((e) => {
      return !!e.getComponent(IsNPC);
    });
  }

  reset(): void {
    this.stop();
    this.entities.clear();
    this.nextEntityId = 1;

    // Clear system state
    for (const system of this.systems) {
      system.clear?.();
    }
  }

  getState(): GameEngineState {
    return {
      isRunning: this.isRunning,
      entityCount: this.entities.size,
      targetFPS: this.targetFPS,
      systems: this.systems.map((s) => ({
        name: s.constructor.name,
        entityCount: s.getEntities().length
      }))
    };
  }
}

export interface GameEngineState {
  isRunning: boolean;
  entityCount: number;
  targetFPS: number;
  systems: Array<{
    name: string;
    entityCount: number;
  }>;
}
