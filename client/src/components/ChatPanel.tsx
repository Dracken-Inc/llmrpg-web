import React, { useState } from 'react';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Game Master',
      message: 'Welcome to the game! You find yourself in a tavern...',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'You',
        message: inputMessage,
        timestamp: Date.now()
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-panel">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <span className="sender">{msg.sender}:</span>
            <span className="text">{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="message-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Say something..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;
