/**
 * Mensajería: lista de conversaciones a la izquierda y chat abierto a la derecha.
 * La lista se reordena en vivo cuando llega un mensaje nuevo.
 */
import { useCallback } from 'react';
import { NavLink, useParams } from 'react-router';
import { listarConversaciones } from '../api/conversaciones.js';
import { Avatar } from '../componentes/Avatar.jsx';
import { Cargando } from '../componentes/Cargando.jsx';
import { PanelChat } from '../componentes/mensajes/PanelChat.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';
import { nombreCompleto } from '../utils/formato.js';

export function Mensajes() {
  const { conversacionId } = useParams();
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar, setDatos } = useDatos(
    listarConversaciones,
    'conversaciones',
  );

  const conversaciones = datos?.items ?? [];
  const actual = conversaciones.find((c) => c.id === conversacionId);

  useEventoSocket(EVENTOS.MENSAJE_NUEVO, (mensaje) => {
    if (!conversaciones.some((c) => c.id === mensaje.conversacionId)) {
      recargar(); // conversación nueva que aún no está en la lista
      return;
    }
    setDatos((d) => {
      const conversacion = d.items.find((c) => c.id === mensaje.conversacionId);
      const sinLeer =
        mensaje.remitenteId !== usuario.id && mensaje.conversacionId !== conversacionId;
      const actualizada = {
        ...conversacion,
        ultimoMensaje: {
          contenido: mensaje.contenido,
          remitenteId: mensaje.remitenteId,
          creadoEn: mensaje.creadoEn,
        },
        noLeidos: (conversacion.noLeidos ?? 0) + (sinLeer ? 1 : 0),
      };
      return {
        ...d,
        items: [actualizada, ...d.items.filter((c) => c.id !== mensaje.conversacionId)],
      };
    });
  });

  const marcarLeida = useCallback(
    (id) =>
      setDatos((d) =>
        d ? { ...d, items: d.items.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c)) } : d,
      ),
    [setDatos],
  );

  return (
    <div className="chat">
      <aside className="chat-lista">
        <div className="chat-cabecera">
          <strong>Conversaciones</strong>
        </div>
        {cargando && !datos && <Cargando />}
        <MensajeError error={error} alReintentar={recargar} />
        {datos && conversaciones.length === 0 && (
          <p className="vacio">
            Aún no tienes conversaciones. Escríbele a un amigo desde "Amigos".
          </p>
        )}
        <ul>
          {conversaciones.map((c) => (
            <li key={c.id}>
              <NavLink to={`/mensajes/${c.id}`}>
                <Avatar usuario={c.otroUsuario} />
                <span className="resumen">
                  <strong>{nombreCompleto(c.otroUsuario)}</strong>
                  <span className="suave">
                    {c.ultimoMensaje
                      ? `${c.ultimoMensaje.remitenteId === usuario.id ? 'Tú: ' : ''}${c.ultimoMensaje.contenido ?? '🖼️ Imagen'}`
                      : 'Sin mensajes'}
                  </span>
                </span>
                {c.noLeidos > 0 && <span className="insignia">{c.noLeidos}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-panel">
        {actual ? (
          <PanelChat key={actual.id} conversacion={actual} alLeer={marcarLeida} />
        ) : (
          <p className="vacio">
            {conversacionId && datos
              ? 'No se encontró esta conversación.'
              : 'Elige una conversación para empezar.'}
          </p>
        )}
      </section>
    </div>
  );
}
