/**
 * Cliente HTTP único hacia el backend.
 *
 * - Agrega el token de acceso (guardado solo en memoria, nunca en localStorage).
 * - Envía cookies (credentials: 'include') para el refresh token httpOnly.
 * - Si recibe 401, renueva la sesión UNA vez y reintenta la petición.
 * - Convierte las respuestas de error del backend en ErrorApi.
 */
import { API_URL } from '../config.js';

const BASE = `${API_URL}/api/v1`;

let tokenAcceso = null;
let escuchadorSesion = null;
let renovacionEnCurso = null;

export class ErrorApi extends Error {
  constructor(estado, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles ?? [];
  }
}

export function establecerToken(token) {
  tokenAcceso = token;
}

export function obtenerToken() {
  return tokenAcceso;
}

/** El contexto de sesión se suscribe aquí para enterarse de renovaciones o expiraciones. */
export function alCambiarSesion(funcion) {
  escuchadorSesion = funcion;
}

async function pedir(ruta, { metodo = 'GET', cuerpo, reintentar = true } = {}) {
  const encabezados = {};
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (tokenAcceso) encabezados.Authorization = `Bearer ${tokenAcceso}`;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      credentials: 'include',
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(
      0,
      'SIN_CONEXION',
      'No se pudo conectar con el servidor. Si está en Render gratis puede estar despertando: espera un minuto y reintenta.',
    );
  }

  if (respuesta.status === 401 && reintentar && !ruta.startsWith('/auth/')) {
    if (await renovarSesion()) return pedir(ruta, { metodo, cuerpo, reintentar: false });
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = datos?.error;
    throw new ErrorApi(
      respuesta.status,
      error?.codigo ?? 'ERROR',
      error?.mensaje ?? `Error ${respuesta.status}`,
      error?.detalles,
    );
  }
  return datos;
}

/**
 * Pide un token nuevo usando la cookie. Si varias peticiones fallan a la vez,
 * todas esperan la MISMA renovación. Devuelve true si la sesión sigue viva.
 */
export function renovarSesion() {
  renovacionEnCurso ??= (async () => {
    try {
      const datos = await pedir('/auth/refrescar', { metodo: 'POST', reintentar: false });
      establecerToken(datos.tokenAcceso);
      escuchadorSesion?.(datos.usuario);
      return true;
    } catch {
      establecerToken(null);
      escuchadorSesion?.(null);
      return false;
    } finally {
      renovacionEnCurso = null;
    }
  })();
  return renovacionEnCurso;
}

/** Arma "?a=1&b=2" ignorando valores vacíos. */
export function consulta(parametros) {
  const limpio = Object.entries(parametros).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  return limpio.length ? `?${new URLSearchParams(limpio)}` : '';
}

export const api = {
  get: (ruta) => pedir(ruta),
  post: (ruta, cuerpo) => pedir(ruta, { metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo) => pedir(ruta, { metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo) => pedir(ruta, { metodo: 'PATCH', cuerpo }),
  delete: (ruta) => pedir(ruta, { metodo: 'DELETE' }),
};
