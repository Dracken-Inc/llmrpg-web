import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const CombatPanel: React.FC = () => {
  const { combatLog, narrative, performAction, gameState } = useGame();
  const [selectedAction, setSelectedAction] = useState<'attack' | 'defend' | 'use-item' | 'cast-spell'>('attack');
  const [targetId, setTargetId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handlePerformAction = async () => {
    try {
      setIsLoading(true);
      await performAction({
        type: selectedAction,
        targetId
      });
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recentCombat = combatLog.slice(-5);
  const recentNarrative = narrative.slice(-5);

  return (
    <div className="combat-panel">
      <div className="combat-log">
        <h3>Combat Log</h3>
        <div className="log-entries">
          {recentCombat.length === 0 ? (
            <p className="no-entries">No combat yet</p>
          ) : (
            recentCombat.map((entry, index) => (
              <div key={index} className="log-entry">
                <span className="round">[Round {entry.round}, Turn {entry.turn}]</span>
                <span className="message">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="narrative-log">
        <h3>Story</h3>
        <div className="narrative-entries">
          {recentNarrative.length === 0 ? (
            <p className="no-entries">Awaiting your actions...</p>
          ) : (
            recentNarrative.map((entry) => (
              <div key={entry.id} className="narrative-entry">
                {entry.text}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="action-menu">
        <h3>Actions</h3>
        <div className="action-buttons">
          <button
            className={`action-btn ${selectedAction === 'attack' ? 'active' : ''}`}
            onClick={() => setSelectedAction('attack')}
            disabled={isLoading}
          >
            ⚔️ Attack
          </button>
          <button
            className={`action-btn ${selectedAction === 'defend' ? 'active' : ''}`}
            onClick={() => setSelectedAction('defend')}
            disabled={isLoading}
          >
            🛡️ Defend
          </button>
          <button
            className={`action-btn ${selectedAction === 'use-item' ? 'active' : ''}`}
            onClick={() => setSelectedAction('use-item')}
            disabled={isLoading}
          >
            🧪 Use Item
          </button>
          <button
            className={`action-btn ${selectedAction === 'cast-spell' ? 'active' : ''}`}
            onClick={() => setSelectedAction('cast-spell')}
            disabled={isLoading}
          >
            ✨ Cast Spell
          </button>
        </div>
        <button onClick={handlePerformAction} disabled={isLoading} className="execute-btn">
          Execute
        </button>
      </div>

      {gameState && (
        <div className="game-status">
          <p>Entities: {gameState.entityCount}</p>
          <p>FPS: {gameState.targetFPS}</p>
        </div>
      )}
    </div>
  );
};

export default CombatPanel;
