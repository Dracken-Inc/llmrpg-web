import React from 'react';

function ChatPanel() {
  return (
    <div>
      <h2>Chat</h2>
      <div className="chat-window">
        <div className="messages">
          {/* Messages will be displayed here */}
        </div>
        <input type="text" placeholder="Type your message..." />
        <button>Send</button>
      </div>
    </div>
  );
}

export default ChatPanel;