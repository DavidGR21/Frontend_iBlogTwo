/**
 * Iconos de las 7 reacciones: círculos con degradado y un símbolo o una carita, dibujados
 * en SVG (se ven igual en todos los sistemas, a diferencia de los emojis).
 * Los ids de los degradados llevan useId para que no choquen entre iconos.
 *
 * Con `animado` cada uno se mueve a su manera (pulgar que se levanta, corazón que late,
 * risa que rebota, cejas que suben, lágrima que cae, cara que se enrojece…). Las piezas
 * llevan clases `ir-*` y la animación está en app.css.
 */
import { useId } from 'react';

const TINTA = '#5a2a16';

function Carita({ id, children, de = '#ffe36e', a = '#f5b400' }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="0.4" cy="0.32" r="0.75">
          <stop offset="0" stopColor={de} />
          <stop offset="1" stopColor={a} />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} />
      {children}
    </>
  );
}

function Insignia({ id, de, a, children }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={de} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} />
      {children}
    </>
  );
}

const PULGAR =
  'M9 14.5h3.2v9H9zM13.4 23.5v-9l3.6-6.2c.8-1.4 3-.9 3 .8v3.4h3.6c1.4 0 2.4 1.3 2 2.6l-1.7 6.3c-.3 1.2-1.4 2.1-2.6 2.1z';

const DIBUJOS = {
  me_gusta: (id) => (
    <Insignia id={id} de="#5aaeff" a="#1877f2">
      <path className="ir-pulgar" d={PULGAR} fill="#fff" />
    </Insignia>
  ),
  me_encanta: (id) => (
    <Insignia id={id} de="#ff6f8f" a="#e3204d">
      <path
        className="ir-corazon"
        d="M16 24.2s-7.6-4.6-7.6-10.1a4.3 4.3 0 0 1 7.6-2.8 4.3 4.3 0 0 1 7.6 2.8c0 5.5-7.6 10.1-7.6 10.1z"
        fill="#fff"
      />
    </Insignia>
  ),
  me_divierte: (id) => (
    <Carita id={id}>
      <g className="ir-rostro">
        <g fill="none" stroke={TINTA} strokeWidth="1.8" strokeLinecap="round">
          <path d="M8.6 12.6q2.2-2.6 4.4 0M19 12.6q2.2-2.6 4.4 0" />
        </g>
        <g className="ir-boca-risa">
          <path d="M8.2 16.6h15.6q-.8 7.6-7.8 7.6t-7.8-7.6z" fill={TINTA} />
          <path d="M11.6 21.6q4.4-2.6 8.8 0q-1.6 2.6-4.4 2.6t-4.4-2.6z" fill="#ff6d7d" />
        </g>
      </g>
    </Carita>
  ),
  me_asombra: (id) => (
    <Carita id={id}>
      <g className="ir-cejas" fill="none" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round">
        <path d="M8.8 9.6q2-1.8 4.2-.8M19 8.8q2.2-1 4.2.8" />
      </g>
      <ellipse cx="11.4" cy="13.4" rx="1.7" ry="2.3" fill={TINTA} />
      <ellipse cx="20.6" cy="13.4" rx="1.7" ry="2.3" fill={TINTA} />
      <ellipse className="ir-boca-o" cx="16" cy="22" rx="3.2" ry="4" fill={TINTA} />
    </Carita>
  ),
  me_entristece: (id) => (
    <Carita id={id}>
      <g fill="none" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round">
        <path d="M9 11.2l3.8-1.6M23 11.2l-3.8-1.6M11.4 23.4q4.6-4 9.2 0" />
      </g>
      <circle cx="11.6" cy="14.4" r="1.6" fill={TINTA} />
      <circle cx="20.4" cy="14.4" r="1.6" fill={TINTA} />
      <path
        className="ir-lagrima"
        d="M10.4 17.4q1.6 2.6 1.6 3.6a1.6 1.6 0 0 1-3.2 0q0-1 1.6-3.6z"
        fill="#4cb8ff"
      />
    </Carita>
  ),
  me_enoja: (id) => (
    <Carita id={id} de="#ffb23a" a="#f0461f">
      {/* Se enrojece de arriba abajo cuando está animada */}
      <circle className="ir-rojo" cx="16" cy="16" r="15" fill="#e8251a" />
      <g className="ir-rostro">
        <g fill="none" stroke={TINTA} strokeWidth="1.9" strokeLinecap="round">
          <path d="M8.6 11l4.6 2M23.4 11l-4.6 2M12.2 22.8q3.8-2 7.6 0" />
        </g>
        <circle cx="11.8" cy="15.4" r="1.6" fill={TINTA} />
        <circle cx="20.2" cy="15.4" r="1.6" fill={TINTA} />
      </g>
    </Carita>
  ),
  me_disgusta: (id) => (
    <Insignia id={id} de="#a593ff" a="#6b4ef0">
      <g transform="rotate(180 16 16)">
        <path className="ir-pulgar" d={PULGAR} fill="#fff" />
      </g>
    </Insignia>
  ),
};

export function IconoReaccion({ tipo, tamano = 20, animado = false, className = '' }) {
  const id = useId();
  const dibujar = DIBUJOS[tipo];
  if (!dibujar) return null;
  return (
    <svg
      className={`icono-reaccion ir-${tipo} ${animado ? 'ir-animado' : ''} ${className}`}
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      aria-hidden="true"
    >
      {dibujar(id)}
    </svg>
  );
}
