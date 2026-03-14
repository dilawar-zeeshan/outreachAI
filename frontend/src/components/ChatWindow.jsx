import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import { sendEmail } from '../services/api';

const ChatWindow = ({ messages, setMessages }) => {
  const bottomRef = useRef(null);
  const [sendingDraft, setSendingDraft] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendDraft = async (draftEmail, messageIndex, prefilledRecipient, subject) => {
    setSendingDraft(true);
    try {
      let recipient = prefilledRecipient;
      
      if (!recipient) {
        recipient = prompt("Enter recipient email address:");
      }

      if (!recipient) {
        setSendingDraft(false);
        return;
      }

      await sendEmail(recipient, subject || "AI Chatbot for your business", draftEmail, prefilledRecipient ? messages[messageIndex].niche : 'Manual');
      
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        draftSent: true
      };
      updatedMessages.push({
        text: `Successfully sent outreach email to ${recipient}!`,
        isAi: true,
        isDraft: false
      });
      setMessages(updatedMessages);

    } catch (error) {
       const updatedMessages = [...messages];
       updatedMessages.push({
         text: `Failed to send email: ${error.message}`,
         isAi: true,
         isDraft: false
       });
       setMessages(updatedMessages);
    } finally {
      setSendingDraft(false);
    }
  };

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', marginTop: '2rem' }}>
          Welcome! Send me a message like "Send outreach email to ABC Logistics..."
        </div>
      )}
      {messages.map((msg, idx) => (
        <React.Fragment key={idx}>
          <MessageBubble 
            message={msg.text} 
            isAi={msg.isAi} 
            isDraft={msg.isDraft}
            subject={msg.subject}
          />
          {msg.isDraft && !msg.draftSent && (
            <div className="ai-wrapper">
               <div className="draft-actions">
                 <button 
                   className="btn-send-draft" 
                   onClick={() => handleSendDraft(msg.text, idx, msg.recipientEmail, msg.subject)}
                   disabled={sendingDraft}
                 >
                   {sendingDraft ? 'Sending...' : 'Confirm & Send Email'}
                 </button>
               </div>
            </div>
          )}
        </React.Fragment>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
