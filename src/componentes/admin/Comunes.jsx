/** Piezas compartidas por las pestañas del panel de administración. */
import { useId } from 'react';
import { Link } from 'react-router';
import { nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { IconoBuscar, IconoCerrar } from '../iconos/Iconos.jsx';

/** Etiqueta de color: tono = 'peligro' | 'aviso' | 'admin' | 'ok' | 'neutro'. */
export function Insignia({ tono = 'neutro', children }) {
  return <span className={`insignia insignia-${tono}`}>{children}</span>;
}

/** Insignias del estado de una cuenta (lista de usuarios y autores de contenido). */
export function InsigniasCuenta({ usuario }) {
  return (
    <>
      {usuario.rol === 'admin' && <Insignia tono="admin">Admin</Insignia>}
      {usuario.estado === 'suspendido' && <Insignia tono="peligro">Suspendida</Insignia>}
      {usuario.estado === 'eliminado' && <Insignia tono="peligro">Eliminada</Insignia>}
      {usuario.correoVerificado === false && <Insignia tono="aviso">Sin verificar</Insignia>}
    </>
  );
}

/**
 * Autor de una publicación o comentario: avatar + @usuario. Si la cuenta está activa el
 * nombre lleva a su perfil; si no, el perfil no existe para el público y no se enlaza.
 */
export function AutorAdmin({ autor, alFiltrar }) {
  const activo = autor.estado === 'activo';
  return (
    <span className="admin-autor">
      <Avatar usuario={autor} tamano={34} />
      <span className="admin-autor-texto">
        {activo ? (
          <Link to={`/u/${autor.nombreUsuario}`}>@{autor.nombreUsuario}</Link>
        ) : (
          <strong>@{autor.nombreUsuario}</strong>
        )}
        <span className="suave">{nombreCompleto(autor)}</span>
      </span>
      <InsigniasCuenta usuario={autor} />
      {alFiltrar && (
        <button type="button" className="boton-enlace" onClick={() => alFiltrar(autor)}>
          Solo de esta cuenta
        </button>
      )}
    </span>
  );
}

/**
 * Buscador + filtros en chips.
 *   opciones: [{ valor, nombre }] · valor/alCambiarFiltro: el filtro elegido
 */
export function BarraFiltros({
  texto,
  alCambiarTexto,
  placeholder,
  opciones,
  valor,
  alCambiarFiltro,
}) {
  const nombreGrupo = useId();
  return (
    <div className="admin-filtros">
      <div className="buscador-caja">
        <IconoBuscar tamano={18} />
        <input
          type="search"
          value={texto}
          onChange={(e) => alCambiarTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
        />
        {texto && (
          <button
            type="button"
            className="buscador-limpiar"
            onClick={() => alCambiarTexto('')}
            aria-label="Borrar búsqueda"
          >
            <IconoCerrar tamano={16} />
          </button>
        )}
      </div>
      <fieldset className="chips">
        <legend className="solo-lector">Filtrar</legend>
        {opciones.map((opcion) => (
          <label
            key={opcion.valor}
            className={`chip ${valor === opcion.valor ? 'chip-activo' : ''}`}
          >
            <input
              type="radio"
              name={nombreGrupo}
              checked={valor === opcion.valor}
              onChange={() => alCambiarFiltro(opcion.valor)}
            />
            <span>{opcion.nombre}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

/** Pie de una lista paginada: cargando, error, vacía y "Cargar más". */
export function PieLista({ lista, textoVacio }) {
  return (
    <>
      {lista.cargando && (
        <p className="cargando" role="status">
          <span className="spinner" aria-hidden="true" /> Cargando…
        </p>
      )}
      {lista.error && (
        <div className="error" role="alert">
          <p>{lista.error.message}</p>
        </div>
      )}
      {!lista.cargando && !lista.error && lista.items.length === 0 && (
        <p className="vacio">{textoVacio}</p>
      )}
      {lista.hayMas && !lista.cargando && (
        <button className="boton-secundario admin-mas" onClick={lista.cargarMas}>
          Cargar más
        </button>
      )}
    </>
  );
}
