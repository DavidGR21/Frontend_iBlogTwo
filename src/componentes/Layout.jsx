/**
 * Estructura común: barra superior + página actual.
 * También escucha los eventos globales (solicitudes de amistad, mensajes)
 * para avisar al usuario esté donde esté.
 */
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAvisos } from '../hooks/useAvisos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';
import { nombreCompleto } from '../utils/formato.js';
import { Avatar } from './Avatar.jsx';

export function Layout() {
  const { usuario, conectado, cerrarSesion } = useSesion();
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const { pathname } = useLocation();

  useEventoSocket(EVENTOS.AMISTAD_SOLICITUD, (solicitud) => {
    avisar(`👋 ${nombreCompleto(solicitud.usuario)} te envió una solicitud de amistad`);
  });

  useEventoSocket(EVENTOS.AMISTAD_ACEPTADA, (amistad) => {
    avisar(`🤝 ${nombreCompleto(amistad.usuario)} aceptó tu solicitud`);
  });

  useEventoSocket(EVENTOS.MENSAJE_NUEVO, (mensaje) => {
    if (mensaje.remitenteId !== usuario?.id && !pathname.startsWith('/mensajes')) {
      avisar('💬 Tienes un mensaje nuevo');
    }
  });

  async function salir() {
    await cerrarSesion();
    navegar('/login');
  }

  return (
    <>
      <header className="barra">
        <div className="barra-contenido">
          <Link to="/" className="marca">
            iBlog
          </Link>

          {usuario ? (
            <nav className="navegacion">
              <NavLink to="/" end>
                Inicio
              </NavLink>
              <NavLink to="/amigos">Amigos</NavLink>
              <NavLink to="/mensajes">Mensajes</NavLink>
              <NavLink to={`/u/${usuario.nombreUsuario}`} className="nav-perfil">
                <Avatar usuario={usuario} tamano={28} />
                <span
                  className={`punto ${conectado ? 'punto-on' : 'punto-off'}`}
                  title={conectado ? 'Tiempo real conectado' : 'Tiempo real desconectado'}
                />
              </NavLink>
              <NavLink to="/ajustes">Ajustes</NavLink>
              <button className="boton-enlace" onClick={salir}>
                Salir
              </button>
            </nav>
          ) : (
            <nav className="navegacion">
              <NavLink to="/login">Ingresar</NavLink>
              <NavLink to="/registro">Crear cuenta</NavLink>
            </nav>
          )}
        </div>
      </header>

      <main className={`contenido ${pathname.startsWith('/mensajes') ? 'contenido-ancho' : ''}`}>
        <Outlet />
      </main>
    </>
  );
}
