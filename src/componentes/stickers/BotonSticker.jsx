/**
 * Botón que abre el selector de stickers de KLIPY (lo sirve el backend: /stickers).
 *  - Computadora: panel flotante junto al botón (encima si cabe, si no debajo), sin tapar la
 *    página; se cierra con Esc o al hacer clic fuera.
 *  - Celular (≤ 860 px): hoja que sube desde abajo, igual que los modales de la app, con el
 *    buscador arriba y la cuadrícula con su propio scroll.
 * Arriba se ven las tendencias; al escribir se busca (con una pequeña espera entre teclas).
 * La cuadrícula carga más al llegar al final. Si el backend no tiene llave de KLIPY, el
 * botón no se muestra.
 *
 * KLIPY exige que el buscador diga "Search KLIPY" (aquí, en español) y pide mostrar su marca.
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { buscarStickers, stickersDisponibles, tendenciasStickers } from '../../api/stickers.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { IconoBuscar, IconoCerrar, IconoSticker } from '../iconos/Iconos.jsx';
import { MensajeError } from '../MensajeError.jsx';

const ESPERA_BUSQUEDA = 400; // ms sin teclear antes de buscar
const PANEL_ANCHO = 360;
const PANEL_ALTO = 430;
const MARGEN = 8;
const CONSULTA_MOVIL = '(max-width: 860px)';

function useEsMovil() {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia(CONSULTA_MOVIL);
      consulta.addEventListener('change', avisar);
      return () => consulta.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CONSULTA_MOVIL).matches,
  );
}

function useStickersDisponibles() {
  const [disponible, setDisponible] = useState(false);
  useEffect(() => {
    let vigente = true;
    stickersDisponibles().then((si) => vigente && setDisponible(si));
    return () => {
      vigente = false;
    };
  }, []);
  return disponible;
}

/** Posición fija del panel junto al botón, sin salirse de la ventana. */
function calcularPosicion(boton) {
  const rect = boton.getBoundingClientRect();
  const left = Math.min(
    Math.max(rect.right - PANEL_ANCHO, MARGEN),
    window.innerWidth - PANEL_ANCHO - MARGEN,
  );
  const arriba = rect.top - PANEL_ALTO - MARGEN;
  const top =
    arriba >= MARGEN
      ? arriba
      : Math.max(MARGEN, Math.min(rect.bottom + MARGEN, window.innerHeight - PANEL_ALTO - MARGEN));
  return { top, left };
}

function SelectorStickers({ ancla, alElegir, alCerrar }) {
  const esMovil = useEsMovil();
  const panel = useRef(null);
  const buscador = useRef(null);
  const caja = useRef(null);
  const centinela = useRef(null);
  const alCerrarRef = useRef(alCerrar);
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [posicion, setPosicion] = useState(null);

  useEffect(() => {
    alCerrarRef.current = alCerrar;
  });

  useEffect(() => {
    const espera = setTimeout(() => setConsulta(texto.trim().slice(0, 50)), ESPERA_BUSQUEDA);
    return () => clearTimeout(espera);
  }, [texto]);

  const lista = usePaginado(
    (cursor) => (consulta ? buscarStickers(consulta, cursor) : tendenciasStickers(cursor)),
    consulta ? `q:${consulta}` : 'tendencias',
  );
  const { hayMas, cargando, cargarMas } = lista;

  // Computadora: el panel sigue al botón si la página se desplaza o cambia de tamaño
  useLayoutEffect(() => {
    if (esMovil || !ancla.current) return undefined;
    const colocar = () => ancla.current && setPosicion(calcularPosicion(ancla.current));
    colocar();
    window.addEventListener('resize', colocar);
    window.addEventListener('scroll', colocar, true);
    return () => {
      window.removeEventListener('resize', colocar);
      window.removeEventListener('scroll', colocar, true);
    };
  }, [esMovil, ancla]);

  // Esc o clic fuera (en el celular, tocar el fondo oscuro) lo cierran
  useEffect(() => {
    const tecla = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      alCerrarRef.current({ devolverFoco: true });
    };
    const fuera = (e) => {
      if (!panel.current?.contains(e.target) && !ancla.current?.contains(e.target)) {
        alCerrarRef.current();
      }
    };
    document.addEventListener('keydown', tecla);
    document.addEventListener('pointerdown', fuera);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('pointerdown', fuera);
    };
  }, [ancla]);

  // En el celular la hoja tapa la página: se bloquea su scroll. En la compu se enfoca el
  // buscador (en el celular no, para que el teclado no tape los stickers al abrir).
  useEffect(() => {
    if (!esMovil) {
      buscador.current?.focus();
      return undefined;
    }
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = antes;
    };
  }, [esMovil]);

  // Nueva búsqueda: volver arriba
  useEffect(() => {
    if (caja.current) caja.current.scrollTop = 0;
  }, [consulta]);

  // Scroll infinito dentro de la cuadrícula
  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo || !hayMas || cargando) return undefined;
    const observador = new IntersectionObserver(
      ([entrada]) => entrada.isIntersecting && cargarMas(),
      {
        root: caja.current,
        rootMargin: '160px',
      },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [hayMas, cargando, cargarMas]);

  const sinResultados = !lista.cargando && !lista.error && lista.items.length === 0;
  const esqueletos = lista.cargando ? (lista.items.length ? 4 : 12) : 0;

  const contenido = (
    <div
      ref={panel}
      className={`stickers-panel ${esMovil ? 'stickers-hoja' : 'stickers-flotante'}`}
      role="dialog"
      aria-label="Elegir un sticker"
      style={
        esMovil
          ? undefined
          : {
              top: posicion?.top ?? 0,
              left: posicion?.left ?? 0,
              visibility: posicion ? 'visible' : 'hidden',
            }
      }
    >
      {esMovil && <span className="stickers-asa" aria-hidden="true" />}

      <div className="stickers-cabecera">
        <label className="stickers-buscador">
          <IconoBuscar tamano={18} />
          <input
            ref={buscador}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar en KLIPY"
            aria-label="Buscar stickers en KLIPY"
            maxLength={50}
            enterKeyHint="search"
            autoComplete="off"
          />
          {texto && (
            <button
              type="button"
              className="stickers-limpiar"
              aria-label="Borrar búsqueda"
              onClick={() => {
                setTexto('');
                buscador.current?.focus();
              }}
            >
              <IconoCerrar tamano={14} />
            </button>
          )}
        </label>
        {esMovil && (
          <button
            type="button"
            className="stickers-cerrar"
            aria-label="Cerrar stickers"
            onClick={() => alCerrar()}
          >
            <IconoCerrar tamano={18} />
          </button>
        )}
      </div>

      <p className="stickers-titulo" aria-live="polite">
        {consulta ? `Resultados para “${consulta}”` : 'Tendencias'}
      </p>

      <div ref={caja} className="stickers-caja">
        <MensajeError error={lista.error} />
        {sinResultados && (
          <p className="stickers-vacio">
            <IconoSticker tamano={30} />
            {consulta
              ? `No encontramos stickers para “${consulta}”.`
              : 'No hay stickers por ahora.'}
          </p>
        )}

        <ul className="stickers-rejilla">
          {lista.items.map((sticker) => (
            <li key={sticker.id}>
              <button
                type="button"
                className="stickers-opcion"
                onClick={() => alElegir(sticker)}
                title={sticker.titulo}
                aria-label={sticker.titulo || 'Sticker'}
              >
                <img
                  src={sticker.miniatura}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
            </li>
          ))}
          {Array.from({ length: esqueletos }, (_, i) => (
            <li key={`esqueleto-${i}`} aria-hidden="true">
              <span className="stickers-opcion stickers-esqueleto" />
            </li>
          ))}
        </ul>
        <div ref={centinela} className="stickers-centinela" />
      </div>

      <p className="stickers-marca">
        Powered by <strong>KLIPY</strong>
      </p>
    </div>
  );

  return createPortal(
    esMovil ? <div className="stickers-fondo">{contenido}</div> : contenido,
    document.body,
  );
}

/** `alElegir(sticker)` recibe { id, titulo, url, miniatura, ancho, alto }. */
export function BotonSticker({ alElegir, deshabilitado = false, className = '' }) {
  const disponible = useStickersDisponibles();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);

  if (!disponible) return null;

  const cerrar = ({ devolverFoco = false } = {}) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        className={`boton-sticker ${abierto ? 'activo' : ''} ${className}`}
        aria-label="Enviar un sticker"
        title="Stickers"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        disabled={deshabilitado}
        onClick={() => setAbierto((a) => !a)}
      >
        <IconoSticker tamano={20} />
      </button>
      {abierto && (
        <SelectorStickers
          ancla={boton}
          alCerrar={cerrar}
          alElegir={(sticker) => {
            cerrar({ devolverFoco: true });
            alElegir(sticker);
          }}
        />
      )}
    </>
  );
}
