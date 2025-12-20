const fs = require('fs');
const path = require('path');

const campaignsPath = path.join(__dirname, '../db/campaigns.json');

function readCampaigns() {
  try {
    const data = fs.readFileSync(campaignsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading campaigns:', error);
    return [];
  }
}

function writeCampaigns(campaigns) {
  try {
    fs.writeFileSync(campaignsPath, JSON.stringify(campaigns, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing campaigns:', error);
    return false;
  }
}

module.exports = {
  getAll: () => {
    return readCampaigns();
  },
  
  getById: (id) => {
    const campaigns = readCampaigns();
    return campaigns.find(c => c.id === id);
  },
  
  create: (campaign) => {
    const campaigns = readCampaigns();
    const newCampaign = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...campaign
    };
    campaigns.push(newCampaign);
    writeCampaigns(campaigns);
    return newCampaign;
  },
  
  update: (id, updates) => {
    const campaigns = readCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
      writeCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  },
  
  delete: (id) => {
    const campaigns = readCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    if (filtered.length < campaigns.length) {
      writeCampaigns(filtered);
      return true;
    }
    return false;
  }
};