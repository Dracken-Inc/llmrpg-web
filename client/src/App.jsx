import React from 'react';
import ChatPanel from './components/ChatPanel';
import InitiativePanel from './components/InitiativePanel';
import EncounterPanel from './components/EncounterPanel';
import CharacterSheet from './components/CharacterSheet';
import InventoryPanel from './components/InventoryPanel';
import SpellbookPanel from './components/SpellbookPanel';
import EffectsPanel from './components/EffectsPanel';
import { useGame } from './context/GameContext';

function App() {
  const { connected } = useGame();

  return (
    <div>
      <header>
        <img src="/assets/logo.png" alt="LLMRPG Logo" />
        <nav>
          <button>Settings</button>
          <button>Profile</button>
          <button>Help</button>
          <button className={connected ? 'connected' : 'disconnected'}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </button>
        </nav>
      </header>
      <div className="app-container">
        <aside>
          <ChatPanel />
          <InitiativePanel />
          <EncounterPanel />
        </aside>
        <main>
          <h1>LLMRPG - D&D 5E Campaign Assistant</h1>
          <p>Welcome to your D&D campaign management tool. Use the panels on the left and right to manage your game.</p>
          <div className="main-info">
            <h2>Getting Started</h2>
            <ul>
              <li>Use the <strong>Chat</strong> panel to communicate with other players</li>
              <li>Track turn order with the <strong>Initiative</strong> tracker</li>
              <li>Manage combat with the <strong>Encounters</strong> panel</li>
              <li>View and edit your <strong>Character Sheet</strong> on the right</li>
              <li>Organize your <strong>Inventory</strong> and <strong>Spells</strong></li>
              <li>Track active <strong>Effects</strong> on your character</li>
            </ul>
          </div>
        </main>
        <aside>
          <CharacterSheet />
          <InventoryPanel />
          <SpellbookPanel />
          <EffectsPanel />
        </aside>
      </div>
      <footer>
        <p>LLMRPG Web &copy; 2024 - Powered by React & Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;