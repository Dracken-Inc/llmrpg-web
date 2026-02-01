/**
 * Position Component - Spatial location in the game world
 */
export interface PositionComponent {
	roomId: string;
	x?: number;
	y?: number;
	z?: number;
}

/**
 * Stats Component - Character attributes (GoMud-style)
 */
export interface StatsComponent {
	str: number; // Strength (affects damage)
	dex: number; // Dexterity (affects attack roll and roundtime)
	con: number; // Constitution (affects HP)
	int: number; // Intelligence
	wis: number; // Wisdom
	cha: number; // Charisma
}

/**
 * Health Component - HP and status
 */
export interface HealthComponent {
	current: number;
	max: number;
	isDead: boolean;
}

/**
 * Combat Component - Active combat state
 */
export interface CombatComponent {
	combatId: string;
	targetId: string;
	roundtime: number; // Seconds until next action
	lastAttackTime: number; // Timestamp of last attack
	isAttacker: boolean;
}

/**
 * Character Component - Player or NPC character data
 */
export interface CharacterComponent {
	name: string;
	description: string;
	isPlayer: boolean;
	level?: number;
	experience?: number;
	inventory?: string[];
}

/**
 * NPC Component - NPC-specific data
 */
export interface NPCComponent {
	personality: string;
	scheduleId?: string;
	lastGreetTime?: number;
	greetRadius?: number;
	respawnRoomId?: string;
}

/**
 * Schedule Component - Time-based NPC behavior
 */
export interface ScheduleComponent {
	scheduleId: string;
	routines: ScheduleRoutine[];
	currentRoutineIndex: number;
}

/**
 * Schedule Routine - Single scheduled action
 */
export interface ScheduleRoutine {
	startMinute: number; // 0-1440 (minutes in a day)
	endMinute: number;
	roomId: string;
	action?: 'move' | 'idle' | 'patrol';
}

/**
 * Session Component - Player session data
 */
export interface SessionComponent {
	socketId: string;
	connectedAt: number;
	lastCommandTime: number;
}

/**
 * Component type names (for type-safe component retrieval)
 */
export const ComponentTypes = {
	POSITION: 'position',
	STATS: 'stats',
	HEALTH: 'health',
	COMBAT: 'combat',
	CHARACTER: 'character',
	NPC: 'npc',
	SCHEDULE: 'schedule',
	SESSION: 'session',
} as const;

/**
 * Helper function to calculate ability modifier (D&D-style)
 */
export function getAbilityModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

/**
 * Helper function to calculate roundtime based on DEX (GoMud-style)
 * Formula: max(0.5, 6 - (DEX / 4)) seconds
 */
export function calculateRoundtime(dex: number): number {
	return Math.max(0.5, 6 - dex / 4);
}

/**
 * Helper function to roll a die
 */
export function rollDie(sides: number): number {
	return Math.floor(Math.random() * sides) + 1;
}

/**
 * Helper function to roll attack (d20 + DEX modifier)
 */
export function rollAttack(stats: StatsComponent): number {
	return rollDie(20) + getAbilityModifier(stats.dex);
}

/**
 * Helper function to roll damage (d8 + STR modifier)
 */
export function rollDamage(stats: StatsComponent): number {
	return rollDie(8) + getAbilityModifier(stats.str);
}
