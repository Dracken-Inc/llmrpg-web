import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { GameEngine } from '../core/GameEngine';
import { SessionManager } from './SessionManager';
import { CommandProcessorService, CommandResponse } from '../services/CommandProcessorService';

/**
 * GameServer - Socket.IO server for real-time multiplayer
 * Handles playerCommand, joinSession, leaveSession events
 * Emits commandResult, roomUpdate, combatLog, playerJoined, playerLeft events
 */
export class GameServer {
	private app = express();
	private httpServer = http.createServer(this.app);
	private io: Server;
	private sessionManager: SessionManager;
	private commandProcessor: CommandProcessorService;

	constructor(
		private port: number,
		private gameEngine: GameEngine,
		commandProcessor: CommandProcessorService,
		private startRoomId: string = 'room_start'
	) {
		this.io = new Server(this.httpServer, {
			cors: {
				origin: 'http://localhost:3000', // React dev server
				methods: ['GET', 'POST'],
			},
		});

		this.sessionManager = new SessionManager(gameEngine);
		this.commandProcessor = commandProcessor;

		this.setupRoutes();
		this.setupSocketHandlers();
	}

	/**
	 * Setup Express routes
	 */
	private setupRoutes(): void {
		this.app.get('/', (req, res) => {
			res.json({
				name: 'LLMRPG MUD Server',
				status: 'running',
				players: this.sessionManager.getPlayerCount(),
			});
		});

		this.app.get('/health', (req, res) => {
			res.json({
				status: 'ok',
				players: this.sessionManager.getPlayerCount(),
				uptime: process.uptime(),
			});
		});
	}

	/**
	 * Setup Socket.IO event handlers
	 */
	private setupSocketHandlers(): void {
		this.io.on('connection', (socket: Socket) => {
			console.log(`Client connected: ${socket.id}`);

			// Handle join session
			socket.on('joinSession', (data: { playerName?: string }) => {
				this.handleJoinSession(socket, data.playerName || 'Adventurer');
			});

			// Handle player commands
			socket.on('playerCommand', async (data: { command: string }) => {
				await this.handlePlayerCommand(socket, data.command);
			});

			// Handle leave session
			socket.on('leaveSession', () => {
				this.handleLeaveSession(socket);
			});

			// Handle disconnect
			socket.on('disconnect', () => {
				console.log(`Client disconnected: ${socket.id}`);
				this.handleLeaveSession(socket);
			});
		});
	}

	/**
	 * Handle joinSession event
	 */
	private handleJoinSession(socket: Socket, playerName: string): void {
		try {
			// Create session
			const session = this.sessionManager.createSession(
				socket.id,
				playerName,
				this.startRoomId
			);

			// Send welcome message
			socket.emit('commandResult', {
				type: 'system',
				text: `Welcome to LLMRPG, ${playerName}!\nType 'help' for a list of commands.\n`,
			});

			// Broadcast player joined to room
			this.broadcastToRoom(this.startRoomId, socket.id, {
				type: 'system',
				text: `${playerName} has entered the world.`,
			});

			// Emit playerJoined event
			this.io.emit('playerJoined', {
				playerId: session.entityId,
				playerName: session.name,
			});

			console.log(`Player joined: ${playerName} (${socket.id})`);
		} catch (error) {
			socket.emit('commandResult', {
				type: 'system',
				text: `Error joining session: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}

	/**
	 * Handle playerCommand event
	 */
	private async handlePlayerCommand(socket: Socket, command: string): Promise<void> {
		const session = this.sessionManager.getSession(socket.id);
		if (!session) {
			socket.emit('commandResult', {
				type: 'system',
				text: 'Error: No active session. Please rejoin.',
			});
			return;
		}

		try {
			// Process command
			const response = await this.commandProcessor.processCommand(
				session.entityId,
				command
			);

			// Send response to player
			socket.emit('commandResult', response);

			// Handle broadcasts
			if (response.meta?.broadcast) {
				const player = this.sessionManager.getPlayerEntity(socket.id);
				const position = player?.getComponent('position') as { roomId: string } | undefined;
				if (position) {
					this.broadcastToRoom(position.roomId, socket.id, response);
				}
			}

			// Handle room updates (after movement)
			if (response.meta?.newRoomId) {
				const newRoomId = response.meta.newRoomId as string;
				
				// Auto-look at new room
				const lookResponse = await this.commandProcessor.processCommand(
					session.entityId,
					'look'
				);
				socket.emit('commandResult', lookResponse);

				// Emit roomUpdate event
				socket.emit('roomUpdate', { roomId: newRoomId });
			}
		} catch (error) {
			socket.emit('commandResult', {
				type: 'system',
				text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}

	/**
	 * Handle leaveSession event
	 */
	private handleLeaveSession(socket: Socket): void {
		const session = this.sessionManager.getSession(socket.id);
		if (!session) return;

		// Broadcast player left
		const player = this.sessionManager.getPlayerEntity(socket.id);
		const position = player?.getComponent('position') as { roomId: string } | undefined;
		if (position) {
			this.broadcastToRoom(position.roomId, socket.id, {
				type: 'system',
				text: `${session.name} has left the world.`,
			});
		}

		// Emit playerLeft event
		this.io.emit('playerLeft', {
			playerId: session.entityId,
			playerName: session.name,
		});

		// Remove session
		this.sessionManager.removeSession(socket.id);
	}

	/**
	 * Broadcast a message to all players in a room (except sender)
	 */
	private broadcastToRoom(roomId: string, senderSocketId: string, response: CommandResponse): void {
		const sessions = this.sessionManager.getAllSessions();

		for (const session of sessions) {
			if (session.socketId === senderSocketId) continue;

			const player = this.sessionManager.getPlayerEntity(session.socketId);
			const position = player?.getComponent('position') as { roomId: string } | undefined;

			if (position?.roomId === roomId) {
				this.io.to(session.socketId).emit('commandResult', response);
			}
		}
	}

	/**
	 * Broadcast combat log to all players in combat
	 */
	broadcastCombatLog(roomId: string, message: string): void {
		const sessions = this.sessionManager.getAllSessions();

		for (const session of sessions) {
			const player = this.sessionManager.getPlayerEntity(session.socketId);
			const position = player?.getComponent('position') as { roomId: string } | undefined;

			if (position?.roomId === roomId) {
				this.io.to(session.socketId).emit('combatLog', {
					type: 'combat',
					text: message,
				});
			}
		}
	}

	/**
	 * Start the server
	 */
	start(): void {
		this.httpServer.listen(this.port, () => {
			console.log(`GameServer running on http://localhost:${this.port}`);
			console.log(`WebSocket server ready for connections`);
		});
	}

	/**
	 * Stop the server
	 */
	stop(): void {
		this.io.close();
		this.httpServer.close();
		console.log('GameServer stopped');
	}

	/**
	 * Get server instance (for external access)
	 */
	getIO(): Server {
		return this.io;
	}

	/**
	 * Get session manager
	 */
	getSessionManager(): SessionManager {
		return this.sessionManager;
	}
}
