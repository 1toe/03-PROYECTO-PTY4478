import { useEffect } from 'react';

/**
 * Hook para prevenir advertencias relacionadas con eventos táctiles cancelables
 * @param elementRef Referencia al elemento DOM que necesita manejo de eventos táctiles
 */
export const useTouchEventHandler = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preventTouchMove = (e: TouchEvent) => {
      // Prevenir el comportamiento predeterminado solo si el evento es cancelable
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Añadir los event listeners con { passive: false } para permitir preventDefault
    element.addEventListener('touchstart', preventTouchMove, { passive: false });
    element.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      // Limpiar los event listeners al desmontar
      element.removeEventListener('touchstart', preventTouchMove);
      element.removeEventListener('touchmove', preventTouchMove);
    };
  }, [elementRef]);
};
