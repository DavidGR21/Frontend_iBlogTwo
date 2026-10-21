/**
 * Contadores de la barra: solicitudes de amistad recibidas y mensajes sin leer.
 *
 * Se cargan del servidor al conectarse el socket (y al volver a la pestaña) y se
 * actualizan en vivo con los eventos de Socket.io. La página de Mensajes, que ya
 * lleva la cuenta exacta por conversación, fija el total con `fijarMensajesSinLeer`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { listarSolicitudes } from '../api/amistades.js';
import { listarConversaciones } from '../api/conversaciones.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';
import { NotificacionesContexto } from './contextos.js';

export function ProveedorNotificaciones({ children }) {
  const { usuario, conectado } = useSesion();
  const { pathname } = useLocation();
  const [solicitudes, setSolicitudes] = useState(0);
  const [mensajes, setMensajes] = useState(0);

  const recargar = useCallback(async () => {
    try {
      const [recibidas, conversaciones] = await Promise.all([
        listarSolicitudes('recibidas'),
        listarConversaciones(),
      ]);
      setSolicitudes(recibidas.items.length);
      setMensajes(conversaciones.items.reduce((suma, c) => suma + (c.noLeidos ?? 0), 0));
    } catch {
      // Los contadores no son críticos: se reintenta en la próxima recarga.
    }
  }, []);

  // Al (re)conectarse el socket se pudieron perder eventos: se pide la cuenta real.
  const usuarioId = usuario?.id;
  useEffect(() => {
    if (usuarioId && conectado) recargar();
  }, [usuarioId, conectado, recargar]);

  useEffect(() => {
    if (!usuarioId) return undefined;
    const alVolver = () => document.visibilityState === 'visible' && recargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [usuarioId, recargar]);

  useEventoSocket(EVENTOS.AMISTAD_SOLICITUD, () => setSolicitudes((n) => n + 1));

  useEventoSocket(EVENTOS.MENSAJE_NUEVO, (mensaje) => {
    const viendoChat = pathname === `/mensajes/${mensaje.conversacionId}`;
    if (mensaje.remitenteId !== usuarioId && !viendoChat) setMensajes((n) => n + 1);
  });

  const valor = useMemo(
    () => ({
      solicitudes: usuarioId ? solicitudes : 0,
      mensajes: usuarioId ? mensajes : 0,
      recargar,
      fijarMensajesSinLeer: setMensajes,
    }),
    [usuarioId, solicitudes, mensajes, recargar],
  );

  return (
    <NotificacionesContexto.Provider value={valor}>{children}</NotificacionesContexto.Provider>
  );
}
