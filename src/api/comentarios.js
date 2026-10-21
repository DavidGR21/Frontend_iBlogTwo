import { LIMITE_PAGINA } from '../config.js';
import { api, consulta } from './cliente.js';

export const listarComentarios = (publicacionId, antesDe, limite = LIMITE_PAGINA) =>
  api.get(`/comentarios${consulta({ publicacionId, antesDe, limite })}`);

export const listarRespuestas = (comentarioId) =>
  api.get(`/comentarios/${comentarioId}/respuestas`);
export const crearComentario = (datos) => api.post('/comentarios', datos);
export const editarComentario = (id, contenido) => api.patch(`/comentarios/${id}`, { contenido });
export const eliminarComentario = (id) => api.delete(`/comentarios/${id}`);
