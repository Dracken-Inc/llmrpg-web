// In-memory storage for encounters
let encounters = {};

module.exports = {
  getByCampaign: (campaignId) => {
    return encounters[campaignId] || [];
  },
  
  getById: (campaignId, encounterId) => {
    const campaignEncounters = encounters[campaignId] || [];
    return campaignEncounters.find(e => e.id === encounterId);
  },
  
  create: (campaignId, encounter) => {
    if (!encounters[campaignId]) {
      encounters[campaignId] = [];
    }
    
    const newEncounter = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: false,
      enemies: [],
      ...encounter
    };
    
    encounters[campaignId].push(newEncounter);
    return newEncounter;
  },
  
  update: (campaignId, encounterId, updates) => {
    if (encounters[campaignId]) {
      const index = encounters[campaignId].findIndex(e => e.id === encounterId);
      if (index !== -1) {
        encounters[campaignId][index] = {
          ...encounters[campaignId][index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return encounters[campaignId][index];
      }
    }
    return null;
  },
  
  delete: (campaignId, encounterId) => {
    if (encounters[campaignId]) {
      const filtered = encounters[campaignId].filter(e => e.id !== encounterId);
      if (filtered.length < encounters[campaignId].length) {
        encounters[campaignId] = filtered;
        return true;
      }
    }
    return false;
  },
  
  addEnemy: (campaignId, encounterId, enemy) => {
    if (encounters[campaignId]) {
      const encounter = encounters[campaignId].find(e => e.id === encounterId);
      if (encounter) {
        const newEnemy = {
          id: Date.now().toString() + Math.random(),
          ...enemy
        };
        encounter.enemies.push(newEnemy);
        return encounter;
      }
    }
    return null;
  },
  
  removeEnemy: (campaignId, encounterId, enemyId) => {
    if (encounters[campaignId]) {
      const encounter = encounters[campaignId].find(e => e.id === encounterId);
      if (encounter) {
        encounter.enemies = encounter.enemies.filter(e => e.id !== enemyId);
        return encounter;
      }
    }
    return null;
  }
};
