import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonLoading,
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import { locate, locateOutline } from 'ionicons/icons';
import './MapPage.css';
import {
  loadGoogleMaps,
  initMap,
  calcularDistanciaMetros,
  mostrarRuta
} from '../../services/map/map.service';

interface Location {
  latitude: number;
  longitude: number;
}

type TravelMode = 'WALKING' | 'DRIVING' | 'TRANSIT' | 'BICYCLING';

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
  const [filtro, setFiltro] = useState<string>('todos');
  const [modoTransporte, setModoTransporte] = useState<TravelMode>('WALKING');

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRenderersRef = useRef<google.maps.DirectionsRenderer[]>([]);

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

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const nuevosMarcadores = supermercados.map(place => {
      const { lat, lng } = getLatLng(place);
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current!,
        title: place.name,
      });
      return marker;
    });

    markersRef.current = nuevosMarcadores;
  }, [supermercados]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker, index) => {
      const place = supermercados[index];
      if (!place || !place.name) {
        marker.setMap(null);
        return;
      }
      const nombre = place.name.toLowerCase();

      if (filtro === 'todos' || nombre.includes(filtro)) {
        marker.setMap(mapInstanceRef.current);
      } else {
        marker.setMap(null);
      }
    });
  }, [filtro, supermercados]);

  const centrarMapaEnSupermercado = (place: google.maps.places.PlaceResult) => {
    if (!mapInstanceRef.current) return;
    const { lat, lng } = getLatLng(place);
    const center = new google.maps.LatLng(lat, lng);
    mapInstanceRef.current.panTo(center);
    mapInstanceRef.current.setZoom(16);
  };

  const limpiarRutas = () => {
    directionsRenderersRef.current.forEach(renderer => renderer.setMap(null));
    directionsRenderersRef.current = [];
  };

  const mostrarRutaHaciaSupermercado = (place: google.maps.places.PlaceResult) => {
    if (!mapInstanceRef.current || !location) return;
    const destino = getLatLng(place);
    const origen = {
      lat: location.latitude,
      lng: location.longitude
    };

    limpiarRutas();

    const nuevaRuta = mostrarRuta(
      mapInstanceRef.current,
      origen,
      destino,
      google.maps.TravelMode[modoTransporte]
    );

    if (nuevaRuta) {
      directionsRenderersRef.current.push(nuevaRuta);
    }
  };

  const supermercadosFiltrados = supermercados.filter((s) => {
    const nombre = (s.name || '').toLowerCase();
    if (filtro === 'todos') return true;
    return nombre.includes(filtro);
  });

  return (
    <IonPage>
      <IonContent>
        <div className="map-container">
          {location ? (
            <div className="map-placeholder">
              <div ref={mapRef} id="map" style={{ height: "400px", width: "100%" }} />

              <IonSegment
                value={modoTransporte}
                onIonChange={(e) => {
                  setModoTransporte(e.detail.value as TravelMode);
                  limpiarRutas(); // Limpia rutas si cambias de modo
                }}
              >
                <IonSegmentButton value="WALKING">
                  <IonLabel>Caminando</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="DRIVING">
                  <IonLabel>En auto</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="TRANSIT">
                  <IonLabel>Transporte público</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="BICYCLING">
                  <IonLabel>Bicicleta</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              <IonCard className="nearby-stores">
                <IonCardContent>
                  <h3>Tiendas cercanas</h3>
                  {supermercadosFiltrados.length > 0 ? (
                    <ul>
                      {supermercadosFiltrados
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
                          if (!lugar.geometry || !lugar.geometry.location) return null;

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
                    <p>No se encontraron supermercados.</p>
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
