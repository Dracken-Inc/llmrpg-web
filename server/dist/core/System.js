"use strict";
/**
 * ECS Core: System base class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = void 0;
class System {
    constructor() {
        this.entities = [];
    }
    addEntity(entity) {
        if (!this.entities.find(e => e.id === entity.id)) {
            this.entities.push(entity);
        }
    }
    removeEntity(entityId) {
        this.entities = this.entities.filter(e => e.id !== entityId);
    }
    getEntities() {
        return this.entities;
    }
    clear() {
        this.entities = [];
    }
}
exports.System = System;
//# sourceMappingURL=System.js.map