/**
 * Moderación de contenido: todas las publicaciones o comentarios del sitio (también los
 * privados y los de cuentas suspendidas), con buscador, filtro vivas/eliminadas y, si se
 * eligió una cuenta, solo lo suyo. Desde aquí se eliminan (las imágenes salen del bucket).
 */
import { useState } from 'react';
import { Link } from 'react-router';
import {
  eliminarComentario,
  eliminarPublicacion,
  listarComentarios,
  listarPublicaciones,
} from '../../api/admin.js';
import { VISIBILIDADES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useConfirmar } from '../../hooks/useConfirmar.js';
import { useDiferido } from '../../hooks/useDiferido.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { fechaCompleta, haceCuanto } from '../../utils/formato.js';
import { IconoBorrar, IconoCerrar, ICONOS_VISIBILIDAD } from '../iconos/Iconos.jsx';
import { VisorImagenes } from '../publicaciones/VisorImagenes.jsx';
import { Sticker } from '../stickers/Sticker.jsx';
import { AutorAdmin, BarraFiltros, Insignia, PieLista } from './Comunes.jsx';

const ESTADOS = [
  { valor: 'vivas', nombre: 'Visibles' },
  { valor: 'eliminadas', nombre: 'Eliminadas' },
  { valor: 'todas', nombre: 'Todas' },
];

/** Buscador + filtros + lista paginada; `tipo` = 'publicaciones' | 'comentarios'. */
function useListaContenido(tipo, autor) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('vivas');
  const buscar = useDiferido(texto.trim());
  const listar = tipo === 'publicaciones' ? listarPublicaciones : listarComentarios;
  const lista = usePaginado(
    (cursor) => listar({ buscar, estado, autorId: autor?.id }, cursor),
    `${tipo}|${buscar}|${estado}|${autor?.id ?? ''}`,
  );
  return { texto, setTexto, estado, setEstado, lista };
}

function FiltroAutor({ autor, alQuitar }) {
  if (!autor) return null;
  return (
    <p className="admin-filtro-autor">
      Solo de <strong>@{autor.nombreUsuario}</strong>
      <button
        type="button"
        className="buscador-limpiar"
        onClick={alQuitar}
        aria-label="Quitar filtro"
      >
        <IconoCerrar tamano={14} />
      </button>
    </p>
  );
}

/** Marca de eliminado: cuándo y, si fue moderación, quién. */
function Eliminado({ en, por }) {
  if (!en) return null;
  return (
    <Insignia tono="peligro">
      Eliminado {haceCuanto(en)}
      {por ? ` por @${por}` : ' por su autor'}
    </Insignia>
  );
}

export function PublicacionesAdmin({ autor, alFiltrarAutor }) {
  const { avisar } = useAvisos();
  const confirmar = useConfirmar();
  const { texto, setTexto, estado, setEstado, lista } = useListaContenido('publicaciones', autor);
  const [visor, setVisor] = useState(null); // { imagenes, inicial }

  async function eliminar(publicacion) {
    const seguro = await confirmar({
      titulo: '¿Eliminar publicación?',
      mensaje: `Se borrará la publicación de @${publicacion.autor.nombreUsuario} y sus ${publicacion.imagenes.length} imagen(es) del almacenamiento. No se puede deshacer.`,
      confirmar: 'Eliminar',
    });
    if (!seguro) return;
    try {
      await eliminarPublicacion(publicacion.id);
      avisar('Publicación eliminada');
      lista.setItems((items) =>
        estado === 'vivas'
          ? items.filter((p) => p.id !== publicacion.id)
          : items.map((p) =>
              p.id === publicacion.id
                ? { ...p, eliminadaEn: new Date().toISOString(), imagenes: [] }
                : p,
            ),
      );
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <>
      <BarraFiltros
        texto={texto}
        alCambiarTexto={setTexto}
        placeholder="Buscar en el texto o por @usuario…"
        opciones={ESTADOS}
        valor={estado}
        alCambiarFiltro={setEstado}
      />
      <FiltroAutor autor={autor} alQuitar={() => alFiltrarAutor(null)} />

      {lista.items.map((p) => {
        const visibilidad = VISIBILIDADES.find((v) => v.valor === p.visibilidad);
        const IconoVisibilidad = ICONOS_VISIBILIDAD[p.visibilidad];
        return (
          <article
            key={p.id}
            className={`tarjeta admin-contenido ${p.eliminadaEn ? 'eliminado' : ''}`}
          >
            <header className="admin-contenido-cabecera">
              <AutorAdmin autor={p.autor} alFiltrar={autor ? null : alFiltrarAutor} />
              <span className="suave admin-contenido-meta">
                <span title={fechaCompleta(p.creadaEn)}>{haceCuanto(p.creadaEn)}</span>
                {p.editada && ' · editada'}
                {IconoVisibilidad && (
                  <span title={visibilidad?.nombre}>
                    {' · '}
                    <IconoVisibilidad tamano={14} /> {visibilidad?.nombre}
                  </span>
                )}
              </span>
            </header>

            <p className="texto-libre admin-contenido-texto">{p.contenido}</p>

            {p.imagenes.length > 0 && (
              <div className="admin-miniaturas">
                {p.imagenes.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setVisor({ imagenes: p.imagenes, inicial: i })}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img src={img.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <footer className="admin-contenido-pie">
              <span className="suave">
                {p.totalReacciones} reacciones · {p.totalComentarios} comentarios
              </span>
              <Eliminado en={p.eliminadaEn} por={p.eliminadaPor} />
              <span className="admin-contenido-acciones">
                {!p.eliminadaEn && p.autor.estado === 'activo' && (
                  <Link to={`/publicaciones/${p.id}`} className="boton-enlace">
                    Abrir
                  </Link>
                )}
                {!p.eliminadaEn && (
                  <button className="accion accion-peligro" onClick={() => eliminar(p)}>
                    <IconoBorrar tamano={16} /> Eliminar
                  </button>
                )}
              </span>
            </footer>
          </article>
        );
      })}
      <PieLista lista={lista} textoVacio="No hay publicaciones con esos filtros." />

      {visor && (
        <VisorImagenes
          imagenes={visor.imagenes}
          inicial={visor.inicial}
          alCerrar={() => setVisor(null)}
        />
      )}
    </>
  );
}

export function ComentariosAdmin({ autor, alFiltrarAutor }) {
  const { avisar } = useAvisos();
  const confirmar = useConfirmar();
  const { texto, setTexto, estado, setEstado, lista } = useListaContenido('comentarios', autor);

  async function eliminar(comentario) {
    const seguro = await confirmar({
      titulo: '¿Eliminar comentario?',
      mensaje: `Se quitará el comentario de @${comentario.autor.nombreUsuario} de la publicación.`,
      confirmar: 'Eliminar',
    });
    if (!seguro) return;
    try {
      await eliminarComentario(comentario.id);
      avisar('Comentario eliminado');
      lista.setItems((items) =>
        estado === 'vivas'
          ? items.filter((c) => c.id !== comentario.id)
          : items.map((c) =>
              c.id === comentario.id ? { ...c, eliminadoEn: new Date().toISOString() } : c,
            ),
      );
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <>
      <BarraFiltros
        texto={texto}
        alCambiarTexto={setTexto}
        placeholder="Buscar en el texto o por @usuario…"
        opciones={ESTADOS}
        valor={estado}
        alCambiarFiltro={setEstado}
      />
      <FiltroAutor autor={autor} alQuitar={() => alFiltrarAutor(null)} />

      {lista.items.map((c) => (
        <article
          key={c.id}
          className={`tarjeta admin-contenido ${c.eliminadoEn ? 'eliminado' : ''}`}
        >
          <header className="admin-contenido-cabecera">
            <AutorAdmin autor={c.autor} alFiltrar={autor ? null : alFiltrarAutor} />
            <span className="suave admin-contenido-meta" title={fechaCompleta(c.creadoEn)}>
              {haceCuanto(c.creadoEn)}
              {c.comentarioPadreId && ' · respuesta'}
            </span>
          </header>

          {c.sticker ? (
            <Sticker sticker={c.sticker} className="sticker-comentario" />
          ) : (
            <p className="texto-libre admin-contenido-texto">{c.contenido}</p>
          )}

          <p className="suave admin-contenido-contexto">
            En:{' '}
            {c.publicacionEliminada ? (
              <em>publicación eliminada</em>
            ) : (
              <Link to={`/publicaciones/${c.publicacionId}`}>«{c.publicacionExtracto}»</Link>
            )}
          </p>

          <footer className="admin-contenido-pie">
            <Eliminado en={c.eliminadoEn} por={c.eliminadoPor} />
            <span className="admin-contenido-acciones">
              {!c.eliminadoEn && (
                <button className="accion accion-peligro" onClick={() => eliminar(c)}>
                  <IconoBorrar tamano={16} /> Eliminar
                </button>
              )}
            </span>
          </footer>
        </article>
      ))}
      <PieLista lista={lista} textoVacio="No hay comentarios con esos filtros." />
    </>
  );
}
