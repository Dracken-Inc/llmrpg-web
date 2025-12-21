import express, { Express, Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { sessionManager } from './SessionManager';
import { GameSession, SessionPlayer } from './SessionManager';
import { CombatAction } from '../systems/CombatSystem';

export class GameServer {
  private app: Express;
  private httpServer: HTTPServer;
  private io: SocketIOServer;
  private connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();

  constructor(port: number = 3001) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
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

  private setupRoutes(): void {
    this.app.use(express.json());

    // Session management endpoints
    this.app.get('/api/sessions', (req: Request, res: Response) => {
      const sessions = sessionManager.getAllSessions();
      res.json(
        sessions.map((s) => ({
          sessionId: s.sessionId,
          name: s.name,
          host: s.host,
          playerCount: s.players.length,
          maxPlayers: s.maxPlayers
        }))
      );
    });

    this.app.post('/api/sessions', (req: Request, res: Response) => {
      const { userId, username, sessionName, maxPlayers } = req.body;

      if (!userId || !username || !sessionName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const session = sessionManager.createSession(userId, username, sessionName, maxPlayers || 4);
      res.json({
        sessionId: session.sessionId,
        name: session.name,
        host: session.host
      });
    });

    this.app.get('/api/sessions/:sessionId', (req: Request, res: Response) => {
      const session = sessionManager.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(sessionManager.getSessionState(req.params.sessionId));
    });

    this.app.post('/api/sessions/:sessionId/join', (req: Request, res: Response) => {
      const { userId, username } = req.body;
      const player = sessionManager.joinSession(req.params.sessionId, userId, username);

      if (!player) {
        return res.status(400).json({ error: 'Unable to join session' });
      }

      res.json({ success: true, player });
    });

    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`);

      // User login
      socket.on('login', (data: { userId: string; username: string }, callback) => {
        this.connectedUsers.set(socket.id, {
          userId: data.userId,
          username: data.username,
          socketId: socket.id
        });

        console.log(`${data.username} (${data.userId}) logged in`);
        callback({ success: true });
      });

      // Session creation
      socket.on('createSession', (data: any, callback) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) {
            return callback({ error: 'Not authenticated' });
          }

          const session = sessionManager.createSession(user.userId, user.username, data.sessionName, data.maxPlayers || 4);

          socket.join(session.sessionId);
          callback({
            success: true,
            sessionId: session.sessionId,
            session: sessionManager.getSessionState(session.sessionId)
          });

          // Broadcast session list update
          this.io.emit('sessionListUpdated', {
            sessions: sessionManager.getAllSessions().map((s) => ({
              sessionId: s.sessionId,
              name: s.name,
              playerCount: s.players.length,
              maxPlayers: s.maxPlayers
            }))
          });
        } catch (error) {
          callback({ error: String(error) });
        }
      });

      // Join session
      socket.on('joinSession', (data: { sessionId: string }, callback) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) {
            return callback({ error: 'Not authenticated' });
          }

          const player = sessionManager.joinSession(data.sessionId, user.userId, user.username);
          if (!player) {
            return callback({ error: 'Unable to join session' });
          }

          socket.join(data.sessionId);
          const session = sessionManager.getSession(data.sessionId);

          callback({
            success: true,
            sessionId: data.sessionId,
            session: sessionManager.getSessionState(data.sessionId)
          });

          // Notify other players in session
          this.io.to(data.sessionId).emit('playerJoined', {
            username: user.username,
            playerCount: session!.players.length
          });

          // Broadcast session list update
          this.io.emit('sessionListUpdated', {
            sessions: sessionManager.getAllSessions().map((s) => ({
              sessionId: s.sessionId,
              name: s.name,
              playerCount: s.players.length,
              maxPlayers: s.maxPlayers
            }))
          });
        } catch (error) {
          callback({ error: String(error) });
        }
      });

      // Leave session
      socket.on('leaveSession', (data: { sessionId: string }, callback) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) {
            return callback({ error: 'Not authenticated' });
          }

          sessionManager.leaveSession(data.sessionId, user.userId);
          socket.leave(data.sessionId);

          callback({ success: true });

          // Notify other players
          this.io.to(data.sessionId).emit('playerLeft', {
            username: user.username
          });

          // Broadcast session list update
          this.io.emit('sessionListUpdated', {
            sessions: sessionManager.getAllSessions().map((s) => ({
              sessionId: s.sessionId,
              name: s.name,
              playerCount: s.players.length,
              maxPlayers: s.maxPlayers
            }))
          });
        } catch (error) {
          callback({ error: String(error) });
        }
      });

      // Ready status
      socket.on('setReady', (data: { sessionId: string; ready: boolean }, callback) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user) {
            return callback({ error: 'Not authenticated' });
          }

          sessionManager.setPlayerReady(data.sessionId, user.userId, data.ready);
          const session = sessionManager.getSession(data.sessionId);

          this.io.to(data.sessionId).emit('playerStatusUpdated', {
            session: sessionManager.getSessionState(data.sessionId)
          });

          if (sessionManager.areAllPlayersReady(data.sessionId)) {
            this.io.to(data.sessionId).emit('gameStarting', {
              message: 'All players ready! Game starting...'
            });
          }

          callback({ success: true });
        } catch (error) {
          callback({ error: String(error) });
        }
      });

      // Combat action
      socket.on('combatAction', (data: { sessionId: string; action: CombatAction }, callback) => {
        try {
          const session = sessionManager.getSession(data.sessionId);
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
        } catch (error) {
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

  close(): void {
    this.io.close();
    this.httpServer.close();
  }
}
