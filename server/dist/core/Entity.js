"use strict";
/**
 * ECS Core: Entity base class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = exports.Component = void 0;
class Component {
}
exports.Component = Component;
class Entity {
    constructor(id) {
        this.components = new Map();
        this.id = id;
    }
    addComponent(component) {
        const key = component.constructor.name;
        this.components.set(key, component);
    }
    removeComponent(componentClass) {
        const key = componentClass.name;
        return this.components.delete(key);
    }
    getComponent(componentClass) {
        const key = componentClass.name;
        return this.components.get(key);
    }
    hasComponent(componentClass) {
        const key = componentClass.name;
        return this.components.has(key);
    }
    getAllComponents() {
        return Array.from(this.components.values());
    }
    serialize() {
        const data = { id: this.id, components: {} };
        this.components.forEach((component, key) => {
            data.components[key] = Object.assign({}, component);
        });
        return data;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map