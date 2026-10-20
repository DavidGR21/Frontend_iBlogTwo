import { api, consulta } from './cliente.js';

export const listarAmigos = () => api.get('/amistades');
export const listarSolicitudes = (tipo) => api.get(`/amistades/solicitudes${consulta({ tipo })}`);
export const enviarSolicitud = (destinatarioId) =>
  api.post('/amistades/solicitudes', { destinatarioId });
export const aceptarSolicitud = (id) => api.post(`/amistades/solicitudes/${id}/aceptar`);
/** Rechazar, cancelar o eliminar amigo: todo es borrar la fila de amistad. */
export const eliminarAmistad = (id) => api.delete(`/amistades/${id}`);
