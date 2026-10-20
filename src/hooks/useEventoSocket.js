import { useEffect, useRef } from 'react';
import { useSesion } from './useSesion.js';

/**
 * Escucha un evento de Socket.io mientras el componente esté montado.
 *   useEventoSocket(EVENTOS.COMENTARIO_NUEVO, (comentario) => { ... });
 * Siempre usa la versión más reciente del manejador, sin volver a suscribirse.
 */
export function useEventoSocket(evento, manejador) {
  const { socket } = useSesion();
  const manejadorRef = useRef(manejador);

  useEffect(() => {
    manejadorRef.current = manejador;
  });

  useEffect(() => {
    if (!socket) return undefined;
    const escuchar = (...datos) => manejadorRef.current(...datos);
    socket.on(evento, escuchar);
    return () => socket.off(evento, escuchar);
  }, [socket, evento]);
}
