import React from 'react';

const InitiativePanel: React.FC = () => {
  return (
    <div className="initiative-panel">
      <h3>Initiative Order</h3>
      <ol className="initiative-list">
        <li className="current">
          <span>You</span>
          <span className="initiative-roll">18</span>
        </li>
        <li>
          <span>Goblin</span>
          <span className="initiative-roll">12</span>
        </li>
        <li>
          <span>Companion</span>
          <span className="initiative-roll">15</span>
        </li>
      </ol>
    </div>
  );
};

export default InitiativePanel;
