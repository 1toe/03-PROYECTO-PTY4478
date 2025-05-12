import React, { useState, useEffect, useRef } from 'react';
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
import { locate, locateOutline, refreshOutline } from 'ionicons/icons';
import './MapPage.css';
import { loadGoogleMaps, initMap } from '../../services/map/map.service';
import { useTouchEventHandler } from '../../utils/TouchEventHandler';

interface Location {
  latitude: number;
  longitude: number;
}

const MapPage: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Aplicar el handler de eventos táctiles al contenedor del mapa
  useTouchEventHandler(mapRef);

  // Cargar Google Maps al inicio
  useEffect(() => {
    setLoading(true);
    loadGoogleMaps()
      .then(() => {
        setMapLoaded(true);
        if (location && mapRef.current) {
          initMap(mapRef.current, location.latitude, location.longitude);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(`Error al cargar Google Maps: ${err}`);
        setLoading(false);
      });
  }, []);

  // Efecto para inicializar el mapa cuando la ubicación cambia
  useEffect(() => {
    if (mapLoaded && location && mapRef.current) {
      initMap(mapRef.current, location.latitude, location.longitude);
    }
  }, [location, mapLoaded]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en tu navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(loc);
        setLoading(false);
      },
      (error) => {
        setError(`Error al obtener la ubicación: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <IonPage>
      <IonContent>
        <div className="map-container">
          {location ? (
            <div className="map-placeholder" ref={mapRef}>
              <div id="map" style={{ height: "400px", width: "100%" }} />
              <IonCard className="nearby-stores">
                <IonCardContent>
                  <h3>Tiendas cercanas</h3>
                  <p>  </p>
                </IonCardContent>
              </IonCard>

              {/* Controles del mapa con manejo específico de eventos táctiles */}
              <div className="map-controls">
                <IonButton 
                  onClick={getLocation} 
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <IonIcon icon={locateOutline} />
                  {location ? 'Actualizar ubicación' : 'Obtener ubicación'}
                </IonButton>
                <IonButton 
                  onClick={() => {/* acción de refrescar */}} 
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <IonIcon icon={refreshOutline} />
                </IonButton>
              </div>
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
