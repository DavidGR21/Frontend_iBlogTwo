import { useEffect, useState } from 'react';
import { EVENTOS } from '../sockets/eventos.js';
import { useSesion } from './useSesion.js';

/**
 * Mientras `activo` sea true, se une a la sala de la publicación para recibir sus
 * comentarios y reacciones en vivo (y vuelve a unirse si el socket se reconecta).
 * El backend solo emite esos eventos a la sala, y solo deja entrar a quien puede verla.
 */
export function useSalaPublicacion(publicacionId, activo = true) {
  const { socket } = useSesion();

  useEffect(() => {
    if (!socket || !publicacionId || !activo) return undefined;
    const unirse = () => socket.emit(EVENTOS.PUBLICACION_UNIRSE, publicacionId);
    unirse();
    socket.on('connect', unirse);
    return () => {
      socket.off('connect', unirse);
      socket.emit(EVENTOS.PUBLICACION_SALIR, publicacionId);
    };
  }, [socket, publicacionId, activo]);
}

/**
 * true mientras el elemento esté en pantalla (o cerca: `margen`). Así cada tarjeta del feed
 * solo está en la sala de su publicación cuando se ve, y no en las de todo el feed.
 */
export function useEnPantalla(ref, margen = '300px') {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting), {
      rootMargin: margen,
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ref, margen]);

  return visible;
}
