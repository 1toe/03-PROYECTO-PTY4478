export interface Location {
  latitude: number;
  longitude: number;
}

// Variable para controlar que el script se carga solo una vez
let isLoadingScript = false;
let isLoaded = false;

/**
 * Carga dinámicamente el script de Google Maps JavaScript API
 */
export const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, resolvemos inmediatamente
    if ((window as any).google && (window as any).google.maps) {
      console.log("Google Maps ya está cargado.");
      isLoaded = true;
      resolve();
      return;
    }

    // Si ya está en proceso de carga, esperamos
    if (isLoadingScript) {
      // Comprobamos cada 500ms si ya se cargó
      const checkLoaded = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkLoaded);
          isLoaded = true;
          console.log("Google Maps cargado por otro proceso.");
          resolve();
        }
      }, 500);
      return;
    }
    const apiKey = "AIzaSyDCatOJ7MK7t41EzdWyXdIOYrYaM2L1Rss";

    if (!apiKey) {
      reject('Falta la clave de Google Maps en el archivo .env');
      return;
    }

    isLoadingScript = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps script cargado.");
      isLoaded = true;
      isLoadingScript = false;
      resolve();
    };

    script.onerror = () => {
      isLoadingScript = false;
      reject('Error al cargar Google Maps');
    };

    document.head.appendChild(script);
  });
};


/**
 * Inicializa el mapa de Google en un elemento HTML dado
 * @param element - Elemento HTML donde se dibuja el mapa
 * @param lat - Latitud inicial
 * @param lng - Longitud inicial
 */
export const initMap = (element: HTMLElement, lat: number, lng: number): void => {
  if (!(window as any).google || !(window as any).google.maps) {
    console.error("Google Maps API no está disponible.");
    return;
  }

  const map = new (window as any).google.maps.Map(element, {
    center: { lat, lng },
    zoom: 15
  });

  // Usar AdvancedMarkerElement en lugar del Marker deprecado
  if ((window as any).google.maps.marker && (window as any).google.maps.marker.AdvancedMarkerElement) {
    const position = { lat, lng };
    new (window as any).google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title: 'Tu ubicación'
    });
  } else {
    // Fallback al marcador tradicional si AdvancedMarkerElement no está disponible
    new (window as any).google.maps.Marker({
      position: { lat, lng },
      map,
      title: 'Tu ubicación'
    });
  }
};
