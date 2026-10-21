/**
 * Mensajería: lista de conversaciones (con buscador) a la izquierda y chat abierto a la
 * derecha. La lista se reordena en vivo cuando llega un mensaje nuevo.
 * En el celular la lista es un panel desplegable que se abre con el icono de conversaciones
 * y se oculta al elegir una.
 */
import { useCallback, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router';
import { listarConversaciones } from '../api/conversaciones.js';
import { Avatar } from '../componentes/Avatar.jsx';
import { Cargando } from '../componentes/Cargando.jsx';
import {
  IconoBuscar,
  IconoCerrar,
  IconoConversaciones,
  IconoImagen,
} from '../componentes/iconos/Iconos.jsx';
import { PanelChat } from '../componentes/mensajes/PanelChat.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';
import { nombreCompleto } from '../utils/formato.js';

export function Mensajes() {
  const { conversacionId } = useParams();
  const { usuario } = useSesion();
  const { fijarMensajesSinLeer } = useNotificaciones();
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

  // Celular: la lista es un panel que se abre con el botón de conversaciones.
  // Sin conversación elegida empieza abierta; al elegir una se cierra y queda el chat.
  const [listaAbierta, setListaAbierta] = useState(!conversacionId);
  const [filtro, setFiltro] = useState('');
  const termino = filtro.trim().toLowerCase();
  const visibles = termino
    ? conversaciones.filter(
        (c) =>
          c.otroUsuario.nombreUsuario.toLowerCase().includes(termino) ||
          nombreCompleto(c.otroUsuario).toLowerCase().includes(termino),
      )
    : conversaciones;
  const totalSinLeer = conversaciones.reduce((suma, c) => suma + (c.noLeidos ?? 0), 0);

  // Esta página lleva la cuenta exacta: el contador de la barra la sigue.
  useEffect(() => {
    if (datos) fijarMensajesSinLeer(totalSinLeer);
  }, [datos, totalSinLeer, fijarMensajesSinLeer]);

  return (
    <div className={`chat ${listaAbierta ? 'chat-lista-abierta' : ''}`}>
      <aside className="chat-lista" id="lista-conversaciones" aria-label="Conversaciones">
        <div className="chat-cabecera chat-lista-cabecera">
          <strong>
            <IconoConversaciones tamano={20} />
            Conversaciones
          </strong>
          {actual && (
            <button
              type="button"
              className="chat-lista-cerrar"
              onClick={() => setListaAbierta(false)}
              aria-label="Volver al chat"
            >
              <IconoCerrar tamano={20} />
            </button>
          )}
        </div>
        <div className="chat-buscar">
          <IconoBuscar tamano={17} />
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar conversación…"
            aria-label="Buscar conversación"
          />
        </div>
        {cargando && !datos && <Cargando />}
        <MensajeError error={error} alReintentar={recargar} />
        {datos && conversaciones.length === 0 && (
          <p className="vacio">
            Aún no tienes conversaciones. Escríbele a un amigo desde "Amigos".
          </p>
        )}
        {termino && visibles.length === 0 && conversaciones.length > 0 && (
          <p className="vacio">Ninguna conversación coincide con "{filtro.trim()}".</p>
        )}
        <ul>
          {visibles.map((c) => (
            <li key={c.id}>
              <NavLink to={`/mensajes/${c.id}`} onClick={() => setListaAbierta(false)}>
                <Avatar usuario={c.otroUsuario} />
                <span className="resumen">
                  <strong>{c.otroUsuario.nombreUsuario}</strong>
                  <span className="suave">
                    {c.ultimoMensaje ? (
                      <>
                        {c.ultimoMensaje.remitenteId === usuario.id && 'Tú: '}
                        {c.ultimoMensaje.contenido ?? (
                          <span className="con-icono">
                            <IconoImagen tamano={15} /> Imagen
                          </span>
                        )}
                      </>
                    ) : (
                      'Sin mensajes'
                    )}
                  </span>
                </span>
                {c.noLeidos > 0 && <span className="insignia">{c.noLeidos}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-panel">
        {/* Solo en el celular: abre la lista de conversaciones */}
        <button
          type="button"
          className="chat-abrir-lista"
          onClick={() => setListaAbierta(true)}
          aria-label="Ver conversaciones"
          aria-controls="lista-conversaciones"
          aria-expanded={listaAbierta}
        >
          <IconoConversaciones tamano={22} />
          {totalSinLeer > 0 && <span className="insignia">{totalSinLeer}</span>}
        </button>

        {actual ? (
          <PanelChat key={actual.id} conversacion={actual} alLeer={marcarLeida} />
        ) : (
          <p className="vacio chat-vacio">
            {conversacionId && datos
              ? 'No se encontró esta conversación.'
              : 'Elige una conversación para empezar.'}
          </p>
        )}
      </section>
    </div>
  );
}
