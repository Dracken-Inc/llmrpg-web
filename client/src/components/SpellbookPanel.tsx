import React from 'react';

interface Spell {
  id: string;
  name: string;
  level: number;
  range: string;
  description: string;
}

const SpellbookPanel: React.FC = () => {
  const [spells] = React.useState<Spell[]>([
    {
      id: '1',
      name: 'Magic Missile',
      level: 1,
      range: '120 ft',
      description: 'Fire magical projectiles at your target'
    },
    {
      id: '2',
      name: 'Shield',
      level: 1,
      range: 'Self',
      description: 'Grant yourself +5 AC until your next turn'
    },
    {
      id: '3',
      name: 'Fireball',
      level: 3,
      range: '150 ft',
      description: 'Explode a ball of flame in a 20-foot radius'
    }
  ]);

  const handleCastSpell = (spellId: string) => {
    console.log(`Casting spell: ${spellId}`);
  };

  return (
    <div className="spellbook-panel">
      <h3>Spellbook</h3>
      <div className="spells-list">
        {spells.map((spell) => (
          <div key={spell.id} className="spell-item">
            <div className="spell-header">
              <span className="spell-name">{spell.name}</span>
              <span className="spell-level">Lvl {spell.level}</span>
            </div>
            <div className="spell-details">
              <span className="spell-range">Range: {spell.range}</span>
              <p className="spell-description">{spell.description}</p>
            </div>
            <button onClick={() => handleCastSpell(spell.id)} className="cast-btn">
              Cast
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpellbookPanel;
