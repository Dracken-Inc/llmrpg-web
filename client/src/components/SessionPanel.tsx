import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

const SessionPanel: React.FC = () => {
  const { sessions, createSession, joinSession } = useGame();
  const [newSessionName, setNewSessionName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    if (newSessionName.trim()) {
      try {
        setLoading(true);
        await createSession(newSessionName, maxPlayers);
        setNewSessionName('');
      } catch (error) {
        console.error('Failed to create session:', error);
      } finally {
        setLoading(false);
        setIsCreating(false);
      }
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      setLoading(true);
      await joinSession(sessionId);
    } catch (error) {
      console.error('Failed to join session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-panel">
      <div className="session-creation">
        {!isCreating ? (
          <button onClick={() => setIsCreating(true)} disabled={loading}>
            Create New Session
          </button>
        ) : (
          <div className="create-form">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Session name"
            />
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))}>
              <option value={2}>2 Players</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
            </select>
            <button onClick={handleCreateSession} disabled={!newSessionName.trim() || loading}>
              Create
            </button>
            <button onClick={() => setIsCreating(false)}>Cancel</button>
          </div>
        )}
      </div>

      <div className="sessions-list">
        <h2>Available Sessions</h2>
        {sessions.length === 0 ? (
          <p>No sessions available. Create one to get started!</p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li key={session.sessionId} className="session-item">
                <div className="session-info">
                  <h3>{session.name}</h3>
                  <p>
                    Players: {session.playerCount}/{session.maxPlayers}
                  </p>
                </div>
                <button onClick={() => handleJoinSession(session.sessionId)} disabled={loading}>
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SessionPanel;
