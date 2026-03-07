import React from 'react';

const MessageBubble = ({ message, isAi, isDraft }) => {
  return (
    <div className={`message-wrapper ${isAi ? 'ai-wrapper' : 'user-wrapper'}`}>
      <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'} ${isDraft ? 'draft-bubble' : ''}`}>
        {isDraft && <div className="draft-label">Draft Email</div>}
        <div className="message-content">
          {message.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
