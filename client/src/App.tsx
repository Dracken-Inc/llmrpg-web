import React, { useState } from 'react';
import './App.css';
import { GameProvider, useGame } from './context/GameContext';
import SessionPanel from './components/SessionPanel';
import CharacterSheet from './components/CharacterSheet';
import CombatPanel from './components/CombatPanel';
import ChatPanel from './components/ChatPanel';

const GameUI: React.FC = () => {
  const { userId, username, login, isConnected, currentSession } = useGame();
  const [loginUsername, setLoginUsername] = useState('');
  const [showLogin, setShowLogin] = useState(true);

  const handleLogin = async () => {
    if (loginUsername.trim()) {
      try {
        const newUserId = `user_${Date.now()}`;
        await login(newUserId, loginUsername);
        setShowLogin(false);
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="app-container login-screen">
        <div className="login-panel">
          <h1>LLMRPG</h1>
          <p>Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (showLogin || !username) {
    return (
      <div className="app-container login-screen">
        <div className="login-panel">
          <h1>LLMRPG</h1>
          <div className="form-group">
            <label>Character Name:</label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your character name"
            />
          </div>
          <button onClick={handleLogin} disabled={!loginUsername.trim()}>
            Enter Game
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="app-container">
        <div className="header">
          <h1>LLMRPG - Session Selection</h1>
          <div className="user-info">
            {username} (ID: {userId})
          </div>
        </div>
        <SessionPanel />
      </div>
    );
  }

  return (
    <div className="app-container game-screen">
      <div className="header">
        <h1>{currentSession.name}</h1>
        <div className="user-info">{username}</div>
      </div>

      <div className="game-layout">
        <div className="left-column">
          <CharacterSheet />
          <CombatPanel />
        </div>

        <div className="center-column">
          <ChatPanel />
        </div>

        <div className="right-column">
          <div className="game-info">
            <h3>Session Info</h3>
            <p>
              Players: {currentSession.playerCount}/{currentSession.maxPlayers}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
};

export default App;
