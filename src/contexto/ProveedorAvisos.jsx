/**
 * Avisos flotantes ("toasts") para confirmar acciones o mostrar errores.
 *   const { avisar } = useAvisos();
 *   avisar('Publicación creada');            // éxito
 *   avisar('No se pudo guardar', 'error');
 *   avisar('Mensaje nuevo', 'exito', IconoComentario); // icono propio en lugar del del tipo
 */
import { useCallback, useMemo, useState } from 'react';
import { IconoAlerta, IconoCheck } from '../componentes/iconos/Iconos.jsx';
import { AvisosContexto } from './contextos.js';

const ICONO_POR_TIPO = { exito: IconoCheck, error: IconoAlerta };

const DURACION_MS = 4000;
let siguienteId = 1;

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);

  const quitar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const avisar = useCallback(
    (texto, tipo = 'exito', icono = ICONO_POR_TIPO[tipo]) => {
      const id = siguienteId++;
      setAvisos((lista) => [...lista, { id, texto, tipo, Icono: icono }]);
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
            {aviso.Icono && <aviso.Icono tamano={18} />}
            {aviso.texto}
          </button>
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}
