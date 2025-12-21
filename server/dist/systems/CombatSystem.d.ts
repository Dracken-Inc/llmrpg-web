import { System } from '../core/System';
import { Entity } from '../core/Entity';
export interface CombatantState {
    entityId: number;
    name: string;
    initiativeRoll: number;
    isPlayer: boolean;
    isAlive: boolean;
    healthCurrent: number;
    healthMax: number;
}
export interface CombatLog {
    timestamp: number;
    combatId: string;
    round: number;
    turn: number;
    message: string;
    combatantStates: CombatantState[];
}
export declare class CombatSystem extends System {
    private combats;
    private combatLogs;
    private nextCombatId;
    update(deltaTime: number): void;
    startCombat(combatantEntities: Entity[]): string;
    endCombat(combatId: string): void;
    getCurrentCombatant(combatId: string): CombatParticipant | undefined;
    processTurn(combatId: string, action: CombatAction): AttackResolution | null;
    private advanceTurn;
    private processCombatRound;
    private getEntityById;
    private logCombat;
    private getCombatantStates;
    getCombatLog(combatId: string): CombatLog[];
    getCombatState(combatId: string): CombatState | undefined;
}
interface CombatState {
    combatId: string;
    combatants: CombatParticipant[];
    currentRound: number;
    currentTurnIndex: number;
    isActive: boolean;
    startTime: number;
}
interface CombatParticipant {
    entityId: number;
    initiativeRoll: number;
    turnIndex: number;
}
export interface CombatAction {
    type: 'attack' | 'defend' | 'use-item' | 'cast-spell';
    targetId?: number;
    itemId?: string;
    spellId?: string;
}
export interface AttackResolution {
    success: boolean;
    message: string;
    targetId: number;
    damage: number;
    critical: boolean;
    fumble: boolean;
}
export {};
//# sourceMappingURL=CombatSystem.d.ts.map