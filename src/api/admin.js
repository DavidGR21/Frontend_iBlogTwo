/** Panel de administración (solo cuentas con rol admin). Ver docs/API.md → Admin. */
import { LIMITE_PAGINA } from '../config.js';
import { api, consulta } from './cliente.js';

export const obtenerEstadisticas = () => api.get('/admin/estadisticas');

export const listarUsuarios = ({ buscar, filtro }, antesDe) =>
  api.get(`/admin/usuarios${consulta({ buscar, filtro, antesDe, limite: LIMITE_PAGINA })}`);

export const obtenerUsuario = (id) => api.get(`/admin/usuarios/${id}`);
export const suspenderUsuario = (id, { motivo, borrarContenido }) =>
  api.post(`/admin/usuarios/${id}/suspender`, { motivo, borrarContenido });
export const reactivarUsuario = (id) => api.post(`/admin/usuarios/${id}/reactivar`);
export const verificarCorreoUsuario = (id) => api.post(`/admin/usuarios/${id}/verificar-correo`);
export const cerrarSesionesUsuario = (id) => api.post(`/admin/usuarios/${id}/cerrar-sesiones`);
export const quitarFotoUsuario = (id) => api.delete(`/admin/usuarios/${id}/foto`);
export const borrarContenidoUsuario = (id) => api.delete(`/admin/usuarios/${id}/contenido`);

export const listarPublicaciones = ({ buscar, autorId, estado }, antesDe) =>
  api.get(
    `/admin/publicaciones${consulta({ buscar, autorId, estado, antesDe, limite: LIMITE_PAGINA })}`,
  );
export const eliminarPublicacion = (id) => api.delete(`/admin/publicaciones/${id}`);

export const listarComentarios = ({ buscar, autorId, estado }, antesDe) =>
  api.get(
    `/admin/comentarios${consulta({ buscar, autorId, estado, antesDe, limite: LIMITE_PAGINA })}`,
  );
export const eliminarComentario = (id) => api.delete(`/admin/comentarios/${id}`);

export const listarRegistro = (antesDe) =>
  api.get(`/admin/registro${consulta({ antesDe, limite: LIMITE_PAGINA })}`);

export const limpiarArchivos = () => api.post('/admin/mantenimiento/limpiar-archivos');
