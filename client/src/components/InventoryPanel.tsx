import React from 'react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
}

const InventoryPanel: React.FC = () => {
  const [items] = React.useState<InventoryItem[]>([
    { id: '1', name: 'Longsword', quantity: 1, type: 'weapon' },
    { id: '2', name: 'Leather Armor', quantity: 1, type: 'armor' },
    { id: '3', name: 'Health Potion', quantity: 5, type: 'consumable' },
    { id: '4', name: 'Gold Coins', quantity: 250, type: 'misc' }
  ]);

  const handleUseItem = (itemId: string) => {
    console.log(`Using item: ${itemId}`);
  };

  return (
    <div className="inventory-panel">
      <h3>Inventory</h3>
      <div className="inventory-list">
        {items.map((item) => (
          <div key={item.id} className={`inventory-item ${item.type}`}>
            <span className="item-name">{item.name}</span>
            <span className="item-quantity">x{item.quantity}</span>
            {item.type === 'consumable' && (
              <button onClick={() => handleUseItem(item.id)} className="use-btn">
                Use
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryPanel;
