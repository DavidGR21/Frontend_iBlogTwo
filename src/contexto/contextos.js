/**
 * Contextos globales de la app. Los proveedores están en ProveedorSesion.jsx,
 * ProveedorNotificaciones.jsx, ProveedorAvisos.jsx y ProveedorConfirmacion.jsx; para usarlos, importa los hooks de src/hooks/.
 */
import { createContext } from 'react';

export const SesionContexto = createContext(null);
export const NotificacionesContexto = createContext(null);
export const AvisosContexto = createContext(null);
export const ConfirmacionContexto = createContext(null);
