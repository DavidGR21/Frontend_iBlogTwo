/**
 * Transición de grafiti entre formularios: una lata de spray recorre el formulario en zigzag.
 *  - cubrir(): agita la lata y tapa el formulario actual con pintura del color del muro.
 *  - revelar(): "pinta" el formulario nuevo quitando esa capa, con salpicaduras y chorreos.
 *    Sube desde donde terminó cubrir(), así la lata no salta de un extremo al otro.
 * Ambas devuelven una promesa que resuelve true al terminar, o false si otra la interrumpió.
 */
import { useImperativeHandle, useRef } from 'react';

const COLOR_MURO = '#17122a';
const NEON = ['#ff3dd8', '#3de0ff', '#ffe03d', '#b14bff'];
const BANDA = 62;
const RADIO = 54;
const MARGEN = 26;
const VARIANTES = 4;
const AGITADO = 260;

const azar = (min, max) => min + Math.random() * (max - min);
const suavizar = (p) => 0.5 - Math.cos(Math.PI * p) / 2;
const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Sellos de aerosol: núcleo sólido y un borde de puntitos sueltos. Hay varias variantes
 * para que el borde del trazo no repita siempre el mismo patrón.
 */
let pinceles;
function obtenerPinceles() {
  if (pinceles) return pinceles;
  pinceles = Array.from({ length: VARIANTES }, () => {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = RADIO * 2;
    const c = lienzo.getContext('2d');
    const g = c.createRadialGradient(RADIO, RADIO, 0, RADIO, RADIO, RADIO * 0.78);
    g.addColorStop(0, COLOR_MURO);
    g.addColorStop(0.7, COLOR_MURO);
    g.addColorStop(1, 'rgba(23, 18, 42, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, RADIO * 2, RADIO * 2);
    c.fillStyle = COLOR_MURO;
    for (let i = 0; i < 170; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const distancia = RADIO * azar(0.5, 0.97);
      c.globalAlpha = Math.min(1, 1.2 - distancia / RADIO);
      c.beginPath();
      c.arc(
        RADIO + Math.cos(angulo) * distancia,
        RADIO + Math.sin(angulo) * distancia,
        azar(0.6, 2.1),
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    return lienzo;
  });
  return pinceles;
}

function prepararLienzo(lienzo) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ancho = Math.round(lienzo.clientWidth * dpr);
  const alto = Math.round(lienzo.clientHeight * dpr);
  if (lienzo.width !== ancho || lienzo.height !== alto) {
    lienzo.width = ancho;
    lienzo.height = alto;
  }
  const ctx = lienzo.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function zonaDe(lienzo, elemento) {
  const base = lienzo.getBoundingClientRect();
  const r = elemento.getBoundingClientRect();
  const x = Math.max(r.left - base.left - MARGEN, 0);
  const y = Math.max(r.top - base.top - MARGEN, 0);
  return {
    x,
    y,
    ancho: Math.min(r.right - base.left + MARGEN, base.width) - x,
    alto: Math.min(r.bottom - base.top + MARGEN, base.height) - y,
  };
}

/**
 * Zigzag horizontal que barre la zona fila por fila: de arriba abajo, o de abajo arriba
 * (`haciaArriba`). Si se pasa `desde`, el recorrido arranca en ese punto.
 */
function crearRecorrido(zona, { haciaArriba = false, desde = null } = {}) {
  const filas = Math.max(2, Math.ceil(zona.alto / BANDA));
  const paso = zona.alto / filas;
  const puntos = desde ? [desde] : [];
  for (let k = 0; k < filas; k++) {
    const i = haciaArriba ? filas - 1 - k : k;
    const y = zona.y + paso * (i + 0.5);
    const izquierda = { x: zona.x, y };
    const derecha = { x: zona.x + zona.ancho, y };
    // Cada fila empieza en el lado más cercano al final de la anterior
    const ultimo = puntos[puntos.length - 1];
    const empiezaDerecha = ultimo ? ultimo.x > zona.x + zona.ancho / 2 : false;
    puntos.push(...(empiezaDerecha ? [derecha, izquierda] : [izquierda, derecha]));
  }
  const tramos = [];
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    const largo = Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
    tramos.push({ desde: puntos[i - 1], hasta: puntos[i], inicio: total, largo });
    total += largo;
  }
  return {
    filas,
    total,
    en(distancia) {
      const tramo =
        tramos.find((t) => distancia <= t.inicio + t.largo) ?? tramos[tramos.length - 1];
      const k = tramo.largo ? (distancia - tramo.inicio) / tramo.largo : 0;
      return {
        x: tramo.desde.x + (tramo.hasta.x - tramo.desde.x) * k,
        y: tramo.desde.y + (tramo.hasta.y - tramo.desde.y) * k + Math.sin(distancia * 0.045) * 5,
        fila: Math.floor(tramos.indexOf(tramo) / 2),
      };
    },
  };
}

export function TransicionGrafiti({ ref, objetivo }) {
  const capa = useRef(null);
  const pintura = useRef(null);
  const lata = useRef(null);
  const estado = useRef({ token: 0, chorreos: [], limpieza: null, ultimo: null });

  function limpiar() {
    const e = estado.current;
    clearTimeout(e.limpieza);
    e.limpieza = null;
    e.chorreos = [];
    for (const lienzo of [capa.current, pintura.current]) {
      if (!lienzo) continue; // ya desmontado
      lienzo.getContext('2d').clearRect(0, 0, lienzo.width, lienzo.height);
      lienzo.classList.remove('desvanecer');
    }
  }

  function terminar(token) {
    const e = estado.current;
    lata.current.classList.remove('activa', 'agitando');
    e.ultimo = null;
    capa.current.classList.remove('bloquea');
    capa.current.classList.add('desvanecer');
    pintura.current.classList.add('desvanecer');
    e.limpieza = setTimeout(() => {
      if (e.token === token) limpiar();
    }, 480);
  }

  function correr(fase) {
    const e = estado.current;
    const token = ++e.token;
    if (!capa.current || !objetivo.current) return Promise.resolve(false);
    if (e.limpieza) limpiar();

    const ctx = prepararLienzo(capa.current);
    const pctx = prepararLienzo(pintura.current);
    const zona = zonaDe(capa.current, objetivo.current);
    capa.current.classList.add('bloquea');

    if (fase === 'revelar') {
      // Lo que aún no esté tapado (p. ej. el formulario nuevo es más alto) se tapa ya,
      // antes del primer pintado, para que no "salte" a la vista.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.shadowColor = COLOR_MURO;
      ctx.shadowBlur = 24;
      ctx.fillStyle = COLOR_MURO;
      ctx.fillRect(zona.x + 12, zona.y + 12, zona.ancho - 24, zona.alto - 24);
      ctx.restore();
    }

    if (movimientoReducido()) {
      if (fase === 'revelar') {
        limpiar();
        capa.current.classList.remove('bloquea');
      }
      return Promise.resolve(true);
    }

    const ruta =
      fase === 'cubrir'
        ? crearRecorrido(zona)
        : crearRecorrido(zona, { haciaArriba: true, desde: e.ultimo });
    const duracion = fase === 'cubrir' ? 320 + ruta.filas * 50 : 420 + ruta.filas * 105;
    const brochas = obtenerPinceles();
    let recorrido = 0;
    // Si la lata aparece ahora, primero se agita un momento
    const espera = lata.current.classList.contains('activa') ? 0 : AGITADO;
    const salida = ruta.en(0);
    lata.current.style.transform = `translate(${salida.x}px, ${salida.y}px)`;
    lata.current.classList.add('activa');
    lata.current.classList.toggle('agitando', espera > 0);
    let inclinacion = 0;
    let previa = salida.x;

    const rociar = ({ x, y, fila }) => {
      const color = NEON[fila % NEON.length];
      ctx.globalCompositeOperation = fase === 'cubrir' ? 'source-over' : 'destination-out';
      ctx.drawImage(brochas[(Math.random() * VARIANTES) | 0], x - RADIO, y - RADIO);

      // Niebla de color que se escapa alrededor del trazo
      pctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const distancia = azar(RADIO * 0.55, RADIO * 1.25);
        pctx.globalAlpha = azar(0.25, 0.6);
        pctx.beginPath();
        pctx.arc(
          x + Math.cos(angulo) * distancia,
          y + Math.sin(angulo) * distancia,
          azar(0.5, 2),
          0,
          Math.PI * 2,
        );
        pctx.fill();
      }
      // De vez en cuando, una gota gorda salpicada
      if (Math.random() < 0.025) {
        const angulo = Math.random() * Math.PI * 2;
        const distancia = azar(RADIO * 0.8, RADIO * 1.4);
        pctx.globalAlpha = 0.8;
        pctx.beginPath();
        pctx.arc(
          x + Math.cos(angulo) * distancia,
          y + Math.sin(angulo) * distancia,
          azar(2.5, 5),
          0,
          Math.PI * 2,
        );
        pctx.fill();
      }
      pctx.globalAlpha = 1;

      if (Math.random() < (fase === 'cubrir' ? 0.01 : 0.02)) {
        e.chorreos.push({
          x: x + azar(-20, 20),
          y: y + RADIO * 0.45,
          largo: 0,
          maximo: azar(18, 70),
          ancho: azar(2.5, 5),
          velocidad: azar(0.8, 2.2),
          color,
        });
      }
    };

    const gotear = () => {
      for (const c of e.chorreos) {
        if (c.largo >= c.maximo) continue;
        const nuevo = Math.min(c.largo + c.velocidad, c.maximo);
        pctx.strokeStyle = c.color;
        pctx.lineWidth = c.ancho;
        pctx.lineCap = 'round';
        pctx.beginPath();
        pctx.moveTo(c.x, c.y + c.largo);
        pctx.lineTo(c.x, c.y + nuevo);
        pctx.stroke();
        c.largo = nuevo;
        if (c.largo >= c.maximo) {
          pctx.fillStyle = c.color;
          pctx.beginPath();
          pctx.arc(c.x, c.y + c.largo, c.ancho * 0.85, 0, Math.PI * 2);
          pctx.fill();
        }
      }
    };

    return new Promise((resolver) => {
      const inicio = performance.now() + espera;
      const paso = () => {
        // Cancelada, o la pantalla se desmontó a mitad de la animación
        if (e.token !== token || !lata.current) return resolver(false);
        const ahora = performance.now();
        if (ahora < inicio) return requestAnimationFrame(paso);
        lata.current.classList.remove('agitando');
        const p = Math.min((ahora - inicio) / duracion, 1);
        const destino = suavizar(p) * ruta.total;
        while (recorrido < destino) {
          rociar(ruta.en(recorrido));
          recorrido += 5;
        }
        const punta = ruta.en(destino);
        // La lata se inclina hacia donde va, como la muñeca que acompaña el trazo
        const objetivoInclinacion = Math.max(-22, Math.min(22, (punta.x - previa) * 0.9));
        inclinacion += (objetivoInclinacion - inclinacion) * 0.2;
        previa = punta.x;
        lata.current.style.transform = `translate(${punta.x}px, ${punta.y}px) rotate(${inclinacion}deg)`;
        lata.current.style.setProperty('--color-niebla', NEON[punta.fila % NEON.length]);
        gotear();

        if (p < 1) return requestAnimationFrame(paso);
        if (fase === 'revelar') terminar(token);
        else e.ultimo = { x: punta.x, y: punta.y };
        resolver(true);
      };
      requestAnimationFrame(paso);
    });
  }

  useImperativeHandle(ref, () => ({
    cubrir: () => correr('cubrir'),
    revelar: () => correr('revelar'),
  }));
  return (
    <>
      <canvas ref={capa} className="grafiti-capa" aria-hidden="true" />
      <canvas ref={pintura} className="grafiti-pintura" aria-hidden="true" />
      <div ref={lata} className="grafiti-lata" aria-hidden="true">
        <span className="grafiti-niebla" />
        <svg viewBox="0 0 40 72" width="40" height="72">
          <rect x="6" y="16" width="28" height="52" rx="6" fill="#ff3d9a" />
          <rect x="6" y="34" width="28" height="12" fill="#3de0ff" />
          <rect
            x="6"
            y="16"
            width="28"
            height="52"
            rx="6"
            fill="none"
            stroke="#120c1f"
            strokeWidth="3"
          />
          <path d="M8 18 Q20 6 32 18 Z" fill="#d9d4e8" stroke="#120c1f" strokeWidth="3" />
          <rect
            x="15"
            y="3"
            width="10"
            height="8"
            rx="2"
            fill="#ffe03d"
            stroke="#120c1f"
            strokeWidth="3"
          />
        </svg>
      </div>
    </>
  );
}
