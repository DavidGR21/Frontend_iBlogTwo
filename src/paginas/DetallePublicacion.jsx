/**
 * Una publicación sola (enlace directo), con los comentarios ya desplegados. Mientras los
 * comentarios están abiertos se recibe la sala de la publicación (comentarios y reacciones
 * en vivo).
 */
import { Link, useNavigate, useParams } from 'react-router';
import { obtenerPublicacion } from '../api/publicaciones.js';
import { Cargando } from '../componentes/Cargando.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { TarjetaPublicacion } from '../componentes/publicaciones/TarjetaPublicacion.jsx';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { EVENTOS } from '../sockets/eventos.js';

export function DetallePublicacion() {
  const { id } = useParams();
  const navegar = useNavigate();
  const {
    datos: publicacion,
    cargando,
    error,
    recargar,
    setDatos,
  } = useDatos(() => obtenerPublicacion(id), id);

  useEventoSocket(EVENTOS.REACCION_ACTUALIZADA, ({ publicacionId, reacciones }) => {
    if (publicacionId === id) setDatos((p) => p && { ...p, reacciones });
  });

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;

  return (
    <>
      <p>
        <Link to="/">← Volver</Link>
      </p>
      <TarjetaPublicacion
        publicacion={publicacion}
        alCambiar={setDatos}
        alEliminar={() => navegar('/')}
        comentariosAbiertos
      />
    </>
  );
}
