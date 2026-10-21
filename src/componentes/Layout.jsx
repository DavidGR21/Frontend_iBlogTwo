/**
 * Estructura común: fondo de calle animado, barra superior + página actual.
 * También escucha los eventos globales (solicitudes de amistad, mensajes)
 * para avisar al usuario esté donde esté.
 *
 * En el celular la navegación va en un menú desplegable (☰) y la barra lleva un botón "+"
 * que abre "Crear un nuevo post" en una ventana modal. Lo publicado ahí llega al inicio por
 * el contexto del Outlet (`publicacionNueva`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAvisos } from '../hooks/useAvisos.js';
import { useEventoSocket } from '../hooks/useEventoSocket.js';
import { useSesion } from '../hooks/useSesion.js';
import { EVENTOS } from '../sockets/eventos.js';
import { nombreCompleto } from '../utils/formato.js';
import { Avatar } from './Avatar.jsx';
import { FondoCalle } from './FondoCalle.jsx';
import {
  IconoAjustes,
  IconoAmigos,
  IconoCerrar,
  IconoComentario,
  IconoCrear,
  IconoInicio,
  IconoMenu,
  IconoSalir,
} from './iconos/Iconos.jsx';
import { Logo } from './Logo.jsx';
import { Modal } from './Modal.jsx';
import { FormPublicacion } from './publicaciones/FormPublicacion.jsx';
import '../estilos/app.css';

function PuntoConexion({ conectado }) {
  return (
    <span
      className={`punto ${conectado ? 'punto-on' : 'punto-off'}`}
      title={conectado ? 'Tiempo real conectado' : 'Tiempo real desconectado'}
    />
  );
}

export function Layout() {
  const { usuario, conectado, cerrarSesion } = useSesion();
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [creandoPost, setCreandoPost] = useState(false);
  const [publicacionNueva, setPublicacionNueva] = useState(null);
  const barra = useRef(null);

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

  // El menú se cierra al tocar fuera de la barra o con Esc
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const fuera = (e) => !barra.current?.contains(e.target) && setMenuAbierto(false);
    const tecla = (e) => e.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [menuAbierto]);

  async function salir() {
    await cerrarSesion();
    navegar('/login');
  }

  const limpiarPublicacionNueva = useCallback(() => setPublicacionNueva(null), []);

  function alPublicar(publicacion) {
    setCreandoPost(false);
    setPublicacionNueva(publicacion);
    if (pathname !== '/') navegar('/');
  }

  const anchoContenido =
    pathname === '/'
      ? 'contenido-inicio'
      : pathname.startsWith('/mensajes')
        ? 'contenido-ancho contenido-mensajes'
        : '';

  return (
    <div className="app">
      <FondoCalle />

      <header className={`barra ${menuAbierto ? 'barra-menu-abierto' : ''}`} ref={barra}>
        <div className="barra-contenido">
          <Link to="/" className="marca" aria-label="iBlogTwo, ir al inicio">
            <Logo />
          </Link>

          {usuario ? (
            <>
              <nav className="navegacion navegacion-principal">
                <NavLink to="/" end>
                  Inicio
                </NavLink>
                <NavLink to="/amigos">Amigos</NavLink>
                <NavLink to="/mensajes">Mensajes</NavLink>
              </nav>
              <nav className="navegacion navegacion-cuenta">
                <NavLink to={`/u/${usuario.nombreUsuario}`} className="nav-perfil">
                  <span className="nav-perfil-avatar">
                    <Avatar usuario={usuario} tamano={34} />
                    <PuntoConexion conectado={conectado} />
                  </span>
                  Mi perfil
                </NavLink>
                <NavLink to="/ajustes">Ajustes</NavLink>
                <button className="boton-enlace" onClick={salir}>
                  Cerrar sesión
                </button>
              </nav>

              {/* Solo en el celular */}
              <div className="barra-movil">
                <button
                  type="button"
                  className="barra-boton barra-crear"
                  onClick={() => {
                    setMenuAbierto(false);
                    setCreandoPost(true);
                  }}
                  aria-label="Crear un nuevo post"
                >
                  <IconoCrear tamano={22} />
                </button>
                <button
                  type="button"
                  className="barra-boton"
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                  aria-expanded={menuAbierto}
                  aria-controls="menu-movil"
                >
                  {menuAbierto ? <IconoCerrar tamano={22} /> : <IconoMenu tamano={22} />}
                </button>
              </div>
            </>
          ) : (
            <nav className="navegacion navegacion-cuenta">
              <NavLink to="/login">Ingresar</NavLink>
              <NavLink to="/registro">Crear cuenta</NavLink>
            </nav>
          )}
        </div>

        {usuario && (
          <nav
            id="menu-movil"
            className={`menu-movil ${menuAbierto ? 'abierto' : ''}`}
            aria-label="Menú"
            inert={!menuAbierto}
            // Cualquier enlace o botón del menú lo cierra
            onClick={(e) => e.target.closest('a, button') && setMenuAbierto(false)}
          >
            <NavLink to={`/u/${usuario.nombreUsuario}`} className="menu-movil-perfil">
              <span className="nav-perfil-avatar">
                <Avatar usuario={usuario} tamano={42} />
                <PuntoConexion conectado={conectado} />
              </span>
              <span>
                <strong>{usuario.nombreUsuario}</strong>
                <span className="suave">Ver mi perfil</span>
              </span>
            </NavLink>
            <NavLink to="/" end>
              <IconoInicio /> Inicio
            </NavLink>
            <NavLink to="/amigos">
              <IconoAmigos /> Amigos
            </NavLink>
            <NavLink to="/mensajes">
              <IconoComentario /> Mensajes
            </NavLink>
            <NavLink to="/ajustes">
              <IconoAjustes /> Ajustes
            </NavLink>
            <button type="button" className="menu-movil-salir" onClick={salir}>
              <IconoSalir /> Cerrar sesión
            </button>
          </nav>
        )}
      </header>

      <main className={`contenido ${anchoContenido}`}>
        <Outlet context={{ publicacionNueva, limpiarPublicacionNueva }} />
      </main>

      {creandoPost && (
        <Modal titulo="Crear un nuevo post" alCerrar={() => setCreandoPost(false)}>
          <FormPublicacion alPublicar={alPublicar} sinCabecera />
        </Modal>
      )}
    </div>
  );
}
