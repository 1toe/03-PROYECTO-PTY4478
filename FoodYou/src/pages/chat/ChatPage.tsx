import React from 'react';
import { IonPage, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
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
