const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const campaignManager = require('./managers/campaignManager');
const characterManager = require('./managers/characterManager');
// ...other managers

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/api/campaigns', (req, res) => {
  res.json(campaignManager.getAll());
});

io.on('connection', (socket) => {
  socket.on('joinCampaign', (campaignId) => {
    socket.join(`campaign_${campaignId}`);
    socket.emit('state', { /* ...initial state... */ });
  });
  // ...other events
});

server.listen(3001, () => console.log('Server running on port 3001'));