import { api } from './cliente.js';

export const registrar = (datos) => api.post('/auth/registro', datos);
export const verificarCorreo = (token) => api.post('/auth/verificar-correo', { token });
export const reenviarVerificacion = (correo) => api.post('/auth/reenviar-verificacion', { correo });
/** `identificador` es el nombre de usuario o el correo. */
export const iniciarSesion = (identificador, clave) =>
  api.post('/auth/login', { identificador, clave });
export const cerrarSesion = () => api.post('/auth/logout');
export const olvideClave = (correo) => api.post('/auth/olvide-clave', { correo });
export const restablecerClave = (token, clave) =>
  api.post('/auth/restablecer-clave', { token, clave });
