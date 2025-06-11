import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonChip,
  IonLabel
} from '@ionic/react';
import { listOutline, pricetag, warning, flame, informationCircle } from 'ionicons/icons';
import { Producto, ProductService } from '../../services/supabase/product.service';
import SelectListModal from '../common/SelectListModal';
import ProductInfoModal from '../common/ProductInfoModal';
import './ProductListInChat.css';

interface ProductListInChatProps {
  products: Producto[];
  onAddToList?: (product: Producto) => void;
  maxDisplay?: number;
}

const ProductListInChat: React.FC<ProductListInChatProps> = ({
  products,
  onAddToList,
  maxDisplay = 6
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showSelectListModal, setShowSelectListModal] = useState(false);
  const [showProductInfoModal, setShowProductInfoModal] = useState(false);
  const [productDetailsForModal, setProductDetailsForModal] = useState<any>(null);

  const displayProducts = products.slice(0, maxDisplay);
  const hasMore = products.length > maxDisplay;

  const handleAddToList = (product: Producto) => {
    setSelectedProduct(product);
    setShowSelectListModal(true);
  };

  const handleShowProductInfo = async (product: Producto) => {
    try {
      // Obtener información detallada del producto
      const productDetails = await ProductService.getProductByEan(product.ean);
      setProductDetailsForModal(productDetails || product);
      setShowProductInfoModal(true);
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
      // Fallback: mostrar con la información disponible
      setProductDetailsForModal(product);
      setShowProductInfoModal(true);
    }
  };

  const handleProductAddedToList = (listId: number, product: Producto) => {
    if (onAddToList) {
      onAddToList(product);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="product-list-in-chat">
      <IonGrid>        <IonRow>
          {displayProducts.map((product, index) => (
            <IonCol key={product.ean || index} size="12" sizeMd="6" sizeLg="4">
              <IonCard className="chat-product-card" button onClick={() => handleShowProductInfo(product)}>
                <div className="chat-product-image-container">
                  {product.url_imagen || product.image_url ? (
                    <IonImg
                      src={product.url_imagen || product.image_url}
                      alt={product.nombre_producto || product.name_vtex || ''}
                      className="chat-product-image"
                    />
                  ) : (
                    <div className="chat-no-image">
                      📦 Sin imagen
                    </div>
                  )}

                  <div className="chat-product-badges">
                    {(product.en_oferta || product.is_in_offer) && (
                      <IonChip color="danger" className="offer-badge">
                        <IonIcon icon={flame} />
                        <IonLabel>Oferta</IonLabel>
                      </IonChip>
                    )}
                    {product.warnings && product.warnings.length > 0 && (
                      <IonChip color="warning" className="warning-badge">
                        <IonIcon icon={warning} />
                        <IonLabel>{product.warnings.length}</IonLabel>
                      </IonChip>
                    )}
                  </div>
                </div>

                <IonCardHeader className="chat-product-header">
                  <IonCardTitle className="chat-product-title">
                    {product.nombre_producto || product.name_vtex || product.name_okto}
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent className="chat-product-content">
                  {(product.marca || product.brand_name) && (
                    <div className="chat-product-brand">
                      🏷️ {product.marca || product.brand_name}
                    </div>
                  )}

                  <div className="chat-product-price">
                    <IonIcon icon={pricetag} />
                    <span className="price-text">{product.price_current}</span>
                  </div>

                  {(product.categoria || product.category_name) && (
                    <div className="chat-product-category">
                      📂 {product.categoria || product.category_name}
                    </div>
                  )}

                  {(product.peso_gramos || product.size_value_okto) && (
                    <div className="chat-product-weight">
                      ⚖️ {product.peso_gramos || product.size_value_okto}
                      {product.size_unit_okto || 'g'}
                    </div>
                  )}

                  {product.saving_text && (
                    <div className="chat-product-saving">
                      💸 {product.saving_text}
                    </div>
                  )}

                  <div className="chat-product-actions">
                    <IonButton
                      expand="block"
                      size="small"
                      fill="outline"
                      className="chat-info-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowProductInfo(product);
                      }}
                    >
                      <IonIcon slot="start" icon={informationCircle} />
                      Ver información
                    </IonButton>
                    
                    <IonButton
                      expand="block"
                      size="small"
                      className="chat-add-to-list-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToList(product);
                      }}
                    >
                      <IonIcon slot="start" icon={listOutline} />
                      Agregar a lista
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>

      {hasMore && (
        <div className="chat-products-more">
          <IonButton
            fill="outline"
            size="small"
            onClick={() => {
              console.log('Mostrar más productos:', products.length - maxDisplay, 'restantes');
            }}
          >
            Ver {products.length - maxDisplay} productos más
          </IonButton>
        </div>)}      <SelectListModal
        isOpen={showSelectListModal}
        onDidDismiss={() => {
          setShowSelectListModal(false);
          setSelectedProduct(null);
        }}
        onProductAdded={handleProductAddedToList}
        product={selectedProduct}
      />

      <ProductInfoModal
        isOpen={showProductInfoModal}
        onDidDismiss={() => {
          setShowProductInfoModal(false);
          setProductDetailsForModal(null);
        }}
        product={productDetailsForModal}
      />
    </div>
  );
};

export default ProductListInChat;
