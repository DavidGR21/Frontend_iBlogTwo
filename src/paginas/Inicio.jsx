/**
 * Inicio en tres columnas: amigos y solicitudes | feed con las publicaciones nuevas llegando
 * en vivo | crear publicación. En pantallas estrechas se apilan.
 */
import { useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { listarFeed } from '../api/publicaciones.js';
import { PanelesAmistad } from '../componentes/inicio/PanelesAmistad.jsx';
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

  // Publicado desde la ventana "Crear post" de la barra (celular)
  // (se limpia al usarla para que no vuelva a aparecer si luego se elimina)
  const { publicacionNueva, limpiarPublicacionNueva } = useOutletContext() ?? {};
  useEffect(() => {
    if (!publicacionNueva) return;
    agregarArriba(publicacionNueva);
    limpiarPublicacionNueva();
  }, [publicacionNueva, agregarArriba, limpiarPublicacionNueva]);

  return (
    <div className="inicio">
      <aside className="inicio-izq" aria-label="Amigos">
        <PanelesAmistad />
      </aside>

      <section className="inicio-feed" aria-label="Publicaciones">
        <ListaPublicaciones
          lista={feed}
          textoVacio="Todavía no hay publicaciones. ¡Escribe la primera!"
        />
      </section>

      <aside className="inicio-der">
        <FormPublicacion alPublicar={agregarArriba} />
      </aside>
    </div>
  );
}
