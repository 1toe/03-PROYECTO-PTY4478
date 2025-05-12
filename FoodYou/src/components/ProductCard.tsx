import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonImg } from '@ionic/react';
import { cart } from 'ionicons/icons';
import { Producto } from '../services/supabase/product.service';
import './ProductCard.css';

interface ProductCardProps {
  product: Producto;
  onAddToCart?: (product: Producto) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <IonCard className="product-card">
      <div className="product-image-container">
        {product.url_imagen ? (
          <IonImg src={product.url_imagen} alt={product.nombre_producto} className="product-image" />
        ) : (
          <div className="no-image">Sin imagen</div>
        )}
      </div>
      <IonCardHeader>
        <IonCardTitle className="product-title">{product.nombre_producto}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="product-details">
          <div className="product-price">
            {formatPrice(product.precio)}
          </div>
          {product.peso_gramos && (
            <div className="product-weight">
              {product.peso_gramos}g
            </div>
          )}
        </div>
        <IonButton expand="block" size="small" onClick={handleAddToCart}>
          <IonIcon slot="start" icon={cart} />
          Agregar
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default ProductCard;
