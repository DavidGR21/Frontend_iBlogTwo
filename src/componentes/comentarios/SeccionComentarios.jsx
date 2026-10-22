/**
 * Comentarios de una publicación, desplegados dentro de la propia tarjeta: primero unos
 * pocos y "Ver más comentarios" para cargar otro grupo. Con respuestas y en tiempo real
 * (la tarjeta es la que se une a la sala de la publicación).
 *
 * Un mismo comentario puede llegar dos veces (respuesta del POST y evento del socket),
 * por eso se lleva un registro de ids ya vistos.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  crearComentario,
  editarComentario,
  eliminarComentario,
  listarComentarios,
  listarRespuestas,
} from '../../api/comentarios.js';
import { COMENTARIOS_INICIALES, COMENTARIOS_POR_CLIC } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useConfirmar } from '../../hooks/useConfirmar.js';
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { FormComentario } from './FormComentario.jsx';
import { ItemComentario } from './ItemComentario.jsx';

export function SeccionComentarios({ publicacionId, alAgregarComentario }) {
  const { avisar } = useAvisos();
  const confirmar = useConfirmar();
  const raiz = usePaginado(
    (cursor) =>
      listarComentarios(
        publicacionId,
        cursor,
        cursor ? COMENTARIOS_POR_CLIC : COMENTARIOS_INICIALES,
      ),
    publicacionId,
  );
  const setRaiz = raiz.setItems;
  const [respuestas, setRespuestas] = useState({}); // { comentarioPadreId: Comentario[] }
  const vistos = useRef(new Set());

  /** Aplica `cambio` al comentario con ese id, esté en la raíz o entre las respuestas. */
  const actualizar = useCallback(
    (id, cambio) => {
      const aplicar = (lista) => lista.map((c) => (c.id === id ? cambio(c) : c));
      setRaiz(aplicar);
      setRespuestas((mapa) =>
        Object.fromEntries(Object.entries(mapa).map(([padre, lista]) => [padre, aplicar(lista)])),
      );
    },
    [setRaiz],
  );

  const agregar = useCallback(
    (comentario) => {
      if (vistos.current.has(comentario.id)) return;
      vistos.current.add(comentario.id);
      alAgregarComentario?.();

      const padre = comentario.comentarioPadreId;
      if (!padre) {
        setRaiz((lista) =>
          lista.some((c) => c.id === comentario.id) ? lista : [...lista, comentario],
        );
        return;
      }
      setRespuestas((mapa) =>
        mapa[padre] ? { ...mapa, [padre]: [...mapa[padre], comentario] } : mapa,
      );
      actualizar(padre, (c) => ({ ...c, totalRespuestas: (c.totalRespuestas ?? 0) + 1 }));
    },
    [setRaiz, actualizar, alAgregarComentario],
  );

  useEventoSocket(EVENTOS.COMENTARIO_NUEVO, (comentario) => {
    if (comentario.publicacionId === publicacionId) agregar(comentario);
  });

  const acciones = {
    /** `datos` = { contenido } o { stickerId } */
    async crear(datos, comentarioPadreId) {
      try {
        agregar(await crearComentario({ publicacionId, ...datos, comentarioPadreId }));
      } catch (e) {
        avisar(e.message, 'error');
        throw e;
      }
    },
    async editar(id, contenido) {
      try {
        const editado = await editarComentario(id, contenido);
        actualizar(id, (c) => ({ ...c, ...editado }));
      } catch (e) {
        avisar(e.message, 'error');
        throw e;
      }
    },
    async eliminar(id) {
      const seguro = await confirmar({
        titulo: '¿Eliminar comentario?',
        mensaje: 'El comentario se quitará de la publicación.',
        confirmar: 'Eliminar',
      });
      if (!seguro) return;
      try {
        await eliminarComentario(id);
        actualizar(id, (c) => ({ ...c, eliminado: true, contenido: null, sticker: null }));
      } catch (e) {
        avisar(e.message, 'error');
      }
    },
    async cargarRespuestas(id) {
      try {
        const { items } = await listarRespuestas(id);
        items.forEach((c) => vistos.current.add(c.id));
        setRespuestas((mapa) => ({ ...mapa, [id]: items }));
      } catch (e) {
        avisar(e.message, 'error');
      }
    },
  };

  // Los que llegan en vivo se agregan al final aunque falten páginas por cargar:
  // se ordenan por fecha para que todo quede en su sitio.
  const ordenados = useMemo(
    () => [...raiz.items].sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn)),
    [raiz.items],
  );

  return (
    <section className="comentarios" aria-label="Comentarios">
      {ordenados.map((comentario) => (
        <ItemComentario
          key={comentario.id}
          comentario={comentario}
          respuestas={respuestas}
          acciones={acciones}
        />
      ))}

      {raiz.cargando && <Cargando />}
      <MensajeError error={raiz.error} />
      {!raiz.cargando && !raiz.error && raiz.items.length === 0 && (
        <p className="comentarios-vacio">Todavía no hay comentarios. ¡Sé el primero!</p>
      )}
      {raiz.hayMas && !raiz.cargando && (
        <button type="button" className="comentarios-mas" onClick={raiz.cargarMas}>
          Ver más comentarios
        </button>
      )}

      <FormComentario
        alEnviar={(contenido) => acciones.crear({ contenido })}
        alEnviarSticker={(sticker) => acciones.crear({ stickerId: sticker.id })}
        conAvatar
      />
    </section>
  );
}
