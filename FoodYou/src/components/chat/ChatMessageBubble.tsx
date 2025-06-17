import React from 'react';
import { IonCard, IonCardContent, IonChip, IonIcon } from '@ionic/react';
import { Message, SenderRole } from '../../types/chat.types';
import { UserIcon, BotIcon, AlertTriangleIcon } from './Icons';
import applesImage from '../../assets/apples_pp.png';
import './ChatMessageBubble.css';

interface ChatMessageBubbleProps {
  message: Message;
}
const formatMessageText = (text: string): React.ReactNode => {
  const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`|\*\*.*?\*\*|\*.*?\*|\`.*?\`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const codeContent = part.substring(3, part.length - 3).trim();
      // Basic language detection attempt or default
      let language = '';
      const firstLine = codeContent.split('\n')[0];
      if (firstLine.match(/^[a-zA-Z]+$/) && codeContent.startsWith(firstLine + '\n')) {
         language = firstLine;
      }
      return (
        <pre key={index} className="code-block">
          {language && <div className="code-language">{language}</div>}
          <code className={`language-${language}`}>
            {language ? codeContent.substring(language.length).trimStart() : codeContent}
          </code>
        </pre>
      );
    } else if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
    } else if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.substring(1, part.length - 1)}</em>;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="inline-code">{part.substring(1, part.length - 1)}</code>;
    }
    return part.split('\n').map((line, i) => 
      <React.Fragment key={`${index}-${i}`}>
        {line}
        {i < part.split('\n').length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === SenderRole.USER;
  const isBot = message.sender === SenderRole.BOT;
  const isSystem = message.sender === SenderRole.SYSTEM;

  const IconComponent = isUser ? UserIcon : isBot ? BotIcon : AlertTriangleIcon;

  return (
    <div className={`chat-message ${isUser ? 'user-message' : isBot ? 'bot-message' : 'system-message'}`}>
      <div className="message-content">        {!isSystem && (
          <div className="message-avatar">
            {isUser ? (
              <img src={applesImage} alt="Usuario" />
            ) : (
              <IconComponent />
            )}
          </div>
        )}
        
        <IonCard className="message-bubble">
          <IonCardContent>
            <div className="message-text">
              {formatMessageText(message.text)}
              {message.isStreaming && <span className="streaming-cursor">▍</span>}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
