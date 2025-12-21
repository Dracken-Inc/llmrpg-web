import React from 'react';
import { useGame } from '../context/GameContext';

const CharacterSheet: React.FC = () => {
  return (
    <div className="character-sheet">
      <h3>Character Stats</h3>
      <div className="stats-grid">
        <div className="stat">
          <label>STR</label>
          <div className="value">10</div>
        </div>
        <div className="stat">
          <label>DEX</label>
          <div className="value">12</div>
        </div>
        <div className="stat">
          <label>CON</label>
          <div className="value">11</div>
        </div>
        <div className="stat">
          <label>INT</label>
          <div className="value">13</div>
        </div>
        <div className="stat">
          <label>WIS</label>
          <div className="value">14</div>
        </div>
        <div className="stat">
          <label>CHA</label>
          <div className="value">9</div>
        </div>
      </div>

      <div className="health">
        <label>Health</label>
        <div className="health-bar">
          <div className="health-fill" style={{ width: '75%' }}></div>
        </div>
        <span>15/20</span>
      </div>

      <div className="equipment">
        <h4>Equipment</h4>
        <div className="equipment-slot">
          <span>Weapon:</span>
          <span>Longsword</span>
        </div>
        <div className="equipment-slot">
          <span>Armor:</span>
          <span>Leather Armor</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
