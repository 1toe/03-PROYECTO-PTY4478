import React from 'react';
import { IonPage } from '@ionic/react';
import ChatInterface from '../../components/chat/ChatInterface';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  return (
    <IonPage className="chat-page">
      <ChatInterface title="Chat IA - FoodYou" />
    </IonPage>
  );
};

export default ChatPage;
