export interface Location {
  latitude: number;
  longitude: number;
}

export interface LugarConGeometry {
  geometry: {
    location: google.maps.LatLng;
  };
  name?: string;
}

/**
 * Calcula la distancia en metros entre dos puntos geográficos
 */
export const calcularDistanciaMetros = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // radio de la Tierra en metros
  const toRad = (deg: number) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Carga dinámicamente el script de Google Maps JavaScript API con Places API
 */
export const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      console.log("Google Maps ya está cargado.");
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject('Falta la clave de Google Maps en el archivo .env');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps script cargado.");
      setTimeout(() => {
        if ((window as any).google && (window as any).google.maps) {
          console.log("google.maps ahora está disponible.");
          resolve();
        } else {
          reject('Error: google.maps no está disponible después de cargar el script');
        }
      }, 3000);
    };

    script.onerror = () => {
      reject('Error al cargar Google Maps');
    };

    document.head.appendChild(script);
  });
};

/**
 * Busca supermercados cercanos filtrando por nombre específico
 */
export const buscarSupermercados = (
  map: google.maps.Map,
  location: google.maps.LatLngLiteral,
  callback: (lugares: google.maps.places.PlaceResult[]) => void
) => {
  const service = new google.maps.places.PlacesService(map);

  const request: google.maps.places.PlaceSearchRequest = {
    location,
    radius: 8000,
    type: 'supermarket',
  };

  service.nearbySearch(request, (results, status) => {
    console.log("Status búsqueda supermercados:", status);
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      console.log("Resultados encontrados:", results.length);

      const supermercadosFiltrados = results.filter((lugar) => {
        const nombre = (lugar.name || '').toLowerCase();
        return (
          //nombre.includes('santa isabel') ||
         // nombre.includes('líder') || 
          //nombre.includes('lider') ||   Agregar para entrega 2 en lo posible algun super extra
          nombre.includes('unimarc')
        );
      });
      console.log("Supermercados filtrados:", supermercadosFiltrados.length);
      callback(supermercadosFiltrados);
    } else {
      console.error('Error al buscar supermercados:', status);
      callback([]);
    }
  });
};

/**
 * Muestra la ruta entre dos puntos en el mapa usando DirectionsService y DirectionsRenderer
 */
let currentDirectionsRenderer: google.maps.DirectionsRenderer | null = null;

export const mostrarRuta = (
  map: google.maps.Map,
  origen: { lat: number; lng: number },
  destino: { lat: number; lng: number },
  modo: google.maps.TravelMode
): google.maps.DirectionsRenderer => {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  directionsService.route(
    {
      origin: origen,
      destination: destino,
      travelMode: modo
    },
    (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Error al mostrar la ruta:', result);
      }
    }
  );

  return directionsRenderer; // <-- Esto es importante
};




/**
 * Marcador global del usuario para actualizar posición
 */
let markerUsuario: google.maps.Marker | null = null;


/**
 * Función para iniciar la actualización automática de la posición del usuario
 */
export const iniciarActualizacionPosicion = (
  map: google.maps.Map,
  onPositionUpdate?: (pos: { lat: number; lng: number }) => void
) => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const nuevaPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      if (markerUsuario) {
        markerUsuario.setPosition(nuevaPos);
      } else {
        markerUsuario = new google.maps.Marker({
          position: nuevaPos,
          map,
          label: "Yo",
          title: "Tu ubicación actualizada",
        });
      }

      // Opcional: centrar mapa en nueva posición
      // map.setCenter(nuevaPos);

      // Opcional: ejecutar callback para actualizar ruta o lógica extra
      if (onPositionUpdate) {
        onPositionUpdate(nuevaPos);
      }
    },
    (error) => {
      console.error("Error al obtener posición:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );
};


/**
 * Inicializa el mapa de Google en un elemento HTML dado y muestra supermercados filtrados
 */
export const initMap = (
  element: HTMLElement,
  lat: number,
  lng: number,
  setSupermercados: (lugares: LugarConGeometry[]) => void
): google.maps.Map => {
  if (!(window as any).google || !(window as any).google.maps) {
    console.error("Google Maps API no está disponible.");
    throw new Error("Google Maps API no está disponible.");
  }

  const google = (window as any).google;
  const location = { lat, lng };

  const map = new google.maps.Map(element, {
    center: location,
    zoom: 15,
    styles: [
      {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        elementType: "all",
        stylers: [{ visibility: "off" }]
      }
    ]
  });

  // Inicializamos marcador usuario con label "Yo"
  markerUsuario = new google.maps.Marker({
    position: location,
    map,
    label: "Yo",
    title: 'Tu ubicación'
  });

  let marcadoresSupermercados: google.maps.Marker[] = [];

  const limpiarMarcadores = () => {
    marcadoresSupermercados.forEach(m => m.setMap(null));
    marcadoresSupermercados = [];
  };

  const actualizarSupermercados = () => {
    buscarSupermercados(map, location, (lugares) => {
      limpiarMarcadores();

      const lugaresFiltrados = lugares.filter(lugar => lugar.geometry && lugar.geometry.location) as LugarConGeometry[];

      lugaresFiltrados.forEach((lugar) => {
        const marker = new google.maps.Marker({
  position: lugar.geometry.location,
  title: lugar.name,
  icon: {
    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  }
  // NO asignamos el mapa aquí (quedará invisible)
});

        marcadoresSupermercados.push(marker);
      });

      setSupermercados(lugaresFiltrados);
    });
  };

  actualizarSupermercados();

  // Iniciamos actualización automática de la posición del usuario
  iniciarActualizacionPosicion(map /*, pos => {
    // Si quieres que la ruta se actualice automáticamente cuando cambia posición:
    // Por ejemplo:
    // if (destinoActual) mostrarRuta(map, pos, destinoActual);
  }*/);

  return map;
};