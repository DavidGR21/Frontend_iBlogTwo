/** Amigos, solicitudes recibidas y enviadas, y buscador por nombre de usuario. */
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
import { MensajeError } from '../componentes/MensajeError.jsx';
import { useAvisos } from '../hooks/useAvisos.js';
import { useDatos } from '../hooks/useDatos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { EVENTOS } from '../sockets/eventos.js';
import { haceCuanto, nombreCompleto } from '../utils/formato.js';

const PESTANAS = [
  { valor: 'amigos', nombre: 'Mis amigos' },
  { valor: 'recibidas', nombre: 'Solicitudes recibidas' },
  { valor: 'enviadas', nombre: 'Solicitudes enviadas' },
];

export function Amigos() {
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const [pestana, setPestana] = useState('amigos');
  const [busqueda, setBusqueda] = useState('');

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
      },
      `Ahora eres amigo de ${nombreCompleto(item.usuario)}`,
    );

  const eliminar = (item, pregunta, mensaje) => {
    if (pregunta && !window.confirm(pregunta)) return;
    ejecutar(async () => {
      await eliminarAmistad(item.id);
      quitarDeLista(item.id);
    }, mensaje);
  };

  const escribir = (item) =>
    ejecutar(async () => {
      const conversacion = await abrirConversacion(item.usuario.id);
      navegar(`/mensajes/${conversacion.id}`);
    });

  function buscar(evento) {
    evento.preventDefault();
    const nombre = busqueda.trim().replace(/^@/, '');
    if (nombre) navegar(`/u/${nombre}`);
  }

  return (
    <>
      <form className="tarjeta fila" onSubmit={buscar}>
        <input
          placeholder="Buscar por nombre de usuario, ej. @david"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="boton">Buscar</button>
      </form>

      <div className="pestanas">
        {PESTANAS.map((p) => (
          <button
            key={p.valor}
            className={pestana === p.valor ? 'activa' : ''}
            onClick={() => setPestana(p.valor)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <section className="tarjeta">
        {cargando && <Cargando />}
        <MensajeError error={error} alReintentar={recargar} />
        {!cargando && datos?.items.length === 0 && <p className="vacio">No hay nada por aquí.</p>}

        {!cargando && datos?.items.length > 0 && (
          <ul className="lista-personas">
            {datos.items.map((item) => (
              <li key={item.id}>
                <Link to={`/u/${item.usuario.nombreUsuario}`} className="autor">
                  <Avatar usuario={item.usuario} />
                  <span>
                    <strong>{nombreCompleto(item.usuario)}</strong>
                    <span className="suave">
                      @{item.usuario.nombreUsuario}
                      {(item.desde ?? item.creadaEn) &&
                        ` · ${haceCuanto(item.desde ?? item.creadaEn)}`}
                    </span>
                  </span>
                </Link>

                <div className="fila">
                  {pestana === 'amigos' && (
                    <>
                      <button className="boton" onClick={() => escribir(item)}>
                        💬 Mensaje
                      </button>
                      <button
                        className="boton-peligro"
                        onClick={() =>
                          eliminar(
                            item,
                            `¿Eliminar a ${nombreCompleto(item.usuario)} de tus amigos?`,
                            'Amigo eliminado',
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                  {pestana === 'recibidas' && (
                    <>
                      <button className="boton" onClick={() => aceptar(item)}>
                        Aceptar
                      </button>
                      <button
                        className="boton-secundario"
                        onClick={() => eliminar(item, null, 'Solicitud rechazada')}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {pestana === 'enviadas' && (
                    <button
                      className="boton-secundario"
                      onClick={() => eliminar(item, null, 'Solicitud cancelada')}
                    >
                      Cancelar
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
