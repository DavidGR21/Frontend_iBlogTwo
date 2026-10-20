/**
 * Guardias de navegación.
 *  - RutaPrivada: solo con sesión; si no, manda al login y recuerda a dónde iba.
 *  - RutaInvitado: solo sin sesión (login, registro, olvidé mi clave); si ya hay sesión, manda al inicio.
 */
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { useSesion } from '../hooks/useSesion.js';
import { Cargando } from './Cargando.jsx';

export function RutaPrivada() {
  const { usuario, comprobando } = useSesion();
  const ubicacion = useLocation();

  if (comprobando) return <Cargando texto="Comprobando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  return <Outlet />;
}

export function RutaInvitado() {
  const { usuario, comprobando } = useSesion();
  // Reenvía el contexto del padre (p. ej. `cambiarModo` de PantallaAuth) a las rutas hijas
  const contexto = useOutletContext();

  if (comprobando) return <Cargando texto="Comprobando sesión…" />;
  if (usuario) return <Navigate to="/" replace />;
  return <Outlet context={contexto} />;
}
