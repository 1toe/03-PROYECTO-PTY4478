import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
  IonList,
  IonListHeader,
  IonNote,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle
} from '@ionic/react';
import {
  closeOutline,
  pricetag,
  warning,
  flame,
  nutrition,
  medkit,
  business,
  storefront,
  scale,
  information
} from 'ionicons/icons';
import { ProductWithDetails } from '../../services/supabase/product.service';
import './ProductInfoModal.css';

interface ProductInfoModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  product: ProductWithDetails | null;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({
  isOpen,
  onDidDismiss,
  product
}) => {
  if (!product) return null;

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  const getSupermercadoInfo = () => {
    // Basado en la URL scraped, determinar el supermercado
    if (product.url_scraped?.includes('unimarc')) {
      return { nombre: 'Unimarc', color: 'primary' };
    } else if (product.url_scraped?.includes('santaisabel')) {
      return { nombre: 'Santa Isabel', color: 'tertiary' };
    } else if (product.url_scraped?.includes('jumbo')) {
      return { nombre: 'Jumbo', color: 'success' };
    } else if (product.url_scraped?.includes('lider')) {
      return { nombre: 'Líder', color: 'warning' };
    }
    return { nombre: 'Supermercado', color: 'medium' };
  };

  const supermercado = getSupermercadoInfo();

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Información del Producto</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Header del producto */}
        <div className="product-info-header">
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                {(product.url_imagen || product.image_url) ? (
                  <IonImg
                    src={product.url_imagen || product.image_url}
                    alt={product.nombre_producto || product.name_vtex || ''}
                    className="product-info-image"
                  />
                ) : (
                  <div className="product-info-no-image">
                    📦 Sin imagen
                  </div>
                )}
              </IonCol>
              <IonCol size="8">
                <h2 className="product-info-title">
                  {product.nombre_producto || product.name_vtex || product.name_okto}
                </h2>
                {(product.marca || product.brand_name) && (
                  <p className="product-info-brand">
                    🏷️ {product.marca || product.brand_name}
                  </p>
                )}
                <div className="product-info-price">
                  <IonIcon icon={pricetag} />
                  <span>{formatPrice(product.precio || product.price_current || 0)}</span>
                </div>
                {(product.en_oferta || product.is_in_offer) && (
                  <IonChip color="danger" className="offer-chip">
                    <IonIcon icon={flame} />
                    <IonLabel>En Oferta</IonLabel>
                  </IonChip>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Información básica */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={information} />
              Información General
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {(product.categoria || product.category_name) && (
                <IonItem>
                  <IonLabel>
                    <h3>Categoría</h3>
                    <p>{product.categoria || product.category_name}</p>
                  </IonLabel>
                </IonItem>
              )}

              {(product.peso_gramos || product.size_value_okto) && (
                <IonItem>
                  <IonIcon slot="start" icon={scale} />
                  <IonLabel>
                    <h3>Peso/Tamaño</h3>
                    <p>
                      {product.peso_gramos || product.size_value_okto}
                      {product.size_unit_okto || 'g'}
                    </p>
                  </IonLabel>
                </IonItem>
              )}

              {(product.descripcion || product.description_short_vtex) && (
                <IonItem>
                  <IonLabel>
                    <h3>Descripción</h3>
                    <p>{product.descripcion || product.description_short_vtex}</p>
                  </IonLabel>
                </IonItem>
              )}

              {product.flavor_okto && (
                <IonItem>
                  <IonLabel>
                    <h3>Sabor</h3>
                    <p>{product.flavor_okto}</p>
                  </IonLabel>
                </IonItem>
              )}

              {product.packaging_type_okto && (
                <IonItem>
                  <IonLabel>
                    <h3>Tipo de Empaque</h3>
                    <p>{product.packaging_type_okto}</p>
                  </IonLabel>
                </IonItem>
              )}

              {product.origin_country_okto && (
                <IonItem>
                  <IonLabel>
                    <h3>País de Origen</h3>
                    <p>{product.origin_country_okto}</p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Información del supermercado */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={storefront} />
              Supermercado
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonChip color={supermercado.color}>
              <IonIcon icon={business} />
              <IonLabel>{supermercado.nombre}</IonLabel>
            </IonChip>
            {product.url_scraped && (
              <IonItem button href={product.url_scraped} target="_blank">
                <IonLabel>
                  <h3>Ver en tienda online</h3>
                  <p>Ir al sitio web del supermercado</p>
                </IonLabel>
              </IonItem>
            )}
          </IonCardContent>
        </IonCard>

        {/* Sellos de advertencia */}
        {product.warnings && product.warnings.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={warning} />
                Sellos de Advertencia
              </IonCardTitle>
            </IonCardHeader>            <IonCardContent>
              <div className="warnings-container">
                {product.warnings.map((productWarning, index) => (
                  <IonChip key={index} color="warning">
                    <IonIcon icon={warning} />
                    <IonLabel>{productWarning.description || productWarning.warning_code}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Información nutricional */}
        {product.nutritional_values && product.nutritional_values.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={nutrition} />
                Información Nutricional
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonListHeader>
                  <IonLabel>Por cada 100g</IonLabel>
                </IonListHeader>
                {product.nutritional_values.map((nutri, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h3>{nutri.nutrient_name}</h3>
                      <p>
                        {nutri.value_per_100g} {nutri.unit}
                        {nutri.value_per_portion && (
                          <IonNote> | Por porción: {nutri.value_per_portion} {nutri.unit}</IonNote>
                        )}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Ingredientes */}
        {product.ingredients && product.ingredients.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={medkit} />
                Ingredientes
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="ingredients-container">
                {product.ingredients.map((ingredient, index) => (
                  <IonChip key={index} outline>
                    <IonLabel>{ingredient}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Certificaciones */}
        {product.certifications && product.certifications.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={medkit} />
                Certificaciones
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="certifications-container">
                {product.certifications.map((certification, index) => (
                  <IonChip key={index} color="success">
                    {certification.icon_url && (
                      <img src={certification.icon_url} alt={certification.name} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                    )}
                    <IonLabel>{certification.name || certification.certification_code}</IonLabel>
                  </IonChip>
                ))}
              </div>
              {product.certifications.some(cert => cert.description) && (
                <IonList>
                  {product.certifications.filter(cert => cert.description).map((certification, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h3>{certification.name || certification.certification_code}</h3>
                        <p>{certification.description}</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Alérgenos */}
        {product.allergens && product.allergens.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={warning} color="danger" />
                Alérgenos
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="allergens-container">
                {product.allergens.map((allergen, index) => (
                  <IonChip key={index} color="danger">
                    <IonIcon icon={warning} />
                    <IonLabel>{allergen}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ProductInfoModal;
