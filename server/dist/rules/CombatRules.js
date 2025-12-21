"use strict";
/**
 * Dice Rolling and Combat Rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatResolver = exports.CombatRules = exports.DiceRoller = void 0;
class DiceRoller {
    static d(sides, count = 1) {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    }
    static d20() {
        return this.d(20);
    }
    static d12() {
        return this.d(12);
    }
    static d10() {
        return this.d(10);
    }
    static d8() {
        return this.d(8);
    }
    static d6() {
        return this.d(6);
    }
    static d4() {
        return this.d(4);
    }
    static d2() {
        return this.d(2);
    }
    static parse(formula) {
        // Parse format like "2d6+3" or "d20"
        const match = formula.match(/^(\d*)d(\d+)(?:\+(\d+))?$/i);
        if (!match)
            throw new Error(`Invalid dice formula: ${formula}`);
        const count = match[1] ? parseInt(match[1]) : 1;
        const sides = parseInt(match[2]);
        const bonus = match[3] ? parseInt(match[3]) : 0;
        return this.d(sides, count) + bonus;
    }
}
exports.DiceRoller = DiceRoller;
class CombatRules {
    static rollInitiative(dexModifier) {
        return DiceRoller.d20() + dexModifier;
    }
    static calculateAttackRoll(attributeModifier) {
        const roll = DiceRoller.d20();
        const total = roll + attributeModifier;
        return { roll, total };
    }
    static isCriticalHit(d20Roll) {
        return d20Roll === 20;
    }
    static isCriticalMiss(d20Roll) {
        return d20Roll === 1;
    }
    static calculateDamage(damageFormula, modifier = 0) {
        return DiceRoller.parse(damageFormula) + modifier;
    }
    static calculateAC(baseAC, dexModifier) {
        return baseAC + dexModifier;
    }
    static isHit(attackTotal, targetAC, isCritical) {
        if (isCritical)
            return true;
        return attackTotal >= targetAC;
    }
}
exports.CombatRules = CombatRules;
class CombatResolver {
    static resolveAttack(attackerName, attackerModifier, targetName, targetAC, damageFormula = 'd8', damageModifier = 0) {
        const { roll, total } = CombatRules.calculateAttackRoll(attackerModifier);
        const critical = CombatRules.isCriticalHit(roll);
        const fumble = CombatRules.isCriticalMiss(roll);
        const hit = CombatRules.isHit(total, targetAC, critical);
        let damage = 0;
        let narrative = '';
        if (fumble) {
            narrative = `${attackerName} fumbles their attack! A critical miss!`;
        }
        else if (critical) {
            damage = CombatRules.calculateDamage(damageFormula, damageModifier) * 2;
            narrative = `${attackerName} lands a CRITICAL HIT on ${targetName} for ${damage} damage!`;
        }
        else if (hit) {
            damage = CombatRules.calculateDamage(damageFormula, damageModifier);
            narrative = `${attackerName} hits ${targetName} for ${damage} damage! (Roll: ${roll}, AC: ${targetAC})`;
        }
        else {
            narrative = `${attackerName}'s attack misses ${targetName}. (Roll: ${roll}, AC: ${targetAC})`;
        }
        return {
            hit,
            critical,
            fumble,
            roll,
            attackTotal: total,
            damage: hit ? damage : 0,
            narrative
        };
    }
}
exports.CombatResolver = CombatResolver;
//# sourceMappingURL=CombatRules.js.map