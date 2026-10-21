/**
 * Confirmaciones en una ventana modal (en lugar de window.confirm).
 *   const confirmar = useConfirmar();
 *   if (!(await confirmar({ titulo: '¿Eliminar?', mensaje: '…', confirmar: 'Eliminar' }))) return;
 * Devuelve una promesa: true si se acepta; false si se cancela, se pulsa Esc o se toca fuera.
 * Por defecto es una acción peligrosa (botón rojo) y el foco empieza en "Cancelar".
 */
import { useCallback, useState } from 'react';
import { Modal } from '../componentes/Modal.jsx';
import { ConfirmacionContexto } from './contextos.js';

export function ProveedorConfirmacion({ children }) {
  const [pendiente, setPendiente] = useState(null); // { titulo, mensaje, confirmar, cancelar, peligro, resolver }

  const confirmar = useCallback(
    (opciones) =>
      new Promise((resolver) => {
        setPendiente({
          titulo: '¿Seguro?',
          confirmar: 'Aceptar',
          cancelar: 'Cancelar',
          peligro: true,
          ...opciones,
          resolver,
        });
      }),
    [],
  );

  function responder(respuesta) {
    pendiente?.resolver(respuesta);
    setPendiente(null);
  }

  return (
    <ConfirmacionContexto.Provider value={confirmar}>
      {children}
      {pendiente && (
        <Modal
          titulo={pendiente.titulo}
          alCerrar={() => responder(false)}
          className="modal-confirmar"
        >
          {pendiente.mensaje && <p className="confirmar-mensaje">{pendiente.mensaje}</p>}
          <div className="confirmar-acciones">
            <button
              type="button"
              className="boton-secundario"
              data-enfocar
              onClick={() => responder(false)}
            >
              {pendiente.cancelar}
            </button>
            <button
              type="button"
              className={pendiente.peligro ? 'boton-confirmar-peligro' : 'boton'}
              onClick={() => responder(true)}
            >
              {pendiente.confirmar}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmacionContexto.Provider>
  );
}
