/**
 * Una publicación: autor, texto, imágenes, resumen de reacciones, botones de reaccionar y
 * comentar, y los comentarios desplegados dentro de la tarjeta.
 * El autor puede editarla o eliminarla desde el menú "⋯".
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { eliminarPublicacion } from '../../api/publicaciones.js';
import { VISIBILIDADES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useEventoSocket } from '../../hooks/useEventoSocket.js';
import { useEnPantalla, useSalaPublicacion } from '../../hooks/useSalaPublicacion.js';
import { useSesion } from '../../hooks/useSesion.js';
import { EVENTOS } from '../../sockets/eventos.js';
import { fechaCompleta, haceCuanto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { SeccionComentarios } from '../comentarios/SeccionComentarios.jsx';
import {
  ICONOS_VISIBILIDAD,
  IconoBorrar,
  IconoComentario,
  IconoEditar,
  IconoMas,
} from '../iconos/Iconos.jsx';
import { BotonReaccionar, ResumenReacciones } from './BarraReacciones.jsx';
import { EditorPublicacion } from './EditorPublicacion.jsx';
import { GaleriaImagenes } from './GaleriaImagenes.jsx';

function MenuPublicacion({ alEditar, alEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => !raiz.current?.contains(e.target) && setAbierto(false);
    const tecla = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const elegir = (accion) => () => {
    setAbierto(false);
    accion();
  };

  return (
    <div className="post-menu" ref={raiz}>
      <button
        type="button"
        className="post-menu-boton"
        onClick={() => setAbierto(!abierto)}
        aria-label="Opciones de la publicación"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <IconoMas />
      </button>
      {abierto && (
        <div className="post-menu-lista" role="menu">
          <button type="button" role="menuitem" onClick={elegir(alEditar)}>
            <IconoEditar tamano={18} />
            Editar publicación
          </button>
          <button type="button" role="menuitem" className="peligro" onClick={elegir(alEliminar)}>
            <IconoBorrar tamano={18} />
            Eliminar publicación
          </button>
        </div>
      )}
    </div>
  );
}

// Publicaciones solo de texto y cortas: en grande, centradas y sobre un fondo de color
const LIENZO_MAX_CARACTERES = 220;
const LIENZO_MAX_LINEAS = 6;
const FONDOS_LIENZO = 6; // .post-lienzo-0 … -5 en app.css

function estiloLienzo(publicacion) {
  const texto = publicacion.contenido ?? '';
  if (publicacion.imagenes?.length || texto.length > LIENZO_MAX_CARACTERES) return null;
  if (texto.split('\n').length > LIENZO_MAX_LINEAS) return null;
  // Siempre el mismo fondo para la misma publicación
  const fondo = [...publicacion.id].reduce((suma, c) => suma + c.charCodeAt(0), 0) % FONDOS_LIENZO;
  const tamano = texto.length <= 60 ? 'grande' : texto.length <= 130 ? 'mediano' : 'pequeno';
  return `post-lienzo post-lienzo-${fondo} post-lienzo-${tamano}`;
}

export function TarjetaPublicacion({
  publicacion,
  alCambiar,
  alEliminar,
  comentariosAbiertos = false,
}) {
  const { usuario } = useSesion();
  const { avisar } = useAvisos();
  const [editando, setEditando] = useState(false);
  const [verComentarios, setVerComentarios] = useState(comentariosAbiertos);
  const tarjeta = useRef(null);

  // En la sala de la publicación (reacciones y comentarios en vivo) mientras se ve en pantalla
  const enPantalla = useEnPantalla(tarjeta);
  useSalaPublicacion(publicacion.id, enPantalla || verComentarios);

  const { autor } = publicacion;
  const esMia = autor.id === usuario?.id;
  const visibilidad = VISIBILIDADES.find((v) => v.valor === publicacion.visibilidad);
  const IconoVisibilidad = ICONOS_VISIBILIDAD[publicacion.visibilidad];
  const totalComentarios = publicacion.totalComentarios ?? 0;

  // `alCambiar` acepta una función (anterior) => nueva: así se suma sobre la versión más
  // reciente aunque justo antes haya llegado otro evento (p. ej. una reacción)
  const sumarComentario = useCallback(() => {
    alCambiar((p) => ({ ...p, totalComentarios: (p.totalComentarios ?? 0) + 1 }));
  }, [alCambiar]);

  // Con los comentarios cerrados, la tarjeta cuenta los nuevos. Abiertos, los cuenta
  // SeccionComentarios (que además evita contar dos veces el propio).
  useEventoSocket(EVENTOS.COMENTARIO_NUEVO, (comentario) => {
    if (!verComentarios && comentario.publicacionId === publicacion.id) sumarComentario();
  });

  const lienzo = !editando && estiloLienzo(publicacion);

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
    <article className="tarjeta post" ref={tarjeta}>
      <header className="post-cabecera">
        <Link to={`/u/${autor.nombreUsuario}`} className="post-avatar">
          <Avatar usuario={autor} tamano={40} />
        </Link>
        <div className="post-meta">
          <Link to={`/u/${autor.nombreUsuario}`} className="post-autor">
            {autor.nombreUsuario}
          </Link>
          <span className="post-detalle">
            <Link
              to={`/publicaciones/${publicacion.id}`}
              title={fechaCompleta(publicacion.creadaEn)}
            >
              {haceCuanto(publicacion.creadaEn)}
            </Link>
            {publicacion.editada && <span>· editada</span>}
            {IconoVisibilidad && (
              <span title={visibilidad?.nombre} aria-label={visibilidad?.nombre}>
                · <IconoVisibilidad tamano={14} />
              </span>
            )}
          </span>
        </div>
        {esMia && !editando && (
          <MenuPublicacion alEditar={() => setEditando(true)} alEliminar={eliminar} />
        )}
      </header>

      {editando ? (
        <EditorPublicacion
          publicacion={publicacion}
          alGuardar={(editada) => {
            alCambiar((p) => ({ ...p, ...editada }));
            setEditando(false);
          }}
          alCancelar={() => setEditando(false)}
        />
      ) : lienzo ? (
        <div className={lienzo}>
          <p className="texto-libre">{publicacion.contenido}</p>
        </div>
      ) : (
        <p className="texto-libre post-texto">{publicacion.contenido}</p>
      )}

      {!editando && publicacion.imagenes?.length > 0 && (
        <GaleriaImagenes imagenes={publicacion.imagenes} />
      )}

      <div className="post-resumen">
        <ResumenReacciones reacciones={publicacion.reacciones} />
        {totalComentarios > 0 && (
          <button
            type="button"
            className="post-resumen-comentarios"
            onClick={() => setVerComentarios(!verComentarios)}
          >
            {totalComentarios} comentario{totalComentarios === 1 ? '' : 's'}
          </button>
        )}
      </div>

      <div className="post-acciones">
        <BotonReaccionar publicacion={publicacion} alCambiar={alCambiar} />
        <button
          type="button"
          className={`accion-post ${verComentarios ? 'activa' : ''}`}
          onClick={() => setVerComentarios(!verComentarios)}
          aria-expanded={verComentarios}
        >
          <IconoComentario />
          Comentar
        </button>
      </div>

      {verComentarios && (
        <SeccionComentarios publicacionId={publicacion.id} alAgregarComentario={sumarComentario} />
      )}
    </article>
  );
}
