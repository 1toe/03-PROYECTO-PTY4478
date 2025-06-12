import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonBadge } from '@ionic/react';
import { 
  restaurantOutline, 
  nutritionOutline, 
  cafeOutline, 
  fishOutline,
  leafOutline,
  pizzaOutline,
  iceCreamOutline,
  wineOutline,
  fastFoodOutline,
  basketOutline
} from 'ionicons/icons';
import { Categoria } from '../../services/supabase/category.service';
import './CategoryCard.css';

interface CategoryCardProps {
  category: Categoria;
  selected?: boolean;
  onClick: () => void;
  productCount?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  selected = false, 
  onClick, 
  productCount 
}) => {
  
  // Función para obtener el icono apropiado basado en el nombre de la categoría
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('condimento') || name.includes('salsa') || name.includes('aceite')) {
      return restaurantOutline;
    } else if (name.includes('cereal') || name.includes('avena') || name.includes('granola')) {
      return nutritionOutline;
    } else if (name.includes('café') || name.includes('te') || name.includes('bebida')) {
      return cafeOutline;
    } else if (name.includes('pescado') || name.includes('mariscos') || name.includes('atún')) {
      return fishOutline;
    } else if (name.includes('verdura') || name.includes('vegetal') || name.includes('ensalada')) {
      return leafOutline;
    } else if (name.includes('pizza') || name.includes('pasta') || name.includes('fideo')) {
      return pizzaOutline;
    } else if (name.includes('helado') || name.includes('postre') || name.includes('dulce')) {
      return iceCreamOutline;
    } else if (name.includes('vino') || name.includes('alcohol') || name.includes('cerveza')) {
      return wineOutline;
    } else if (name.includes('snack') || name.includes('galleta') || name.includes('papa')) {
      return fastFoodOutline;
    } else {
      return basketOutline;
    }
  };

  // Función para obtener el color de la categoría
  const getCategoryColor = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('condimento') || name.includes('salsa')) {
      return '#ff6b35';
    } else if (name.includes('cereal') || name.includes('avena')) {
      return '#f7931e';
    } else if (name.includes('café') || name.includes('te')) {
      return '#8b4513';
    } else if (name.includes('pescado') || name.includes('mariscos')) {
      return '#4a90e2';
    } else if (name.includes('verdura') || name.includes('vegetal')) {
      return '#2dd36f';
    } else if (name.includes('pizza') || name.includes('pasta')) {
      return '#e74c3c';
    } else if (name.includes('helado') || name.includes('postre')) {
      return '#ff69b4';
    } else if (name.includes('vino') || name.includes('alcohol')) {
      return '#722f37';
    } else if (name.includes('snack') || name.includes('galleta')) {
      return '#ffc409';
    } else {
      return '#3880ff';
    }
  };

  const categoryIcon = getCategoryIcon(category.name || '');
  const categoryColor = getCategoryColor(category.name || '');

  return (
    <IonCard
      className={`category-card ${selected ? 'selected-category' : ''}`}
      onClick={onClick}
      style={{ '--category-color': categoryColor }}
    >
      <IonCardHeader className="category-header">
        <div className="category-icon-container">
          <IonIcon 
            icon={categoryIcon} 
            className="category-icon"
            style={{ color: categoryColor }}
          />
        </div>
        <IonCardTitle className="category-title">
          {category.name}
        </IonCardTitle>
        {productCount !== undefined && (
          <IonBadge className="product-count-badge" color="primary">
            {productCount} productos
          </IonBadge>
        )}
      </IonCardHeader>
      
      {category.category_okto_name && category.category_okto_name !== category.name && (
        <IonCardContent className="category-content">
          <p className="category-description">{category.category_okto_name}</p>
        </IonCardContent>
      )}
      
      <div className="category-overlay">
        <span className="category-action-text">Explorar</span>
      </div>
    </IonCard>
  );
};

export default CategoryCard;
