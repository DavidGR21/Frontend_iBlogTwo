import { useContext } from 'react';
import { SesionContexto } from '../contexto/contextos.js';

/** { usuario, comprobando, socket, conectado, iniciarSesion, cerrarSesion, actualizarUsuario } */
export function useSesion() {
  const contexto = useContext(SesionContexto);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  return contexto;
}
