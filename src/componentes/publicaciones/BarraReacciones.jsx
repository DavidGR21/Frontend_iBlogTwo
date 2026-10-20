/**
 * Las 7 reacciones con su contador. Un clic pone o cambia la reacción;
 * un clic sobre la reacción propia la quita.
 */
import { useState } from 'react';
import { quitarReaccion, reaccionar } from '../../api/publicaciones.js';
import { REACCIONES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';

export function BarraReacciones({ publicacion, alCambiar }) {
  const { avisar } = useAvisos();
  const [enviando, setEnviando] = useState(false);

  async function elegir(tipo) {
    setEnviando(true);
    try {
      const resultado =
        publicacion.miReaccion === tipo
          ? await quitarReaccion(publicacion.id)
          : await reaccionar(publicacion.id, tipo);
      alCambiar({ ...publicacion, ...resultado });
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="reacciones">
      {REACCIONES.map(({ tipo, emoji, nombre }) => {
        const total = publicacion.reacciones?.[tipo] ?? 0;
        const mia = publicacion.miReaccion === tipo;
        return (
          <button
            key={tipo}
            className={`reaccion ${mia ? 'reaccion-mia' : ''}`}
            onClick={() => elegir(tipo)}
            disabled={enviando}
            title={nombre}
            aria-pressed={mia}
          >
            {emoji} {total > 0 && total}
          </button>
        );
      })}
    </div>
  );
}
