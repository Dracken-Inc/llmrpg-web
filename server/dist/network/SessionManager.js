"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
const GameEngine_1 = require("../core/GameEngine");
const CoreComponents_1 = require("../components/CoreComponents");
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.nextSessionId = 1;
    }
    createSession(hostUserId, hostUsername, sessionName, maxPlayers = 4) {
        const sessionId = `session_${this.nextSessionId++}`;
        const gameEngine = new GameEngine_1.GameEngine();
        gameEngine.start();
        const session = {
            sessionId,
            name: sessionName,
            host: hostUserId,
            players: [
                {
                    userId: hostUserId,
                    username: hostUsername,
                    entityId: 0, // Will be set when character is created
                    role: 'host',
                    joinedAt: Date.now(),
                    isReady: false
                }
            ],
            gameEngine,
            isActive: true,
            createdAt: Date.now(),
            maxPlayers
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.isActive);
    }
    joinSession(sessionId, userId, username) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        if (session.players.length >= session.maxPlayers) {
            return null; // Session full
        }
        // Check if already joined
        if (session.players.some((p) => p.userId === userId)) {
            return session.players.find((p) => p.userId === userId) || null;
        }
        const player = {
            userId,
            username,
            entityId: 0,
            role: 'player',
            joinedAt: Date.now(),
            isReady: false
        };
        session.players.push(player);
        return player;
    }
    leaveSession(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        const playerIndex = session.players.findIndex((p) => p.userId === userId);
        if (playerIndex === -1)
            return false;
        const player = session.players[playerIndex];
        // Remove entity from game if exists
        if (player.entityId !== 0) {
            session.gameEngine.removeEntity(player.entityId);
        }
        session.players.splice(playerIndex, 1);
        // If host leaves, disband session
        if (player.role === 'host') {
            this.closeSession(sessionId);
        }
        return true;
    }
    createPlayerCharacter(sessionId, userId, characterName, characterStats) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        const player = session.players.find((p) => p.userId === userId);
        if (!player)
            return null;
        // Create entity in game engine
        const entity = session.gameEngine.createEntity();
        // Add components
        entity.addComponent(new CoreComponents_1.IsPlayer(userId));
        entity.addComponent(new CoreComponents_1.Name(characterName));
        entity.addComponent(new CoreComponents_1.Health(characterStats.hp || 10, characterStats.maxHp || 10));
        entity.addComponent(new CoreComponents_1.Position(0, 0));
        entity.addComponent(new CoreComponents_1.CharacterStats(characterStats));
        player.entityId = entity.id;
        return entity;
    }
    setPlayerReady(sessionId, userId, ready) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        const player = session.players.find((p) => p.userId === userId);
        if (!player)
            return false;
        player.isReady = ready;
        return true;
    }
    areAllPlayersReady(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        return session.players.length > 1 && session.players.every((p) => p.isReady);
    }
    closeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.isActive = false;
        session.gameEngine.stop();
        // Clean up
        setTimeout(() => {
            this.sessions.delete(sessionId);
        }, 5000); // Keep session data for 5 seconds after close
    }
    getSessionState(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        return {
            sessionId: session.sessionId,
            name: session.name,
            host: session.host,
            playerCount: session.players.length,
            maxPlayers: session.maxPlayers,
            isActive: session.isActive,
            players: session.players.map((p) => ({
                userId: p.userId,
                username: p.username,
                role: p.role,
                isReady: p.isReady
            })),
            gameEngineState: session.gameEngine.getState()
        };
    }
}
exports.SessionManager = SessionManager;
exports.sessionManager = new SessionManager();
//# sourceMappingURL=SessionManager.js.map