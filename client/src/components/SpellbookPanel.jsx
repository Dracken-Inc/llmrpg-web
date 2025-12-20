import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

function SpellbookPanel() {
  const { currentCharacter, updateCharacter } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpell, setNewSpell] = useState({ name: '', level: 0, school: '', description: '' });

  const spells = currentCharacter?.spells || [];

  const handleAddSpell = (e) => {
    e.preventDefault();
    if (newSpell.name) {
      const updatedSpells = [
        ...spells,
        {
          id: Date.now().toString(),
          ...newSpell,
          level: parseInt(newSpell.level, 10) || 0,
          prepared: false
        }
      ];
      updateCharacter(currentCharacter.id, { spells: updatedSpells });
      setNewSpell({ name: '', level: 0, school: '', description: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveSpell = (spellId) => {
    const updatedSpells = spells.filter(spell => spell.id !== spellId);
    updateCharacter(currentCharacter.id, { spells: updatedSpells });
  };

  const togglePrepared = (spellId) => {
    const updatedSpells = spells.map(spell =>
      spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
    );
    updateCharacter(currentCharacter.id, { spells: updatedSpells });
  };

  if (!currentCharacter) {
    return (
      <div className="spellbook-panel">
        <h2>Spellbook</h2>
        <p>No character selected.</p>
      </div>
    );
  }

  const spellsByLevel = spells.reduce((acc, spell) => {
    const level = spell.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(spell);
    return acc;
  }, {});

  return (
    <div className="spellbook-panel">
      <h2>Spellbook</h2>
      
      <div className="spellbook-controls">
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Spell'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSpell} className="add-spell-form">
          <input
            type="text"
            placeholder="Spell name"
            value={newSpell.name}
            onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Level"
            value={newSpell.level}
            onChange={(e) => setNewSpell({ ...newSpell, level: e.target.value })}
            min="0"
            max="9"
          />
          <input
            type="text"
            placeholder="School"
            value={newSpell.school}
            onChange={(e) => setNewSpell({ ...newSpell, school: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newSpell.description}
            onChange={(e) => setNewSpell({ ...newSpell, description: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="spell-list">
        {spells.length === 0 ? (
          <p>No spells in your spellbook.</p>
        ) : (
          Object.keys(spellsByLevel).sort((a, b) => a - b).map((level) => (
            <div key={level} className="spell-level-group">
              <h3>Level {level} {level === '0' ? '(Cantrips)' : ''}</h3>
              {spellsByLevel[level].map((spell) => (
                <div key={spell.id} className={`spell-item ${spell.prepared ? 'prepared' : ''}`}>
                  <div className="spell-info">
                    <h4>{spell.name}</h4>
                    {spell.school && <p className="spell-school">{spell.school}</p>}
                    {spell.description && <p>{spell.description}</p>}
                  </div>
                  <div className="spell-controls">
                    <label>
                      <input
                        type="checkbox"
                        checked={spell.prepared}
                        onChange={() => togglePrepared(spell.id)}
                      />
                      Prepared
                    </label>
                    <button onClick={() => handleRemoveSpell(spell.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SpellbookPanel;