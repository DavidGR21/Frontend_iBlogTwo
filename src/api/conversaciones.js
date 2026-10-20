/** Consultas HTTP del chat. El ENVÍO de mensajes va por Socket.io (ver paginas/Mensajes.jsx). */
import { LIMITE_PAGINA } from '../config.js';
import { api, consulta } from './cliente.js';

export const listarConversaciones = () => api.get('/conversaciones');
export const abrirConversacion = (amigoId) => api.post('/conversaciones', { amigoId });
export const listarMensajes = (conversacionId, antesDe) =>
  api.get(
    `/conversaciones/${conversacionId}/mensajes${consulta({ antesDe, limite: LIMITE_PAGINA })}`,
  );
