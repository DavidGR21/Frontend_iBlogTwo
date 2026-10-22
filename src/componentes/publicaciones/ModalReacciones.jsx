/**
 * Quién reaccionó a una publicación.
 *  - Arriba, pestañas: "Todas" y una por cada reacción usada (icono + total), subrayadas con
 *    el color de la reacción. En el móvil se deslizan de lado si no caben.
 *  - Debajo, la lista (con su propio scroll, así las pestañas no se mueven): foto con la
 *    reacción encima, nombre y usuario, y una etiqueta con la reacción a la derecha.
 * Mientras carga se ven filas "esqueleto" en lugar de un spinner.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { listarReacciones } from '../../api/publicaciones.js';
import { REACCIONES } from '../../config.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { useSesion } from '../../hooks/useSesion.js';
import { nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { IconoReaccion } from '../iconos/IconoReaccion.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { Modal } from '../Modal.jsx';

const FILAS_ESQUELETO = 5;

const datosDe = (tipo) => REACCIONES.find((r) => r.tipo === tipo);

function FilaEsqueleto() {
  return (
    <li className="reaccion-fila reaccion-esqueleto" aria-hidden="true">
      <span className="esqueleto esqueleto-avatar" />
      <span className="reaccion-textos">
        <span className="esqueleto esqueleto-linea" />
        <span className="esqueleto esqueleto-linea corta" />
      </span>
    </li>
  );
}

export function ModalReacciones({ publicacionId, reacciones = {}, alCerrar }) {
  const { usuario: yo } = useSesion();
  const [tipo, setTipo] = useState(null); // null = todas
  const idPanel = useId();
  const pestanaActiva = useRef(null);
  const lista = usePaginado(
    (cursor) => listarReacciones(publicacionId, tipo ?? undefined, cursor),
    `${publicacionId}:${tipo ?? 'todas'}`,
  );

  const usadas = REACCIONES.filter((r) => reacciones[r.tipo] > 0).sort(
    (a, b) => reacciones[b.tipo] - reacciones[a.tipo],
  );
  const total = usadas.reduce((suma, r) => suma + reacciones[r.tipo], 0);

  // En el móvil la pestaña elegida puede quedar fuera de la vista: se desliza hasta ella
  useEffect(() => {
    pestanaActiva.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tipo]);

  const pestanas = [
    { valor: null, contenido: <span>Todas</span>, cantidad: total, etiqueta: 'Todas' },
    ...usadas.map((r) => ({
      valor: r.tipo,
      contenido: <IconoReaccion tipo={r.tipo} tamano={22} />,
      cantidad: reacciones[r.tipo],
      etiqueta: r.nombre,
      color: r.color,
    })),
  ];

  const primeraCarga = lista.cargando && lista.items.length === 0;

  return (
    <Modal titulo="Reacciones" alCerrar={alCerrar} className="modal-reacciones">
      <div className="reacciones-pestanas" role="tablist" aria-label="Filtrar por reacción">
        {pestanas.map((p) => {
          const activa = tipo === p.valor;
          return (
            <button
              key={p.valor ?? 'todas'}
              ref={activa ? pestanaActiva : undefined}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={idPanel}
              aria-label={`${p.etiqueta}: ${p.cantidad}`}
              title={p.etiqueta}
              className={`reacciones-pestana ${activa ? 'activa' : ''}`}
              style={p.color ? { '--color-reaccion': p.color } : undefined}
              onClick={() => setTipo(p.valor)}
              data-enfocar={p.valor === null ? true : undefined}
            >
              {p.contenido}
              <span className="reacciones-pestana-total">{p.cantidad}</span>
            </button>
          );
        })}
      </div>

      <div id={idPanel} role="tabpanel" className="reacciones-panel">
        <MensajeError error={lista.error} />
        {!lista.cargando && !lista.error && lista.items.length === 0 && (
          <p className="vacio">Nadie ha reaccionado así todavía.</p>
        )}

        <ul className="reacciones-lista">
          {lista.items.map(({ id, usuario, tipo: suReaccion }) => {
            const reaccion = datosDe(suReaccion);
            const nombre = nombreCompleto(usuario);
            return (
              <li key={id} className="reaccion-fila">
                <Link
                  to={`/u/${usuario.nombreUsuario}`}
                  className="reaccion-persona"
                  onClick={alCerrar}
                >
                  <span className="reaccion-avatar">
                    <Avatar usuario={usuario} tamano={46} />
                    <IconoReaccion tipo={suReaccion} tamano={20} />
                  </span>
                  <span className="reaccion-textos">
                    <strong>
                      {nombre}
                      {usuario.id === yo?.id && <span className="reaccion-tu">Tú</span>}
                    </strong>
                    <span className="suave">@{usuario.nombreUsuario}</span>
                  </span>
                </Link>
                {reaccion && (
                  <span
                    className="reaccion-etiqueta"
                    style={{ '--color-reaccion': reaccion.color }}
                  >
                    {reaccion.nombre}
                  </span>
                )}
              </li>
            );
          })}
          {lista.cargando &&
            Array.from({ length: primeraCarga ? FILAS_ESQUELETO : 2 }, (_, i) => (
              <FilaEsqueleto key={`esqueleto-${i}`} />
            ))}
        </ul>

        {lista.hayMas && !lista.cargando && (
          <button type="button" className="reacciones-mas" onClick={lista.cargarMas}>
            Ver más personas
          </button>
        )}
      </div>
    </Modal>
  );
}
