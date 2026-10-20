/**
 * Avisos flotantes ("toasts") para confirmar acciones o mostrar errores.
 *   const { avisar } = useAvisos();
 *   avisar('Publicación creada');            // éxito
 *   avisar('No se pudo guardar', 'error');
 */
import { useCallback, useMemo, useState } from 'react';
import { AvisosContexto } from './contextos.js';

const DURACION_MS = 4000;
let siguienteId = 1;

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);

  const quitar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const avisar = useCallback(
    (texto, tipo = 'exito') => {
      const id = siguienteId++;
      setAvisos((lista) => [...lista, { id, texto, tipo }]);
      setTimeout(() => quitar(id), DURACION_MS);
    },
    [quitar],
  );

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <button
            key={aviso.id}
            className={`aviso aviso-${aviso.tipo}`}
            onClick={() => quitar(aviso.id)}
          >
            {aviso.texto}
          </button>
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}
