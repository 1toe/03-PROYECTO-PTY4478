import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonImg } from '@ionic/react';
import { listOutline, pricetag, informationCircle } from 'ionicons/icons';
import { Producto } from '../../services/supabase/product.service';

import './ProductCard.css';

interface ProductCardProps {
  product: Producto;
  onAddToList?: (product: Producto) => void;
  onShowProductInfo?: (product: Producto) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToList, onShowProductInfo }) => {
  const handleAddToList = () => {
    if (onAddToList) {
      onAddToList(product);
    }
  };

  const handleShowProductInfo = () => {
    if (onShowProductInfo) {
      onShowProductInfo(product);
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
      </IonCardHeader>      <IonCardContent>
        <div className="product-details">
          <div className="product-price">
            <IonIcon icon={pricetag} />
            {product.precio ? formatPrice(product.precio) : '$0'}
          </div>
          {product.peso_gramos && (
            <div className="product-weight">
              {product.peso_gramos}g
            </div>
          )}
        </div>
        
        <div className="product-actions">
          {onShowProductInfo && (
            <IonButton 
              expand="block" 
              size="small" 
              fill="outline" 
              onClick={handleShowProductInfo}
              className="product-info-btn"
            >
              <IonIcon slot="start" icon={informationCircle} />
              Ver información
            </IonButton>
          )}
          
          <IonButton expand="block" size="small" onClick={handleAddToList}>
            <IonIcon slot="start" icon={listOutline} />
            Agregar a lista
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ProductCard;
