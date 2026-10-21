/**
 * Pantalla compartida por el login, el registro y la recuperación de contraseña: la mascota
 * 3D a la izquierda y el formulario (Outlet) a la derecha, sobre un muro. Al cambiar entre
 * ellos la escena no se reinicia; solo se "repinta" el formulario con la transición de grafiti.
 */
import { lazy, Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '../../componentes/Logo.jsx';
import { Salpicaduras } from '../../componentes/auth/Salpicaduras.jsx';
import { TransicionGrafiti } from '../../componentes/auth/TransicionGrafiti.jsx';
import { IconoOjo, IconoOjoTachado } from '../../componentes/iconos/Iconos.jsx';
import '../../estilos/auth.css';

// Three.js solo se descarga para esta pantalla
const Mascota3D = lazy(() =>
  import('../../componentes/auth/Mascota3D.jsx').then((m) => ({ default: m.Mascota3D })),
);

const SALUDOS = {
  login: '¡Hey, qué tal!',
  registro: '¡Únete al crew!',
  olvide: '¡Tranqui, le pasa a cualquiera!',
  restablecer: '¡Ahora una que no se te olvide!',
};
const MODOS = [
  ['/registro', 'registro'],
  ['/olvide-clave', 'olvide'],
  ['/restablecer-clave', 'restablecer'],
];
const REACCIONES = {
  clave: { texto: '¡No miro, lo prometo!', Icono: IconoOjoTachado },
  espiando: { texto: 'Bueno… solo un poquito', Icono: IconoOjo },
};

export function PantallaAuth() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const modo = MODOS.find(([ruta]) => pathname.startsWith(ruta))?.[1] ?? 'login';

  const transicion = useRef(null);
  const hoja = useRef(null);
  const ocupado = useRef(false);
  const [foco, setFoco] = useState(null);
  // La burbuja no sale hasta que la paloma ha aterrizado
  const [mascotaLista, setMascotaLista] = useState(false);
  const alAparecer = useCallback(() => setMascotaLista(true), []);

  const cambiarModo = useCallback(
    async (destino) => {
      if (ocupado.current || destino === pathname) return;
      ocupado.current = true;
      const cubierto = await transicion.current?.cubrir();
      if (cubierto) navegar(destino);
      else ocupado.current = false;
    },
    [navegar, pathname],
  );

  // Cada formulario nuevo (también el primero) aparece pintado con spray.
  // En layout effect para tapar el formulario antes de que el navegador lo muestre.
  useLayoutEffect(() => {
    let vigente = true;
    transicion.current?.revelar().then((terminado) => {
      if (!vigente || !terminado) return;
      ocupado.current = false;
    });
    return () => {
      vigente = false;
    };
  }, [pathname]);

  // Qué campo tiene el foco, para la burbuja de la mascota
  const revisarFoco = useCallback(() => {
    requestAnimationFrame(() => {
      const activo = document.activeElement;
      if (activo?.dataset && 'secreto' in activo.dataset) {
        setFoco(activo.type === 'text' ? 'espiando' : 'clave');
      } else {
        setFoco(null);
      }
    });
  }, []);

  const reaccion = REACCIONES[foco];
  const mensaje = reaccion?.texto ?? SALUDOS[modo];

  return (
    <div className="auth">
      <svg className="auth-filtros" aria-hidden="true">
        <filter id="grafiti-rugoso">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" />
          <feDisplacementMap
            in="SourceGraphic"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <section className="auth-escena">
        <div className="auth-concreto" />
        <Salpicaduras />
        <Suspense fallback={null}>
          <Mascota3D alAparecer={alAparecer} />
        </Suspense>
        <Link to="/login" className="auth-marca" aria-label="iBlogTwo">
          <Logo />
        </Link>
        {mascotaLista && (
          <p key={mensaje} className="auth-burbuja" aria-hidden="true">
            {mensaje}
            {reaccion && (
              <>
                {' '}
                <reaccion.Icono tamano={18} className="icono-en-linea" />
              </>
            )}
          </p>
        )}
      </section>

      <section
        className="auth-muro"
        onFocus={revisarFoco}
        onBlur={revisarFoco}
        onClick={revisarFoco}
      >
        <div className="auth-muro-scroll">
          <div ref={hoja} className={`auth-hoja auth-hoja-${modo}`}>
            <Outlet context={{ cambiarModo }} />
          </div>
        </div>
        <TransicionGrafiti ref={transicion} objetivo={hoja} />
      </section>
    </div>
  );
}
