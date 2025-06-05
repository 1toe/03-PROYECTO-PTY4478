import React, { useState, useRef, useEffect } from 'react';
import { 
  IonItem, 
  IonTextarea, 
  IonButton, 
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { SendIcon } from './Icons';
import './MessageInput.css';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSendMessage,
  isLoading,
  placeholder = "Escribe un mensaje..."
}) => {
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  const handleChange = (event: CustomEvent) => {
    onChange(event.detail.value);
  };

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    if (value.trim() && !isLoading) {
      onSendMessage(value);
      onChange('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const textareaElement = textarea.getInputElement();
      textareaElement.then((element) => {
        element.addEventListener('keydown', handleKeyPress);
        return () => {
          element.removeEventListener('keydown', handleKeyPress);
        };
      });
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <IonItem className="message-input-item">
        <IonTextarea
          ref={textareaRef}
          value={value}
          onIonInput={handleChange}
          placeholder={placeholder}
          rows={1}
          autoGrow={true}
          maxlength={2000}
          disabled={isLoading}
          className="message-textarea"
        />
        <IonButton
          slot="end"
          type="submit"
          fill="clear"
          disabled={isLoading || !value.trim()}
          className="send-button"
        >
          {isLoading ? (
            <IonSpinner name="crescent" />
          ) : (
            <SendIcon />
          )}
        </IonButton>
      </IonItem>
    </form>
  );
};

export default MessageInput;
