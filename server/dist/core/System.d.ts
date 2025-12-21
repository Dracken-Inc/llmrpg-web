/**
 * ECS Core: System base class
 */
import { Entity } from './Entity';
export declare abstract class System {
    protected entities: Entity[];
    abstract update(deltaTime: number): void;
    addEntity(entity: Entity): void;
    removeEntity(entityId: number): void;
    getEntities(): Entity[];
    clear?(): void;
}
//# sourceMappingURL=System.d.ts.map