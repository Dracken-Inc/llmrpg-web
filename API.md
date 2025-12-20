# API Documentation

## REST API Reference

All API endpoints are prefixed with `/api` and return JSON responses.

### Campaigns

#### List All Campaigns
```http
GET /api/campaigns
```

**Response:**
```json
[
  {
    "id": "1234567890",
    "name": "Lost Mine of Phandelver",
    "description": "A classic D&D adventure",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Campaign by ID
```http
GET /api/campaigns/:id
```

**Response:**
```json
{
  "id": "1234567890",
  "name": "Lost Mine of Phandelver",
  "description": "A classic D&D adventure",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Campaign
```http
POST /api/campaigns
Content-Type: application/json

{
  "name": "Curse of Strahd",
  "description": "Gothic horror adventure"
}
```

**Response:**
```json
{
  "id": "1234567891",
  "name": "Curse of Strahd",
  "description": "Gothic horror adventure",
  "createdAt": "2024-01-02T00:00:00.000Z"
}
```

#### Update Campaign
```http
PUT /api/campaigns/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Campaign
```http
DELETE /api/campaigns/:id
```

**Response:**
```json
{
  "success": true
}
```

### Characters

#### List All Characters
```http
GET /api/characters
```

**Query Parameters:**
- `campaignId` (optional) - Filter characters by campaign

**Response:**
```json
[
  {
    "id": "9876543210",
    "name": "Thorin Ironforge",
    "class": "Fighter",
    "level": 5,
    "campaignId": "demo-campaign",
    "stats": {
      "str": 16,
      "dex": 12,
      "con": 15,
      "int": 10,
      "wis": 11,
      "cha": 8
    },
    "hp": {
      "current": 42,
      "max": 42,
      "temp": 0
    },
    "armorClass": 18,
    "speed": 30,
    "inventory": [],
    "spells": [],
    "effects": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Character by ID
```http
GET /api/characters/:id
```

#### Create Character
```http
POST /api/characters
Content-Type: application/json

{
  "name": "Elara Moonwhisper",
  "class": "Wizard",
  "level": 3,
  "campaignId": "demo-campaign",
  "stats": {
    "str": 8,
    "dex": 14,
    "con": 12,
    "int": 18,
    "wis": 13,
    "cha": 10
  },
  "hp": {
    "current": 18,
    "max": 18,
    "temp": 0
  },
  "armorClass": 12,
  "speed": 30,
  "inventory": [
    {
      "id": "item1",
      "name": "Spellbook",
      "quantity": 1,
      "description": "Contains known spells"
    }
  ],
  "spells": [
    {
      "id": "spell1",
      "name": "Magic Missile",
      "level": 1,
      "school": "Evocation",
      "description": "Auto-hit force damage",
      "prepared": true
    }
  ],
  "effects": []
}
```

#### Update Character
```http
PUT /api/characters/:id
Content-Type: application/json

{
  "hp": {
    "current": 35,
    "max": 42,
    "temp": 5
  }
}
```

#### Delete Character
```http
DELETE /api/characters/:id
```

## WebSocket API (Socket.IO)

Connect to the server at `http://localhost:3001` using Socket.IO client.

### Connection Events

#### Connect
Automatically emitted when connection is established.

```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### Disconnect
Emitted when connection is lost.

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

### Campaign Events

#### Join Campaign
Join a campaign room to receive real-time updates.

```javascript
socket.emit('joinCampaign', 'demo-campaign');
```

**Server Response:**
```javascript
socket.on('campaignState', (state) => {
  // state.initiative - current initiative tracker state
  // state.encounters - list of encounters
  // state.messages - recent chat messages
});
```

#### Leave Campaign
Leave a campaign room.

```javascript
socket.emit('leaveCampaign', 'demo-campaign');
```

### Chat Events

#### Send Message
```javascript
socket.emit('sendMessage', {
  campaignId: 'demo-campaign',
  message: {
    text: 'Hello, adventurers!',
    sender: 'Thorin'
  }
});
```

**Server Broadcast:**
```javascript
socket.on('newMessage', (message) => {
  // message.id - unique message ID
  // message.text - message content
  // message.sender - sender name
  // message.timestamp - ISO timestamp
});
```

### Initiative Events

#### Add Participant
```javascript
socket.emit('addToInitiative', {
  campaignId: 'demo-campaign',
  participant: {
    name: 'Goblin',
    initiative: 15
  }
});
```

**Server Broadcast:**
```javascript
socket.on('initiativeUpdate', (initiative) => {
  // initiative.round - current round number
  // initiative.currentTurn - index of current participant
  // initiative.participants - array of participants sorted by initiative
});
```

#### Remove Participant
```javascript
socket.emit('removeFromInitiative', {
  campaignId: 'demo-campaign',
  participantId: 'participant-id'
});
```

#### Next Turn
Advance to the next participant in initiative.

```javascript
socket.emit('nextTurn', {
  campaignId: 'demo-campaign'
});
```

#### Reset Initiative
Clear the initiative tracker.

```javascript
socket.emit('resetInitiative', {
  campaignId: 'demo-campaign'
});
```

### Encounter Events

#### Create Encounter
```javascript
socket.emit('createEncounter', {
  campaignId: 'demo-campaign',
  encounter: {
    name: 'Goblin Ambush',
    description: 'A group of goblins attacks!',
    enemies: [
      { name: 'Goblin 1', hp: 7 },
      { name: 'Goblin 2', hp: 7 }
    ]
  }
});
```

**Server Broadcast:**
```javascript
socket.on('encounterCreated', (encounter) => {
  // New encounter with generated ID
});
```

#### Update Encounter
```javascript
socket.emit('updateEncounter', {
  campaignId: 'demo-campaign',
  encounterId: 'encounter-id',
  updates: {
    active: true
  }
});
```

**Server Broadcast:**
```javascript
socket.on('encounterUpdated', (encounter) => {
  // Updated encounter
});
```

#### Delete Encounter
```javascript
socket.emit('deleteEncounter', {
  campaignId: 'demo-campaign',
  encounterId: 'encounter-id'
});
```

**Server Broadcast:**
```javascript
socket.on('encounterDeleted', (encounterId) => {
  // ID of deleted encounter
});
```

### Character Events

#### Update Character
```javascript
socket.emit('updateCharacter', {
  characterId: 'character-id',
  updates: {
    hp: {
      current: 35,
      max: 42,
      temp: 0
    }
  }
});
```

**Server Broadcast:**
```javascript
socket.on('characterUpdated', (character) => {
  // Updated character object
});
```

## Error Handling

All REST API endpoints return standard HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include an error message:

```json
{
  "error": "Campaign not found"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting to prevent abuse.

## CORS

The server accepts requests from any origin (`*`). For production use, configure CORS to accept requests only from your client domain.

```javascript
const io = new Server(server, { 
  cors: { 
    origin: 'https://yourdomain.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  } 
});
```
