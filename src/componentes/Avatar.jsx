import { useState } from 'react';
import { nombreCompleto } from '../utils/formato.js';
import { VisorImagenes } from './publicaciones/VisorImagenes.jsx';

/** Iniciales (máximo 2) del nombre: "Ana Pérez" → "AP". */
function obtenerIniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

/** Imagen SVG grande con las iniciales, con el mismo degradado que .avatar-iniciales. */
function imagenIniciales(iniciales) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b14bff"/><stop offset="1" stop-color="#ff3dd8"/>
    </linearGradient></defs>
    <circle cx="256" cy="256" r="256" fill="url(#g)"/>
    <text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#fff"
      font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="200"
      font-weight="700">${iniciales}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Foto de perfil, o las iniciales si no tiene.
 * Con `ampliable`, al pulsarla se abre en grande en el mismo visor de las publicaciones
 * (si no hay foto, se amplían las iniciales).
 */
export function Avatar({ usuario, tamano = 40, ampliable = false }) {
  const [ampliada, setAmpliada] = useState(false);
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.4 };
  const nombre = nombreCompleto(usuario) ?? '?';
  const iniciales = obtenerIniciales(nombre);
  const foto = usuario?.fotoPerfilUrl;

  const avatar = foto ? (
    <img className="avatar" src={foto} alt={nombre} style={estilo} />
  ) : (
    <span className="avatar avatar-iniciales" style={estilo} aria-label={nombre}>
      {iniciales}
    </span>
  );
  if (!ampliable) return avatar;

  return (
    <>
      <button
        type="button"
        className="avatar-ampliable"
        onClick={() => setAmpliada(true)}
        aria-label={`Ver la foto de perfil de ${nombre}`}
      >
        {avatar}
      </button>
      {ampliada && (
        <VisorImagenes
          imagenes={[
            {
              id: 'foto-perfil',
              url: foto ?? imagenIniciales(iniciales),
              descripcion: `Foto de perfil de ${nombre}`,
            },
          ]}
          alCerrar={() => setAmpliada(false)}
        />
      )}
    </>
  );
}
