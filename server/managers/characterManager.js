const fs = require('fs');
const path = require('path');

const charactersPath = path.join(__dirname, '../db/characters.json');

function readCharacters() {
  try {
    const data = fs.readFileSync(charactersPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading characters:', error);
    return [];
  }
}

function writeCharacters(characters) {
  try {
    fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing characters:', error);
    return false;
  }
}

module.exports = {
  getAll: () => {
    return readCharacters();
  },
  
  getByCampaign: (campaignId) => {
    const characters = readCharacters();
    return characters.filter(c => c.campaignId === campaignId);
  },
  
  getById: (id) => {
    const characters = readCharacters();
    return characters.find(c => c.id === id);
  },
  
  create: (character) => {
    const characters = readCharacters();
    const newCharacter = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...character
    };
    characters.push(newCharacter);
    writeCharacters(characters);
    return newCharacter;
  },
  
  update: (id, updates) => {
    const characters = readCharacters();
    const index = characters.findIndex(c => c.id === id);
    if (index !== -1) {
      characters[index] = { ...characters[index], ...updates, updatedAt: new Date().toISOString() };
      writeCharacters(characters);
      return characters[index];
    }
    return null;
  },
  
  delete: (id) => {
    const characters = readCharacters();
    const filtered = characters.filter(c => c.id !== id);
    if (filtered.length < characters.length) {
      writeCharacters(filtered);
      return true;
    }
    return false;
  }
};