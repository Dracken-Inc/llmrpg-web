import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

function EncounterPanel() {
  const { encounters, createEncounter, updateEncounter, deleteEncounter } = useGame();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEncounter, setNewEncounter] = useState({ name: '', description: '' });

  const handleCreateEncounter = (e) => {
    e.preventDefault();
    if (newEncounter.name) {
      createEncounter({
        name: newEncounter.name,
        description: newEncounter.description,
        enemies: []
      });
      setNewEncounter({ name: '', description: '' });
      setShowCreateForm(false);
    }
  };

  const toggleEncounterActive = (encounter) => {
    updateEncounter(encounter.id, { active: !encounter.active });
  };

  const handleDeleteEncounter = (encounterId) => {
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      deleteEncounter(encounterId);
    }
  };

  const activeEncounter = encounters.find(e => e.active);

  return (
    <div className="encounter-panel">
      <h2>Encounters</h2>
      
      <div className="encounter-controls">
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'New Encounter'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateEncounter} className="create-encounter-form">
          <input
            type="text"
            placeholder="Encounter name"
            value={newEncounter.name}
            onChange={(e) => setNewEncounter({ ...newEncounter, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={newEncounter.description}
            onChange={(e) => setNewEncounter({ ...newEncounter, description: e.target.value })}
          />
          <button type="submit">Create</button>
        </form>
      )}

      {activeEncounter && (
        <div className="active-encounter">
          <h3>{activeEncounter.name}</h3>
          <p>{activeEncounter.description}</p>
          <p className="enemy-count">Enemies: {activeEncounter.enemies.length}</p>
        </div>
      )}

      <div className="encounter-list">
        {encounters.length === 0 ? (
          <p>No encounters created yet.</p>
        ) : (
          encounters.map((encounter) => (
            <div
              key={encounter.id}
              className={`encounter-item ${encounter.active ? 'active' : ''}`}
            >
              <div className="encounter-info">
                <h4>{encounter.name}</h4>
                <p>{encounter.description}</p>
              </div>
              <div className="encounter-actions">
                <button onClick={() => toggleEncounterActive(encounter)}>
                  {encounter.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDeleteEncounter(encounter.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EncounterPanel;