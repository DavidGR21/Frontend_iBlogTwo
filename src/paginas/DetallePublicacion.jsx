/**
 * Una publicación con sus comentarios. Mientras está abierta, el usuario se une
 * a la sala de la publicación para recibir comentarios y reacciones en vivo.
 */
import { useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { obtenerPublicacion } from '../api/publicaciones.js';
import { Cargando } from '../componentes/Cargando.jsx';
import { SeccionComentarios } from '../componentes/comentarios/SeccionComentarios.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { TarjetaPublicacion } from '../componentes/publicaciones/TarjetaPublicacion.jsx';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';

export function DetallePublicacion() {
  const { id } = useParams();
  const { socket } = useSesion();
  const navegar = useNavigate();
  const {
    datos: publicacion,
    cargando,
    error,
    recargar,
    setDatos,
  } = useDatos(() => obtenerPublicacion(id), id);

  // Unirse a la sala (y volver a unirse si el socket se reconecta).
  useEffect(() => {
    if (!socket) return undefined;
    const unirse = () => socket.emit(EVENTOS.PUBLICACION_UNIRSE, id);
    unirse();
    socket.on('connect', unirse);
    return () => {
      socket.off('connect', unirse);
      socket.emit(EVENTOS.PUBLICACION_SALIR, id);
    };
  }, [socket, id]);

  useEventoSocket(EVENTOS.REACCION_ACTUALIZADA, ({ publicacionId, reacciones }) => {
    if (publicacionId === id) setDatos((p) => p && { ...p, reacciones });
  });

  const sumarComentario = useCallback(
    () => setDatos((p) => p && { ...p, totalComentarios: (p.totalComentarios ?? 0) + 1 }),
    [setDatos],
  );

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
        mostrarEnlace={false}
      />
      <SeccionComentarios publicacionId={id} alAgregarComentario={sumarComentario} />
    </>
  );
}
