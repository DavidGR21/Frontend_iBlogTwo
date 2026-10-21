/**
 * Chat abierto con una persona.
 *  - Historial por HTTP (los más recientes primero; se muestran al revés).
 *  - Envío por Socket.io con confirmación (ack): el mensaje aparece al instante
 *    como "pendiente" y se reemplaza por el real cuando el servidor lo guarda.
 *  - Indicador de "escribiendo…" y marca de leído.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { listarMensajes } from '../../api/conversaciones.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { useSesion } from '../../hooks/useSesion.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { hora } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';

const ESPERA_ACK_MS = 10_000;
const INTERVALO_ESCRIBIENDO_MS = 2_000;
const DURACION_ESCRIBIENDO_MS = 3_000;

export function PanelChat({ conversacion, alLeer }) {
  const { usuario, socket, conectado } = useSesion();
  const { avisar } = useAvisos();
  const historial = usePaginado(
    (cursor) => listarMensajes(conversacion.id, cursor),
    conversacion.id,
  );
  const { items: mensajes, setItems: setMensajes } = historial; // más recientes primero

  const [texto, setTexto] = useState('');
  const [otroEscribe, setOtroEscribe] = useState(false);
  const contenedor = useRef(null);
  const temporizadorEscribiendo = useRef(null);
  const ultimoAvisoEscribiendo = useRef(0);

  /**
   * Agrega un mensaje real. Si es mío, reemplaza a su burbuja "pendiente"
   * (el evento del socket puede llegar antes que la confirmación del envío).
   */
  const agregar = useCallback(
    (mensaje) =>
      setMensajes((lista) => {
        if (lista.some((m) => m.id === mensaje.id)) return lista;
        const pendiente = lista.findLastIndex(
          (m) =>
            m.pendiente &&
            m.remitenteId === mensaje.remitenteId &&
            m.contenido === mensaje.contenido,
        );
        const sinPendiente = pendiente === -1 ? lista : lista.filter((_, i) => i !== pendiente);
        return [mensaje, ...sinPendiente];
      }),
    [setMensajes],
  );

  useEventoSocket(EVENTOS.MENSAJE_NUEVO, (mensaje) => {
    if (mensaje.conversacionId !== conversacion.id) return;
    agregar(mensaje);
    if (mensaje.remitenteId !== usuario.id) setOtroEscribe(false);
  });

  useEventoSocket(EVENTOS.CONVERSACION_ESCRIBIENDO, ({ conversacionId, usuarioId }) => {
    if (conversacionId !== conversacion.id || usuarioId === usuario.id) return;
    setOtroEscribe(true);
    clearTimeout(temporizadorEscribiendo.current);
    temporizadorEscribiendo.current = setTimeout(
      () => setOtroEscribe(false),
      DURACION_ESCRIBIENDO_MS,
    );
  });

  useEffect(() => () => clearTimeout(temporizadorEscribiendo.current), []);

  // Marcar como leído el último mensaje recibido.
  const masReciente = mensajes[0];
  useEffect(() => {
    if (!socket || !masReciente || masReciente.pendiente || masReciente.remitenteId === usuario.id)
      return;
    socket.emit(EVENTOS.MENSAJE_LEIDO, {
      conversacionId: conversacion.id,
      mensajeId: masReciente.id,
    });
    alLeer(conversacion.id);
  }, [socket, masReciente, usuario.id, conversacion.id, alLeer]);

  // Bajar al final cuando llega un mensaje nuevo.
  const idMasReciente = masReciente?.id;
  useEffect(() => {
    const caja = contenedor.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, [idMasReciente]);

  function avisarQueEscribo(valor) {
    setTexto(valor);
    const ahora = Date.now();
    if (socket && ahora - ultimoAvisoEscribiendo.current > INTERVALO_ESCRIBIENDO_MS) {
      ultimoAvisoEscribiendo.current = ahora;
      socket.emit(EVENTOS.CONVERSACION_ESCRIBIENDO, { conversacionId: conversacion.id });
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !socket) return;

    const temporal = {
      id: `pendiente-${Date.now()}`,
      conversacionId: conversacion.id,
      remitenteId: usuario.id,
      contenido,
      creadoEn: new Date().toISOString(),
      pendiente: true,
    };
    setMensajes((lista) => [temporal, ...lista]);
    setTexto('');

    socket
      .timeout(ESPERA_ACK_MS)
      .emit(
        EVENTOS.MENSAJE_ENVIAR,
        { conversacionId: conversacion.id, contenido },
        (sinRespuesta, respuesta) => {
          if (sinRespuesta || !respuesta?.ok) {
            setMensajes((lista) => lista.filter((m) => m.id !== temporal.id));
            setTexto(contenido);
            avisar(
              sinRespuesta
                ? 'El servidor no respondió. Intenta de nuevo.'
                : `No se pudo enviar (${respuesta?.error ?? 'error'})`,
              'error',
            );
            return;
          }
          setMensajes((lista) => {
            const sinTemporal = lista.filter((m) => m.id !== temporal.id);
            return sinTemporal.some((m) => m.id === respuesta.mensaje.id)
              ? sinTemporal
              : [respuesta.mensaje, ...sinTemporal];
          });
        },
      );
  }

  const otro = conversacion.otroUsuario;

  return (
    <>
      <div className="chat-cabecera">
        <Link to={`/u/${otro.nombreUsuario}`} className="autor">
          <Avatar usuario={otro} tamano={32} />
          <strong>{otro.nombreUsuario}</strong>
        </Link>
      </div>

      <div className="chat-mensajes" ref={contenedor}>
        {historial.hayMas && !historial.cargando && (
          <button className="boton-enlace" onClick={historial.cargarMas}>
            ↑ Cargar mensajes anteriores
          </button>
        )}
        {historial.cargando && <Cargando />}
        <MensajeError error={historial.error} />

        {[...mensajes].reverse().map((m) => (
          <div
            key={m.id}
            className={`burbuja ${m.remitenteId === usuario.id ? 'burbuja-mia' : ''} ${m.pendiente ? 'burbuja-pendiente' : ''}`}
          >
            {m.imagenUrl && (
              <img src={m.imagenUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
            )}
            {m.contenido && <span className="texto-libre">{m.contenido}</span>}
            <small>{m.pendiente ? 'Enviando…' : hora(m.creadoEn)}</small>
          </div>
        ))}
      </div>

      <div className="escribiendo">{otroEscribe && `${otro.nombres} está escribiendo…`}</div>

      <form className="chat-escribir" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => avisarQueEscribo(e.target.value)}
          placeholder={conectado ? 'Escribe un mensaje…' : 'Conectando…'}
          maxLength={4000}
          disabled={!conectado}
        />
        <button className="boton" disabled={!conectado || !texto.trim()}>
          Enviar
        </button>
      </form>
    </>
  );
}
