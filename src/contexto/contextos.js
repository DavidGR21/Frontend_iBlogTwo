/**
 * Contextos globales de la app. Los proveedores están en ProveedorSesion.jsx
 * y ProveedorAvisos.jsx; para usarlos, importa los hooks de src/hooks/.
 */
import { createContext } from 'react';

export const SesionContexto = createContext(null);
export const AvisosContexto = createContext(null);
