import React from 'react';

const EncounterPanel: React.FC = () => {
  return (
    <div className="encounter-panel">
      <h3>Encounter</h3>
      <div className="enemies-list">
        <div className="enemy">
          <span>Goblin</span>
          <div className="health-bar">
            <div className="health-fill" style={{ width: '50%' }}></div>
          </div>
        </div>
        <div className="enemy">
          <span>Goblin Archer</span>
          <div className="health-bar">
            <div className="health-fill" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterPanel;
