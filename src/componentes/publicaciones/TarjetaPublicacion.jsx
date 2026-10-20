/**
 * Una publicación: autor, texto, imágenes, reacciones y enlace a comentarios.
 * El autor puede editarla o eliminarla.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { editarPublicacion, eliminarPublicacion } from '../../api/publicaciones.js';
import { VISIBILIDADES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useSesion } from '../../hooks/useSesion.js';
import { fechaCompleta, haceCuanto, nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { BarraReacciones } from './BarraReacciones.jsx';

export function TarjetaPublicacion({ publicacion, alCambiar, alEliminar, mostrarEnlace = true }) {
  const { usuario } = useSesion();
  const { avisar } = useAvisos();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(publicacion.contenido);
  const [guardando, setGuardando] = useState(false);

  const esMia = publicacion.autor.id === usuario?.id;
  const visibilidad = VISIBILIDADES.find((v) => v.valor === publicacion.visibilidad);

  async function guardar() {
    if (!texto.trim()) return;
    setGuardando(true);
    try {
      alCambiar(await editarPublicacion(publicacion.id, { contenido: texto.trim() }));
      setEditando(false);
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    try {
      await eliminarPublicacion(publicacion.id);
      avisar('Publicación eliminada');
      alEliminar(publicacion.id);
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <article className="tarjeta">
      <div className="fila-espaciada">
        <Link to={`/u/${publicacion.autor.nombreUsuario}`} className="autor">
          <Avatar usuario={publicacion.autor} />
          <span>
            <strong>{nombreCompleto(publicacion.autor)}</strong>
            <span className="suave" title={fechaCompleta(publicacion.creadaEn)}>
              {haceCuanto(publicacion.creadaEn)}
              {publicacion.editada && ' · editada'} · {visibilidad?.nombre}
            </span>
          </span>
        </Link>
        {esMia && !editando && (
          <div className="fila">
            <button className="boton-enlace" onClick={() => setEditando(true)}>
              Editar
            </button>
            <button className="boton-enlace" onClick={eliminar}>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {editando ? (
        <div className="formulario" style={{ marginTop: '0.75rem' }}>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={5000} />
          <div className="fila">
            <button className="boton" onClick={guardar} disabled={guardando || !texto.trim()}>
              Guardar
            </button>
            <button
              className="boton-secundario"
              onClick={() => {
                setTexto(publicacion.contenido);
                setEditando(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="texto-libre">{publicacion.contenido}</p>
      )}

      {publicacion.imagenes?.length > 0 && (
        <div className={`imagenes ${publicacion.imagenes.length === 1 ? 'imagenes-una' : ''}`}>
          {publicacion.imagenes.map((imagen) => (
            <a key={imagen.id} href={imagen.url} target="_blank" rel="noreferrer">
              <img src={imagen.url} alt="" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      <BarraReacciones publicacion={publicacion} alCambiar={alCambiar} />

      {mostrarEnlace && (
        <p className="suave" style={{ margin: '0.5rem 0 0' }}>
          <Link to={`/publicaciones/${publicacion.id}`}>
            💬 {publicacion.totalComentarios ?? 0} comentario
            {publicacion.totalComentarios === 1 ? '' : 's'}
          </Link>
        </p>
      )}
    </article>
  );
}
