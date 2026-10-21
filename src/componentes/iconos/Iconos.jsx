/** Iconos de línea de la app (24 × 24, usan currentColor). */

function Icono({ children, tamano = 20, relleno = false, className = '' }) {
  return (
    <svg
      className={`icono ${className}`}
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill={relleno ? 'currentColor' : 'none'}
      stroke={relleno ? 'none' : 'currentColor'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconoMeGusta = (p) => (
  <Icono {...p}>
    <path d="M7 10.5v10H4.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 10.5l4-7.2c1-.9 2.9-.4 2.9 1.4v4.3h5.3c1.3 0 2.3 1.2 2 2.5l-1.8 7.3a2.2 2.2 0 0 1-2.1 1.7H7" />
  </Icono>
);

export const IconoComentario = (p) => (
  <Icono {...p}>
    <path d="M20.5 11.6c0 4.2-3.8 7.6-8.5 7.6-1.1 0-2.1-.2-3.1-.5L4 20.5l1.4-3.9A7.2 7.2 0 0 1 3.5 11.6C3.5 7.4 7.3 4 12 4s8.5 3.4 8.5 7.6z" />
  </Icono>
);

export const IconoMas = (p) => (
  <Icono {...p} relleno>
    <circle cx="5.5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="18.5" cy="12" r="1.8" />
  </Icono>
);

export const IconoCerrar = (p) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icono>
);

export const IconoAnterior = (p) => (
  <Icono {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icono>
);

export const IconoSiguiente = (p) => (
  <Icono {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icono>
);

export const IconoEnviar = (p) => (
  <Icono {...p}>
    <path d="M4 12l16-8-6 16-2.6-6.4zM11.4 13.6L20 4" />
  </Icono>
);

export const IconoEditar = (p) => (
  <Icono {...p}>
    <path d="M14.5 5.5l4 4M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19z" />
  </Icono>
);

export const IconoBorrar = (p) => (
  <Icono {...p}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7M10.3 11v6M13.7 11v6" />
  </Icono>
);

export const IconoImagen = (p) => (
  <Icono {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M20.5 16l-4.8-4.8L6 19.5" />
  </Icono>
);

export const IconoMundo = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
  </Icono>
);

export const IconoAmigos = (p) => (
  <Icono {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.6 14.6c1.8.7 3 2.4 3.4 4.9" />
  </Icono>
);

export const IconoCandado = (p) => (
  <Icono {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
    <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
  </Icono>
);

export const IconoBuscar = (p) => (
  <Icono {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L20 20" />
  </Icono>
);

export const IconoMenu = (p) => (
  <Icono {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icono>
);

export const IconoCrear = (p) => (
  <Icono {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);

export const IconoInicio = (p) => (
  <Icono {...p}>
    <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z" />
  </Icono>
);

export const IconoAjustes = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.5 7.5 0 0 0 2.6-1.5l2.3.9 2-3.4z" />
  </Icono>
);

export const IconoSalir = (p) => (
  <Icono {...p}>
    <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h9" />
  </Icono>
);

/** Dos bocadillos superpuestos: la lista de conversaciones */
export const IconoConversaciones = (p) => (
  <Icono {...p}>
    <path d="M15.5 9.5c0 3.3-3 6-6.6 6-.8 0-1.6-.1-2.3-.4L3 16.5l1.1-3A5.6 5.6 0 0 1 2.4 9.5c0-3.3 2.9-6 6.5-6s6.6 2.7 6.6 6z" />
    <path d="M18.3 8.6a5.5 5.5 0 0 1 3.3 4.9 5.5 5.5 0 0 1-1.7 3.9l1.1 3-3.6-1.4c-.7.2-1.5.4-2.3.4-2 0-3.8-.8-5-2.1" />
  </Icono>
);

export const IconoCheck = (p) => (
  <Icono {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icono>
);

/** Icono de cada visibilidad de publicación (mismos valores que VISIBILIDADES). */
export const ICONOS_VISIBILIDAD = {
  publico: IconoMundo,
  amigos: IconoAmigos,
  privado: IconoCandado,
};
