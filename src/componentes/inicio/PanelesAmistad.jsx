/**
 * Columna izquierda del inicio: buscador de personas y tus amigos.
 * La lista de amigos se actualiza sola cuando alguien acepta tu solicitud
 * (las solicitudes recibidas se gestionan en la página Amigos).
 */
import { Link } from 'react-router';
import { listarAmigos } from '../../api/amistades.js';
import { useDatos } from '../../hooks/useDatos.js';
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { Avatar } from '../Avatar.jsx';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { BuscadorPersonas } from './BuscadorPersonas.jsx';
import { IconoFlechaDerecha } from '../iconos/Iconos.jsx';

const MAX_AMIGOS = 6;

export function PanelesAmistad() {
  const amigos = useDatos(listarAmigos, 'amigos');
  const recargarAmigos = amigos.recargar;
  useEventoSocket(EVENTOS.AMISTAD_ACEPTADA, recargarAmigos);

  const lista = amigos.datos?.items ?? [];

  return (
    <>
      <BuscadorPersonas amigos={lista} />

      <section className="tarjeta panel">
        <h2 className="panel-titulo">
          Tus amigos
          {lista.length > 0 && <span className="panel-contador">{lista.length}</span>}
        </h2>
        {amigos.cargando && <Cargando />}
        <MensajeError error={amigos.error} alReintentar={recargarAmigos} />
        {!amigos.cargando && !amigos.error && lista.length === 0 && (
          <p className="suave">Todavía no tienes amigos. ¡Búscalos arriba!</p>
        )}
        {lista.length > 0 && (
          <ul className="panel-personas">
            {lista.slice(0, MAX_AMIGOS).map(({ id, usuario }) => (
              <li key={id}>
                <Link to={`/u/${usuario.nombreUsuario}`} className="autor">
                  <Avatar usuario={usuario} tamano={38} />
                  <strong>{usuario.nombreUsuario}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/amigos" className="panel-pie con-icono">
          Ver todos <IconoFlechaDerecha tamano={16} />
        </Link>
      </section>
    </>
  );
}
