/**
 * Guardias de navegación.
 *  - RutaPrivada: solo con sesión; si no, manda al login y recuerda a dónde iba.
 *  - RutaInvitado: solo sin sesión (login, registro); si ya hay sesión, manda al inicio.
 */
import { Navigate, Outlet, useLocation } from 'react-router';
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

  if (comprobando) return <Cargando texto="Comprobando sesión…" />;
  if (usuario) return <Navigate to="/" replace />;
  return <Outlet />;
}
