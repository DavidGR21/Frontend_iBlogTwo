import { api } from './cliente.js';

export const obtenerYo = () => api.get('/usuarios/yo');
export const actualizarPerfil = (datos) => api.patch('/usuarios/yo/perfil', datos);
export const obtenerPerfil = (nombreUsuario) =>
  api.get(`/usuarios/${encodeURIComponent(nombreUsuario)}`);
