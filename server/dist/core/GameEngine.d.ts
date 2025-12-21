import { Entity } from './Entity';
import { CombatSystem } from '../systems/CombatSystem';
import { NarrativeSystem } from '../systems/NarrativeSystem';
export declare class GameEngine {
    private entities;
    private systems;
    private nextEntityId;
    private combatSystem;
    private narrativeSystem;
    private isRunning;
    private lastUpdateTime;
    private targetFPS;
    private targetFrameTime;
    constructor();
    start(): void;
    stop(): void;
    private gameLoop;
    createEntity(name?: string): Entity;
    getEntity(id: number): Entity | undefined;
    removeEntity(id: number): void;
    getAllEntities(): Entity[];
    getCombatSystem(): CombatSystem;
    getNarrativeSystem(): NarrativeSystem;
    getPlayerEntities(): Entity[];
    getNPCEntities(): Entity[];
    reset(): void;
    getState(): GameEngineState;
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
//# sourceMappingURL=GameEngine.d.ts.map