/**
 * Logo de iBlogTwo: una lata de spray soltando niebla de colores + el nombre en letra de
 * grafiti. La lata sola es también el favicon (public/favicon.svg).
 */
import '../estilos/logo.css';

export function LataLogo({ className = '' }) {
  return (
    <svg className={`logo-lata ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <g className="logo-niebla">
        <circle cx="38" cy="7" r="3.2" fill="#3de0ff" />
        <circle cx="43.5" cy="13" r="2.2" fill="#ff3dd8" />
        <circle cx="33" cy="3" r="1.8" fill="#ffe03d" />
        <circle cx="44" cy="4.5" r="1.4" fill="#3de0ff" />
      </g>
      <g transform="rotate(-18 22 28)" stroke="#120c1f" strokeWidth="2.6" strokeLinejoin="round">
        <rect x="18" y="5" width="9" height="6" rx="1.5" fill="#efeaff" />
        <rect x="24.5" y="6.6" width="4.5" height="2.6" rx="1" fill="#120c1f" strokeWidth="0" />
        <path d="M13 17q0-6 9.5-6t9.5 6v24q0 4-4 4h-11q-4 0-4-4z" fill="#b14bff" />
        <path d="M13 23h19v8H13z" fill="#ffe03d" />
        <path d="M18 31v5" stroke="#ffe03d" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <LataLogo />
      <span className="logo-texto">
        iBlog<span className="logo-two">Two</span>
      </span>
    </span>
  );
}
