import { useContext } from 'react';
import { AvisosContexto } from '../contexto/contextos.js';

/** { avisar(texto, tipo = 'exito' | 'error') } */
export function useAvisos() {
  const contexto = useContext(AvisosContexto);
  if (!contexto) throw new Error('useAvisos debe usarse dentro de <ProveedorAvisos>');
  return contexto;
}
