import { api, consulta } from './cliente.js';

// El cursor de estas listas es el número de la página siguiente (lo arma el backend).
export const tendenciasStickers = (antesDe) =>
  api.get(`/stickers/tendencias${consulta({ antesDe })}`);
export const buscarStickers = (q, antesDe) =>
  api.get(`/stickers/buscar${consulta({ q, antesDe })}`);

let disponibles = null;

/** Si el backend tiene llave de KLIPY. Se pregunta una sola vez por carga de la app. */
export function stickersDisponibles() {
  disponibles ??= api
    .get('/stickers/estado')
    .then((r) => Boolean(r?.disponible))
    .catch(() => {
      disponibles = null; // se vuelve a intentar la próxima vez
      return false;
    });
  return disponibles;
}
