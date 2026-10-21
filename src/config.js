/** Configuración central. Ningún otro archivo lee import.meta.env directamente. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const LIMITE_PAGINA = 20;
// Comentarios dentro de una publicación: los primeros que se muestran y cuántos más por clic
export const COMENTARIOS_INICIALES = 3;
export const COMENTARIOS_POR_CLIC = 5;
// Imágenes visibles en la cuadrícula de una publicación; la última muestra "+N"
export const IMAGENES_EN_CUADRICULA = 4;
export const MAX_IMAGENES_POST = 10;
export const MAX_TAMANO_IMAGEN = 10 * 1024 * 1024; // 10 MB, igual que la BD
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Igual que el enum tipo_reaccion de la base de datos. `color` tiñe el botón al reaccionar. */
export const REACCIONES = [
  { tipo: 'me_gusta', nombre: 'Me gusta', color: '#4ea4ff' },
  { tipo: 'me_encanta', nombre: 'Me encanta', color: '#ff5c7f' },
  { tipo: 'me_divierte', nombre: 'Me divierte', color: '#ffc93d' },
  { tipo: 'me_asombra', nombre: 'Me asombra', color: '#ffc93d' },
  { tipo: 'me_entristece', nombre: 'Me entristece', color: '#ffc93d' },
  { tipo: 'me_enoja', nombre: 'Me enoja', color: '#ff8a3d' },
  { tipo: 'me_disgusta', nombre: 'Me disgusta', color: '#a593ff' },
];

export const VISIBILIDADES = [
  { valor: 'publico', nombre: 'Público' },
  { valor: 'amigos', nombre: 'Amigos' },
  { valor: 'privado', nombre: 'Solo yo' },
];

/** Mismos países que la semilla de la tabla paises. */
export const PAISES = [
  { codigo: 'EC', nombre: 'Ecuador' },
  { codigo: 'CO', nombre: 'Colombia' },
  { codigo: 'PE', nombre: 'Perú' },
  { codigo: 'MX', nombre: 'México' },
  { codigo: 'AR', nombre: 'Argentina' },
  { codigo: 'CL', nombre: 'Chile' },
  { codigo: 'ES', nombre: 'España' },
  { codigo: 'US', nombre: 'Estados Unidos' },
];
