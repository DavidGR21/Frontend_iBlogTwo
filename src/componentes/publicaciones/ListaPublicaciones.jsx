/**
 * Lista paginada de publicaciones (feed o perfil).
 * Recibe el resultado de usePaginado y se encarga de editar/eliminar en la lista
 * y de actualizar los contadores de reacciones que llegan por socket.
 */
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { TarjetaPublicacion } from './TarjetaPublicacion.jsx';

export function ListaPublicaciones({ lista, textoVacio = 'Todavía no hay publicaciones.' }) {
  const { items, setItems } = lista;

  const reemplazar = (publicacion) =>
    setItems((actuales) => actuales.map((p) => (p.id === publicacion.id ? publicacion : p)));
  const quitar = (id) => setItems((actuales) => actuales.filter((p) => p.id !== id));

  useEventoSocket(EVENTOS.REACCION_ACTUALIZADA, ({ publicacionId, reacciones }) => {
    setItems((actuales) =>
      actuales.map((p) => (p.id === publicacionId ? { ...p, reacciones } : p)),
    );
  });

  return (
    <>
      {items.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion.id}
          publicacion={publicacion}
          alCambiar={reemplazar}
          alEliminar={quitar}
        />
      ))}

      {lista.cargando && <Cargando />}
      <MensajeError error={lista.error} />
      {!lista.cargando && !lista.error && items.length === 0 && (
        <p className="vacio">{textoVacio}</p>
      )}
      {lista.hayMas && !lista.cargando && (
        <button className="boton-secundario" onClick={lista.cargarMas} style={{ width: '100%' }}>
          Cargar más
        </button>
      )}
    </>
  );
}
