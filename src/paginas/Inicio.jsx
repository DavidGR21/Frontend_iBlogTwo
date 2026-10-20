/** Feed: crear publicación + publicaciones de todos, con las nuevas llegando en vivo. */
import { useCallback } from 'react';
import { listarFeed } from '../api/publicaciones.js';
import { FormPublicacion } from '../componentes/publicaciones/FormPublicacion.jsx';
import { ListaPublicaciones } from '../componentes/publicaciones/ListaPublicaciones.jsx';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { usePaginado } from '../hooks/usePaginado.js';
import { EVENTOS } from '../sockets/eventos.js';

export function Inicio() {
  const feed = usePaginado((cursor) => listarFeed(cursor), 'feed');
  const { setItems } = feed;

  const agregarArriba = useCallback(
    (publicacion) =>
      setItems((actuales) =>
        actuales.some((p) => p.id === publicacion.id) ? actuales : [publicacion, ...actuales],
      ),
    [setItems],
  );

  useEventoSocket(EVENTOS.PUBLICACION_NUEVA, agregarArriba);

  return (
    <>
      <FormPublicacion alPublicar={agregarArriba} />
      <ListaPublicaciones
        lista={feed}
        textoVacio="Todavía no hay publicaciones. ¡Escribe la primera!"
      />
    </>
  );
}
