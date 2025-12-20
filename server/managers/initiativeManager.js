// In-memory storage for initiative tracking
let initiativeData = {};

module.exports = {
  get: (campaignId) => {
    return initiativeData[campaignId] || { round: 0, currentTurn: 0, participants: [] };
  },
  
  set: (campaignId, data) => {
    initiativeData[campaignId] = data;
    return initiativeData[campaignId];
  },
  
  addParticipant: (campaignId, participant) => {
    if (!initiativeData[campaignId]) {
      initiativeData[campaignId] = { round: 0, currentTurn: 0, participants: [] };
    }
    
    const newParticipant = {
      id: Date.now().toString(),
      ...participant,
      initiative: participant.initiative || 0
    };
    
    initiativeData[campaignId].participants.push(newParticipant);
    initiativeData[campaignId].participants.sort((a, b) => b.initiative - a.initiative);
    
    return initiativeData[campaignId];
  },
  
  removeParticipant: (campaignId, participantId) => {
    if (initiativeData[campaignId]) {
      initiativeData[campaignId].participants = initiativeData[campaignId].participants.filter(
        p => p.id !== participantId
      );
    }
    return initiativeData[campaignId];
  },
  
  nextTurn: (campaignId) => {
    if (initiativeData[campaignId]) {
      const { participants, currentTurn } = initiativeData[campaignId];
      if (participants.length > 0) {
        let nextTurn = currentTurn + 1;
        if (nextTurn >= participants.length) {
          nextTurn = 0;
          initiativeData[campaignId].round += 1;
        }
        initiativeData[campaignId].currentTurn = nextTurn;
      }
    }
    return initiativeData[campaignId];
  },
  
  reset: (campaignId) => {
    initiativeData[campaignId] = { round: 0, currentTurn: 0, participants: [] };
    return initiativeData[campaignId];
  }
};
