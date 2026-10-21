import { useContext } from 'react';
import { NotificacionesContexto } from '../contexto/contextos.js';

/** { solicitudes, mensajes, recargar, fijarMensajesSinLeer } */
export function useNotificaciones() {
  const contexto = useContext(NotificacionesContexto);
  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de <ProveedorNotificaciones>');
  }
  return contexto;
}
