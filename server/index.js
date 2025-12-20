const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const campaignManager = require('./managers/campaignManager');
const characterManager = require('./managers/characterManager');
const initiativeManager = require('./managers/initiativeManager');
const encounterManager = require('./managers/encounterManager');
const chatManager = require('./managers/chatManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  } 
});

app.use(cors());
app.use(express.json());

// Campaign API routes
app.get('/api/campaigns', (req, res) => {
  res.json(campaignManager.getAll());
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaignManager.getById(req.params.id);
  if (campaign) {
    res.json(campaign);
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

app.post('/api/campaigns', (req, res) => {
  const campaign = campaignManager.create(req.body);
  res.status(201).json(campaign);
});

app.put('/api/campaigns/:id', (req, res) => {
  const campaign = campaignManager.update(req.params.id, req.body);
  if (campaign) {
    res.json(campaign);
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

app.delete('/api/campaigns/:id', (req, res) => {
  const success = campaignManager.delete(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Character API routes
app.get('/api/characters', (req, res) => {
  const { campaignId } = req.query;
  if (campaignId) {
    res.json(characterManager.getByCampaign(campaignId));
  } else {
    res.json(characterManager.getAll());
  }
});

app.get('/api/characters/:id', (req, res) => {
  const character = characterManager.getById(req.params.id);
  if (character) {
    res.json(character);
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
});

app.post('/api/characters', (req, res) => {
  const character = characterManager.create(req.body);
  res.status(201).json(character);
});

app.put('/api/characters/:id', (req, res) => {
  const character = characterManager.update(req.params.id, req.body);
  if (character) {
    res.json(character);
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
});

app.delete('/api/characters/:id', (req, res) => {
  const success = characterManager.delete(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
});

// Socket.IO real-time events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinCampaign', (campaignId) => {
    socket.join(`campaign_${campaignId}`);
    console.log(`Socket ${socket.id} joined campaign ${campaignId}`);
    
    // Send initial state
    socket.emit('campaignState', {
      initiative: initiativeManager.get(campaignId),
      encounters: encounterManager.getByCampaign(campaignId),
      messages: chatManager.getByCampaign(campaignId)
    });
  });
  
  socket.on('leaveCampaign', (campaignId) => {
    socket.leave(`campaign_${campaignId}`);
    console.log(`Socket ${socket.id} left campaign ${campaignId}`);
  });
  
  // Chat events
  socket.on('sendMessage', ({ campaignId, message }) => {
    const newMessage = chatManager.add(campaignId, message);
    io.to(`campaign_${campaignId}`).emit('newMessage', newMessage);
  });
  
  // Initiative events
  socket.on('addToInitiative', ({ campaignId, participant }) => {
    const initiative = initiativeManager.addParticipant(campaignId, participant);
    io.to(`campaign_${campaignId}`).emit('initiativeUpdate', initiative);
  });
  
  socket.on('removeFromInitiative', ({ campaignId, participantId }) => {
    const initiative = initiativeManager.removeParticipant(campaignId, participantId);
    io.to(`campaign_${campaignId}`).emit('initiativeUpdate', initiative);
  });
  
  socket.on('nextTurn', ({ campaignId }) => {
    const initiative = initiativeManager.nextTurn(campaignId);
    io.to(`campaign_${campaignId}`).emit('initiativeUpdate', initiative);
  });
  
  socket.on('resetInitiative', ({ campaignId }) => {
    const initiative = initiativeManager.reset(campaignId);
    io.to(`campaign_${campaignId}`).emit('initiativeUpdate', initiative);
  });
  
  // Encounter events
  socket.on('createEncounter', ({ campaignId, encounter }) => {
    const newEncounter = encounterManager.create(campaignId, encounter);
    io.to(`campaign_${campaignId}`).emit('encounterCreated', newEncounter);
  });
  
  socket.on('updateEncounter', ({ campaignId, encounterId, updates }) => {
    const encounter = encounterManager.update(campaignId, encounterId, updates);
    if (encounter) {
      io.to(`campaign_${campaignId}`).emit('encounterUpdated', encounter);
    }
  });
  
  socket.on('deleteEncounter', ({ campaignId, encounterId }) => {
    const success = encounterManager.delete(campaignId, encounterId);
    if (success) {
      io.to(`campaign_${campaignId}`).emit('encounterDeleted', encounterId);
    }
  });
  
  // Character update events
  socket.on('updateCharacter', ({ characterId, updates }) => {
    const character = characterManager.update(characterId, updates);
    if (character) {
      io.to(`campaign_${character.campaignId}`).emit('characterUpdated', character);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});