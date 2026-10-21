/**
 * Fondo de la app: muro de ladrillo, una franja de concreto a la izquierda y manchas de
 * pintura. Animaciones sutiles (solo CSS, sin JS por cuadro): resplandores de neón que
 * derivan despacio, manchas que "respiran", chorreos que crecen y motas de spray que suben.
 * Con movimiento reducido todo queda quieto.
 */
import { mancha } from './auth/Salpicaduras.jsx';

// Coordenadas en un lienzo de 1600 × 1000 que cubre la pantalla (slice)
const MANCHAS = [
  { x: 90, y: 160, radio: 120, color: '#c13cff', semilla: 3 },
  { x: 250, y: 420, radio: 80, color: '#3de0ff', semilla: 7 },
  { x: 120, y: 690, radio: 95, color: '#ff2fb0', semilla: 11 },
  { x: 300, y: 860, radio: 55, color: '#ffe03d', semilla: 19 },
  { x: 1530, y: 120, radio: 70, color: '#b14bff', semilla: 23 },
  { x: 1500, y: 820, radio: 90, color: '#ff3dd8', semilla: 31 },
  { x: 1380, y: 960, radio: 50, color: '#3de0ff', semilla: 37 },
].map(mancha);

const COLORES_MOTAS = ['#ff3dd8', '#3de0ff', '#ffe03d', '#b14bff'];
// Posición, tamaño, duración y retraso fijos: las motas no cambian entre renders
const MOTAS = Array.from({ length: 22 }, (_, i) => ({
  izquierda: (i * 37 + 11) % 100,
  tamano: 3 + (i % 4) * 1.5,
  duracion: 16 + ((i * 7) % 12),
  retraso: -((i * 5.3) % 24),
  color: COLORES_MOTAS[i % COLORES_MOTAS.length],
}));

export function FondoCalle() {
  return (
    <div className="fondo-calle" aria-hidden="true">
      <div className="fondo-resplandor fondo-resplandor-1" />
      <div className="fondo-resplandor fondo-resplandor-2" />
      <div className="fondo-resplandor fondo-resplandor-3" />
      <div className="fondo-concreto" />

      <svg className="fondo-manchas" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {MANCHAS.map((m, i) => (
          <g key={i} fill={m.color} style={{ animationDelay: `${-i * 1.7}s` }}>
            <path d={m.d} />
            {m.gotas.map((g, j) => (
              <circle key={j} cx={g.x} cy={g.y} r={g.r} />
            ))}
            {m.chorreos.map((c, j) => (
              <g key={j} className="fondo-chorreo" style={{ animationDelay: `${-(i + j) * 2.3}s` }}>
                <rect
                  x={c.x - c.ancho / 2}
                  y={c.y}
                  width={c.ancho}
                  height={c.largo}
                  rx={c.ancho / 2}
                />
                <circle cx={c.x} cy={c.y + c.largo} r={c.ancho * 0.75} />
              </g>
            ))}
          </g>
        ))}
      </svg>

      <div className="fondo-motas">
        {MOTAS.map((m, i) => (
          <span
            key={i}
            style={{
              left: `${m.izquierda}%`,
              width: m.tamano,
              height: m.tamano,
              background: m.color,
              animationDuration: `${m.duracion}s`,
              animationDelay: `${m.retraso}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
