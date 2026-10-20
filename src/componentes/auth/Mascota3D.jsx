/**
 * Mascota de la pantalla de acceso: una paloma callejera hecha con Three.js
 * (gorra hacia atrás, sudadera con capucha, cadena al cuello y las dos manos en el bolsillo).
 *  - Entra cayendo desde arriba, aterriza con un aplastón y salpica pintura.
 *  - Sigue el puntero con la cabeza: la mueve con un muelle (llega rápido, se pasa un pelín
 *    y se asienta), la ladea con curiosidad y acompaña con el cuerpo y los ojos.
 *  - Mientras escribes en un campo, mira lo que escribes.
 *  - Con el foco en una contraseña aprieta los ojos, aparta la cabeza y la hunde en la
 *    capucha (y espía con un ojo si la muestras).
 *
 * Las piezas son elipsoides, cápsulas o esferas deformadas con la forma "horneada" en la
 * geometría, así el contorno tiene el mismo grosor en todas partes y nada se deforma al animar.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const C = {
  plumaje: '#7a84b4',
  plumajeOscuro: '#4f5583',
  cuello: '#7c68ae',
  pico: '#4a4c63',
  cera: '#ece8f5',
  ceja: '#373a59',
  pata: '#e27a8f',
  una: '#3a2f45',
  sudadera: '#7b7d4e',
  sudaderaOscura: '#5d5f38',
  bolsillo: '#73754a',
  gorra: '#8b5bd9',
  gorraOscura: '#6a3fb5',
  abertura: '#2a1d45',
  cadena: '#bfc1d0',
  ojo: '#fbf8ff',
  iris: '#3b1d40',
  pupila: '#0f0a16',
  contorno: '#0d0a18',
};

// Radios del cráneo: ojos, cejas y pico se apoyan sobre esta superficie
const CABEZA = new THREE.Vector3(0.68, 0.78, 0.7);
// La cabeza gira desde la base (dentro de la capucha); el cráneo queda por encima
const CUELLO_Y = 0.78;
const CRANEO_Y = 0.7;
// La cabeza es más grande que la sudadera, como en el boceto
const ESCALA_CABEZA = 1.15;
// Perfil (radio, altura) de la sudadera; se gira alrededor del eje y
const PERFIL_SUDADERA = [
  [0, -0.95],
  [0.66, -0.95],
  [0.78, -0.9],
  [0.85, -0.75],
  [0.88, -0.5],
  [0.89, -0.2],
  [0.87, 0.1],
  [0.82, 0.32],
  [0.7, 0.5],
  [0.5, 0.62],
  [0.25, 0.68],
  [0, 0.7],
];
const FONDO_TORSO = 0.85; // el torso es más plano de delante a atrás
const BOLSILLO = { y: -0.42, alto: 0.27, abajo: 0.6, arriba: 0.46 };
// Dónde entra cada antebrazo (borde del bolsillo) y dónde queda el puño dentro, en |px|
const MANO_BOLSILLO = { entrada: 0.95, puno: 0.42 };
const SUELO = -1.8;
const ENTRADA = { espera: 0.2, caida: 0.42, altura: 7 };
const ATERRIZAJE = ENTRADA.espera + ENTRADA.caida;
// Muelle de la cabeza: rigidez y amortiguación (poco amortiguado: se pasa un poco)
const MUELLE_CABEZA = { rigidez: 90, freno: 13 };

const limitar = (v, min, max) => Math.min(Math.max(v, min), max);
const mezclar = (a, b, t) => a + (b - a) * t;
// Muelle amortiguado: empieza en 0 y se asienta en 1 con un pequeño rebote
const muelle = (d) => (d <= 0 ? 0 : 1 - Math.exp(-7 * d) * Math.cos(13 * d));

export function Mascota3D({ alAparecer }) {
  const contenedor = useRef(null);
  const alAparecerRef = useRef(alAparecer);

  useEffect(() => {
    alAparecerRef.current = alAparecer;
  }, [alAparecer]);

  useEffect(() => {
    let escena;
    try {
      escena = crearEscena(contenedor.current, alAparecerRef);
    } catch {
      alAparecerRef.current?.();
      return undefined; // sin WebGL: la pantalla funciona igual, solo sin mascota
    }
    return () => escena.destruir();
  }, []);

  return <div ref={contenedor} className="auth-mascota" aria-hidden="true" />;
}

function crearEscena(el, alAparecerRef) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  escena.add(new THREE.HemisphereLight(0xe2d4ff, 0x2a1840, 1.3));
  const principal = new THREE.DirectionalLight(0xffffff, 2.2);
  principal.position.set(3, 5, 6);
  const rimRosa = new THREE.DirectionalLight(0xff3dd8, 2);
  rimRosa.position.set(-6, 2, -3);
  const rimCian = new THREE.DirectionalLight(0x3de0ff, 1.8);
  rimCian.position.set(6, 1, -4);
  escena.add(principal, rimRosa, rimCian);

  const piezas = crearFabrica();
  const paloma = construirPaloma(piezas);
  escena.add(paloma.raiz);

  function ajustar() {
    const { clientWidth: ancho, clientHeight: alto } = el;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto);
    camara.aspect = ancho / alto;
    const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const distancia = Math.max(11.5, 2.9 / (tan * camara.aspect));
    camara.position.set(0, 0.7, distancia);
    camara.lookAt(0, 0.4, 0);
    camara.updateProjectionMatrix();
  }
  const observador = new ResizeObserver(ajustar);
  observador.observe(el);
  ajustar();

  const raton = { x: window.innerWidth * 0.45, y: window.innerHeight * 0.4 };
  const alMover = (e) => {
    raton.x = e.clientX;
    raton.y = e.clientY;
  };
  window.addEventListener('pointermove', alMover);

  // Con movimiento reducido la paloma ya está en el suelo desde el principio
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const s = {
    cerrar: 1,
    espiar: 0,
    // Giro de la cabeza (x: cabeceo, y: giro, z: ladeo) y su velocidad, para el muelle
    giro: { x: 0, y: 0, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    ojoX: 0,
    ojoY: 0,
    parpadeo: -1,
    proximoParpadeo: ATERRIZAJE + 1.4,
    ladeo: -1,
    ladoLadeo: 1,
    proximoLadeo: 4,
    aparecio: false,
  };
  const cabezaPantalla = new THREE.Vector3();
  const inicio = performance.now();
  let anterior = inicio;
  let cuadroId;

  function cuadro(ahora) {
    cuadroId = requestAnimationFrame(cuadro);
    const dt = Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    const t = (ahora - inicio) / 1000;
    const suave = (k) => 1 - Math.exp(-dt * k);
    const girarCabeza = (eje, objetivo) => {
      const { rigidez, freno } = MUELLE_CABEZA;
      s.vel[eje] += ((objetivo - s.giro[eje]) * rigidez - s.vel[eje] * freno) * dt;
      s.giro[eje] += s.vel[eje] * dt;
    };

    // Entrada: `tras` son los segundos desde que tocó el suelo (negativo mientras cae)
    const tras = animarEntrada(paloma, reducido ? 99 : t);
    const cayendo = tras < 0.3;
    const sacudida = tras >= 0 ? Math.exp(-5 * tras) * Math.cos(12 * tras) : 0;
    if (!s.aparecio && tras > 0.15) {
      s.aparecio = true;
      alAparecerRef.current?.();
    }

    // ¿Qué está mirando? El puntero, o el texto del campo con foco.
    const activo = document.activeElement;
    const secreto = activo?.dataset ? 'secreto' in activo.dataset : false;
    let objetivo = raton;
    if (activo?.closest?.('.auth-form') && /^(INPUT|SELECT)$/.test(activo.tagName)) {
      const r = activo.getBoundingClientRect();
      const texto = Math.min((activo.value?.length ?? 0) * 8.5, r.width - 10);
      objetivo = { x: r.left + texto, y: r.top + r.height / 2 };
    }
    // Mientras cae aprieta los ojos; los abre justo después de aterrizar
    s.cerrar += ((secreto || cayendo ? 1 : 0) - s.cerrar) * suave(16);
    s.espiar += ((secreto && activo.type === 'text' ? 1 : 0) - s.espiar) * suave(10);
    // Cuánto aparta la cara: del todo con los ojos cerrados, poco si está espiando
    const desvio = s.cerrar * (1 - s.espiar * 0.7);

    paloma.cabeza.getWorldPosition(cabezaPantalla).project(camara);
    const lienzo = renderer.domElement.getBoundingClientRect();
    const cx = lienzo.left + ((cabezaPantalla.x + 1) / 2) * lienzo.width;
    const cy = lienzo.top + ((1 - cabezaPantalla.y) / 2) * lienzo.height;
    const dx = limitar((objetivo.x - cx) / (window.innerWidth * 0.55), -1, 1);
    const dy = limitar((cy - objetivo.y) / (window.innerHeight * 0.4), -1, 1);

    // De vez en cuando ladea la cabeza, como hacen las palomas cuando algo les intriga
    if (t > s.proximoLadeo) {
      s.ladeo = t;
      s.ladoLadeo = Math.random() < 0.5 ? -1 : 1;
      s.proximoLadeo = t + 4 + Math.random() * 5;
    }
    const l = (t - s.ladeo) / 1.4;
    const ladeo = l >= 0 && l <= 1 ? Math.sin(Math.PI * l) ** 2 * 0.17 * s.ladoLadeo : 0;

    // Cabeza: gira hacia el objetivo con amplitud y la ladea un poco hacia él.
    // Con los ojos cerrados mira hacia otro lado, con el pico un poco hacia arriba.
    girarCabeza('y', mezclar(dx * 0.8, -0.62, desvio));
    girarCabeza('x', mezclar(-dy * 0.4, -0.2, desvio));
    girarCabeza('z', mezclar(-dx * 0.12 + ladeo, 0.14, desvio));
    paloma.cabeza.rotation.set(s.giro.x, s.giro.y, s.giro.z + Math.sin(t * 0.9) * 0.02);
    // Asoma un poco hacia donde mira; se hunde en la capucha al cerrar los ojos y al aterrizar
    paloma.cabeza.position.set(
      s.giro.y * 0.06,
      CUELLO_Y - sacudida * 0.08 - desvio * 0.07,
      0.03 * (1 - desvio),
    );
    // El cuerpo acompaña el giro de la cabeza
    paloma.torso.rotation.set(
      s.giro.x * 0.08,
      s.giro.y * 0.22,
      Math.sin(t * 0.8) * 0.012 - s.giro.z * 0.1,
    );
    paloma.torso.position.y = Math.sin(t * 2) * 0.02;

    // Ojos: pupilas, parpadeo y espía
    s.ojoX += ((dx * 0.11 + 0.02) * (1 - desvio) - s.ojoX) * suave(18);
    s.ojoY += (dy * 0.09 * (1 - desvio) - s.ojoY) * suave(18);
    if (t > s.proximoParpadeo) {
      s.parpadeo = t;
      s.proximoParpadeo = t + 2.5 + Math.random() * 3.5;
    }
    const p = (t - s.parpadeo) / 0.16;
    const parpadeo = p >= 0 && p <= 1 ? Math.sin(Math.PI * p) : 0;
    paloma.ojos.forEach((ojo, i) => {
      let cierre = Math.max(s.cerrar, parpadeo);
      // El ojo más cercano al formulario es el que espía
      if (i === 1) cierre = Math.min(cierre, 1 - s.espiar * 0.65);
      ojo.ajustar(cierre, s.ojoX, s.ojoY, s.cerrar * (i === 1 ? 1 - s.espiar : 1));
    });
    paloma.cejas.forEach((ceja) => ceja.ajustar(s.cerrar));

    renderer.render(escena, camara);
  }
  cuadroId = requestAnimationFrame(cuadro);

  return {
    destruir() {
      cancelAnimationFrame(cuadroId);
      observador.disconnect();
      window.removeEventListener('pointermove', alMover);
      escena.traverse((objeto) => {
        objeto.geometry?.dispose();
        const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
        materiales.forEach((m) => {
          m?.map?.dispose();
          m?.dispose();
        });
      });
      piezas.gradiente.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/**
 * Cae desde arriba estirada, se aplasta al tocar el suelo y rebota hasta quedarse quieta.
 * Después saltan a su sitio las latas y los charcos. Devuelve los segundos desde el aterrizaje.
 */
function animarEntrada(m, t) {
  const tras = t - ATERRIZAJE;
  let altura = 0;
  let estirar;
  if (tras < 0) {
    const p = limitar((t - ENTRADA.espera) / ENTRADA.caida, 0, 1);
    altura = ENTRADA.altura * (1 - p * p);
    estirar = 1 + 0.16 * p;
  } else {
    estirar = 1 - 0.3 * Math.exp(-7 * tras) * Math.cos(15 * tras);
  }
  // `salto` tiene el origen en el suelo: el aplastón no despega las patas
  m.salto.position.y = SUELO + altura;
  const ancho = 1 / Math.sqrt(estirar);
  m.salto.scale.set(ancho, estirar, ancho);

  // La sombra crece y se oscurece a medida que se acerca al suelo
  const cerca = 1 - altura / ENTRADA.altura;
  const sombra = 0.3 + 0.7 * cerca;
  m.sombra.scale.set(1.5 * sombra, 0.8 * sombra, 1);
  m.sombra.material.opacity = cerca;

  m.decorado.forEach(({ objeto, escala, retraso }) => {
    objeto.scale.setScalar(escala * muelle(tras - retraso));
  });
  m.gotas.forEach((gota) => gota.actualizar(tras));
  return tras;
}

/** Materiales "cartoon" con contorno negro (casco invertido). */
function crearFabrica() {
  const gradiente = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  gradiente.minFilter = THREE.NearestFilter;
  gradiente.magFilter = THREE.NearestFilter;
  gradiente.needsUpdate = true;

  const contorno = new THREE.ShaderMaterial({
    uniforms: { grosor: { value: 0.022 }, color: { value: new THREE.Color(C.contorno) } },
    vertexShader: `
      uniform float grosor;
      void main() {
        vec3 p = position + normal * grosor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 color;
      void main() { gl_FragColor = vec4(color, 1.0); }`,
    side: THREE.BackSide,
  });

  const toon = (color, extra = {}) =>
    new THREE.MeshToonMaterial({ color, gradientMap: gradiente, ...extra });

  function pieza(geometria, color, { conContorno = true, material } = {}) {
    const malla = new THREE.Mesh(geometria, material ?? toon(color));
    if (conContorno) malla.add(new THREE.Mesh(geometria, contorno));
    return malla;
  }

  return { gradiente, contorno, toon, pieza };
}

/** Esfera con la escala aplicada a la geometría (el contorno queda uniforme). */
function elipsoide(rx, ry, rz, detalle = 28) {
  return new THREE.SphereGeometry(1, detalle, Math.round(detalle * 0.75)).scale(rx, ry, rz);
}

/** Mueve cada vértice con `fn` y recalcula normales suaves. */
function deformar(geometria, fn) {
  const pos = geometria.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    fn(v.fromBufferAttribute(pos, i), i);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return normalesSuaves(geometria);
}

/**
 * Normales calculadas y promediadas entre vértices que comparten posición (costuras y
 * polos de la esfera), para que el contorno no se abra en esas líneas.
 */
function normalesSuaves(geometria) {
  geometria.computeVertexNormals();
  const pos = geometria.attributes.position;
  const nor = geometria.attributes.normal;
  const grupos = new Map();
  for (let i = 0; i < pos.count; i++) {
    const clave = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(i);
    else grupos.set(clave, [i]);
  }
  const n = new THREE.Vector3();
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    n.set(0, 0, 0);
    grupo.forEach((i) => n.add(new THREE.Vector3().fromBufferAttribute(nor, i)));
    n.normalize();
    grupo.forEach((i) => nor.setXYZ(i, n.x, n.y, n.z));
  }
  return geometria;
}

/** Cápsula de `a` a `b` (brazos, patas y dedos). */
function tramo(pieza, a, b, radio, color) {
  const malla = pieza(new THREE.CapsuleGeometry(radio, a.distanceTo(b), 6, 16), color);
  malla.position.copy(a).add(b).multiplyScalar(0.5);
  malla.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3().subVectors(b, a).normalize(),
  );
  return malla;
}

/** Radio de la sudadera a la altura `y` (interpolando el perfil). */
function radioSudadera(y) {
  const perfil = PERFIL_SUDADERA.slice(1, -1);
  for (let i = 1; i < perfil.length; i++) {
    const [r0, y0] = perfil[i - 1];
    const [r1, y1] = perfil[i];
    if (y <= y1) return mezclar(r0, r1, limitar((y - y0) / (y1 - y0), 0, 1));
  }
  return perfil.at(-1)[0];
}

function construirPaloma({ toon, pieza }) {
  const raiz = new THREE.Group();
  raiz.rotation.y = 0.18; // de tres cuartos, mirando hacia el formulario

  // Sombra en el suelo
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 40),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = SUELO;
  raiz.add(sombra);

  // `salto` tiene el origen en el suelo para aplastar y estirar desde las patas;
  // `cuerpo` devuelve el origen al centro de la paloma.
  const salto = new THREE.Group();
  const cuerpo = new THREE.Group();
  cuerpo.position.y = -SUELO;
  salto.add(cuerpo);
  raiz.add(salto);

  // Barriga emplumada que asoma bajo la sudadera, patas y plumas de la cola y las alas
  const barriga = pieza(elipsoide(0.6, 0.32, 0.5), C.plumaje);
  barriga.position.y = -0.98;
  cuerpo.add(barriga);
  for (const lado of [-1, 1]) cuerpo.add(crearPata(pieza, lado));
  cuerpo.add(crearPlumas(pieza, toon));

  // Torso: sudadera, puño elástico, capucha, cadena y bolsillo canguro
  const torso = new THREE.Group();
  cuerpo.add(torso);

  const sudadera = pieza(
    normalesSuaves(
      new THREE.LatheGeometry(
        PERFIL_SUDADERA.map(([r, y]) => new THREE.Vector2(r, y)),
        44,
      ).scale(1, 1, FONDO_TORSO),
    ),
    C.sudadera,
  );
  torso.add(sudadera);

  const elastico = pieza(
    new THREE.TorusGeometry(0.8, 0.08, 10, 48).rotateX(Math.PI / 2).scale(1, 1.5, FONDO_TORSO),
    C.sudaderaOscura,
  );
  elastico.position.y = -0.88;
  torso.add(elastico);

  // Cuello con el brillo morado de las palomas; casi todo queda dentro de la capucha
  const cuello = pieza(elipsoide(0.42, 0.34, 0.4), C.cuello);
  cuello.position.set(0, 0.82, 0.02);
  torso.add(cuello);

  // Capucha: un rollo grueso alrededor del cuello, más alto por detrás
  const capucha = pieza(
    new THREE.TorusGeometry(0.52, 0.25, 16, 40).rotateX(Math.PI / 2).scale(1, 1, 0.92),
    C.sudadera,
  );
  capucha.position.set(0, 0.68, -0.04);
  capucha.rotation.x = 0.22;
  const capuchaCaida = pieza(elipsoide(0.6, 0.5, 0.26), C.sudaderaOscura);
  capuchaCaida.position.set(0, 0.8, -0.66);
  capuchaCaida.rotation.x = -0.3;
  torso.add(capucha, capuchaCaida);

  torso.add(crearCadena(toon));
  torso.add(crearBolsillo(pieza, toon));
  // Los dos brazos con las manos metidas en el bolsillo (no hay manos que dibujar)
  for (const lado of [-1, 1]) torso.add(crearBrazoBolsillo(pieza, lado));

  // Latas en el suelo como en el boceto: una azul de pie, una roja tirada y una rosa
  // sobre su charco. Aparecen tras el aterrizaje.
  const lataAzul = crearLata(pieza, '#3d5bff', '#3de0ff');
  lataAzul.position.set(-1.9, -1.47, 0.25);
  lataAzul.rotation.y = 0.6;
  const lataRoja = crearLata(pieza, '#ff2d55', '#ffe03d', { conTapa: false });
  lataRoja.rotation.set(0.3, -0.5, Math.PI / 2);
  lataRoja.position.set(-1.35, -1.6, 0.9);
  const lataRosa = crearLata(pieza, '#ff3d9a', '#b14bff');
  lataRosa.position.set(1.7, -1.47, 0.55);
  lataRosa.rotation.y = -0.5;
  const decorado = [
    { objeto: crearCharco(toon, '#ff3dd8', 0.42, 1.72, 0.6, 3), escala: 1, retraso: 0.02 },
    { objeto: crearCharco(toon, '#3de0ff', 0.3, -1.85, 0.35, 7), escala: 1, retraso: 0.08 },
    { objeto: lataRosa, escala: 1.6, retraso: 0.14 },
    { objeto: lataAzul, escala: 1.6, retraso: 0.18 },
    { objeto: lataRoja, escala: 1.6, retraso: 0.24 },
  ];
  decorado.forEach(({ objeto }) => raiz.add(objeto));

  const gotas = crearGotas();
  gotas.forEach((gota) => raiz.add(gota.malla));

  const cabeza = crearCabeza(pieza, toon);
  cabeza.grupo.position.y = CUELLO_Y;
  torso.add(cabeza.grupo);

  return {
    raiz,
    salto,
    sombra,
    decorado,
    gotas,
    torso,
    cabeza: cabeza.grupo,
    ojos: cabeza.ojos,
    cejas: cabeza.cejas,
  };
}

/**
 * Pata de paloma: muslo emplumado que se estrecha, tarso rosa y tres dedos hacia delante
 * más uno hacia atrás, con uñas. Origen bajo la barriga; el suelo queda en y = -0.8.
 */
function crearPata(pieza, lado) {
  const pata = new THREE.Group();
  pata.position.set(0.3 * lado, -1.0, 0.05);
  pata.rotation.y = lado * 0.18; // las puntas un poco abiertas

  const muslo = pieza(
    deformar(new THREE.CapsuleGeometry(0.19, 0.26, 8, 18), (v) => {
      // Más ancho arriba, se estrecha hacia el tobillo
      const k = mezclar(0.6, 1, limitar((v.y + 0.32) / 0.64, 0, 1));
      v.x *= k;
      v.z *= k;
    }),
    C.plumaje,
  );
  muslo.position.y = -0.2;
  pata.add(muslo);

  const tobillo = new THREE.Vector3(0, -0.73, 0.03);
  pata.add(tramo(pieza, new THREE.Vector3(0, -0.42, 0), tobillo, 0.06, C.pata));
  const nudillo = pieza(new THREE.SphereGeometry(0.075, 14, 10), C.pata);
  nudillo.position.copy(tobillo);
  pata.add(nudillo);

  const geoUna = new THREE.ConeGeometry(0.032, 0.08, 8);
  const dedo = (direccion, largo) => {
    const punta = tobillo.clone().addScaledVector(direccion, largo);
    punta.y = -0.745;
    pata.add(tramo(pieza, tobillo, punta, 0.052, C.pata));
    const una = pieza(geoUna, C.una);
    una.position.copy(punta).addScaledVector(direccion, 0.06);
    una.position.y -= 0.01;
    una.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion);
    pata.add(una);
  };
  for (const angulo of [-0.5, 0, 0.5]) {
    dedo(new THREE.Vector3(Math.sin(angulo), 0, Math.cos(angulo)), 0.34);
  }
  dedo(new THREE.Vector3(0, 0, -1), 0.2);
  return pata;
}

/** Plumas de la cola (abanico por detrás) y puntas de las alas que asoman a los lados. */
function crearPlumas(pieza, toon) {
  const grupo = new THREE.Group();
  const material = toon('#ffffff', { map: texturaPluma() });
  // Pluma colgando desde su base (y = 0) hacia abajo; la textura oscurece la punta
  const pluma = (largo) =>
    pieza(elipsoide(0.15, largo / 2, 0.035, 20).translate(0, -largo / 2, 0), null, { material });

  const cola = new THREE.Group();
  cola.position.set(0, -0.7, -0.5);
  for (const abrir of [-0.36, -0.12, 0.12, 0.36]) {
    const p = pluma(0.78 - Math.abs(abrir) * 0.3);
    // Primero se abre en abanico (z) y luego se inclina hacia atrás (x)
    p.rotation.set(1.15, 0, abrir);
    cola.add(p);
  }
  grupo.add(cola);

  for (const lado of [-1, 1]) {
    const ala = new THREE.Group();
    ala.position.set(0.68 * lado, -0.62, -0.28);
    for (const [abrir, largo] of [
      [0.35, 0.62],
      [0.6, 0.5],
    ]) {
      const p = pluma(largo);
      p.rotation.set(1.0, 0, lado * abrir);
      ala.add(p);
    }
    grupo.add(ala);
  }
  return grupo;
}

/** Cadena gruesa colgada del cuello, apoyada sobre el pecho de la sudadera. */
function crearCadena(toon) {
  const puntos = [];
  for (let i = 0; i <= 12; i++) {
    const s = -1 + (2 * i) / 12;
    const y = 0.05 + 0.45 * s * s;
    const angulo = s * 1.1;
    const r = radioSudadera(y);
    puntos.push(
      new THREE.Vector3(
        Math.sin(angulo) * (r + 0.05),
        y,
        Math.cos(angulo) * (r * FONDO_TORSO + 0.05),
      ),
    );
  }
  const curva = new THREE.CatmullRomCurve3(puntos);
  const cadena = new THREE.Group();
  const material = toon(C.cadena, { emissive: '#2c2c3a' });
  // Eslabón alargado a lo largo de su eje y
  const geometria = new THREE.TorusGeometry(0.062, 0.022, 8, 16).scale(1, 1.35, 1);
  const eslabones = 24;
  const eje = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= eslabones; i++) {
    const eslabon = new THREE.Mesh(geometria, material);
    const u = i / eslabones;
    eslabon.position.copy(curva.getPointAt(u));
    // Cada eslabón sigue la curva y gira 90° respecto al anterior
    eslabon.quaternion.setFromUnitVectors(eje, curva.getTangentAt(u));
    eslabon.rotateY((i % 2) * (Math.PI / 2));
    cadena.add(eslabon);
  }
  return cadena;
}

/** Punto sobre la tela del bolsillo: `px`, `py` en [-1, 1] y `fuera` hacia delante. */
function sobreBolsillo(px, py, fuera) {
  const { y: centroY, alto, abajo, arriba } = BOLSILLO;
  const y = centroY + py * alto;
  const u = px * mezclar(abajo, arriba, (py + 1) / 2);
  const r = radioSudadera(y);
  const angulo = u / r;
  return new THREE.Vector3(
    Math.sin(angulo) * (r + fuera),
    y,
    Math.cos(angulo) * (r * FONDO_TORSO + fuera),
  );
}

/** Cuánto se abomba la tela en (px, py): los dos antebrazos y los puños escondidos. */
function bultoBolsillo(px, py) {
  const { entrada, puno } = MANO_BOLSILLO;
  const a = Math.abs(px);
  // Túnel del antebrazo: alto en el borde abierto y baja hasta el puño
  const tunel = limitar((a - (puno - 0.2)) / (entrada - (puno - 0.2)), 0, 1);
  const brazo = 0.12 * Math.sqrt(tunel) * Math.exp(-((py / 0.9) ** 2));
  // El puño: un bulto redondo al final del túnel
  const nudillos = 0.11 * Math.exp(-(((a - puno) / 0.36) ** 2) - ((py - 0.05) / 0.6) ** 2);
  return Math.max(brazo, nudillos);
}

/**
 * Bolsillo canguro: una almohadilla de esquinas redondeadas cosida por fuera de la
 * barriga, abombada por las dos manos que lleva dentro.
 */
function crearBolsillo(pieza, toon) {
  const geometria = new THREE.SphereGeometry(1, 64, 32);
  const uv = geometria.attributes.uv;
  const cuadrar = (a) => Math.sign(a) * Math.abs(a) ** 0.35;
  deformar(geometria, (v, i) => {
    const px = cuadrar(v.x);
    const py = cuadrar(v.y);
    // La cara de delante se separa de la sudadera; la de atrás queda pegada a ella
    const fuera = v.z > 0 ? 0.012 + v.z * (0.04 + bultoBolsillo(px, py)) : 0.012 + v.z * 0.03;
    v.copy(sobreBolsillo(px, py, fuera));
    uv.setXY(i, (px + 1) / 2, (py + 1) / 2);
  });
  return pieza(geometria, null, {
    material: toon('#ffffff', { map: texturaBolsillo() }),
  });
}

/**
 * Brazo con la mano en el bolsillo: hombro metido en la sudadera, codo hacia fuera y un
 * poco adelantado, y antebrazo que entra por el lado abierto del bolsillo. Las dos cápsulas
 * tienen el mismo radio, así el codo queda redondo y sin escalón.
 */
function crearBrazoBolsillo(pieza, lado) {
  const grupo = new THREE.Group();
  const radio = 0.2;
  const hombro = new THREE.Vector3(0.68 * lado, 0.38, -0.02);
  const codo = new THREE.Vector3(1.12 * lado, -0.2, 0.22);
  // La muñeca acaba bajo la tela, medio hundida en la barriga, junto al puño
  const entrada = sobreBolsillo(MANO_BOLSILLO.entrada * lado, 0, -0.06);
  const muneca = sobreBolsillo((MANO_BOLSILLO.puno + 0.1) * lado, 0, -0.1);
  grupo.add(
    tramo(pieza, hombro, codo, radio, C.sudadera),
    tramo(pieza, codo, muneca, radio, C.sudadera),
  );
  // Puño elástico (un aro) justo antes de entrar al bolsillo
  const direccion = new THREE.Vector3().subVectors(muneca, codo).normalize();
  const puno = pieza(
    new THREE.TorusGeometry(radio - 0.02, 0.05, 10, 24).rotateX(Math.PI / 2).scale(1, 1.4, 1),
    C.sudaderaOscura,
  );
  puno.position.copy(entrada).addScaledVector(direccion, -0.16);
  puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion);
  grupo.add(puno);
  return grupo;
}

/** Perfil (radio, altura) del cuerpo de la lata y de su cúpula metálica. */
const PERFIL_LATA = [
  [0, -0.2],
  [0.1, -0.2],
  [0.118, -0.19],
  [0.12, -0.17],
  [0.12, 0.11],
];
const PERFIL_CUPULA = [
  [0.12, 0.1],
  [0.116, 0.126],
  [0.1, 0.155],
  [0.07, 0.178],
  [0.04, 0.19],
  [0.036, 0.2],
  [0, 0.2],
];
const torno = (perfil) =>
  new THREE.LatheGeometry(
    perfil.map(([r, y]) => new THREE.Vector2(r, y)),
    28,
  );

function crearLata(pieza, color, franja, { conTapa = true } = {}) {
  const lata = new THREE.Group();
  const cuerpo = pieza(torno(PERFIL_LATA), color);
  const etiqueta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1215, 0.1215, 0.2, 28, 1, true, -Math.PI / 2),
    new THREE.MeshToonMaterial({ map: texturaEtiqueta(color, franja) }),
  );
  etiqueta.position.y = -0.04;
  const cupula = pieza(torno(PERFIL_CUPULA), '#d9d4e8');
  const aro = new THREE.Mesh(
    new THREE.TorusGeometry(0.112, 0.012, 8, 28),
    new THREE.MeshToonMaterial({ color: '#b9b2cc' }),
  );
  aro.rotation.x = Math.PI / 2;
  aro.position.y = -0.188;
  const valvula = pieza(new THREE.CylinderGeometry(0.032, 0.034, 0.05, 16), '#f3effb');
  valvula.position.y = 0.225;
  const boquilla = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8),
    new THREE.MeshBasicMaterial({ color: C.contorno }),
  );
  boquilla.rotation.x = Math.PI / 2;
  boquilla.position.set(0, 0.232, 0.03);
  lata.add(cuerpo, etiqueta, cupula, aro, valvula, boquilla);
  if (conTapa) {
    const tapa = pieza(
      new THREE.CylinderGeometry(0.105, 0.112, 0.14, 28).translate(0, 0.17, 0),
      franja,
    );
    lata.add(tapa);
  }
  return lata;
}

/** Charco irregular en el suelo, en coordenadas de la raíz. */
function crearCharco(toon, color, radio, x, z, semilla) {
  const forma = new THREE.Shape();
  const lados = 28;
  for (let i = 0; i <= lados; i++) {
    const a = (i / lados) * Math.PI * 2;
    const r = radio * (1 + 0.16 * Math.sin(a * 3 + semilla) + 0.1 * Math.sin(a * 5 + semilla * 2));
    if (i === 0) forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else forma.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const charco = new THREE.Mesh(new THREE.ShapeGeometry(forma).scale(1, 0.7, 1), toon(color));
  charco.rotation.x = -Math.PI / 2;
  charco.position.set(x, SUELO + 0.01, z);
  return charco;
}

/** Gotas de pintura que saltan de las patas al aterrizar. */
function crearGotas() {
  const colores = ['#ff3dd8', '#3de0ff', '#ffe03d', '#b14bff'];
  const cantidad = 16;
  const vida = 0.75;
  return Array.from({ length: cantidad }, (_, i) => {
    const angulo = (i / cantidad) * Math.PI * 2 + Math.sin(i * 7.1) * 0.3;
    const rapidez = 1.7 + ((i * 37) % 10) / 9;
    const subida = 2.6 + (i % 4) * 0.45;
    const malla = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + (i % 3) * 0.018, 10, 8),
      new THREE.MeshBasicMaterial({ color: colores[i % colores.length] }),
    );
    malla.visible = false;
    return {
      malla,
      actualizar(d) {
        malla.visible = d > 0 && d < vida;
        if (!malla.visible) return;
        malla.position.set(
          Math.cos(angulo) * rapidez * d * 1.2,
          Math.max(SUELO + 0.04 + subida * d - 9 * d * d, SUELO + 0.02),
          Math.sin(angulo) * rapidez * d * 0.7,
        );
        malla.scale.setScalar(1 - (d / vida) ** 2);
      },
    };
  });
}

/**
 * Cabeza de paloma: cráneo en forma de huevo (más ancho en los carrillos), ojos saltones
 * con párpados, cejas gruesas de mal humor, pico corto con la cera blanca y gorra hacia atrás.
 * `grupo` es el pivote en la base del cuello; todo lo demás cuelga de `cara`.
 */
function crearCabeza(pieza, toon) {
  const grupo = new THREE.Group();
  grupo.rotation.order = 'YXZ'; // primero gira, luego cabecea sobre su propio eje
  const cara = new THREE.Group();
  cara.position.y = CRANEO_Y;
  cara.scale.setScalar(ESCALA_CABEZA);
  grupo.add(cara);

  const craneo = pieza(
    deformar(elipsoide(CABEZA.x, CABEZA.y, CABEZA.z, 48), (v) => {
      if (v.y >= 0) return;
      const k = 1 + 0.07 * (-v.y / CABEZA.y);
      v.x *= k;
      v.z *= k;
    }),
    null,
    { material: toon('#ffffff', { map: texturaCabeza() }) },
  );
  cara.add(craneo);

  cara.add(crearPico(pieza));
  cara.add(crearGorra(pieza));

  const ojos = [-1, 1].map((lado) => crearOjo(lado, pieza, toon));
  ojos.forEach((ojo) => cara.add(ojo.grupo));
  const cejas = [-1, 1].map((lado) => crearCeja(lado, pieza));
  cejas.forEach((ceja) => cara.add(ceja.malla));

  return { grupo, ojos, cejas };
}

/**
 * Punto de la superficie del cráneo en (x, y), hundido `hundir` hacia dentro, y la
 * rotación que alinea el eje +z de una pieza con la normal en ese punto.
 */
function sobreCabeza(x, y, hundir) {
  const { x: a, y: b, z: c } = CABEZA;
  const z = c * Math.sqrt(Math.max(0, 1 - (x / a) ** 2 - (y / b) ** 2));
  const normal = new THREE.Vector3(x / (a * a), y / (b * b), z / (c * c)).normalize();
  const posicion = new THREE.Vector3(x, y, z).addScaledVector(normal, -hundir);
  const giro = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  return { posicion, giro };
}

/** Pico corto, afilado y un poco ganchudo, con la cera blanca abultada en la base. */
function crearPico(pieza) {
  const grupo = new THREE.Group();
  const { posicion, giro } = sobreCabeza(0, -0.14, 0.12);
  grupo.position.copy(posicion);
  grupo.quaternion.copy(giro);
  grupo.rotateX(0.3); // apunta un poco hacia abajo

  const pico = pieza(
    deformar(elipsoide(0.13, 0.1, 0.3, 24).translate(0, 0, 0.1), (v) => {
      const k = limitar((v.z + 0.2) / 0.6, 0, 1);
      v.x *= 1 - 0.65 * k ** 1.2;
      v.y = v.y * (1 - 0.45 * k) - 0.07 * k * k;
    }),
    C.pico,
  );
  grupo.add(pico);
  for (const lado of [-1, 1]) {
    const cera = pieza(elipsoide(0.075, 0.06, 0.11, 16), C.cera);
    cera.position.set(0.045 * lado, 0.075, 0.1);
    cera.rotation.z = lado * 0.25;
    grupo.add(cera);
  }
  return grupo;
}

/**
 * Gorra de béisbol puesta del revés: copa, banda, visera hacia atrás, botón arriba y la
 * abertura del cierre con su tira sobre la frente.
 */
function crearGorra(pieza) {
  const gorra = new THREE.Group();
  gorra.position.set(0, 0.47, -0.02);
  gorra.rotation.x = -0.08; // la frente sube y la visera cae un poco por detrás

  const copa = pieza(
    deformar(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), (v) =>
      v.set(v.x * 0.63, v.y * 0.52, v.z * 0.66),
    ),
    C.gorra,
  );
  const banda = pieza(
    new THREE.TorusGeometry(0.64, 0.045, 8, 56).rotateX(Math.PI / 2).scale(1, 1, 1.03),
    C.gorraOscura,
  );
  banda.position.y = 0.02;
  const boton = pieza(new THREE.SphereGeometry(0.055, 12, 8), C.gorraOscura);
  boton.position.y = 0.525;
  gorra.add(copa, banda, boton);

  // Visera hacia atrás, girada un poco hacia un lado y con la punta algo levantada
  const pivoteVisera = new THREE.Group();
  pivoteVisera.rotation.y = 0.25;
  const visera = pieza(elipsoide(0.44, 0.045, 0.4, 32), C.gorraOscura);
  visera.position.set(0, 0.01, -0.7);
  visera.rotation.x = 0.3;
  pivoteVisera.add(visera);
  gorra.add(pivoteVisera);

  // Abertura del cierre: media cúpula oscura con la base plana sobre la banda
  const abertura = pieza(
    deformar(elipsoide(0.18, 0.15, 0.06, 20), (v) => {
      v.y = Math.max(v.y, 0);
    }),
    C.abertura,
  );
  abertura.position.set(0, 0.02, 0.635);
  const tira = pieza(new THREE.CapsuleGeometry(0.03, 0.26, 4, 10).rotateZ(Math.PI / 2), C.gorra);
  tira.position.set(0, 0.06, 0.685);
  gorra.add(abertura, tira);
  return gorra;
}

// Ojo saltón: elipsoide grande que sale bastante de la cara
const OJO = { ancho: 0.25, alto: 0.28, fondo: 0.2, hundido: 0.1 };

function crearOjo(lado, pieza, toon) {
  const grupo = new THREE.Group();
  const { posicion, giro } = sobreCabeza(0.31 * lado, 0.08, OJO.hundido);
  grupo.position.copy(posicion);
  grupo.quaternion.copy(giro);

  // El iris va pintado en el blanco y se mueve desplazando la textura: así queda
  // siempre pegado a la curva del ojo y el párpado lo tapa limpiamente
  const iris = texturaOjo();
  const blanco = pieza(elipsoide(OJO.ancho, OJO.alto, OJO.fondo, 32), null, {
    material: toon('#ffffff', { map: iris }),
  });
  grupo.add(blanco);

  // Párpado: media esfera del color de la cabeza que gira desde atrás hasta tapar el ojo.
  // Abierto tapa la parte de arriba del ojo: la mirada desganada del boceto.
  const reposo = -0.85;
  const parpado = new THREE.Group();
  const tamano = new THREE.Vector3(OJO.ancho + 0.01, OJO.alto + 0.01, OJO.fondo + 0.012);
  parpado.scale.copy(tamano);
  const tapa = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    toon(C.plumaje, { side: THREE.DoubleSide }),
  );
  parpado.add(tapa);
  grupo.add(parpado);

  // Raya de ojo cerrado, pegada a la curva del párpado
  const puntos = [];
  for (let i = 0; i <= 10; i++) {
    const x = -0.16 + (0.32 * i) / 10;
    const y = 0.02 - 0.07 * (1 - (x / 0.16) ** 2);
    const z = tamano.z * Math.sqrt(Math.max(0, 1 - (x / tamano.x) ** 2 - (y / tamano.y) ** 2));
    puntos.push(new THREE.Vector3(x, y, z + 0.006));
  }
  const linea = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 24, 0.018, 6),
    new THREE.MeshBasicMaterial({ color: C.contorno }),
  );
  grupo.add(linea);

  return {
    grupo,
    /**
     * `cierre` 0..1 baja el párpado; (x, y) es cuánto se mueve la pupila vista de frente;
     * `apretar` 0..1 achata el ojo cuando lo cierra a propósito.
     */
    ajustar(cierre, x, y, apretar) {
      tapa.rotation.set(mezclar(reposo, Math.PI / 2 + 0.12, cierre), 0, lado * 0.15 * (1 - cierre));
      const largo = Math.asin(limitar(x / OJO.ancho, -0.9, 0.9));
      const alto = Math.asin(limitar(y / OJO.alto, -0.9, 0.9));
      iris.offset.set(-largo / (Math.PI * 2), -alto / Math.PI);
      linea.visible = cierre > 0.92;
      grupo.scale.set(1 + apretar * 0.04, 1 - apretar * 0.1, 1);
    },
  };
}

/** Ceja gruesa y oscura sobre el ojo: de mal humor normalmente, preocupada con los ojos cerrados. */
function crearCeja(lado, pieza) {
  const malla = new THREE.Group();
  const { posicion, giro } = sobreCabeza(0.3 * lado, 0.32, -0.08);
  malla.position.copy(posicion);
  malla.quaternion.copy(giro);
  const trazo = pieza(new THREE.CapsuleGeometry(0.07, 0.26, 6, 12).rotateZ(Math.PI / 2), C.ceja);
  malla.add(trazo);
  return {
    malla,
    ajustar(preocupado) {
      // Normal: extremo interior abajo (ceño fruncido). Con ojos cerrados: interior arriba.
      trazo.rotation.z = lado * mezclar(0.45, -0.3, preocupado);
      trazo.position.y = preocupado * 0.06;
    },
  };
}

/**
 * Plumaje de la cabeza: gris azulado, más claro arriba y con el brillo morado y verdoso
 * del cuello abajo. Proyección equirectangular: el frente (+z) está en x = 1/4 del ancho.
 */
function texturaCabeza() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 256;
  const c = lienzo.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#a3aad6');
  g.addColorStop(0.45, C.plumaje);
  g.addColorStop(0.72, '#8173b3');
  g.addColorStop(1, '#7556a4');
  c.fillStyle = g;
  c.fillRect(0, 0, 512, 256);
  // Reflejos verdosos en los lados del cuello (x = 0 y 512 es un lado, 256 el otro)
  for (const x of [0, 256, 512]) {
    const brillo = c.createRadialGradient(x, 215, 0, x, 215, 70);
    brillo.addColorStop(0, 'rgba(90, 210, 190, 0.35)');
    brillo.addColorStop(1, 'rgba(90, 210, 190, 0)');
    c.fillStyle = brillo;
    c.fillRect(0, 0, 512, 256);
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

/**
 * Blanco del ojo con el iris, la pupila y el brillo, mirando al frente (u = 1/4, v = 1/2).
 * Medidas en ángulo: 1 radián ≈ 40,7 px en ambos ejes.
 */
function texturaOjo() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 128;
  const c = lienzo.getContext('2d');
  c.fillStyle = C.ojo;
  c.fillRect(0, 0, 256, 128);
  const elipse = (x, y, rx, ry, color) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };
  elipse(64, 64, 25, 27, '#1f0f24');
  elipse(64, 64, 22, 24, C.iris);
  elipse(64, 65, 15, 17, C.pupila);
  elipse(72, 55, 6, 6, '#ffffff');
  elipse(57, 73, 2.5, 2.5, '#ffffff');
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.wrapS = THREE.RepeatWrapping;
  textura.anisotropy = 4;
  return textura;
}

/** Pluma (v = 1 en la base, 0 en la punta): banda oscura en medio y punta oscura. */
function texturaPluma() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 4;
  lienzo.height = 128;
  const c = lienzo.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, C.plumaje);
  g.addColorStop(0.7, '#6c74a6');
  g.addColorStop(0.78, C.plumajeOscuro);
  g.addColorStop(1, C.plumajeOscuro);
  c.fillStyle = g;
  c.fillRect(0, 0, 4, 128);
  c.fillStyle = C.plumajeOscuro;
  c.fillRect(0, 46, 4, 12);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

/** Etiqueta de la lata: color base, franja y un chorreón con estrella. */
function texturaEtiqueta(color, franja) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 128;
  const c = lienzo.getContext('2d');
  c.fillStyle = color;
  c.fillRect(0, 0, 256, 128);
  c.fillStyle = franja;
  c.fillRect(0, 34, 256, 34);
  // Chorreones que caen de la franja
  for (const [x, largo] of [
    [30, 40],
    [92, 22],
    [150, 50],
    [214, 30],
  ]) {
    c.fillRect(x - 5, 60, 10, largo);
    c.beginPath();
    c.arc(x, 60 + largo, 7, 0, Math.PI * 2);
    c.fill();
  }
  // Estrellita en la parte que mira al frente
  c.fillStyle = '#ffffff';
  c.strokeStyle = C.contorno;
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 7 : 16;
    c.lineTo(64 + Math.cos(a) * r, 51 + Math.sin(a) * r);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = C.contorno;
  c.fillRect(0, 0, 256, 4);
  c.fillRect(0, 124, 256, 4);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function texturaSombra() {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 64;
  const c = lienzo.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(lienzo);
}

/** Tela del bolsillo con costuras, sombra en las aberturas y los dos puños escondidos. */
function texturaBolsillo() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = 256;
  const c = lienzo.getContext('2d');
  c.fillStyle = C.bolsillo;
  c.fillRect(0, 0, 512, 256);
  // Sombra dentro de las aberturas de los lados, por donde entran las manos
  for (const [x0, x1] of [
    [0, 44],
    [512, 468],
  ]) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#2b2c16');
    g.addColorStop(1, 'rgba(43, 44, 22, 0)');
    c.fillStyle = g;
    c.fillRect(Math.min(x0, x1), 0, 44, 256);
  }
  // Bulto de cada puño (coincide con MANO_BOLSILLO.puno): luz arriba y pliegues de la
  // tela que salen de su abertura
  c.lineCap = 'round';
  for (const lado of [-1, 1]) {
    const x = ((lado * MANO_BOLSILLO.puno + 1) / 2) * 512;
    const luz = c.createRadialGradient(x + 14, 100, 4, x + 14, 100, 76);
    luz.addColorStop(0, 'rgba(225, 228, 170, 0.32)');
    luz.addColorStop(1, 'rgba(225, 228, 170, 0)');
    c.fillStyle = luz;
    c.fillRect(0, 0, 512, 256);
    c.strokeStyle = 'rgba(38, 39, 18, 0.45)';
    c.lineWidth = 5;
    const borde = lado === -1 ? 14 : 498;
    for (const [y0, y1] of [
      [70, 92],
      [178, 160],
    ]) {
      c.beginPath();
      c.moveTo(borde, y0);
      c.quadraticCurveTo(x - lado * 60, (y0 + y1) / 2 + 6, x - lado * 22, y1);
      c.stroke();
    }
  }
  // Pespunte alrededor del borde
  c.strokeStyle = 'rgba(230, 232, 190, 0.4)';
  c.lineWidth = 4;
  c.setLineDash([12, 9]);
  c.strokeRect(26, 22, 460, 212);
  c.setLineDash([]);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}
