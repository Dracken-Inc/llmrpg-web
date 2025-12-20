# LLMRPG Web Project

## Overview
LLMRPG is a fully functional web-based D&D 5E campaign assistant that allows players and game masters to manage campaigns, characters, and game sessions in real-time. The application features a user-friendly interface built with React for the client-side and an Express server with Socket.IO for real-time communication.

![LLMRPG Application](https://github.com/user-attachments/assets/66f97ac0-d349-48cf-a8fc-211456cafc7b)

## Features

### Real-Time Communication
- **Live Chat**: Communicate with other players in real-time
- **Socket.IO Integration**: Instant updates across all connected clients
- **Connection Status**: Visual indicator showing server connection status

### Game Management
- **Initiative Tracker**: Manage turn order with automatic sorting by initiative
- **Encounter Management**: Create and manage combat encounters
- **Character Sheets**: Full D&D 5E character sheets with ability scores, HP, AC, and more
- **Inventory System**: Track items and equipment
- **Spellbook**: Manage known spells with level organization
- **Active Effects**: Track buffs, debuffs, and conditions

### Responsive Design
- Dark fantasy theme with gold accents
- Mobile-responsive layout
- Intuitive three-panel design

## Project Structure

The project is organized into two main directories: `client` and `server`.

### Client
```
client/
├── public/
│   └── index.html          # Main HTML document
├── src/
│   ├── components/         # React components
│   │   ├── ChatPanel.jsx
│   │   ├── InitiativePanel.jsx
│   │   ├── EncounterPanel.jsx
│   │   ├── CharacterSheet.jsx
│   │   ├── InventoryPanel.jsx
│   │   ├── SpellbookPanel.jsx
│   │   └── EffectsPanel.jsx
│   ├── context/
│   │   └── GameContext.jsx # Global state management
│   ├── services/
│   │   ├── api.js          # REST API service
│   │   └── socket.js       # Socket.IO service
│   ├── App.jsx             # Main application component
│   ├── index.jsx           # Entry point
│   └── index.css           # Global styles
└── package.json
```

### Server
```
server/
├── managers/               # Business logic modules
│   ├── campaignManager.js
│   ├── characterManager.js
│   ├── initiativeManager.js
│   ├── encounterManager.js
│   └── chatManager.js
├── db/                     # JSON file storage
│   ├── campaigns.json
│   └── characters.json
├── index.js                # Server entry point
└── package.json
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llmrpg-web
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server** (from the `server` directory)
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```
   Server will run on `http://localhost:3001`

2. **Start the client** (from the `client` directory, in a new terminal)
   ```bash
   npm start
   ```
   Client will run on `http://localhost:3000`

3. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## API Documentation

### REST API Endpoints

#### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create a new campaign
- `PUT /api/campaigns/:id` - Update a campaign
- `DELETE /api/campaigns/:id` - Delete a campaign

#### Characters
- `GET /api/characters` - Get all characters
- `GET /api/characters?campaignId=<id>` - Get characters by campaign
- `GET /api/characters/:id` - Get character by ID
- `POST /api/characters` - Create a new character
- `PUT /api/characters/:id` - Update a character
- `DELETE /api/characters/:id` - Delete a character

### Socket.IO Events

#### Client → Server
- `joinCampaign(campaignId)` - Join a campaign room
- `leaveCampaign(campaignId)` - Leave a campaign room
- `sendMessage({campaignId, message})` - Send a chat message
- `addToInitiative({campaignId, participant})` - Add participant to initiative
- `removeFromInitiative({campaignId, participantId})` - Remove from initiative
- `nextTurn({campaignId})` - Advance to next turn
- `resetInitiative({campaignId})` - Reset initiative tracker
- `createEncounter({campaignId, encounter})` - Create an encounter
- `updateEncounter({campaignId, encounterId, updates})` - Update encounter
- `deleteEncounter({campaignId, encounterId})` - Delete encounter
- `updateCharacter({characterId, updates})` - Update character data

#### Server → Client
- `campaignState(state)` - Initial state on joining campaign
- `newMessage(message)` - New chat message received
- `initiativeUpdate(initiative)` - Initiative tracker updated
- `encounterCreated(encounter)` - New encounter created
- `encounterUpdated(encounter)` - Encounter updated
- `encounterDeleted(encounterId)` - Encounter deleted
- `characterUpdated(character)` - Character data updated

## Component Usage

### Creating a Character

Use the REST API to create a character:

```bash
curl -X POST http://localhost:3001/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gandalf",
    "class": "Wizard",
    "level": 10,
    "campaignId": "demo-campaign",
    "stats": {"str": 10, "dex": 14, "con": 16, "int": 20, "wis": 17, "cha": 15},
    "hp": {"current": 68, "max": 68, "temp": 0},
    "armorClass": 15,
    "speed": 30,
    "inventory": [],
    "spells": [],
    "effects": []
  }'
```

### Using the Initiative Tracker
1. Click "Add" button
2. Enter participant name and initiative roll
3. Click "Add" to submit
4. Use "Next Turn" to advance initiative
5. Use "Reset" to clear the tracker

### Managing Inventory
1. Select a character from the character sheet
2. Click "Add Item" in the Inventory panel
3. Fill in item details
4. Adjust quantities as needed
5. Remove items when consumed

## Technology Stack

- **Frontend**: React 17, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Data Storage**: JSON file-based storage
- **Real-time Communication**: WebSockets via Socket.IO
- **State Management**: React Context API

## Development

### Running Tests
```bash
# From client directory
npm test
```

### Building for Production
```bash
# From client directory
npm run build
```

### Code Style
The project follows standard React and Node.js conventions:
- Use functional components with hooks
- Implement proper error handling
- Follow ESLint recommendations

## Troubleshooting

### Port Already in Use
If port 3001 or 3000 is already in use:
```bash
# Change server port
PORT=3002 npm start

# Change client port
PORT=3001 npm start
```

### Socket Connection Issues
- Ensure server is running before starting client
- Check firewall settings
- Verify CORS configuration in `server/index.js`

### Character Not Loading
- Verify character has correct `campaignId` (default: "demo-campaign")
- Check browser console for errors
- Ensure server database files exist in `server/db/`

## Future Enhancements

Potential features for future development:
- User authentication and authorization
- Persistent database (MongoDB, PostgreSQL)
- Dice rolling integration
- Map and token management
- Campaign notes and journal
- Character creation wizard
- Integration with D&D 5E API for spells and monsters

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- D&D 5E by Wizards of the Coast
- React and Node.js communities
- Socket.IO for real-time capabilities