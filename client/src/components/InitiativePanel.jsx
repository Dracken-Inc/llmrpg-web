import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

function InitiativePanel() {
  const { initiative, addToInitiative, removeFromInitiative, nextTurn, resetInitiative } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', initiative: '' });

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (newParticipant.name && newParticipant.initiative) {
      addToInitiative({
        name: newParticipant.name,
        initiative: parseInt(newParticipant.initiative, 10)
      });
      setNewParticipant({ name: '', initiative: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveParticipant = (participantId) => {
    removeFromInitiative(participantId);
  };

  return (
    <div className="initiative-panel">
      <h2>Initiative Tracker</h2>
      <div className="initiative-info">
        <p>Round: {initiative.round}</p>
        <div className="initiative-controls">
          <button onClick={nextTurn}>Next Turn</button>
          <button onClick={resetInitiative}>Reset</button>
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddParticipant} className="add-participant-form">
          <input
            type="text"
            placeholder="Name"
            value={newParticipant.name}
            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Initiative"
            value={newParticipant.initiative}
            onChange={(e) => setNewParticipant({ ...newParticipant, initiative: e.target.value })}
            required
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="initiative-list">
        {initiative.participants.length === 0 ? (
          <p>No participants in initiative. Add some!</p>
        ) : (
          initiative.participants.map((participant, index) => (
            <div
              key={participant.id}
              className={`initiative-participant ${
                index === initiative.currentTurn ? 'current-turn' : ''
              }`}
            >
              <span className="participant-initiative">{participant.initiative}</span>
              <span className="participant-name">{participant.name}</span>
              <button
                className="remove-btn"
                onClick={() => handleRemoveParticipant(participant.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InitiativePanel;