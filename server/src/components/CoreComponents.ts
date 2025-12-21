/**
 * Core Components
 */

import { Component } from '../core/Entity';

export class Position extends Component {
  constructor(public x: number = 0, public y: number = 0) {
    super();
  }
}

export class Health extends Component {
  constructor(public current: number = 10, public max: number = 10) {
    super();
  }

  isAlive(): boolean {
    return this.current > 0;
  }

  takeDamage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }
}

export class CharacterStats extends Component {
  constructor(
    public level: number = 1,
    public str: number = 10,
    public dex: number = 10,
    public con: number = 10,
    public int: number = 10,
    public wis: number = 10,
    public cha: number = 10
  ) {
    super();
  }

  getModifier(stat: number): number {
    return Math.floor((stat - 10) / 2);
  }

  getStrModifier(): number {
    return this.getModifier(this.str);
  }

  getDexModifier(): number {
    return this.getModifier(this.dex);
  }

  getConModifier(): number {
    return this.getModifier(this.con);
  }
}

export class Inventory extends Component {
  constructor(public items: Array<{ id: string; name: string; quantity: number }> = []) {
    super();
  }

  addItem(id: string, name: string, quantity: number = 1): void {
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ id, name, quantity });
    }
  }

  removeItem(id: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === id);
    if (!item) return false;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.items = this.items.filter(i => i.id !== id);
    }
    return true;
  }
}

export class Name extends Component {
  constructor(public value: string = 'Unknown') {
    super();
  }
}

export class IsPlayer extends Component {
  constructor(public userId: string = '') {
    super();
  }
}

export class IsNPC extends Component {
  constructor(public aiType: string = 'basic') {
    super();
  }
}

export class InCombat extends Component {
  constructor(
    public combatId: string = '',
    public initiativeRoll: number = 0,
    public turnOrder: number = 0
  ) {
    super();
  }
}

export class Weapon extends Component {
  constructor(
    public name: string = 'Longsword',
    public damageType: string = 'd8',
    public damageMod: number = 0
  ) {
    super();
  }
}

export class Armor extends Component {
  constructor(public ac: number = 10) {
    super();
  }

  getBaseAC(): number {
    return this.ac;
  }
}
