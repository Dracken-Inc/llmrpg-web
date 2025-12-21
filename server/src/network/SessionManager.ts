import { GameEngine } from '../core/GameEngine';
import { Entity } from '../core/Entity';
import { IsPlayer, Health, Position, CharacterStats, Name } from '../components/CoreComponents';

export interface GameSession {
  sessionId: string;
  name: string;
  host: string;
  players: SessionPlayer[];
  gameEngine: GameEngine;
  isActive: boolean;
  createdAt: number;
  maxPlayers: number;
}

export interface SessionPlayer {
  userId: string;
  username: string;
  entityId: number;
  role: 'host' | 'player';
  joinedAt: number;
  isReady: boolean;
}

export class SessionManager {
  private sessions = new Map<string, GameSession>();
  private nextSessionId = 1;

  createSession(hostUserId: string, hostUsername: string, sessionName: string, maxPlayers: number = 4): GameSession {
    const sessionId = `session_${this.nextSessionId++}`;

    const gameEngine = new GameEngine();
    gameEngine.start();

    const session: GameSession = {
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

  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): GameSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  joinSession(sessionId: string, userId: string, username: string): SessionPlayer | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.players.length >= session.maxPlayers) {
      return null; // Session full
    }

    // Check if already joined
    if (session.players.some((p) => p.userId === userId)) {
      return session.players.find((p) => p.userId === userId) || null;
    }

    const player: SessionPlayer = {
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

  leaveSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const playerIndex = session.players.findIndex((p) => p.userId === userId);
    if (playerIndex === -1) return false;

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

  createPlayerCharacter(
    sessionId: string,
    userId: string,
    characterName: string,
    characterStats: any
  ): Entity | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const player = session.players.find((p) => p.userId === userId);
    if (!player) return null;

    // Create entity in game engine
    const entity = session.gameEngine.createEntity();

    // Add components
    entity.addComponent(new IsPlayer(userId));
    entity.addComponent(new Name(characterName));
    entity.addComponent(new Health(characterStats.hp || 10, characterStats.maxHp || 10));
    entity.addComponent(new Position(0, 0));
    entity.addComponent(new CharacterStats(characterStats));

    player.entityId = entity.id;

    return entity;
  }

  setPlayerReady(sessionId: string, userId: string, ready: boolean): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const player = session.players.find((p) => p.userId === userId);
    if (!player) return false;

    player.isReady = ready;
    return true;
  }

  areAllPlayersReady(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    return session.players.length > 1 && session.players.every((p) => p.isReady);
  }

  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    session.gameEngine.stop();

    // Clean up
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 5000); // Keep session data for 5 seconds after close
  }

  getSessionState(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

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

export const sessionManager = new SessionManager();
