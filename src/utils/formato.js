const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const absoluto = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

const UNIDADES = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** "hace 5 minutos", "ayer"… */
export function haceCuanto(fecha) {
  const segundos = (new Date(fecha).getTime() - Date.now()) / 1000;
  for (const [unidad, tamano] of UNIDADES) {
    if (Math.abs(segundos) >= tamano) return relativo.format(Math.round(segundos / tamano), unidad);
  }
  return 'justo ahora';
}

const soloHora = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });

/** "14:05" */
export function hora(fecha) {
  return soloHora.format(new Date(fecha));
}

export function fechaCompleta(fecha) {
  return absoluto.format(new Date(fecha));
}

export function nombreCompleto(usuario) {
  return [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(' ') || usuario?.nombreUsuario;
}
