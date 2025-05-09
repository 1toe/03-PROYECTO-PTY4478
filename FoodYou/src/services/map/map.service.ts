// src/services/map/map.service.ts

export interface Location {
    latitude: number;
    longitude: number;
  }
  
  /**
   * Carga dinámicamente el script de Google Maps JavaScript API
   */
  export const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {  // Aquí definimos `resolve` y `reject`
      if ((window as any).google && (window as any).google.maps) {
        console.log("Google Maps ya está cargado.");
        resolve();
        return;
      }
  
      const apiKey = ; 
      

      if (!apiKey) {
        reject('Falta la clave de Google Maps en el archivo .env');
        return;
      }
  
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
  
      script.onload = () => {
        console.log("Google Maps script cargado.");
        
        // Verificar si google.maps está disponible después de que el script se cargue
        setTimeout(() => {
          if ((window as any).google && (window as any).google.maps) {
            console.log("google.maps ahora está disponible.");
            resolve(); // Aquí usamos `resolve` correctamente
          } else {
            reject('Error: google.maps no está disponible después de cargar el script');
          }
        }, 3000); // Esperar 3 segundos antes de verificar
      };
      
      script.onerror = () => {
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
  
    new (window as any).google.maps.Marker({
      position: { lat, lng },
      map,
      title: 'Tu ubicación'
    });
  };
  