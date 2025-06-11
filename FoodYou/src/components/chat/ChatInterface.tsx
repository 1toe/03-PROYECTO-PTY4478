import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonSpinner,
  IonToast,
  IonButtons
} from '@ionic/react';
import { Message, SenderRole, GroundingMetadata, GroundingChunk } from '../../types/chat.types';
import ChatMessageBubble from './ChatMessageBubble';
import MessageInput from './MessageInput';
import ProductListInChat from './ProductListInChat';
import { ResetChatIcon, AlertTriangleIcon } from './Icons';
import { useAIWithProducts } from '../../hooks/useAIWithProducts';
import './ChatInterface.css';

interface ChatInterfaceProps {
  title?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ title = "Chat IA" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  const contentRef = useRef<HTMLIonContentElement>(null);

  // Usar el hook de IA con productos
  const { processMessage, isLoading, error } = useAIWithProducts();

  // Verificar API key
  const apiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;

  // Mensaje inicial
  const initializeChat = useCallback(() => {
    setMessages([{
      id: 'initial-bot-message',
      text: "¡Hola! Soy tu asistente de FoodYou. Puedo ayudarte a buscar productos, comparar precios, y responder preguntas sobre alimentación. ¿En qué puedo ayudarte hoy?",
      sender: SenderRole.BOT,
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    if (!apiKeyMissing) {
      initializeChat();
    }
  }, [apiKeyMissing, initializeChat]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  // Mostrar toast de error
  useEffect(() => {
    if (error) {
      setShowToast(true);
    }
  }, [error]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || apiKeyMissing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: SenderRole.USER,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');

    try {
      // Procesar mensaje con IA y productos
      const aiResponse = await processMessage(messageText);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: aiResponse.message,
        sender: SenderRole.BOT,
        timestamp: new Date(),
        products: aiResponse.products,
        isProductSearch: aiResponse.isProductSearch
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (e: any) {
      console.error('Error sending message:', e);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Error: ${e.message || 'Error al obtener respuesta de la IA.'}`,
        sender: SenderRole.SYSTEM,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (!apiKeyMissing) {
      initializeChat();
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={clearChat}>
              <ResetChatIcon />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {apiKeyMissing && (
        <div className="api-key-warning">
          <AlertTriangleIcon />
          <span>Clave API faltante. Por favor contacta a los desarrolladores.</span>
        </div>
      )}

      <IonContent ref={contentRef} className="chat-content">
        <div className="messages-container">
          {messages.map(msg => (
            <div key={msg.id}>
              <ChatMessageBubble message={msg} />
              {msg.products && msg.products.length > 0 && (
                <ProductListInChat products={msg.products} />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading-message">
              <IonSpinner name="dots" />
              <span>La IA está pensando...</span>
            </div>
          )}
        </div>
      </IonContent>

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading || apiKeyMissing}
        placeholder={apiKeyMissing ? "API Key no configurada" : "Escribe tu mensaje..."}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={error || ""}
        duration={3000}
        color="danger"
        position="top"
      />
    </>
  );
};

export default ChatInterface;
