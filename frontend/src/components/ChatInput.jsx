import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSend}>
      <input
        type="text"
        className="chat-input-field"
        placeholder="Type a message (e.g., Send outreach email)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="chat-send-button"
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? <Loader2 className="spinner icon" /> : <Send className="icon" />}
      </button>
    </form>
  );
};

export default ChatInput;
