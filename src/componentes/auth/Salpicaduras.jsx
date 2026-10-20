/** Manchas de pintura de fondo, generadas una sola vez con un azar con semilla (siempre iguales). */

function aleatorio(semilla) {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mancha({ x: cx, y: cy, radio, color, semilla }) {
  const azar = aleatorio(semilla);
  const n = 26;
  const puntos = Array.from({ length: n }, (_, i) => {
    const angulo = (i / n) * Math.PI * 2;
    const r = azar() < 0.22 ? radio * (1.25 + azar() * 0.55) : radio * (0.78 + azar() * 0.28);
    return [cx + Math.cos(angulo) * r, cy + Math.sin(angulo) * r];
  });
  const medio = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const fmt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let d = `M${fmt(medio(puntos[n - 1], puntos[0]))}`;
  puntos.forEach((p, i) => {
    d += ` Q${fmt(p)} ${fmt(medio(p, puntos[(i + 1) % n]))}`;
  });

  const gotas = Array.from({ length: 16 }, () => {
    const angulo = azar() * Math.PI * 2;
    const distancia = radio * (1.3 + azar() * 1.1);
    return {
      x: cx + Math.cos(angulo) * distancia,
      y: cy + Math.sin(angulo) * distancia,
      r: 1.5 + azar() * radio * 0.07,
    };
  });

  const chorreos = Array.from({ length: 3 }, () => ({
    x: cx + (azar() - 0.5) * radio * 1.1,
    y: cy + radio * 0.3,
    largo: 40 + azar() * radio * 2.2,
    ancho: radio * (0.06 + azar() * 0.07),
  }));

  return { d: `${d}Z`, gotas, chorreos, color };
}

const MANCHAS = [
  { x: 110, y: 120, radio: 110, color: '#c13cff', semilla: 3 },
  { x: 430, y: 300, radio: 95, color: '#3de0ff', semilla: 7 },
  { x: 160, y: 470, radio: 92, color: '#ff2fb0', semilla: 11 },
  { x: 480, y: 560, radio: 80, color: '#ffe03d', semilla: 19 },
  { x: 330, y: 210, radio: 60, color: '#b14bff', semilla: 23 },
  { x: 80, y: 700, radio: 42, color: '#3de0ff', semilla: 31 },
].map(mancha);

export function Salpicaduras() {
  return (
    <svg
      className="auth-salpicaduras"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {MANCHAS.map((m, i) => (
        <g key={i} fill={m.color} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
          <path d={m.d} />
          {m.gotas.map((g, j) => (
            <circle key={j} cx={g.x} cy={g.y} r={g.r} />
          ))}
          {m.chorreos.map((c, j) => (
            <g key={j}>
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
  );
}
