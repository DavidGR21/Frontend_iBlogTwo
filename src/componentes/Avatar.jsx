import { nombreCompleto } from '../utils/formato.js';

/** Foto de perfil, o las iniciales si no tiene. */
export function Avatar({ usuario, tamano = 40 }) {
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.4 };
  const nombre = nombreCompleto(usuario) ?? '?';

  if (usuario?.fotoPerfilUrl) {
    return <img className="avatar" src={usuario.fotoPerfilUrl} alt={nombre} style={estilo} />;
  }

  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <span className="avatar avatar-iniciales" style={estilo} aria-label={nombre}>
      {iniciales}
    </span>
  );
}
