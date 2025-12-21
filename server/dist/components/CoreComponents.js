"use strict";
/**
 * Core Components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Armor = exports.Weapon = exports.InCombat = exports.IsNPC = exports.IsPlayer = exports.Name = exports.Inventory = exports.CharacterStats = exports.Health = exports.Position = void 0;
const Entity_1 = require("../core/Entity");
class Position extends Entity_1.Component {
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}
exports.Position = Position;
class Health extends Entity_1.Component {
    constructor(current = 10, max = 10) {
        super();
        this.current = current;
        this.max = max;
    }
    isAlive() {
        return this.current > 0;
    }
    takeDamage(amount) {
        this.current = Math.max(0, this.current - amount);
    }
    heal(amount) {
        this.current = Math.min(this.max, this.current + amount);
    }
}
exports.Health = Health;
class CharacterStats extends Entity_1.Component {
    constructor(level = 1, str = 10, dex = 10, con = 10, int = 10, wis = 10, cha = 10) {
        super();
        this.level = level;
        this.str = str;
        this.dex = dex;
        this.con = con;
        this.int = int;
        this.wis = wis;
        this.cha = cha;
    }
    getModifier(stat) {
        return Math.floor((stat - 10) / 2);
    }
    getStrModifier() {
        return this.getModifier(this.str);
    }
    getDexModifier() {
        return this.getModifier(this.dex);
    }
    getConModifier() {
        return this.getModifier(this.con);
    }
}
exports.CharacterStats = CharacterStats;
class Inventory extends Entity_1.Component {
    constructor(items = []) {
        super();
        this.items = items;
    }
    addItem(id, name, quantity = 1) {
        const existing = this.items.find(i => i.id === id);
        if (existing) {
            existing.quantity += quantity;
        }
        else {
            this.items.push({ id, name, quantity });
        }
    }
    removeItem(id, quantity = 1) {
        const item = this.items.find(i => i.id === id);
        if (!item)
            return false;
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.items = this.items.filter(i => i.id !== id);
        }
        return true;
    }
}
exports.Inventory = Inventory;
class Name extends Entity_1.Component {
    constructor(value = 'Unknown') {
        super();
        this.value = value;
    }
}
exports.Name = Name;
class IsPlayer extends Entity_1.Component {
    constructor(userId = '') {
        super();
        this.userId = userId;
    }
}
exports.IsPlayer = IsPlayer;
class IsNPC extends Entity_1.Component {
    constructor(aiType = 'basic') {
        super();
        this.aiType = aiType;
    }
}
exports.IsNPC = IsNPC;
class InCombat extends Entity_1.Component {
    constructor(combatId = '', initiativeRoll = 0, turnOrder = 0) {
        super();
        this.combatId = combatId;
        this.initiativeRoll = initiativeRoll;
        this.turnOrder = turnOrder;
    }
}
exports.InCombat = InCombat;
class Weapon extends Entity_1.Component {
    constructor(name = 'Longsword', damageType = 'd8', damageMod = 0) {
        super();
        this.name = name;
        this.damageType = damageType;
        this.damageMod = damageMod;
    }
}
exports.Weapon = Weapon;
class Armor extends Entity_1.Component {
    constructor(ac = 10) {
        super();
        this.ac = ac;
    }
    getBaseAC() {
        return this.ac;
    }
}
exports.Armor = Armor;
//# sourceMappingURL=CoreComponents.js.map