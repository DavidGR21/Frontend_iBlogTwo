/**
 * Lista paginada de publicaciones (feed o perfil).
 * Recibe el resultado de usePaginado y se encarga de editar/eliminar en la lista
 * y de actualizar los contadores de reacciones que llegan por socket (y de quitar las que
 * se eliminan mientras está abierta).
 */
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { TarjetaPublicacion } from './TarjetaPublicacion.jsx';

export function ListaPublicaciones({ lista, textoVacio = 'Todavía no hay publicaciones.' }) {
  const { items, setItems } = lista;

  // `cambio` puede ser la publicación nueva o una función (anterior) => nueva: con la función
  // dos eventos seguidos (p. ej. reacción y comentario) no se pisan entre sí.
  const actualizar = (id, cambio) =>
    setItems((actuales) =>
      actuales.map((p) => (p.id === id ? (typeof cambio === 'function' ? cambio(p) : cambio) : p)),
    );
  const quitar = (id) => setItems((actuales) => actuales.filter((p) => p.id !== id));

  useEventoSocket(EVENTOS.REACCION_ACTUALIZADA, ({ publicacionId, reacciones }) => {
    setItems((actuales) =>
      actuales.map((p) => (p.id === publicacionId ? { ...p, reacciones } : p)),
    );
  });

  // Eliminada por su autor en otra pestaña o por un administrador
  useEventoSocket(EVENTOS.PUBLICACION_ELIMINADA, ({ publicacionId }) => quitar(publicacionId));

  return (
    <>
      {items.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion.id}
          publicacion={publicacion}
          alCambiar={(cambio) => actualizar(publicacion.id, cambio)}
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
