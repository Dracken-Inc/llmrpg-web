import { System } from '../core/System';
import { Entity } from '../core/Entity';
import {
	CombatComponent,
	StatsComponent,
	HealthComponent,
	CharacterComponent,
	ComponentTypes,
	rollAttack,
	rollDamage,
	rollDie,
	calculateRoundtime,
} from '../components/CoreComponents';
import { SessionStateService } from '../services/SessionStateService';

/**
 * Active combat instance
 */
interface Combat {
	id: string;
	attackerId: string;
	defenderId: string;
	startTime: number;
	isActive: boolean;
}

/**
 * CombatSystem - GoMud-style real-time combat
 * - Real-time cooldowns (no turns)
 * - Roundtime = max(0.5, 6 - (DEX / 4)) seconds
 * - Attack roll = d20 + DEX mod
 * - Damage = d8 + STR mod
 * - Crit on natural 20 (2x damage)
 */
export class CombatSystem extends System {
	private combats: Map<string, Combat> = new Map();

	constructor(private sessionState?: SessionStateService) {
		super();
	}

	protected canProcess(entity: Entity): boolean {
		return entity.hasComponent(ComponentTypes.COMBAT);
	}

	async update(deltaTime: number): Promise<void> {
		const now = Date.now();

		// Process all entities in combat
		for (const entity of this.getEntities()) {
			const combat = entity.getComponent<CombatComponent>(ComponentTypes.COMBAT);
			if (!combat) continue;

			// Check if roundtime has elapsed
			const timeSinceLastAttack = (now - combat.lastAttackTime) / 1000;

			if (timeSinceLastAttack >= combat.roundtime) {
				// Resolve attack
				await this.resolveAttack(entity.id, combat.targetId);

				// Update last attack time
				combat.lastAttackTime = now;

				// Recalculate roundtime based on DEX
				const stats = entity.getComponent<StatsComponent>(ComponentTypes.STATS);
				if (stats) {
					combat.roundtime = calculateRoundtime(stats.dex);
				}
			}
		}
	}

	/**
	 * Start combat between two entities
	 */
	startCombat(attackerId: string, defenderId: string): string {
		const attacker = this.entities.get(attackerId);
		const defender = this.entities.get(defenderId);

		if (!attacker || !defender) {
			throw new Error('Invalid combat participants');
		}

		const combatId = `combat_${Date.now()}_${attackerId}`;

		// Add combat component to attacker
		const attackerStats = attacker.getComponent<StatsComponent>(ComponentTypes.STATS);
		const attackerCombat: CombatComponent = {
			combatId,
			targetId: defenderId,
			roundtime: calculateRoundtime(attackerStats?.dex || 10),
			lastAttackTime: Date.now(),
			isAttacker: true,
		};
		attacker.addComponent(ComponentTypes.COMBAT, attackerCombat);

		// Add combat component to defender
		const defenderStats = defender.getComponent<StatsComponent>(ComponentTypes.STATS);
		const defenderCombat: CombatComponent = {
			combatId,
			targetId: attackerId,
			roundtime: calculateRoundtime(defenderStats?.dex || 10),
			lastAttackTime: Date.now(),
			isAttacker: false,
		};
		defender.addComponent(ComponentTypes.COMBAT, defenderCombat);

		// Store combat instance
		const combat: Combat = {
			id: combatId,
			attackerId,
			defenderId,
			startTime: Date.now(),
			isActive: true,
		};
		this.combats.set(combatId, combat);

		console.log(`Combat started: ${combatId}`);

		return combatId;
	}

	/**
	 * Resolve an attack
	 */
	private async resolveAttack(attackerId: string, defenderId: string): Promise<void> {
		const attacker = this.entities.get(attackerId);
		const defender = this.entities.get(defenderId);

		if (!attacker || !defender) return;

		const attackerStats = attacker.getComponent<StatsComponent>(ComponentTypes.STATS);
		const defenderHealth = defender.getComponent<HealthComponent>(ComponentTypes.HEALTH);
		const attackerChar = attacker.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);
		const defenderChar = defender.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);

		if (!attackerStats || !defenderHealth) return;

		// Roll attack (d20 + DEX mod)
		const attackRoll = rollAttack(attackerStats);
		const naturalRoll = rollDie(20);

		// Simple AC check (future: get from defender)
		const defenderAC = 10; // Base AC

		let message = '';

		if (attackRoll >= defenderAC) {
			// Hit!
			let damage = rollDamage(attackerStats);

			// Check for critical hit (natural 20)
			if (naturalRoll === 20) {
				damage *= 2;
				message = `${attackerChar?.name || 'Attacker'} CRITICALLY HITS ${defenderChar?.name || 'Defender'} for ${damage} damage!`;
			} else {
				message = `${attackerChar?.name || 'Attacker'} hits ${defenderChar?.name || 'Defender'} for ${damage} damage.`;
			}

			// Apply damage
			defenderHealth.current -= damage;

			// Check for death
			if (defenderHealth.current <= 0) {
				defenderHealth.current = 0;
				defenderHealth.isDead = true;
				message += `\n${defenderChar?.name || 'Defender'} has been defeated!`;

				if (this.sessionState && defender.hasComponent(ComponentTypes.NPC)) {
					this.sessionState.markNpcDead(defender.id);
				}

				// End combat
				this.endCombat(attacker.getComponent<CombatComponent>(ComponentTypes.COMBAT)?.combatId || '');
			}
		} else {
			// Miss
			message = `${attackerChar?.name || 'Attacker'} misses ${defenderChar?.name || 'Defender'}.`;
		}

		console.log(`[Combat] ${message}`);

		// TODO: Broadcast combat log to players in room
	}

	/**
	 * End combat
	 */
	endCombat(combatId: string): void {
		const combat = this.combats.get(combatId);
		if (!combat) return;

		// Remove combat components
		const attacker = this.entities.get(combat.attackerId);
		const defender = this.entities.get(combat.defenderId);

		attacker?.removeComponent(ComponentTypes.COMBAT);
		defender?.removeComponent(ComponentTypes.COMBAT);

		// Mark combat as inactive
		combat.isActive = false;

		console.log(`Combat ended: ${combatId}`);
	}

	/**
	 * Get combat by ID
	 */
	getCombat(combatId: string): Combat | undefined {
		return this.combats.get(combatId);
	}

	/**
	 * Check if entity is in combat
	 */
	isInCombat(entityId: string): boolean {
		const entity = this.entities.get(entityId);
		return entity?.hasComponent(ComponentTypes.COMBAT) || false;
	}
}
