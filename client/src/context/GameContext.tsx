import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

export interface GameContextType {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;

  // User
  userId: string | null;
  username: string | null;
  login: (userId: string, username: string) => Promise<void>;

  // Sessions
  sessions: Session[];
  currentSession: Session | null;
  createSession: (sessionName: string, maxPlayers?: number) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;

  // Game state
  gameState: GameState | null;
  combatLog: CombatLogEntry[];
  narrative: NarrativeEntry[];
  performAction: (action: GameAction) => Promise<void>;
}

export interface Session {
  sessionId: string;
  name: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  players?: SessionPlayer[];
  isActive?: boolean;
}

export interface SessionPlayer {
  userId: string;
  username: string;
  role: 'host' | 'player';
  isReady: boolean;
}

export interface GameState {
  isRunning: boolean;
  entityCount: number;
  targetFPS: number;
  systems: Array<{
    name: string;
    entityCount: number;
  }>;
}

export interface CombatLogEntry {
  timestamp: number;
  combatId: string;
  round: number;
  turn: number;
  message: string;
}

export interface NarrativeEntry {
  id: string;
  timestamp: number;
  text: string;
  tags: string[];
}

export interface GameAction {
  type: 'attack' | 'defend' | 'use-item' | 'cast-spell';
  targetId?: number;
  itemId?: string;
  spellId?: string;
}

const GameContextObject = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [narrative, setNarrative] = useState<NarrativeEntry[]>([]);

  // Initialize socket connection
  React.useEffect(() => {
    const socket = io('http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to game server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error: any) => {
      setConnectionError(error.message);
      console.error('Connection error:', error);
    });

    socket.on('sessionListUpdated', (data: { sessions: Session[] }) => {
      setSessions(data.sessions);
    });

    socket.on('playerJoined', (data: any) => {
      console.log(`${data.username} joined the session`);
    });

    socket.on('playerLeft', (data: any) => {
      console.log(`${data.username} left the session`);
    });

    socket.on('playerStatusUpdated', (data: any) => {
      if (data.session) {
        setCurrentSession(data.session);
      }
    });

    socket.on('gameStarting', (data: any) => {
      console.log(data.message);
    });

    socket.on('gameStateUpdated', (data: any) => {
      if (data.engineState) {
        setGameState(data.engineState);
      }
      if (data.combatLog) {
        setCombatLog(data.combatLog);
      }
      if (data.narrative) {
        setNarrative(data.narrative);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const login = useCallback(
    async (userId: string, username: string) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket not initialized'));
          return;
        }

        socketRef.current.emit('login', { userId, username }, (response: any) => {
          if (response.success) {
            setUserId(userId);
            setUsername(username);
            resolve();
          } else {
            reject(new Error(response.error || 'Login failed'));
          }
        });
      });
    },
    []
  );

  const createSession = useCallback(
    async (sessionName: string, maxPlayers: number = 4) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket not initialized'));
          return;
        }

        socketRef.current.emit('createSession', { sessionName, maxPlayers }, (response: any) => {
          if (response.success) {
            setCurrentSession(response.session);
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to create session'));
          }
        });
      });
    },
    []
  );

  const joinSession = useCallback(
    async (sessionId: string) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket not initialized'));
          return;
        }

        socketRef.current.emit('joinSession', { sessionId }, (response: any) => {
          if (response.success) {
            setCurrentSession(response.session);
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to join session'));
          }
        });
      });
    },
    []
  );

  const leaveSession = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not initialized'));
        return;
      }

      if (!currentSession) {
        reject(new Error('Not in a session'));
        return;
      }

      socketRef.current.emit('leaveSession', { sessionId: currentSession.sessionId }, (response: any) => {
        if (response.success) {
          setCurrentSession(null);
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave session'));
        }
      });
    });
  }, [currentSession]);

  const setReady = useCallback(
    async (ready: boolean) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket not initialized'));
          return;
        }

        if (!currentSession) {
          reject(new Error('Not in a session'));
          return;
        }

        socketRef.current.emit('setReady', { sessionId: currentSession.sessionId, ready }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to set ready status'));
          }
        });
      });
    },
    [currentSession]
  );

  const performAction = useCallback(
    async (action: GameAction) => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket not initialized'));
          return;
        }

        if (!currentSession) {
          reject(new Error('Not in a session'));
          return;
        }

        socketRef.current.emit('combatAction', { sessionId: currentSession.sessionId, action }, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to perform action'));
          }
        });
      });
    },
    [currentSession]
  );

  const value: GameContextType = {
    socket: socketRef.current,
    isConnected,
    connectionError,
    userId,
    username,
    login,
    sessions,
    currentSession,
    createSession,
    joinSession,
    leaveSession,
    setReady,
    gameState,
    combatLog,
    narrative,
    performAction
  };

  return <GameContextObject.Provider value={value}>{children}</GameContextObject.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContextObject);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
