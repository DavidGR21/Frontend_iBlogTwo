import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` cuando lleva `espera` ms sin cambiar (p. ej. un buscador: no pedir al
 * servidor con cada tecla).
 *   const buscar = useDiferido(texto.trim(), 350);
 */
export function useDiferido(valor, espera = 350) {
  const [diferido, setDiferido] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setDiferido(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);
  return diferido;
}
