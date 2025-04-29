import React from 'react';
import { 
  IonPage, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonButton
} from '@ionic/react';
import './RecommendationsPage.css';

const RecommendationsPage: React.FC = () => {
  // Datos de muestra para recomendaciones

  
  const recommendations = [
    {
      id: 1,
      title: 'Recetas con pollo',
      description: 'Basado en tus compras recientes de pollo',
      tags: ['Pollo', 'Cena', 'Saludable']
    },
    {
      id: 2,
      title: 'Ofertas en lácteos',
      description: 'Descuentos para productos que compras frecuentemente',
      tags: ['Ahorro', 'Lácteos', 'Ofertas']
    },
    {
      id: 3,
      title: 'Frutas de temporada',
      description: 'Las mejores frutas disponibles este mes',
      tags: ['Frutas', 'Temporada', 'Orgánico']
    }
  ];

  return (
    <IonPage>
      <IonContent>
        <div className="recommendations-header">
          <h1>Recomendaciones para ti</h1>
          <p>Basado en tu historial de compras y preferencias</p>
        </div>

        <div className="recommendations-container">
          {recommendations.map((rec) => (
            <IonCard key={rec.id} className="recommendation-card">
              <IonCardHeader>
                <IonCardTitle>{rec.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>{rec.description}</p>
                <div className="tags-container">
                  {rec.tags.map((tag, index) => (
                    <IonChip key={index} color="primary">
                      <IonLabel>{tag}</IonLabel>
                    </IonChip>
                  ))}
                </div>
                <IonButton expand="block">Ver detalles</IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RecommendationsPage;
