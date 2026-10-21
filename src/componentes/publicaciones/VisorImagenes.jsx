/**
 * Visor de imágenes a pantalla completa, sobre la misma página (no abre pestañas).
 *  - Flechas o ← / → para cambiar, Esc o clic en el fondo para cerrar.
 *  - En el móvil se desliza con el dedo.
 *  - Miniaturas abajo cuando hay varias.
 * Bloquea el scroll de la página y devuelve el foco a donde estaba al cerrar.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconoAnterior, IconoCerrar, IconoSiguiente } from '../iconos/Iconos.jsx';

const DESLIZAR_MINIMO = 50; // px para que un deslizamiento cuente como cambio de imagen

export function VisorImagenes({ imagenes, inicial = 0, alCerrar }) {
  const [indice, setIndice] = useState(inicial);
  const [direccion, setDireccion] = useState(0); // -1 / 1: hacia dónde anima la imagen
  const cerrarRef = useRef(null);
  const toque = useRef(null);
  const alCerrarRef = useRef(alCerrar);

  useEffect(() => {
    alCerrarRef.current = alCerrar;
  });

  const total = imagenes.length;
  const varias = total > 1;

  function ir(paso) {
    if (!varias) return;
    setDireccion(paso);
    setIndice((i) => (i + paso + total) % total);
  }
  const irRef = useRef(ir);
  useEffect(() => {
    irRef.current = ir;
  });

  useEffect(() => {
    const anterior = document.activeElement;
    const desbordamiento = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();

    const alTeclear = (e) => {
      if (e.key === 'Escape') alCerrarRef.current();
      else if (e.key === 'ArrowLeft') irRef.current(-1);
      else if (e.key === 'ArrowRight') irRef.current(1);
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = desbordamiento;
      anterior?.focus?.();
    };
  }, []);

  const imagen = imagenes[indice];

  return createPortal(
    <div
      className="visor"
      role="dialog"
      aria-modal="true"
      aria-label={imagen.descripcion ?? `Imagen ${indice + 1} de ${total}`}
      onClick={(e) => e.target === e.currentTarget && alCerrar()}
      onPointerDown={(e) => {
        toque.current = e.pointerType === 'mouse' ? null : e.clientX;
      }}
      onPointerUp={(e) => {
        if (toque.current === null) return;
        const dx = e.clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > DESLIZAR_MINIMO) ir(dx < 0 ? 1 : -1);
      }}
    >
      <div className="visor-barra">
        {varias && (
          <span className="visor-contador">
            {indice + 1} / {total}
          </span>
        )}
        <button
          ref={cerrarRef}
          type="button"
          className="visor-boton visor-cerrar"
          onClick={alCerrar}
          aria-label="Cerrar"
        >
          <IconoCerrar tamano={24} />
        </button>
      </div>

      {varias && (
        <button
          type="button"
          className="visor-boton visor-flecha visor-anterior"
          onClick={() => ir(-1)}
          aria-label="Imagen anterior"
        >
          <IconoAnterior tamano={28} />
        </button>
      )}

      <img
        key={imagen.id}
        className="visor-imagen"
        style={{ '--desde': `${direccion * 40}px` }}
        src={imagen.url}
        alt={imagen.descripcion ?? `Imagen ${indice + 1} de ${total}`}
        draggable={false}
      />

      {varias && (
        <button
          type="button"
          className="visor-boton visor-flecha visor-siguiente"
          onClick={() => ir(1)}
          aria-label="Imagen siguiente"
        >
          <IconoSiguiente tamano={28} />
        </button>
      )}

      {varias && (
        <div className="visor-miniaturas">
          {imagenes.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={i === indice ? 'activa' : ''}
              onClick={() => {
                setDireccion(i > indice ? 1 : -1);
                setIndice(i);
              }}
              aria-label={`Ir a la imagen ${i + 1}`}
              aria-current={i === indice}
            >
              <img src={m.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
