import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinCampaign(campaignId) {
    if (this.socket) {
      this.socket.emit('joinCampaign', campaignId);
    }
  }

  leaveCampaign(campaignId) {
    if (this.socket) {
      this.socket.emit('leaveCampaign', campaignId);
    }
  }

  // Chat methods
  sendMessage(campaignId, message) {
    if (this.socket) {
      this.socket.emit('sendMessage', { campaignId, message });
    }
  }

  // Initiative methods
  addToInitiative(campaignId, participant) {
    if (this.socket) {
      this.socket.emit('addToInitiative', { campaignId, participant });
    }
  }

  removeFromInitiative(campaignId, participantId) {
    if (this.socket) {
      this.socket.emit('removeFromInitiative', { campaignId, participantId });
    }
  }

  nextTurn(campaignId) {
    if (this.socket) {
      this.socket.emit('nextTurn', { campaignId });
    }
  }

  resetInitiative(campaignId) {
    if (this.socket) {
      this.socket.emit('resetInitiative', { campaignId });
    }
  }

  // Encounter methods
  createEncounter(campaignId, encounter) {
    if (this.socket) {
      this.socket.emit('createEncounter', { campaignId, encounter });
    }
  }

  updateEncounter(campaignId, encounterId, updates) {
    if (this.socket) {
      this.socket.emit('updateEncounter', { campaignId, encounterId, updates });
    }
  }

  deleteEncounter(campaignId, encounterId) {
    if (this.socket) {
      this.socket.emit('deleteEncounter', { campaignId, encounterId });
    }
  }

  // Character methods
  updateCharacter(characterId, updates) {
    if (this.socket) {
      this.socket.emit('updateCharacter', { characterId, updates });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();
