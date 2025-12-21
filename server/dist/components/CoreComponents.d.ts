/**
 * Core Components
 */
import { Component } from '../core/Entity';
export declare class Position extends Component {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
}
export declare class Health extends Component {
    current: number;
    max: number;
    constructor(current?: number, max?: number);
    isAlive(): boolean;
    takeDamage(amount: number): void;
    heal(amount: number): void;
}
export declare class CharacterStats extends Component {
    level: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    constructor(level?: number, str?: number, dex?: number, con?: number, int?: number, wis?: number, cha?: number);
    getModifier(stat: number): number;
    getStrModifier(): number;
    getDexModifier(): number;
    getConModifier(): number;
}
export declare class Inventory extends Component {
    items: Array<{
        id: string;
        name: string;
        quantity: number;
    }>;
    constructor(items?: Array<{
        id: string;
        name: string;
        quantity: number;
    }>);
    addItem(id: string, name: string, quantity?: number): void;
    removeItem(id: string, quantity?: number): boolean;
}
export declare class Name extends Component {
    value: string;
    constructor(value?: string);
}
export declare class IsPlayer extends Component {
    userId: string;
    constructor(userId?: string);
}
export declare class IsNPC extends Component {
    aiType: string;
    constructor(aiType?: string);
}
export declare class InCombat extends Component {
    combatId: string;
    initiativeRoll: number;
    turnOrder: number;
    constructor(combatId?: string, initiativeRoll?: number, turnOrder?: number);
}
export declare class Weapon extends Component {
    name: string;
    damageType: string;
    damageMod: number;
    constructor(name?: string, damageType?: string, damageMod?: number);
}
export declare class Armor extends Component {
    ac: number;
    constructor(ac?: number);
    getBaseAC(): number;
}
//# sourceMappingURL=CoreComponents.d.ts.map