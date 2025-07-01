import React from 'react';
import ChatPanel from './components/ChatPanel';
import InitiativePanel from './components/InitiativePanel';
import EncounterPanel from './components/EncounterPanel';
import CharacterSheet from './components/CharacterSheet';
import InventoryPanel from './components/InventoryPanel';
import SpellbookPanel from './components/SpellbookPanel';
import EffectsPanel from './components/EffectsPanel';

function App() {
  return (
    <div>
      <header>
        <img src="/assets/logo.png" alt="LLMRPG Logo" />
        <nav>
          <button>Settings</button>
          <button>Profile</button>
          <button>Help</button>
          <button>Disconnect</button>
        </nav>
      </header>
      <aside>
        <ChatPanel />
        <InitiativePanel />
        <EncounterPanel />
      </aside>
      <main>
        {/* Map/Scene/Narrative panels here */}
      </main>
      <aside>
        <CharacterSheet />
        <InventoryPanel />
        <SpellbookPanel />
        <EffectsPanel />
      </aside>
      <footer>
        {/* Action buttons and timer */}
      </footer>
    </div>
  );
}

export default App;