import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { Categoria } from '../../services/supabase/category.service';
import './CategoryCard.css';

interface CategoryCardProps {
  category: Categoria;
  selected?: boolean;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, selected = false, onClick }) => {
  return (
    <IonCard 
      className={`category-card ${selected ? 'selected-category' : ''}`}
      onClick={onClick}
    >      <IonCardHeader>
        <IonCardTitle>{category.name}</IonCardTitle>
      </IonCardHeader>
      {category.category_okto_name && (
        <IonCardContent>
          <p>{category.category_okto_name}</p>
        </IonCardContent>
      )}
    </IonCard>
  );
};

export default CategoryCard;
