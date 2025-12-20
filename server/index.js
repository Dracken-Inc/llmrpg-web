const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const campaignManager = require('./managers/campaignManager');
const characterManager = require('./managers/characterManager');
const initiativeManager = require('./managers/initiativeManager');
const encounterManager = require('./managers/encounterManager');
const chatManager = require('./managers/chatManager');
const userManager = require('./managers/userManager');
const { authenticateToken, requirePermission } = require('./middleware/auth');
const { asyncHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
// Note: CORS is set to '*' for development. In production, restrict to specific origins:
// const io = new Server(server, { cors: { origin: 'https://yourdomain.com' } });
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  } 
});

app.use(cors());
app.use(express.json());

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes (public)
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = userManager.register(username, password);
  
  if (!result.success) {
    return res.status(400).json({
      error: true,
      code: 'REGISTRATION_FAILED',
      message: result.error,
      status: 400
    });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = userManager.login(username, password);
  
  if (!result.success) {
    return res.status(401).json({
      error: true,
      code: 'LOGIN_FAILED',
      message: result.error,
      status: 401
    });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
}));

app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = userManager.getById(req.user.userId);
  res.json({
    success: true,
    user
  });
}));

// Campaign API routes (protected)
app.get('/api/campaigns', authenticateToken, (req, res) => {
  res.json(campaignManager.getAll());
});

app.get('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaign = campaignManager.getById(req.params.id);
  if (campaign) {
    res.json(campaign);
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

app.post('/api/campaigns', authenticateToken, (req, res) => {
  const campaign = campaignManager.create(req.body);
  res.status(201).json(campaign);
});

app.put('/api/campaigns/:id', authenticateToken, (req, res) => {
  const campaign = campaignManager.update(req.params.id, req.body);
  if (campaign) {
    res.json(campaign);
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

app.delete('/api/campaigns/:id', authenticateToken, (req, res) => {
  const success = campaignManager.delete(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Campaign not found' });
  }
});

// Character API routes
app.get('/api/characters', authenticateToken, (req, res) => {
  const { campaignId } = req.query;
  if (campaignId) {
    res.json(characterManager.getByCampaign(campaignId));
  } else {
    res.json(characterManager.getAll());
  }
});

app.get('/api/characters/:id', authenticateToken, (req, res) => {
  const character = characterManager.getById(req.params.id);
  if (character) {
    res.json(character);
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
});

app.post('/api/characters', authenticateToken, (req, res) => {
  const character = characterManager.create(req.body);
  res.status(201).json(character);
});

app.put('/api/characters/:id', authenticateToken, (req, res) => {
  const character = characterManager.update(req.params.id, req.body);
  if (character) {
    res.json(character);
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
});

app.delete('/api/characters/:id', authenticateToken, (req, res) => {
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

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});