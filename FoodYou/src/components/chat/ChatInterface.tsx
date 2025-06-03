import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButtons
} from '@ionic/react';
import { Message, SenderRole, GroundingMetadata, GroundingChunk } from '../../types/chat.types';
import ChatMessageBubble from './ChatMessageBubble';
import MessageInput from './MessageInput';
import { ResetChatIcon, AlertTriangleIcon } from './Icons';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import './ChatInterface.css';

interface ChatInterfaceProps {
  title?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ title = "Chat IA" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  const [currentGroundingMetadata, setCurrentGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  const contentRef = useRef<HTMLIonContentElement>(null);
  const genAI = useRef<GoogleGenAI | null>(null);

  useEffect(() => {

    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      console.error("No hay clave API de Gemini.");
      setError("Clave API de Gemini no configurada. Contactar a los desarrolladores.");
      setShowToast(true);
      setApiKeyMissing(true);
      return;
    }
    setApiKeyMissing(false);
    genAI.current = new GoogleGenAI({ apiKey: key });
  }, []);

  const initializeChat = useCallback(() => {
    if (!genAI.current) return;

    const newChat = genAI.current.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      config: {
        systemInstruction: 'Eres un asistente útil para la app FoodYou, especializado en ayudar con listas de compras, recomendaciones de comida y planificación de comidas. Sé conciso y amigable. Si proporcionas código, usa bloques de código markdown.',
      },
    });
    setChatSession(newChat);
    setMessages([{
      id: 'initial-bot-message',
      text: "¡Hola! Soy tu asistente de FoodYou. ¿En qué puedo ayudarte hoy?",
      sender: SenderRole.BOT,
      timestamp: new Date(),
    }]);
    setCurrentGroundingMetadata(null);
  }, [genAI]);

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

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || apiKeyMissing || !chatSession) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: SenderRole.USER,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setCurrentGroundingMetadata(null);

    try {
      const botMessageId = `bot-${Date.now()}`;
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: botMessageId,
          text: '',
          sender: SenderRole.BOT,
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      const stream = await chatSession.sendMessageStream({ message: messageText });
      let currentText = '';
      let finalResponse: GenerateContentResponse | null = null;

      for await (const chunk of stream) {
        currentText += chunk.text;
        finalResponse = chunk;
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === botMessageId ? { ...msg, text: currentText } : msg
          )
        );
      }

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === botMessageId ? { ...msg, text: currentText, isStreaming: false } : msg
        )
      );

      if (finalResponse?.candidates?.[0]?.groundingMetadata) {
        setCurrentGroundingMetadata(finalResponse.candidates[0].groundingMetadata);
      }

    } catch (e: any) {
      console.error('Error sending message to Gemini:', e);
      const errorMessage = e.message || 'Error al obtener respuesta de la IA.';
      setError(errorMessage);
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== `bot-${Date.now()}` && !msg.isStreaming),
        {
          id: `error-${Date.now()}`,
          text: `Error: ${errorMessage}`,
          sender: SenderRole.SYSTEM,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentGroundingMetadata(null);
    setError(null);
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
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages.length > 0 && !messages[messages.length - 1].isStreaming && (
            <div className="loading-message">
              <IonSpinner name="dots" />
              <span>La IA está pensando...</span>
            </div>
          )}
        </div>

        {currentGroundingMetadata && currentGroundingMetadata.groundingChunks && currentGroundingMetadata.groundingChunks.length > 0 && (
          <div className="grounding-sources">
            <p className="sources-title">Fuentes de información:</p>
            <ul>
              {currentGroundingMetadata.groundingChunks.map((chunk: GroundingChunk, index: number) => (
                chunk.web && chunk.web.uri && (
                  <li key={index}>
                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer">
                      {chunk.web.title || chunk.web.uri}
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
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
