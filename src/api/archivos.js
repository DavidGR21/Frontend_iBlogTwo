/**
 * Subida de imágenes en 3 pasos (ver docs/API.md → Archivos):
 * pedir URL prefirmada → PUT directo al bucket → confirmar.
 */
import { MAX_TAMANO_IMAGEN, TIPOS_IMAGEN } from '../config.js';
import { api, ErrorApi } from './cliente.js';

export function validarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'Solo se permiten imágenes JPG, PNG, WEBP o GIF';
  if (archivo.size > MAX_TAMANO_IMAGEN) return 'La imagen supera los 10 MB';
  return null;
}

/** Devuelve { id, url } del archivo ya confirmado. */
export async function subirImagen(archivo, destino) {
  const problema = validarImagen(archivo);
  if (problema) throw new ErrorApi(400, 'IMAGEN_INVALIDA', problema);

  const { archivoId, urlSubida } = await api.post('/archivos/subidas', {
    tipoMime: archivo.type,
    tamanoBytes: archivo.size,
    destino,
  });

  const respuesta = await fetch(urlSubida, {
    method: 'PUT',
    headers: { 'Content-Type': archivo.type },
    body: archivo,
  }).catch(() => null);

  if (!respuesta?.ok) {
    throw new ErrorApi(
      respuesta?.status ?? 0,
      'SUBIDA_FALLIDA',
      'No se pudo subir la imagen al almacenamiento (revisa el CORS del bucket)',
    );
  }

  return api.post(`/archivos/${archivoId}/confirmar`);
}

/**
 * Borra del bucket imágenes ya subidas que al final no se usaron (p. ej. si falló crear la
 * publicación). Nunca lanza: si falla, la limpieza periódica del backend las borrará.
 */
export async function descartarImagenes(ids) {
  await Promise.all(ids.map((id) => api.delete(`/archivos/${id}`).catch(() => null)));
}
