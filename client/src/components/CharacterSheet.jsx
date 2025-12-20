import React from 'react';
import { useGame } from '../context/GameContext';

function CharacterSheet() {
  const { currentCharacter, characters, setCurrentCharacter, updateCharacter } = useGame();

  if (!currentCharacter && characters.length === 0) {
    return (
      <div className="character-sheet">
        <h2>Character Sheet</h2>
        <p>No character selected. Create or select a character to view details.</p>
      </div>
    );
  }

  const character = currentCharacter || characters[0];

  const handleStatChange = (stat, value) => {
    const updatedCharacter = {
      ...character,
      stats: {
        ...character.stats,
        [stat]: parseInt(value, 10) || 0
      }
    };
    updateCharacter(character.id, updatedCharacter);
  };

  const handleHPChange = (field, value) => {
    updateCharacter(character.id, {
      hp: {
        ...character.hp,
        [field]: parseInt(value, 10) || 0
      }
    });
  };

  return (
    <div className="character-sheet">
      <h2>Character Sheet</h2>
      
      {characters.length > 1 && (
        <select 
          value={character.id} 
          onChange={(e) => {
            const selected = characters.find(c => c.id === e.target.value);
            setCurrentCharacter(selected);
          }}
        >
          {characters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      <div className="character-header">
        <h3>{character.name || 'Unnamed Character'}</h3>
        <p className="character-class">
          {character.class || 'No Class'} - Level {character.level || 1}
        </p>
      </div>

      <div className="hp-section">
        <h4>Hit Points</h4>
        <div className="hp-inputs">
          <div>
            <label>Current:</label>
            <input
              type="number"
              value={character.hp?.current || 0}
              onChange={(e) => handleHPChange('current', e.target.value)}
            />
          </div>
          <div>
            <label>Max:</label>
            <input
              type="number"
              value={character.hp?.max || 0}
              onChange={(e) => handleHPChange('max', e.target.value)}
            />
          </div>
          <div>
            <label>Temp:</label>
            <input
              type="number"
              value={character.hp?.temp || 0}
              onChange={(e) => handleHPChange('temp', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h4>Ability Scores</h4>
        <div className="stats-grid">
          {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((stat) => (
            <div key={stat} className="stat-item">
              <label>{stat.toUpperCase()}</label>
              <input
                type="number"
                value={character.stats?.[stat] || 10}
                onChange={(e) => handleStatChange(stat, e.target.value)}
              />
              <span className="modifier">
                {Math.floor(((character.stats?.[stat] || 10) - 10) / 2) >= 0 ? '+' : ''}
                {Math.floor(((character.stats?.[stat] || 10) - 10) / 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="character-info">
        <p><strong>AC:</strong> {character.armorClass || 10}</p>
        <p><strong>Speed:</strong> {character.speed || 30} ft</p>
        <p><strong>Initiative:</strong> +{Math.floor(((character.stats?.dex || 10) - 10) / 2)}</p>
      </div>
    </div>
  );
}

export default CharacterSheet;