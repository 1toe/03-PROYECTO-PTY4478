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
import { loadGoogleMaps, initMap, calcularDistanciaMetros, mostrarRuta } from '../../services/map/map.service';

interface Location {
  latitude: number;
  longitude: number;
}

// Función auxiliar para obtener lat y lng de forma segura
const getLatLng = (place: google.maps.places.PlaceResult) => {
  if (place.geometry && place.geometry.location) {
    return {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };
  }
  return { lat: 0, lng: 0 };
};

const MapPage: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supermercados, setSupermercados] = useState<google.maps.places.PlaceResult[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

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

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        if (location && mapRef.current) {
          const map = initMap(mapRef.current, location.latitude, location.longitude, setSupermercados);
          mapInstanceRef.current = map;
        }
      })
      .catch((err) => setError(err));
  }, [location]);

  const centrarMapaEnSupermercado = (place: google.maps.places.PlaceResult) => {
    if (!mapInstanceRef.current) return;
    const { lat, lng } = getLatLng(place);
    const center = new google.maps.LatLng(lat, lng);
    mapInstanceRef.current.panTo(center);
    mapInstanceRef.current.setZoom(16);
  };

  // ✅ NUEVA FUNCIÓN: Mostrar ruta hacia supermercado
  const mostrarRutaHaciaSupermercado = (place: google.maps.places.PlaceResult) => {
    if (!mapInstanceRef.current || !location) return;

    const destino = getLatLng(place);
    const origen = {
      lat: location.latitude,
      lng: location.longitude
    };

    mostrarRuta(mapInstanceRef.current, origen, destino);
  };

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
                  {supermercados.length > 0 ? (
                    <ul>
                      {supermercados
                        .slice()
                        .sort((a, b) => {
                          const aCoords = getLatLng(a);
                          const bCoords = getLatLng(b);

                          const distanciaA = calcularDistanciaMetros(
                            location.latitude,
                            location.longitude,
                            aCoords.lat,
                            aCoords.lng
                          );
                          const distanciaB = calcularDistanciaMetros(
                            location.latitude,
                            location.longitude,
                            bCoords.lat,
                            bCoords.lng
                          );

                          return distanciaA - distanciaB;
                        })
                        .map((lugar, index) => {
                          if (!lugar.geometry || !lugar.geometry.location) {
                            return null;
                          }

                          const latLugar = lugar.geometry.location.lat();
                          const lngLugar = lugar.geometry.location.lng();
                          const distancia = calcularDistanciaMetros(
                            location.latitude,
                            location.longitude,
                            latLugar,
                            lngLugar
                          );

                          return (
                            <li key={index} style={{ marginBottom: '10px' }}>
                              <div
                                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                onClick={() => centrarMapaEnSupermercado(lugar)}
                              >
                                {lugar.name} - {(distancia / 1000).toFixed(2)} km
                              </div>

                              {/* ✅ BOTÓN PARA VER RUTA */}
                              <IonButton
                                size="small"
                                color="primary"
                                onClick={() => mostrarRutaHaciaSupermercado(lugar)}
                              >
                                Ver ruta
                              </IonButton>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p>No se encontraron supermercados cercanos.</p>
                  )}
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
