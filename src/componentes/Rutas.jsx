/**
 * Guardias de navegación.
 *  - RutaPrivada: solo con sesión; si no, manda al login y recuerda a dónde iba.
 *  - RutaAdmin: solo cuentas con rol admin; si no, manda al inicio.
 *  - RutaInvitado: solo sin sesión (login, registro, olvidé mi clave); si ya hay sesión, manda al inicio.
 */
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { useSesion } from '../hooks/useSesion.js';
import { Cargando } from './Cargando.jsx';

export function RutaPrivada() {
  const { usuario, comprobando } = useSesion();
  const ubicacion = useLocation();
  // Reenvía el contexto del padre (p. ej. `publicacionNueva` de Layout) a las rutas hijas
  const contexto = useOutletContext();

  if (comprobando) return <Cargando texto="Comprobando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return <Outlet context={contexto} />;
}

/** Solo administradores (va dentro de RutaPrivada). El backend lo vuelve a comprobar. */
export function RutaAdmin() {
  const { usuario } = useSesion();
  const contexto = useOutletContext();

  if (usuario?.rol !== 'admin') return <Navigate to="/" replace />;
  return <Outlet context={contexto} />;
}

export function RutaInvitado() {
  const { usuario, comprobando } = useSesion();
  // Reenvía el contexto del padre (p. ej. `cambiarModo` de PantallaAuth) a las rutas hijas
  const contexto = useOutletContext();

  if (comprobando) return <Cargando texto="Comprobando sesión…" />;
  if (usuario) return <Navigate to="/" replace />;
  return <Outlet context={contexto} />;
}
