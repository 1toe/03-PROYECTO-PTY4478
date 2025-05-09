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
import { locate, locateOutline } from 'ionicons/icons';
import './MapPage.css';
import { loadGoogleMaps, initMap } from '../../services/map/map.service';

interface Location {
  latitude: number;
  longitude: number;
}

const MapPage: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

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

        if (mapRef.current && (window as any).google && (window as any).google.maps) {
          initMap(mapRef.current, loc.latitude, loc.longitude);
        } else {
          setError("Google Maps no está disponible");
        }
      },
      (error) => {
        setError(`Error al obtener la ubicación: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,     // Espera hasta 10 segundos por una ubicación precisa
        maximumAge: 0       // No reutiliza ubicaciones antiguas
      }
    );
  };

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (location && mapRef.current) {
          initMap(mapRef.current, location.latitude, location.longitude);
        }
      })
      .catch((err) => setError(err));
  }, [location]);

  return (
    <IonPage>
      <IonContent>
        <div className="map-container">
          {location ? (
            <div className="map-placeholder">
              <div ref={mapRef} id="map" style={{ height: "400px", width: "100%" }} />
              <IonCard className="nearby-stores">
                <IonCardContent>
                  <h3>Tiendas cercanas</h3>
                  <p>Esta funcionalidad estará disponible próximamente.</p>
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
