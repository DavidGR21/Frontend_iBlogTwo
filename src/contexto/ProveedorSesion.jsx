/**
 * Estado de la sesión para toda la app:
 *  - usuario con sesión (o null) y si todavía se está comprobando
 *  - la conexión de Socket.io (solo existe mientras hay sesión)
 *  - acciones iniciarSesion / cerrarSesion / actualizarUsuario
 *
 * Al abrir la app intenta recuperar la sesión con la cookie del refresh token y,
 * si no está, con el estado de sesión de 1 día guardado en el navegador.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import {
  alCambiarSesion,
  establecerToken,
  guardarEstadoSesion,
  renovarSesion,
} from '../api/cliente.js';
import { crearSocket } from '../sockets/socket.js';
import { SesionContexto } from './contextos.js';

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [comprobando, setComprobando] = useState(true);
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);

  // 1. Recuperar la sesión al cargar y escuchar renovaciones/expiraciones.
  useEffect(() => {
    alCambiarSesion(setUsuario);
    renovarSesion().finally(() => setComprobando(false));
    return () => alCambiarSesion(null);
  }, []);

  // 2. Conectar el socket mientras haya un usuario con sesión.
  const usuarioId = usuario?.id;
  useEffect(() => {
    if (!usuarioId) return undefined;

    const nuevo = crearSocket();
    // Se publica el socket al conectarse: así los componentes se suscriben a uno ya listo.
    nuevo.on('connect', () => {
      setSocket(nuevo);
      setConectado(true);
    });
    nuevo.on('disconnect', () => setConectado(false));
    nuevo.on('connect_error', async (error) => {
      // Token expirado: se renueva y se reintenta (la función auth toma el token nuevo).
      if (error.message === 'NO_AUTENTICADO' && (await renovarSesion())) nuevo.connect();
    });

    return () => {
      nuevo.disconnect();
      setSocket(null);
      setConectado(false);
    };
  }, [usuarioId]);

  const iniciarSesion = useCallback(async (identificador, clave) => {
    const datos = await authApi.iniciarSesion(identificador, clave);
    establecerToken(datos.tokenAcceso);
    guardarEstadoSesion(datos.tokenSesion);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.cerrarSesion();
    } catch {
      // Aunque falle el servidor, la sesión local se cierra igual.
    } finally {
      establecerToken(null);
      guardarEstadoSesion(null);
      setUsuario(null);
    }
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      comprobando,
      socket,
      conectado,
      iniciarSesion,
      cerrarSesion,
      actualizarUsuario: setUsuario,
    }),
    [usuario, comprobando, socket, conectado, iniciarSesion, cerrarSesion],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}
