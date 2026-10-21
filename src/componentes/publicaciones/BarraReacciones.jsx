/**
 * Reacciones al estilo de Facebook.
 *  - ResumenReacciones: los iconos de las reacciones más usadas y el total.
 *  - BotonReaccionar: un clic pone "Me gusta" (o quita la reacción propia). Al dejar el
 *    puntero encima (o mantener pulsado en el móvil, o ↑ con el teclado) sube el selector
 *    con las 7 reacciones, que aparecen una tras otra con un rebote.
 * El cambio se ve al instante (optimista) y se deshace si el servidor falla.
 */
import { useEffect, useRef, useState } from 'react';
import { quitarReaccion, reaccionar } from '../../api/publicaciones.js';
import { REACCIONES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { IconoMeGusta } from '../iconos/Iconos.jsx';
import { IconoReaccion } from '../iconos/IconoReaccion.jsx';

const ESPERA_ABRIR = 450; // ms con el puntero encima antes de mostrar el selector
const ESPERA_CERRAR = 350;
const PULSACION_LARGA = 420;

const datosDe = (tipo) => REACCIONES.find((r) => r.tipo === tipo);

/** Contadores después de cambiar la reacción propia de `antes` a `despues` (o quitarla). */
function recontar(reacciones = {}, antes, despues) {
  const nuevas = { ...reacciones };
  if (antes) nuevas[antes] = Math.max((nuevas[antes] ?? 1) - 1, 0);
  if (despues) nuevas[despues] = (nuevas[despues] ?? 0) + 1;
  return nuevas;
}

export function ResumenReacciones({ reacciones = {} }) {
  const usadas = REACCIONES.filter(({ tipo }) => reacciones[tipo] > 0).sort(
    (a, b) => reacciones[b.tipo] - reacciones[a.tipo],
  );
  const total = usadas.reduce((suma, { tipo }) => suma + reacciones[tipo], 0);
  if (total === 0) return <span />;

  return (
    <span
      className="resumen-reacciones"
      title={usadas.map(({ tipo, nombre }) => `${nombre}: ${reacciones[tipo]}`).join('\n')}
    >
      <span className="resumen-iconos">
        {usadas.slice(0, 3).map(({ tipo }) => (
          <IconoReaccion key={tipo} tipo={tipo} tamano={20} />
        ))}
      </span>
      {total}
    </span>
  );
}

export function BotonReaccionar({ publicacion, alCambiar }) {
  const { avisar } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pulso, setPulso] = useState(0); // cambia para repetir la animación del botón
  const temporizador = useRef(null);
  const fuePulsacionLarga = useRef(false);
  const raiz = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  // Abierto con el dedo o el teclado: se cierra al tocar fuera
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (!raiz.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  const programar = (accion, ms) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(accion, ms);
  };
  const cerrar = () => {
    clearTimeout(temporizador.current);
    setAbierto(false);
  };

  async function elegir(tipo) {
    cerrar();
    if (enviando) return;
    const antes = publicacion.miReaccion ?? null;
    const despues = antes === tipo ? null : tipo;
    setPulso((p) => p + 1);
    alCambiar((p) => ({
      ...p,
      miReaccion: despues,
      reacciones: recontar(p.reacciones, antes, despues),
    }));

    setEnviando(true);
    try {
      const resultado = despues
        ? await reaccionar(publicacion.id, despues)
        : await quitarReaccion(publicacion.id);
      if (resultado) alCambiar((p) => ({ ...p, miReaccion: despues, ...resultado }));
    } catch (e) {
      // Deshacer sobre la versión actual (puede haber llegado otra reacción entre medias)
      alCambiar((p) => ({
        ...p,
        miReaccion: antes,
        reacciones: recontar(p.reacciones, despues, antes),
      }));
      avisar(e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  const mia = datosDe(publicacion.miReaccion);

  return (
    <div
      ref={raiz}
      className="reaccionar"
      onPointerEnter={(e) =>
        e.pointerType === 'mouse' && programar(() => setAbierto(true), ESPERA_ABRIR)
      }
      onPointerLeave={(e) =>
        e.pointerType === 'mouse' && programar(() => setAbierto(false), ESPERA_CERRAR)
      }
      onKeyDown={(e) => {
        if (e.key === 'Escape') cerrar();
      }}
    >
      <div
        className={`selector-reacciones ${abierto ? 'abierto' : ''}`}
        role="toolbar"
        aria-label="Elegir reacción"
        aria-hidden={!abierto}
      >
        {REACCIONES.map(({ tipo, nombre }, i) => (
          <button
            key={tipo}
            type="button"
            className={`selector-opcion ${publicacion.miReaccion === tipo ? 'elegida' : ''}`}
            style={{ '--i': i }}
            onClick={() => elegir(tipo)}
            tabIndex={abierto ? 0 : -1}
            aria-label={nombre}
          >
            <span className="selector-nombre">{nombre}</span>
            <IconoReaccion tipo={tipo} tamano={38} animado={abierto} />
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`accion-post ${mia ? 'reaccionado' : ''}`}
        style={mia ? { '--color-reaccion': mia.color } : undefined}
        aria-pressed={Boolean(mia)}
        aria-haspopup="true"
        aria-expanded={abierto}
        title="Mantén pulsado o pulsa ↑ para elegir otra reacción"
        onPointerDown={(e) => {
          fuePulsacionLarga.current = false;
          if (e.pointerType !== 'mouse') {
            programar(() => {
              fuePulsacionLarga.current = true;
              setAbierto(true);
            }, PULSACION_LARGA);
          }
        }}
        onPointerUp={(e) =>
          e.pointerType !== 'mouse' && !abierto && clearTimeout(temporizador.current)
        }
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setAbierto(true);
          }
        }}
        onClick={() => {
          if (fuePulsacionLarga.current) {
            fuePulsacionLarga.current = false;
            return;
          }
          elegir(mia ? mia.tipo : 'me_gusta');
        }}
      >
        <span key={pulso} className={pulso ? 'accion-pulso' : ''}>
          {mia ? (
            <IconoReaccion tipo={mia.tipo} tamano={20} animado={pulso > 0} />
          ) : (
            <IconoMeGusta />
          )}
        </span>
        {mia ? mia.nombre : 'Me gusta'}
      </button>
    </div>
  );
}
