// In-memory storage for chat messages
let messages = {};

module.exports = {
  getByCampaign: (campaignId, limit = 100) => {
    const campaignMessages = messages[campaignId] || [];
    return campaignMessages.slice(-limit);
  },
  
  add: (campaignId, message) => {
    if (!messages[campaignId]) {
      messages[campaignId] = [];
    }
    
    const newMessage = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    };
    
    messages[campaignId].push(newMessage);
    
    // Keep only last 500 messages per campaign to prevent memory issues
    if (messages[campaignId].length > 500) {
      messages[campaignId] = messages[campaignId].slice(-500);
    }
    
    return newMessage;
  },
  
  clear: (campaignId) => {
    messages[campaignId] = [];
    return true;
  }
};
