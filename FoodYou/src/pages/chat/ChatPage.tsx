import React from 'react';
import { IonPage } from '@ionic/react';
import ChatInterface from '../../components/chat/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <IonPage>
      <ChatInterface title="Chat IA - FoodYou" />
    </IonPage>
  );
};

export default ChatPage;
