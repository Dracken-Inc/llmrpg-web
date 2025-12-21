import React from 'react';

const EffectsPanel: React.FC = () => {
  return (
    <div className="effects-panel">
      <h3>Active Effects</h3>
      <ul className="effects-list">
        <li className="effect">
          <span className="effect-icon">⚔️</span>
          <span className="effect-name">Bless</span>
          <span className="effect-duration">2 rounds</span>
        </li>
        <li className="effect">
          <span className="effect-icon">🛡️</span>
          <span className="effect-name">Shield</span>
          <span className="effect-duration">1 round</span>
        </li>
      </ul>
    </div>
  );
};

export default EffectsPanel;
