"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatSystem = void 0;
const System_1 = require("../core/System");
const CoreComponents_1 = require("../components/CoreComponents");
const CombatRules_1 = require("../rules/CombatRules");
class CombatSystem extends System_1.System {
    constructor() {
        super(...arguments);
        this.combats = new Map();
        this.combatLogs = new Map();
        this.nextCombatId = 1;
    }
    update(deltaTime) {
        // Process active combats
        for (const [combatId, combat] of this.combats) {
            if (combat.isActive) {
                this.processCombatRound(combatId, combat);
            }
        }
    }
    startCombat(combatantEntities) {
        const combatId = `combat_${this.nextCombatId++}`;
        const combatants = [];
        // Initialize combatants with initiative rolls
        for (const entity of combatantEntities) {
            let inCombat = entity.getComponent(CoreComponents_1.InCombat);
            if (!inCombat) {
                inCombat = new CoreComponents_1.InCombat(combatId, 0, 0);
                entity.addComponent(inCombat);
            }
            const stats = entity.getComponent(CoreComponents_1.CharacterStats);
            const dexModifier = stats ? stats.getDexModifier() : 0;
            const initiativeRoll = CombatRules_1.CombatRules.rollInitiative(dexModifier);
            const name = entity.getComponent(CoreComponents_1.Name);
            const isPlayer = entity.getComponent(CoreComponents_1.IsPlayer);
            combatants.push({
                entityId: entity.id,
                initiativeRoll,
                turnIndex: 0
            });
            this.addEntity(entity);
        }
        // Sort by initiative (highest first)
        combatants.sort((a, b) => b.initiativeRoll - a.initiativeRoll);
        const combat = {
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
                const nameComponent = entity.getComponent(CoreComponents_1.Name);
                const name = nameComponent ? nameComponent.value : `Entity ${entity.id}`;
                this.logCombat(combatId, `${name} rolls initiative: ${combatant.initiativeRoll}`);
            }
        }
        return combatId;
    }
    endCombat(combatId) {
        const combat = this.combats.get(combatId);
        if (!combat)
            return;
        combat.isActive = false;
        this.logCombat(combatId, 'Combat ended.');
        // Remove InCombat component from all participants
        for (const combatant of combat.combatants) {
            const entity = this.getEntityById(combatant.entityId);
            if (entity && entity.hasComponent(CoreComponents_1.InCombat)) {
                entity.removeComponent(CoreComponents_1.InCombat);
            }
        }
    }
    getCurrentCombatant(combatId) {
        const combat = this.combats.get(combatId);
        if (!combat)
            return undefined;
        return combat.combatants[combat.currentTurnIndex];
    }
    processTurn(combatId, action) {
        const combat = this.combats.get(combatId);
        if (!combat)
            return null;
        const currentCombatant = combat.combatants[combat.currentTurnIndex];
        const attacker = this.getEntityById(currentCombatant.entityId);
        if (!attacker)
            return null;
        const attackerStats = attacker.getComponent(CoreComponents_1.CharacterStats);
        const attackerNameComponent = attacker.getComponent(CoreComponents_1.Name);
        const attackerName = attackerNameComponent ? attackerNameComponent.value : `Entity ${attacker.id}`;
        if (action.type === 'attack') {
            const target = this.getEntityById(action.targetId);
            if (!target)
                return null;
            const targetHealth = target.getComponent(CoreComponents_1.Health);
            const targetNameComponent = target.getComponent(CoreComponents_1.Name);
            const targetName = targetNameComponent ? targetNameComponent.value : `Entity ${target.id}`;
            // For now, assume AC 10 - TODO: add Armor component
            const targetAC = 10;
            const attackerModifier = attackerStats ? attackerStats.getStrModifier() : 0;
            const result = CombatRules_1.CombatResolver.resolveAttack(attackerName, attackerModifier, targetName, targetAC, 'd8', attackerModifier);
            if (result.hit && targetHealth) {
                targetHealth.takeDamage(result.damage || 0);
            }
            this.logCombat(combatId, result.narrative);
            const resolution = {
                success: true,
                message: result.narrative,
                targetId: action.targetId,
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
    advanceTurn(combatId) {
        const combat = this.combats.get(combatId);
        if (!combat)
            return;
        combat.currentTurnIndex = (combat.currentTurnIndex + 1) % combat.combatants.length;
        if (combat.currentTurnIndex === 0) {
            combat.currentRound++;
            this.logCombat(combatId, `--- Round ${combat.currentRound} ---`);
        }
        // Check for combat end (all enemies dead or all allies dead)
        const hasAliveEnemies = combat.combatants.some((c) => {
            const entity = this.getEntityById(c.entityId);
            const health = entity?.getComponent(CoreComponents_1.Health);
            return health && health.isAlive();
        });
        if (!hasAliveEnemies) {
            this.endCombat(combatId);
        }
    }
    processCombatRound(combatId, combat) {
        // This is called each update - actual turn processing happens via processTurn
        // Check for defeated combatants
        for (const combatant of combat.combatants) {
            const entity = this.getEntityById(combatant.entityId);
            const health = entity?.getComponent(CoreComponents_1.Health);
            if (health && !health.isAlive()) {
                const nameComponent = entity?.getComponent(CoreComponents_1.Name);
                const name = nameComponent ? nameComponent.value : `Entity ${entity?.id}`;
                this.logCombat(combatId, `${name} has been defeated!`);
            }
        }
    }
    getEntityById(entityId) {
        return this.entities.find((e) => e.id === entityId);
    }
    logCombat(combatId, message) {
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
    getCombatantStates(combatId) {
        const combat = this.combats.get(combatId);
        if (!combat)
            return [];
        return combat.combatants.map((c) => {
            const entity = this.getEntityById(c.entityId);
            const health = entity?.getComponent(CoreComponents_1.Health);
            const isPlayer = entity?.getComponent(CoreComponents_1.IsPlayer);
            const nameComponent = entity?.getComponent(CoreComponents_1.Name);
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
    getCombatLog(combatId) {
        return this.combatLogs.get(combatId) || [];
    }
    getCombatState(combatId) {
        return this.combats.get(combatId);
    }
}
exports.CombatSystem = CombatSystem;
//# sourceMappingURL=CombatSystem.js.map