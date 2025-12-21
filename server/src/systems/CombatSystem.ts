import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { InCombat, Health, CharacterStats, Position, IsPlayer, IsNPC, Name } from '../components/CoreComponents';
import { CombatResolver, DiceRoller, CombatRules } from '../rules/CombatRules';

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

export class CombatSystem extends System {
  private combats = new Map<string, CombatState>();
  private combatLogs = new Map<string, CombatLog[]>();
  private nextCombatId = 1;

  update(deltaTime: number): void {
    // Process active combats
    for (const [combatId, combat] of this.combats) {
      if (combat.isActive) {
        this.processCombatRound(combatId, combat);
      }
    }
  }

  startCombat(combatantEntities: Entity[]): string {
    const combatId = `combat_${this.nextCombatId++}`;
    const combatants: CombatParticipant[] = [];

    // Initialize combatants with initiative rolls
    for (const entity of combatantEntities) {
      let inCombat = entity.getComponent(InCombat);
      if (!inCombat) {
        inCombat = new InCombat(combatId, 0, 0);
        entity.addComponent(inCombat);
      }

      const stats = entity.getComponent(CharacterStats);
      const dexModifier = stats ? stats.getDexModifier() : 0;
      const initiativeRoll = CombatRules.rollInitiative(dexModifier);

      const name = entity.getComponent(Name);
      const isPlayer = entity.getComponent(IsPlayer);

      combatants.push({
        entityId: entity.id,
        initiativeRoll,
        turnIndex: 0
      });

      this.addEntity(entity);
    }

    // Sort by initiative (highest first)
    combatants.sort((a, b) => b.initiativeRoll - a.initiativeRoll);

    const combat: CombatState = {
      combatId,
      combatants,
      currentRound: 1,
      currentTurnIndex: 0,
      isActive: true,
      startTime: Date.now()
    };

    this.combats.set(combatId, combat);
    this.combatLogs.set(combatId, []);

    // Log combat start
    this.logCombat(combatId, `Combat started! ${combatants.length} combatants rolled initiative.`);

    for (const combatant of combatants) {
      const entity = this.getEntityById(combatant.entityId);
      if (entity) {
        const nameComponent = entity.getComponent(Name);
        const name = nameComponent ? nameComponent.value : `Entity ${entity.id}`;
        this.logCombat(combatId, `${name} rolls initiative: ${combatant.initiativeRoll}`);
      }
    }

    return combatId;
  }

  endCombat(combatId: string): void {
    const combat = this.combats.get(combatId);
    if (!combat) return;

    combat.isActive = false;
    this.logCombat(combatId, 'Combat ended.');

    // Remove InCombat component from all participants
    for (const combatant of combat.combatants) {
      const entity = this.getEntityById(combatant.entityId);
      if (entity && entity.hasComponent(InCombat)) {
        entity.removeComponent(InCombat);
      }
    }
  }

  getCurrentCombatant(combatId: string): CombatParticipant | undefined {
    const combat = this.combats.get(combatId);
    if (!combat) return undefined;
    return combat.combatants[combat.currentTurnIndex];
  }

  processTurn(combatId: string, action: CombatAction): AttackResolution | null {
    const combat = this.combats.get(combatId);
    if (!combat) return null;

    const currentCombatant = combat.combatants[combat.currentTurnIndex];
    const attacker = this.getEntityById(currentCombatant.entityId);

    if (!attacker) return null;

    const attackerStats = attacker.getComponent(CharacterStats);
    const attackerNameComponent = attacker.getComponent(Name);
    const attackerName = attackerNameComponent ? attackerNameComponent.value : `Entity ${attacker.id}`;

    if (action.type === 'attack') {
      const target = this.getEntityById(action.targetId!);
      if (!target) return null;

      const targetHealth = target.getComponent(Health);
      const targetNameComponent = target.getComponent(Name);
      const targetName = targetNameComponent ? targetNameComponent.value : `Entity ${target.id}`;

      // For now, assume AC 10 - TODO: add Armor component
      const targetAC = 10;
      const attackerModifier = attackerStats ? attackerStats.getStrModifier() : 0;

      const result = CombatResolver.resolveAttack(
        attackerName,
        attackerModifier,
        targetName,
        targetAC,
        'd8',
        attackerModifier
      );

      if (result.hit && targetHealth) {
        targetHealth.takeDamage(result.damage || 0);
      }

      this.logCombat(combatId, result.narrative);

      const resolution: AttackResolution = {
        success: true,
        message: result.narrative,
        targetId: action.targetId!,
        damage: result.damage || 0,
        critical: result.critical,
        fumble: result.fumble
      };

      this.advanceTurn(combatId);
      return resolution;
    }

    this.advanceTurn(combatId);
    return {
      success: true,
      message: `${attackerName} takes a defensive stance.`,
      targetId: 0,
      damage: 0,
      critical: false,
      fumble: false
    };
  }

  private advanceTurn(combatId: string): void {
    const combat = this.combats.get(combatId);
    if (!combat) return;

    combat.currentTurnIndex = (combat.currentTurnIndex + 1) % combat.combatants.length;

    if (combat.currentTurnIndex === 0) {
      combat.currentRound++;
      this.logCombat(combatId, `--- Round ${combat.currentRound} ---`);
    }

    // Check for combat end (all enemies dead or all allies dead)
    const hasAliveEnemies = combat.combatants.some((c) => {
      const entity = this.getEntityById(c.entityId);
      const health = entity?.getComponent(Health);
      return health && health.isAlive();
    });

    if (!hasAliveEnemies) {
      this.endCombat(combatId);
    }
  }

  private processCombatRound(combatId: string, combat: CombatState): void {
    // This is called each update - actual turn processing happens via processTurn
    // Check for defeated combatants
    for (const combatant of combat.combatants) {
      const entity = this.getEntityById(combatant.entityId);
      const health = entity?.getComponent(Health);

      if (health && !health.isAlive()) {
        const nameComponent = entity?.getComponent(Name);
        const name = nameComponent ? nameComponent.value : `Entity ${entity?.id}`;
        this.logCombat(combatId, `${name} has been defeated!`);
      }
    }
  }

  private getEntityById(entityId: number): Entity | undefined {
    return this.entities.find((e) => e.id === entityId);
  }

  private logCombat(combatId: string, message: string): void {
    const logs = this.combatLogs.get(combatId) || [];
    const combat = this.combats.get(combatId);

    logs.push({
      timestamp: Date.now(),
      combatId,
      round: combat?.currentRound || 0,
      turn: combat?.currentTurnIndex || 0,
      message,
      combatantStates: this.getCombatantStates(combatId)
    });

    this.combatLogs.set(combatId, logs);
  }

  private getCombatantStates(combatId: string): CombatantState[] {
    const combat = this.combats.get(combatId);
    if (!combat) return [];

    return combat.combatants.map((c) => {
      const entity = this.getEntityById(c.entityId);
      const health = entity?.getComponent(Health);
      const isPlayer = entity?.getComponent(IsPlayer);
      const nameComponent = entity?.getComponent(Name);
      const name = nameComponent ? nameComponent.value : `Entity ${entity?.id}`;

      return {
        entityId: c.entityId,
        name,
        initiativeRoll: c.initiativeRoll,
        isPlayer: !!isPlayer,
        isAlive: health ? health.isAlive() : false,
        healthCurrent: health?.current || 0,
        healthMax: health?.max || 0
      };
    });
  }

  getCombatLog(combatId: string): CombatLog[] {
    return this.combatLogs.get(combatId) || [];
  }

  getCombatState(combatId: string): CombatState | undefined {
    return this.combats.get(combatId);
  }
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
