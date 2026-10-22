import { LIMITE_PAGINA } from '../config.js';
import { api, consulta } from './cliente.js';

export const listarFeed = (antesDe) =>
  api.get(`/publicaciones${consulta({ antesDe, limite: LIMITE_PAGINA })}`);

export const listarDeUsuario = (usuarioId, antesDe) =>
  api.get(`/publicaciones/usuario/${usuarioId}${consulta({ antesDe, limite: LIMITE_PAGINA })}`);

export const obtenerPublicacion = (id) => api.get(`/publicaciones/${id}`);
export const crearPublicacion = (datos) => api.post('/publicaciones', datos);
export const editarPublicacion = (id, datos) => api.patch(`/publicaciones/${id}`, datos);
export const eliminarPublicacion = (id) => api.delete(`/publicaciones/${id}`);
export const reaccionar = (id, tipo) => api.put(`/publicaciones/${id}/reaccion`, { tipo });
export const quitarReaccion = (id) => api.delete(`/publicaciones/${id}/reaccion`);
export const listarReacciones = (id, tipo, antesDe) =>
  api.get(`/publicaciones/${id}/reacciones${consulta({ tipo, antesDe, limite: LIMITE_PAGINA })}`);
