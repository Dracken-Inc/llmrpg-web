"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const SessionManager_1 = require("./SessionManager");
class GameServer {
    constructor(port = 3001) {
        this.connectedUsers = new Map();
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });
        this.setupRoutes();
        this.setupWebSocket();
        this.httpServer.listen(port, () => {
            console.log(`Game server running on port ${port}`);
        });
    }
    setupRoutes() {
        this.app.use(express_1.default.json());
        // Session management endpoints
        this.app.get('/api/sessions', (req, res) => {
            const sessions = SessionManager_1.sessionManager.getAllSessions();
            res.json(sessions.map((s) => ({
                sessionId: s.sessionId,
                name: s.name,
                host: s.host,
                playerCount: s.players.length,
                maxPlayers: s.maxPlayers
            })));
        });
        this.app.post('/api/sessions', (req, res) => {
            const { userId, username, sessionName, maxPlayers } = req.body;
            if (!userId || !username || !sessionName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const session = SessionManager_1.sessionManager.createSession(userId, username, sessionName, maxPlayers || 4);
            res.json({
                sessionId: session.sessionId,
                name: session.name,
                host: session.host
            });
        });
        this.app.get('/api/sessions/:sessionId', (req, res) => {
            const session = SessionManager_1.sessionManager.getSession(req.params.sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json(SessionManager_1.sessionManager.getSessionState(req.params.sessionId));
        });
        this.app.post('/api/sessions/:sessionId/join', (req, res) => {
            const { userId, username } = req.body;
            const player = SessionManager_1.sessionManager.joinSession(req.params.sessionId, userId, username);
            if (!player) {
                return res.status(400).json({ error: 'Unable to join session' });
            }
            res.json({ success: true, player });
        });
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: Date.now() });
        });
    }
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            // User login
            socket.on('login', (data, callback) => {
                this.connectedUsers.set(socket.id, {
                    userId: data.userId,
                    username: data.username,
                    socketId: socket.id
                });
                console.log(`${data.username} (${data.userId}) logged in`);
                callback({ success: true });
            });
            // Session creation
            socket.on('createSession', (data, callback) => {
                try {
                    const user = this.connectedUsers.get(socket.id);
                    if (!user) {
                        return callback({ error: 'Not authenticated' });
                    }
                    const session = SessionManager_1.sessionManager.createSession(user.userId, user.username, data.sessionName, data.maxPlayers || 4);
                    socket.join(session.sessionId);
                    callback({
                        success: true,
                        sessionId: session.sessionId,
                        session: SessionManager_1.sessionManager.getSessionState(session.sessionId)
                    });
                    // Broadcast session list update
                    this.io.emit('sessionListUpdated', {
                        sessions: SessionManager_1.sessionManager.getAllSessions().map((s) => ({
                            sessionId: s.sessionId,
                            name: s.name,
                            playerCount: s.players.length,
                            maxPlayers: s.maxPlayers
                        }))
                    });
                }
                catch (error) {
                    callback({ error: String(error) });
                }
            });
            // Join session
            socket.on('joinSession', (data, callback) => {
                try {
                    const user = this.connectedUsers.get(socket.id);
                    if (!user) {
                        return callback({ error: 'Not authenticated' });
                    }
                    const player = SessionManager_1.sessionManager.joinSession(data.sessionId, user.userId, user.username);
                    if (!player) {
                        return callback({ error: 'Unable to join session' });
                    }
                    socket.join(data.sessionId);
                    const session = SessionManager_1.sessionManager.getSession(data.sessionId);
                    callback({
                        success: true,
                        sessionId: data.sessionId,
                        session: SessionManager_1.sessionManager.getSessionState(data.sessionId)
                    });
                    // Notify other players in session
                    this.io.to(data.sessionId).emit('playerJoined', {
                        username: user.username,
                        playerCount: session.players.length
                    });
                    // Broadcast session list update
                    this.io.emit('sessionListUpdated', {
                        sessions: SessionManager_1.sessionManager.getAllSessions().map((s) => ({
                            sessionId: s.sessionId,
                            name: s.name,
                            playerCount: s.players.length,
                            maxPlayers: s.maxPlayers
                        }))
                    });
                }
                catch (error) {
                    callback({ error: String(error) });
                }
            });
            // Leave session
            socket.on('leaveSession', (data, callback) => {
                try {
                    const user = this.connectedUsers.get(socket.id);
                    if (!user) {
                        return callback({ error: 'Not authenticated' });
                    }
                    SessionManager_1.sessionManager.leaveSession(data.sessionId, user.userId);
                    socket.leave(data.sessionId);
                    callback({ success: true });
                    // Notify other players
                    this.io.to(data.sessionId).emit('playerLeft', {
                        username: user.username
                    });
                    // Broadcast session list update
                    this.io.emit('sessionListUpdated', {
                        sessions: SessionManager_1.sessionManager.getAllSessions().map((s) => ({
                            sessionId: s.sessionId,
                            name: s.name,
                            playerCount: s.players.length,
                            maxPlayers: s.maxPlayers
                        }))
                    });
                }
                catch (error) {
                    callback({ error: String(error) });
                }
            });
            // Ready status
            socket.on('setReady', (data, callback) => {
                try {
                    const user = this.connectedUsers.get(socket.id);
                    if (!user) {
                        return callback({ error: 'Not authenticated' });
                    }
                    SessionManager_1.sessionManager.setPlayerReady(data.sessionId, user.userId, data.ready);
                    const session = SessionManager_1.sessionManager.getSession(data.sessionId);
                    this.io.to(data.sessionId).emit('playerStatusUpdated', {
                        session: SessionManager_1.sessionManager.getSessionState(data.sessionId)
                    });
                    if (SessionManager_1.sessionManager.areAllPlayersReady(data.sessionId)) {
                        this.io.to(data.sessionId).emit('gameStarting', {
                            message: 'All players ready! Game starting...'
                        });
                    }
                    callback({ success: true });
                }
                catch (error) {
                    callback({ error: String(error) });
                }
            });
            // Combat action
            socket.on('combatAction', (data, callback) => {
                try {
                    const session = SessionManager_1.sessionManager.getSession(data.sessionId);
                    if (!session) {
                        return callback({ error: 'Session not found' });
                    }
                    const combatSystem = session.gameEngine.getCombatSystem();
                    const narrativeSystem = session.gameEngine.getNarrativeSystem();
                    const result = combatSystem.processTurn(data.sessionId, data.action);
                    if (result) {
                        // Add to narrative log
                        narrativeSystem.addEvent({
                            type: 'combat.attack',
                            subject: result.message.split(' ')[0], // Extract attacker name
                            action: 'attacks',
                            target: data.action.targetId?.toString(),
                            details: {
                                hit: result.success,
                                damage: result.damage,
                                critical: result.critical
                            },
                            timestamp: Date.now()
                        });
                    }
                    // Broadcast updated state to all players in session
                    this.io.to(data.sessionId).emit('gameStateUpdated', {
                        combatLog: combatSystem.getCombatLog(data.sessionId),
                        narrative: narrativeSystem.getNarrativeLog(10),
                        engineState: session.gameEngine.getState()
                    });
                    callback({ success: true, result });
                }
                catch (error) {
                    callback({ error: String(error) });
                }
            });
            // Disconnect
            socket.on('disconnect', () => {
                const user = this.connectedUsers.get(socket.id);
                if (user) {
                    console.log(`${user.username} disconnected`);
                    this.connectedUsers.delete(socket.id);
                }
            });
        });
    }
    close() {
        this.io.close();
        this.httpServer.close();
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=GameServer.js.map