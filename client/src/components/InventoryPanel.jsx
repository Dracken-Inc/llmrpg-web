import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

function InventoryPanel() {
  const { currentCharacter, updateCharacter } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, description: '' });

  const inventory = currentCharacter?.inventory || [];

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name) {
      const updatedInventory = [
        ...inventory,
        {
          id: Date.now().toString(),
          ...newItem,
          quantity: parseInt(newItem.quantity, 10) || 1
        }
      ];
      updateCharacter(currentCharacter.id, { inventory: updatedInventory });
      setNewItem({ name: '', quantity: 1, description: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    const updatedInventory = inventory.filter(item => item.id !== itemId);
    updateCharacter(currentCharacter.id, { inventory: updatedInventory });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const updatedInventory = inventory.map(item =>
      item.id === itemId ? { ...item, quantity: parseInt(newQuantity, 10) || 0 } : item
    );
    updateCharacter(currentCharacter.id, { inventory: updatedInventory });
  };

  if (!currentCharacter) {
    return (
      <div className="inventory-panel">
        <h2>Inventory</h2>
        <p>No character selected.</p>
      </div>
    );
  }

  return (
    <div className="inventory-panel">
      <h2>Inventory</h2>
      
      <div className="inventory-controls">
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddItem} className="add-item-form">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            min="1"
          />
          <input
            type="text"
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="inventory-list">
        {inventory.length === 0 ? (
          <p>Your inventory is empty.</p>
        ) : (
          inventory.map((item) => (
            <div key={item.id} className="inventory-item">
              <div className="item-info">
                <h4>{item.name}</h4>
                {item.description && <p>{item.description}</p>}
              </div>
              <div className="item-controls">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  min="0"
                  className="quantity-input"
                />
                <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InventoryPanel;