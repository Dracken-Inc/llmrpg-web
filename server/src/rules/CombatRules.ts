/**
 * Dice Rolling and Combat Rules
 */

export class DiceRoller {
  static d(sides: number, count: number = 1): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  }

  static d20(): number {
    return this.d(20);
  }

  static d12(): number {
    return this.d(12);
  }

  static d10(): number {
    return this.d(10);
  }

  static d8(): number {
    return this.d(8);
  }

  static d6(): number {
    return this.d(6);
  }

  static d4(): number {
    return this.d(4);
  }

  static d2(): number {
    return this.d(2);
  }

  static parse(formula: string): number {
    // Parse format like "2d6+3" or "d20"
    const match = formula.match(/^(\d*)d(\d+)(?:\+(\d+))?$/i);
    if (!match) throw new Error(`Invalid dice formula: ${formula}`);

    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const bonus = match[3] ? parseInt(match[3]) : 0;

    return this.d(sides, count) + bonus;
  }
}

export class CombatRules {
  static rollInitiative(dexModifier: number): number {
    return DiceRoller.d20() + dexModifier;
  }

  static calculateAttackRoll(attributeModifier: number): { roll: number; total: number } {
    const roll = DiceRoller.d20();
    const total = roll + attributeModifier;
    return { roll, total };
  }

  static isCriticalHit(d20Roll: number): boolean {
    return d20Roll === 20;
  }

  static isCriticalMiss(d20Roll: number): boolean {
    return d20Roll === 1;
  }

  static calculateDamage(damageFormula: string, modifier: number = 0): number {
    return DiceRoller.parse(damageFormula) + modifier;
  }

  static calculateAC(baseAC: number, dexModifier: number): number {
    return baseAC + dexModifier;
  }

  static isHit(attackTotal: number, targetAC: number, isCritical: boolean): boolean {
    if (isCritical) return true;
    return attackTotal >= targetAC;
  }
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

export class CombatResolver {
  static resolveAttack(
    attackerName: string,
    attackerModifier: number,
    targetName: string,
    targetAC: number,
    damageFormula: string = 'd8',
    damageModifier: number = 0
  ): AttackResult {
    const { roll, total } = CombatRules.calculateAttackRoll(attackerModifier);
    const critical = CombatRules.isCriticalHit(roll);
    const fumble = CombatRules.isCriticalMiss(roll);
    const hit = CombatRules.isHit(total, targetAC, critical);

    let damage = 0;
    let narrative = '';

    if (fumble) {
      narrative = `${attackerName} fumbles their attack! A critical miss!`;
    } else if (critical) {
      damage = CombatRules.calculateDamage(damageFormula, damageModifier) * 2;
      narrative = `${attackerName} lands a CRITICAL HIT on ${targetName} for ${damage} damage!`;
    } else if (hit) {
      damage = CombatRules.calculateDamage(damageFormula, damageModifier);
      narrative = `${attackerName} hits ${targetName} for ${damage} damage! (Roll: ${roll}, AC: ${targetAC})`;
    } else {
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
