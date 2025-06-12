import React, { useState, useEffect } from 'react';
import { IonButton } from '@ionic/react';
import './ChatStarterPhrases.css';

interface ChatStarterPhrasesProps {
  onPhraseClick: (phrase: string) => void;
}

interface StarterPhrase {
  id: string;
  text: string;
  query: string;
  category: 'search' | 'health' | 'offers' | 'comparison';
}

const ChatStarterPhrases: React.FC<ChatStarterPhrasesProps> = ({ onPhraseClick }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const starterPhrases: StarterPhrase[] = [
    {
      id: 'healthy-products',
      text: '¿Qué productos saludables tienes disponibles?',
      query: 'buscar productos sin sellos de advertencia',
      category: 'health'
    },
    {
      id: 'best-offers',
      text: '¿Cuáles son las mejores ofertas de hoy?',
      query: 'buscar productos en oferta',
      category: 'offers'
    },
    {
      id: 'compare-prices',
      text: '¿Puedes comparar precios de aceites?',
      query: 'buscar aceite comparar precios',
      category: 'comparison'
    },
    {
      id: 'breakfast-options',
      text: '¿Qué opciones de desayuno me recomiendas?',
      query: 'buscar cereales pan mermelada',
      category: 'search'
    },
    {
      id: 'snack-ideas',
      text: '¿Tienes snacks saludables para la tarde?',
      query: 'buscar frutos secos galletas sin azúcar',
      category: 'health'
    },
    {
      id: 'dinner-ingredients',
      text: '¿Qué ingredientes necesito para hacer pasta?',
      query: 'buscar fideos salsa condimentos',
      category: 'search'
    },
    {
      id: 'budget-shopping',
      text: '¿Cuáles son los productos más económicos?',
      query: 'buscar productos hasta $1000',
      category: 'offers'
    },
    {
      id: 'brand-comparison',
      text: '¿Puedes comparar marcas de yogurt?',
      query: 'buscar yogurt comparar marcas',
      category: 'comparison'
    }
  ];

  const currentPhrase = starterPhrases[currentPhraseIndex];

  // Efecto de escritura (typewriter)
  useEffect(() => {
    if (!currentPhrase) return;

    setDisplayedText('');
    setIsTyping(true);
    
    let index = 0;
    const text = currentPhrase.text;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
        
        // Cambiar a la siguiente frase después de 3 segundos
        setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % starterPhrases.length);
        }, 3000);
      }
    }, 50); // Velocidad de escritura

    return () => clearInterval(typeInterval);
  }, [currentPhraseIndex]);

  const handlePhraseClick = () => {
    onPhraseClick(currentPhrase.query);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return '#2dd36f';
      case 'offers': return '#eb445a';
      case 'comparison': return '#3880ff';
      case 'search': return '#ffc409';
      default: return '#3880ff';
    }
  };

  return (
    <div className="chat-starter-phrases">
      <div className="phrase-container">
        <IonButton
          fill="clear"
          className="starter-phrase-button"
          onClick={handlePhraseClick}
          style={{
            '--background': getCategoryColor(currentPhrase.category),
            '--color': 'white'
          }}
        >
          <div className="phrase-content">
            <div className="phrase-text">
              {displayedText}
              {isTyping && <span className="cursor">|</span>}
            </div>
            <div className="phrase-hint">
              Toca para buscar
            </div>
          </div>
        </IonButton>
      </div>
      
      <div className="phrase-indicators">
        {starterPhrases.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentPhraseIndex ? 'active' : ''}`}
            onClick={() => setCurrentPhraseIndex(index)}
          />
        ))}
      </div>
      
      <div className="phrase-navigation">
        <IonButton
          fill="clear"
          size="small"
          onClick={() => setCurrentPhraseIndex((prev) => 
            prev === 0 ? starterPhrases.length - 1 : prev - 1
          )}
        >
          ← Anterior
        </IonButton>
        <IonButton
          fill="clear"
          size="small"
          onClick={() => setCurrentPhraseIndex((prev) => (prev + 1) % starterPhrases.length)}
        >
          Siguiente →
        </IonButton>
      </div>
    </div>
  );
};

export default ChatStarterPhrases;

