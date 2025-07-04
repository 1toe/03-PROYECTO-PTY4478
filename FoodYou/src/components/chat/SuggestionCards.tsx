import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonButton } from '@ionic/react';
import { searchOutline, pricetagOutline, nutritionOutline, restaurantOutline } from 'ionicons/icons';
import './SuggestionCards.css';

interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  query: string;
  icon: string;
  category: 'search' | 'offers' | 'nutrition' | 'categories';
}

interface SuggestionCardsProps {
  onSuggestionClick: (query: string) => void;
}

const SuggestionCards: React.FC<SuggestionCardsProps> = ({ onSuggestionClick }) => {
  const suggestions: SuggestionCard[] = [
    {
      id: 'popular-products',
      title: 'Productos Populares',
      description: 'Buscar los productos más vendidos',
      query: 'buscar productos populares',
      icon: searchOutline,
      category: 'search'
    },
    {
      id: 'offers',
      title: 'Ofertas Especiales',
      description: 'Ver productos en descuento',
      query: 'buscar productos en oferta',
      icon: pricetagOutline,
      category: 'offers'
    },
    {
      id: 'condiments',
      title: 'Condimentos',
      description: 'Salsas, aderezos y especias',
      query: 'buscar condimentos',
      icon: restaurantOutline,
      category: 'categories'
    },
    {
      id: 'cereals',
      title: 'Cereales',
      description: 'Desayunos y cereales',
      query: 'buscar cereales',
      icon: nutritionOutline,
      category: 'categories'
    },
    {
      id: 'snacks',
      title: 'Snacks',
      description: 'Galletas y papas fritas',
      query: 'buscar galletas y papas fritas',
      icon: restaurantOutline,
      category: 'categories'
    },
    {
      id: 'pasta',
      title: 'Fideos y Pastas',
      description: 'Variedad de pastas',
      query: 'buscar fideos y pastas',
      icon: restaurantOutline,
      category: 'categories'
    },
    {
      id: 'budget-friendly',
      title: 'Productos Económicos',
      description: 'Productos hasta $1000',
      query: 'buscar productos hasta $1000',
      icon: pricetagOutline,
      category: 'offers'
    }
  ];


  return (
    <div className="suggestion-cards-container">
    </div>
  );
};

export default SuggestionCards;

