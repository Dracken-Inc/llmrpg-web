"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const Entity_1 = require("./Entity");
const CombatSystem_1 = require("../systems/CombatSystem");
const NarrativeSystem_1 = require("../systems/NarrativeSystem");
const CoreComponents_1 = require("../components/CoreComponents");
class GameEngine {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.nextEntityId = 1;
        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.targetFPS = 30;
        this.targetFrameTime = 1000 / this.targetFPS;
        // Initialize all systems
        this.combatSystem = new CombatSystem_1.CombatSystem();
        this.narrativeSystem = new NarrativeSystem_1.NarrativeSystem();
        this.systems = [this.combatSystem, this.narrativeSystem];
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }
    stop() {
        this.isRunning = false;
    }
    gameLoop() {
        if (!this.isRunning)
            return;
        const now = Date.now();
        const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
        this.lastUpdateTime = now;
        // Update all systems
        for (const system of this.systems) {
            system.update(deltaTime);
        }
        // Schedule next frame
        setTimeout(() => this.gameLoop(), this.targetFrameTime);
    }
    createEntity(name) {
        const entity = new Entity_1.Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        // Register entity with all systems
        for (const system of this.systems) {
            system.addEntity(entity);
        }
        return entity;
    }
    getEntity(id) {
        return this.entities.get(id);
    }
    removeEntity(id) {
        const entity = this.entities.get(id);
        if (!entity)
            return;
        // Unregister from all systems
        for (const system of this.systems) {
            system.removeEntity(id);
        }
        this.entities.delete(id);
    }
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    // System access
    getCombatSystem() {
        return this.combatSystem;
    }
    getNarrativeSystem() {
        return this.narrativeSystem;
    }
    // Utility methods
    getPlayerEntities() {
        return this.getAllEntities().filter((e) => {
            return !!e.getComponent(CoreComponents_1.IsPlayer);
        });
    }
    getNPCEntities() {
        return this.getAllEntities().filter((e) => {
            return !!e.getComponent(CoreComponents_1.IsNPC);
        });
    }
    reset() {
        this.stop();
        this.entities.clear();
        this.nextEntityId = 1;
        // Clear system state
        for (const system of this.systems) {
            system.clear?.();
        }
    }
    getState() {
        return {
            isRunning: this.isRunning,
            entityCount: this.entities.size,
            targetFPS: this.targetFPS,
            systems: this.systems.map((s) => ({
                name: s.constructor.name,
                entityCount: s.getEntities().length
            }))
        };
    }
}
exports.GameEngine = GameEngine;
//# sourceMappingURL=GameEngine.js.map