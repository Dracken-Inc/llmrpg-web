import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

function EffectsPanel() {
  const { currentCharacter, updateCharacter } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEffect, setNewEffect] = useState({ name: '', duration: '', description: '' });

  const effects = currentCharacter?.effects || [];

  const handleAddEffect = (e) => {
    e.preventDefault();
    if (newEffect.name) {
      const updatedEffects = [
        ...effects,
        {
          id: Date.now().toString(),
          ...newEffect,
          active: true
        }
      ];
      updateCharacter(currentCharacter.id, { effects: updatedEffects });
      setNewEffect({ name: '', duration: '', description: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveEffect = (effectId) => {
    const updatedEffects = effects.filter(effect => effect.id !== effectId);
    updateCharacter(currentCharacter.id, { effects: updatedEffects });
  };

  const toggleEffectActive = (effectId) => {
    const updatedEffects = effects.map(effect =>
      effect.id === effectId ? { ...effect, active: !effect.active } : effect
    );
    updateCharacter(currentCharacter.id, { effects: updatedEffects });
  };

  if (!currentCharacter) {
    return (
      <div className="effects-panel">
        <h2>Active Effects</h2>
        <p>No character selected.</p>
      </div>
    );
  }

  const activeEffects = effects.filter(e => e.active);
  const inactiveEffects = effects.filter(e => !e.active);

  return (
    <div className="effects-panel">
      <h2>Active Effects</h2>
      
      <div className="effects-controls">
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Effect'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEffect} className="add-effect-form">
          <input
            type="text"
            placeholder="Effect name"
            value={newEffect.name}
            onChange={(e) => setNewEffect({ ...newEffect, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Duration (e.g., 1 hour, 3 rounds)"
            value={newEffect.duration}
            onChange={(e) => setNewEffect({ ...newEffect, duration: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newEffect.description}
            onChange={(e) => setNewEffect({ ...newEffect, description: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="effects-list">
        {activeEffects.length === 0 && inactiveEffects.length === 0 ? (
          <p>No active effects.</p>
        ) : (
          <>
            {activeEffects.length > 0 && (
              <div className="active-effects">
                <h3>Active</h3>
                {activeEffects.map((effect) => (
                  <div key={effect.id} className="effect-item active">
                    <div className="effect-info">
                      <h4>{effect.name}</h4>
                      {effect.duration && <p className="effect-duration">Duration: {effect.duration}</p>}
                      {effect.description && <p>{effect.description}</p>}
                    </div>
                    <div className="effect-controls">
                      <button onClick={() => toggleEffectActive(effect.id)}>Deactivate</button>
                      <button onClick={() => handleRemoveEffect(effect.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inactiveEffects.length > 0 && (
              <div className="inactive-effects">
                <h3>Inactive</h3>
                {inactiveEffects.map((effect) => (
                  <div key={effect.id} className="effect-item inactive">
                    <div className="effect-info">
                      <h4>{effect.name}</h4>
                      {effect.duration && <p className="effect-duration">Duration: {effect.duration}</p>}
                    </div>
                    <div className="effect-controls">
                      <button onClick={() => toggleEffectActive(effect.id)}>Activate</button>
                      <button onClick={() => handleRemoveEffect(effect.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EffectsPanel;