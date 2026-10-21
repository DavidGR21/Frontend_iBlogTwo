/**
 * Un comentario con sus respuestas anidadas (se dibuja a sí mismo para cada respuesta).
 * Las respuestas cargadas viven en SeccionComentarios y llegan por `respuestas`.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { useSesion } from '../../hooks/useSesion.js';
import { fechaCompleta, haceCuanto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { FormComentario } from './FormComentario.jsx';
import { IconoRespuesta } from '../iconos/Iconos.jsx';

const MAX_NIVEL_VISUAL = 4; // a partir de aquí ya no se indenta más

export function ItemComentario({ comentario, respuestas, acciones, nivel = 0 }) {
  const { usuario } = useSesion();
  const [respondiendo, setRespondiendo] = useState(false);
  const [editando, setEditando] = useState(false);

  const misRespuestas = respuestas[comentario.id];
  const esMio = comentario.autor.id === usuario?.id;
  const faltanPorCargar = !misRespuestas && comentario.totalRespuestas > 0;

  async function responder(texto) {
    await acciones.crear(texto, comentario.id);
    setRespondiendo(false);
  }

  async function editar(texto) {
    await acciones.editar(comentario.id, texto);
    setEditando(false);
  }

  return (
    <div className="comentario">
      <Avatar usuario={comentario.autor} tamano={32} ampliable />
      <div className="comentario-cuerpo">
        <div className="comentario-burbuja">
          <Link to={`/u/${comentario.autor.nombreUsuario}`} className="comentario-autor">
            {comentario.autor.nombreUsuario}
          </Link>
          {comentario.eliminado ? (
            <p className="comentario-eliminado">Comentario eliminado</p>
          ) : editando ? (
            <FormComentario
              alEnviar={editar}
              placeholder="Edita tu comentario"
              valorInicial={comentario.contenido}
              autoFocus
            />
          ) : (
            <p className="texto-libre">{comentario.contenido}</p>
          )}
        </div>

        <div className="comentario-acciones">
          <span title={fechaCompleta(comentario.creadoEn)}>{haceCuanto(comentario.creadoEn)}</span>
          {!comentario.eliminado && (
            <button className="boton-enlace" onClick={() => setRespondiendo(!respondiendo)}>
              Responder
            </button>
          )}
          {esMio && !comentario.eliminado && (
            <>
              <button className="boton-enlace" onClick={() => setEditando(!editando)}>
                {editando ? 'Cancelar' : 'Editar'}
              </button>
              <button className="boton-enlace" onClick={() => acciones.eliminar(comentario.id)}>
                Eliminar
              </button>
            </>
          )}
        </div>

        {respondiendo && (
          <FormComentario
            alEnviar={responder}
            placeholder={`Responder a ${comentario.autor.nombreUsuario}…`}
            autoFocus
          />
        )}

        {faltanPorCargar && (
          <button
            className="comentario-ver-respuestas con-icono"
            onClick={() => acciones.cargarRespuestas(comentario.id)}
          >
            <IconoRespuesta tamano={16} /> Ver {comentario.totalRespuestas} respuesta
            {comentario.totalRespuestas === 1 ? '' : 's'}
          </button>
        )}

        {misRespuestas?.length > 0 && (
          <div className={nivel < MAX_NIVEL_VISUAL ? 'respuestas' : ''}>
            {misRespuestas.map((respuesta) => (
              <ItemComentario
                key={respuesta.id}
                comentario={respuesta}
                respuestas={respuestas}
                acciones={acciones}
                nivel={nivel + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
