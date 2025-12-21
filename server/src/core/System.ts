/**
 * ECS Core: System base class
 */

import { Entity } from './Entity';

export abstract class System {
  protected entities: Entity[] = [];

  abstract update(deltaTime: number): void;

  addEntity(entity: Entity): void {
    if (!this.entities.find(e => e.id === entity.id)) {
      this.entities.push(entity);
    }
  }

  removeEntity(entityId: number): void {
    this.entities = this.entities.filter(e => e.id !== entityId);
  }

  getEntities(): Entity[] {
    return this.entities;
  }
  clear?(): void {
    this.entities = [];
  }}
