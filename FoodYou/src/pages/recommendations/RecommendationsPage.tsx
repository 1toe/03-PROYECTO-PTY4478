import React, { useState, useEffect } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './RecommendationsPage.css';

interface Recommendation {
    id: string;
    title: string;
    description: string;
    items: string[];
}

const RecommendationsPage: React.FC = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const history = useHistory();

    useEffect(() => {
        loadRecommendations(); // TODO: Implementar la carga de recomendaciones desde el backend
    }, []);

    const loadRecommendations = async () => {
        // Datos de prueba (Obviamente cambiarlos)
        // Mediante una llamada a la API o servicio de backendd
        const mockRecommendations = [
            {
                id: '1',
                title: 'Compra semanal básica',
                description: 'Productos esenciales para la semana',
                items: ['Leche', 'Pan', 'Huevos', 'Frutas', 'Vegetales']
            },
            {
                id: '2',
                title: 'Receta de pasta',
                description: 'Ingredientes para hacer pasta con salsa',
                items: ['Pasta', 'Tomates', 'Albahaca', 'Queso parmesano', 'Ajo']
            },
            {
                id: '3',
                title: 'Productos saludables',
                description: 'Una selección de productos bajos en calorías',
                items: ['Yogurt griego', 'Pollo', 'Brócoli', 'Quinoa', 'Aguacate']
            }
        ];

        setTimeout(() => {
            setRecommendations(mockRecommendations);
            setLoading(false);
        }, 800);
    };

    const createListFromRecommendation = (recommendation: Recommendation) => {
        // NOTA!!! -> En una implementación real, esto crearía una lista de compras basada en la recomendación
        console.log(`Crear lista desde recomendación: ${recommendation.title}`);
        // Luego redirige a la página de listas
        history.push('/lists/create');
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonTitle>Recomendaciones</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" />
                        <p>Cargando recomendaciones...</p>
                    </div>
                ) : (
                    <div className="recommendations-container">
                        <h2>Sugerencias para ti</h2>
                        <p>Basadas en tus preferencias y compras anteriores</p>

                        {recommendations.length > 0 ? (
                            recommendations.map(recommendation => (
                                <IonCard key={recommendation.id} className="recommendation-card">
                                    <IonCardHeader>
                                        <IonCardTitle>{recommendation.title}</IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <p>{recommendation.description}</p>
                                        <div className="items-list">
                                            <p><strong>Incluye:</strong></p>
                                            <ul>
                                                {recommendation.items.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <IonButton
                                            expand="block"
                                            size="small"
                                            onClick={() => createListFromRecommendation(recommendation)}
                                        >
                                            <IonIcon slot="start" icon={addOutline} />
                                            Crear Lista
                                        </IonButton>
                                    </IonCardContent>
                                </IonCard>
                            ))
                        ) : (
                            <div className="no-recommendations">
                                <p>No hay recomendaciones.</p>
                            </div>
                        )}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default RecommendationsPage;
