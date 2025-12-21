/**
 * Dice Rolling and Combat Rules
 */
export declare class DiceRoller {
    static d(sides: number, count?: number): number;
    static d20(): number;
    static d12(): number;
    static d10(): number;
    static d8(): number;
    static d6(): number;
    static d4(): number;
    static d2(): number;
    static parse(formula: string): number;
}
export declare class CombatRules {
    static rollInitiative(dexModifier: number): number;
    static calculateAttackRoll(attributeModifier: number): {
        roll: number;
        total: number;
    };
    static isCriticalHit(d20Roll: number): boolean;
    static isCriticalMiss(d20Roll: number): boolean;
    static calculateDamage(damageFormula: string, modifier?: number): number;
    static calculateAC(baseAC: number, dexModifier: number): number;
    static isHit(attackTotal: number, targetAC: number, isCritical: boolean): boolean;
}
export interface AttackResult {
    hit: boolean;
    critical: boolean;
    fumble: boolean;
    roll: number;
    attackTotal: number;
    damage?: number;
    narrative: string;
}
export declare class CombatResolver {
    static resolveAttack(attackerName: string, attackerModifier: number, targetName: string, targetAC: number, damageFormula?: string, damageModifier?: number): AttackResult;
}
//# sourceMappingURL=CombatRules.d.ts.map