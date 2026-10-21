import { useContext } from 'react';
import { ConfirmacionContexto } from '../contexto/contextos.js';

/** confirmar({ titulo, mensaje, confirmar, cancelar, peligro }) → Promise<boolean> */
export function useConfirmar() {
  const confirmar = useContext(ConfirmacionContexto);
  if (!confirmar) throw new Error('useConfirmar debe usarse dentro de <ProveedorConfirmacion>');
  return confirmar;
}
