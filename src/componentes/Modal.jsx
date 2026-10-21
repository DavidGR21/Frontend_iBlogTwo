/**
 * Ventana modal sobre la página (en el móvil sube desde abajo como una hoja).
 * Esc o clic en el fondo la cierran; bloquea el scroll y devuelve el foco al cerrar.
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconoCerrar } from './iconos/Iconos.jsx';

export function Modal({ titulo, alCerrar, children }) {
  const idTitulo = useId();
  const caja = useRef(null);
  const alCerrarRef = useRef(alCerrar);

  useEffect(() => {
    alCerrarRef.current = alCerrar;
  });

  useEffect(() => {
    const anterior = document.activeElement;
    const desbordamiento = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caja.current?.focus();
    const alTeclear = (e) => e.key === 'Escape' && alCerrarRef.current();
    window.addEventListener('keydown', alTeclear);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = desbordamiento;
      anterior?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="modal-fondo" onClick={(e) => e.target === e.currentTarget && alCerrar()}>
      <div
        ref={caja}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
      >
        <header className="modal-cabecera">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="modal-cerrar" onClick={alCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </header>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
