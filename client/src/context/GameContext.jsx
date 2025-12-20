import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socket';
import apiService from '../services/api';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [campaignId, setCampaignId] = useState('demo-campaign');
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [initiative, setInitiative] = useState({ round: 0, currentTurn: 0, participants: [] });
  const [encounters, setEncounters] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Set up socket event listeners
    socketService.on('connect', () => {
      setConnected(true);
      if (campaignId) {
        socketService.joinCampaign(campaignId);
      }
    });

    socketService.on('disconnect', () => {
      setConnected(false);
    });

    socketService.on('campaignState', (state) => {
      if (state.initiative) setInitiative(state.initiative);
      if (state.encounters) setEncounters(state.encounters);
      if (state.messages) setMessages(state.messages);
    });

    socketService.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.on('initiativeUpdate', (newInitiative) => {
      setInitiative(newInitiative);
    });

    socketService.on('encounterCreated', (encounter) => {
      setEncounters(prev => [...prev, encounter]);
    });

    socketService.on('encounterUpdated', (encounter) => {
      setEncounters(prev => prev.map(e => e.id === encounter.id ? encounter : e));
    });

    socketService.on('encounterDeleted', (encounterId) => {
      setEncounters(prev => prev.filter(e => e.id !== encounterId));
    });

    socketService.on('characterUpdated', (character) => {
      setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
      if (currentCharacter && currentCharacter.id === character.id) {
        setCurrentCharacter(character);
      }
    });

    // Load initial data
    const loadInitialData = async () => {
      try {
        const chars = await apiService.getCharacters(campaignId);
        setCharacters(chars);
        if (chars.length > 0 && !currentCharacter) {
          setCurrentCharacter(chars[0]);
        }
      } catch (error) {
        console.error('Failed to load characters:', error);
      }
    };

    loadInitialData();

    // Cleanup
    return () => {
      socketService.removeAllListeners('connect');
      socketService.removeAllListeners('disconnect');
      socketService.removeAllListeners('campaignState');
      socketService.removeAllListeners('newMessage');
      socketService.removeAllListeners('initiativeUpdate');
      socketService.removeAllListeners('encounterCreated');
      socketService.removeAllListeners('encounterUpdated');
      socketService.removeAllListeners('encounterDeleted');
      socketService.removeAllListeners('characterUpdated');
    };
  }, [campaignId]);

  const sendMessage = (text, sender) => {
    socketService.sendMessage(campaignId, { text, sender });
  };

  const addToInitiative = (participant) => {
    socketService.addToInitiative(campaignId, participant);
  };

  const removeFromInitiative = (participantId) => {
    socketService.removeFromInitiative(campaignId, participantId);
  };

  const nextTurn = () => {
    socketService.nextTurn(campaignId);
  };

  const resetInitiative = () => {
    socketService.resetInitiative(campaignId);
  };

  const createEncounter = (encounter) => {
    socketService.createEncounter(campaignId, encounter);
  };

  const updateEncounter = (encounterId, updates) => {
    socketService.updateEncounter(campaignId, encounterId, updates);
  };

  const deleteEncounter = (encounterId) => {
    socketService.deleteEncounter(campaignId, encounterId);
  };

  const updateCharacter = (characterId, updates) => {
    socketService.updateCharacter(characterId, updates);
  };

  const value = {
    campaignId,
    setCampaignId,
    currentCharacter,
    setCurrentCharacter,
    characters,
    messages,
    initiative,
    encounters,
    connected,
    sendMessage,
    addToInitiative,
    removeFromInitiative,
    nextTurn,
    resetInitiative,
    createEncounter,
    updateEncounter,
    deleteEncounter,
    updateCharacter
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
