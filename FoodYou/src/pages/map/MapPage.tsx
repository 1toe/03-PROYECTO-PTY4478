import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonContent,
  IonLoading,
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { locate, locateOutline } from 'ionicons/icons';
import './MapPage.css';

interface Location {
  latitude: number;
  longitude: number;
}

const MapPage: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en tu navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError(`Error al obtener la ubicación: ${error.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Intentar obtener la ubicación al cargar la página
    getLocation();
  }, []);

  return (
    <IonPage>
      <IonContent>
        <div className="map-container">
          {location ? (
            <div className="map-placeholder">
              <div className="map-content">
                {/* Aquí se integraría un mapa real como Google Maps, Leaflet, etc. */}
                <h2>Tu ubicación actual</h2>
                <p>Latitud: {location.latitude.toFixed(6)}</p>
                <p>Longitud: {location.longitude.toFixed(6)}</p>
              </div>
              <IonCard className="nearby-stores">
                <IonCardContent>
                  <h3>Tiendas cercanas</h3>
                  <p>Esta funcionalidad estará disponible próximamente. Aquí podrás ver tiendas y supermercados cercanos a tu ubicación.</p>
                </IonCardContent>
              </IonCard>
            </div>
          ) : (
            <div className="location-request">
              <h2>Ubicación no disponible</h2>
              <p>Necesitamos acceder a tu ubicación para mostrarte las tiendas y supermercados cercanos.</p>
              <IonButton onClick={getLocation}>
                <IonIcon slot="start" icon={locateOutline} />
                Activar ubicación
              </IonButton>
            </div>
          )}
          
          <div className="map-controls">
            <IonButton onClick={getLocation} disabled={loading}>
              <IonIcon slot="start" icon={locate} />
              {location ? 'Actualizar ubicación' : 'Obtener ubicación'}
            </IonButton>
          </div>
        </div>
        
        <IonLoading isOpen={loading} message="Obteniendo tu ubicación..." />
        <IonToast
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          message={error || ''}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default MapPage;
