import { GameEngine } from '../core/GameEngine';
import { Entity } from '../core/Entity';
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
export declare class SessionManager {
    private sessions;
    private nextSessionId;
    createSession(hostUserId: string, hostUsername: string, sessionName: string, maxPlayers?: number): GameSession;
    getSession(sessionId: string): GameSession | undefined;
    getAllSessions(): GameSession[];
    joinSession(sessionId: string, userId: string, username: string): SessionPlayer | null;
    leaveSession(sessionId: string, userId: string): boolean;
    createPlayerCharacter(sessionId: string, userId: string, characterName: string, characterStats: any): Entity | null;
    setPlayerReady(sessionId: string, userId: string, ready: boolean): boolean;
    areAllPlayersReady(sessionId: string): boolean;
    closeSession(sessionId: string): void;
    getSessionState(sessionId: string): any;
}
export declare const sessionManager: SessionManager;
//# sourceMappingURL=SessionManager.d.ts.map