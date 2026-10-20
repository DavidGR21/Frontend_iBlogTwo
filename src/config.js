/** Configuración central. Ningún otro archivo lee import.meta.env directamente. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const LIMITE_PAGINA = 20;
export const MAX_IMAGENES_POST = 10;
export const MAX_TAMANO_IMAGEN = 10 * 1024 * 1024; // 10 MB, igual que la BD
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Igual que el enum tipo_reaccion de la base de datos. */
export const REACCIONES = [
  { tipo: 'me_gusta', emoji: '👍', nombre: 'Me gusta' },
  { tipo: 'me_encanta', emoji: '❤️', nombre: 'Me encanta' },
  { tipo: 'me_divierte', emoji: '😂', nombre: 'Me divierte' },
  { tipo: 'me_asombra', emoji: '😮', nombre: 'Me asombra' },
  { tipo: 'me_entristece', emoji: '😢', nombre: 'Me entristece' },
  { tipo: 'me_enoja', emoji: '😡', nombre: 'Me enoja' },
  { tipo: 'me_disgusta', emoji: '👎', nombre: 'Me disgusta' },
];

export const VISIBILIDADES = [
  { valor: 'publico', nombre: '🌎 Público' },
  { valor: 'amigos', nombre: '👥 Amigos' },
  { valor: 'privado', nombre: '🔒 Solo yo' },
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
