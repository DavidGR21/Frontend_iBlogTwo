/** Amigos, solicitudes recibidas y enviadas, y el mismo buscador de personas del inicio. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  aceptarSolicitud,
  eliminarAmistad,
  listarAmigos,
  listarSolicitudes,
} from '../api/amistades.js';
import { abrirConversacion } from '../api/conversaciones.js';
import { Avatar } from '../componentes/Avatar.jsx';
import { Cargando } from '../componentes/Cargando.jsx';
import {
  IconoBorrar,
  IconoCerrar,
  IconoCheck,
  IconoComentario,
} from '../componentes/iconos/Iconos.jsx';
import { BuscadorPersonas } from '../componentes/inicio/BuscadorPersonas.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { useAvisos } from '../hooks/useAvisos.js';
import { useConfirmar } from '../hooks/useConfirmar.js';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import { EVENTOS } from '../sockets/eventos.js';
import { haceCuanto, nombreCompleto } from '../utils/formato.js';

const PESTANAS = [
  { valor: 'amigos', nombre: 'Mis amigos' },
  { valor: 'recibidas', nombre: 'Solicitudes recibidas' },
  { valor: 'enviadas', nombre: 'Solicitudes enviadas' },
];

export function Amigos() {
  const { avisar } = useAvisos();
  const confirmar = useConfirmar();
  const navegar = useNavigate();
  const { recargar: recargarContadores } = useNotificaciones();
  const [pestana, setPestana] = useState('amigos');

  const { datos, cargando, error, recargar, setDatos } = useDatos(
    () => (pestana === 'amigos' ? listarAmigos() : listarSolicitudes(pestana)),
    pestana,
  );

  useEventoSocket(EVENTOS.AMISTAD_SOLICITUD, () => {
    if (pestana === 'recibidas') recargar();
  });
  useEventoSocket(EVENTOS.AMISTAD_ACEPTADA, () => {
    if (pestana !== 'recibidas') recargar();
  });

  const quitarDeLista = (id) =>
    setDatos((d) => ({ ...d, items: d.items.filter((item) => item.id !== id) }));

  async function ejecutar(accion, mensaje) {
    try {
      await accion();
      if (mensaje) avisar(mensaje);
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  const aceptar = (item) =>
    ejecutar(
      async () => {
        await aceptarSolicitud(item.id);
        quitarDeLista(item.id);
        recargarContadores();
      },
      `Ahora eres amigo de ${nombreCompleto(item.usuario)}`,
    );

  // `pregunta`: opciones de la ventana de confirmación (null = sin preguntar)
  const eliminar = async (item, pregunta, mensaje) => {
    if (pregunta && !(await confirmar(pregunta))) return;
    ejecutar(async () => {
      await eliminarAmistad(item.id);
      quitarDeLista(item.id);
      if (pestana === 'recibidas') recargarContadores();
    }, mensaje);
  };

  const escribir = (item) =>
    ejecutar(async () => {
      const conversacion = await abrirConversacion(item.usuario.id);
      navegar(`/mensajes/${conversacion.id}`);
    });

  const vacio = {
    amigos: 'Todavía no tienes amigos. ¡Búscalos arriba!',
    recibidas: 'No tienes solicitudes pendientes.',
    enviadas: 'No has enviado solicitudes.',
  }[pestana];

  return (
    <>
      <BuscadorPersonas className="amigos-buscador" />

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.valor}
            role="tab"
            aria-selected={pestana === p.valor}
            className={pestana === p.valor ? 'activa' : ''}
            onClick={() => setPestana(p.valor)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <section className="tarjeta lista-amigos">
        {cargando && <Cargando />}
        <MensajeError error={error} alReintentar={recargar} />
        {!cargando && datos?.items.length === 0 && <p className="vacio">{vacio}</p>}

        {!cargando && datos?.items.length > 0 && (
          <ul className="lista-personas">
            {datos.items.map((item) => (
              <li key={item.id} className="persona">
                <Link to={`/u/${item.usuario.nombreUsuario}`} className="autor persona-info">
                  <Avatar usuario={item.usuario} tamano={48} />
                  <span>
                    <strong>{item.usuario.nombreUsuario}</strong>
                    <span className="suave">
                      {nombreCompleto(item.usuario)}
                      {(item.desde ?? item.creadaEn) &&
                        ` · ${haceCuanto(item.desde ?? item.creadaEn)}`}
                    </span>
                  </span>
                </Link>

                <div className="persona-acciones">
                  {pestana === 'amigos' && (
                    <>
                      <button className="accion accion-principal" onClick={() => escribir(item)}>
                        <IconoComentario tamano={18} />
                        <span>Mensaje</span>
                      </button>
                      <button
                        className="accion accion-peligro"
                        onClick={() =>
                          eliminar(
                            item,
                            {
                              titulo: '¿Eliminar amigo?',
                              mensaje: `${item.usuario.nombreUsuario} dejará de estar en tu lista de amigos. Podrás volver a enviarle una solicitud.`,
                              confirmar: 'Eliminar',
                            },
                            'Amigo eliminado',
                          )
                        }
                      >
                        <IconoBorrar tamano={18} />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                  {pestana === 'recibidas' && (
                    <>
                      <button className="accion accion-principal" onClick={() => aceptar(item)}>
                        <IconoCheck tamano={18} />
                        <span>Aceptar</span>
                      </button>
                      <button
                        className="accion"
                        onClick={() => eliminar(item, null, 'Solicitud rechazada')}
                      >
                        <IconoCerrar tamano={18} />
                        <span>Rechazar</span>
                      </button>
                    </>
                  )}
                  {pestana === 'enviadas' && (
                    <button
                      className="accion"
                      onClick={() => eliminar(item, null, 'Solicitud cancelada')}
                    >
                      <IconoCerrar tamano={18} />
                      <span>Cancelar solicitud</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
