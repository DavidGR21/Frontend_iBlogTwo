/**
 * Buscador de personas de la columna izquierda. Sin cambios en el backend:
 *  - filtra tus amigos por nombre de usuario o nombre mientras escribes;
 *  - si lo escrito es un nombre de usuario válido, comprueba con GET /usuarios/:nombre si
 *    existe esa cuenta (coincidencia exacta, sin distinguir mayúsculas) y la muestra.
 * ↑/↓ recorren los resultados y Enter abre el perfil.
 */
import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { listarAmigos } from '../../api/amistades.js';
import { obtenerPerfil } from '../../api/usuarios.js';
import { useDatos } from '../../hooks/useDatos.js';
import { nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { IconoBuscar, IconoCerrar } from '../iconos/Iconos.jsx';

const ESPERA = 350; // ms sin teclear antes de preguntar al servidor
const MAX_AMIGOS = 5;
const NOMBRE_USUARIO = /^[A-Za-z0-9_.]{3,30}$/; // misma regla que el backend

/** Sin `amigos` (p. ej. en la página Amigos) carga la lista por su cuenta. */
export function BuscadorPersonas({ amigos: amigosDados, className = '' }) {
  const propios = useDatos(
    () => (amigosDados ? Promise.resolve(null) : listarAmigos()),
    amigosDados ? 'dados' : 'amigos',
  );
  const amigos = amigosDados ?? propios.datos?.items ?? [];
  const navegar = useNavigate();
  const idLista = useId();
  const [texto, setTexto] = useState('');
  const [remoto, setRemoto] = useState({ consulta: '', perfil: null });
  const [activo, setActivo] = useState(0);

  const consulta = texto.trim().replace(/^@/, '');
  const minusculas = consulta.toLowerCase();

  const coincidencias = consulta
    ? amigos
        .map((a) => a.usuario)
        .filter(
          (u) =>
            u.nombreUsuario.toLowerCase().includes(minusculas) ||
            nombreCompleto(u).toLowerCase().includes(minusculas),
        )
        .slice(0, MAX_AMIGOS)
    : [];

  // Búsqueda exacta en el servidor (solo si parece un nombre de usuario y no es un amigo ya listado)
  const buscarRemoto =
    NOMBRE_USUARIO.test(consulta) &&
    !coincidencias.some((u) => u.nombreUsuario.toLowerCase() === minusculas);

  useEffect(() => {
    if (!buscarRemoto) return undefined;
    let vigente = true;
    const espera = setTimeout(() => {
      obtenerPerfil(consulta)
        .then((perfil) => vigente && setRemoto({ consulta, perfil }))
        .catch(() => vigente && setRemoto({ consulta, perfil: null }));
    }, ESPERA);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [consulta, buscarRemoto]);

  const buscando = buscarRemoto && remoto.consulta !== consulta;
  const encontrado = buscarRemoto && remoto.consulta === consulta ? remoto.perfil : null;
  const resultados = encontrado ? [...coincidencias, encontrado] : coincidencias;
  const indice = Math.min(activo, Math.max(resultados.length - 1, 0));

  function alTeclear(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!resultados.length) return;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((indice + paso + resultados.length) % resultados.length);
    } else if (e.key === 'Enter' && resultados[indice]) {
      e.preventDefault();
      navegar(`/u/${resultados[indice].nombreUsuario}`);
    } else if (e.key === 'Escape') {
      setTexto('');
    }
  }

  return (
    <section className={`tarjeta panel buscador ${className}`}>
      <div className="buscador-caja">
        <IconoBuscar tamano={18} />
        <input
          type="search"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setActivo(0);
          }}
          onKeyDown={alTeclear}
          placeholder="Buscar personas…"
          aria-label="Buscar personas por nombre de usuario"
          role="combobox"
          aria-expanded={Boolean(consulta)}
          aria-controls={idLista}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
        />
        {texto && (
          <button
            type="button"
            className="buscador-limpiar"
            onClick={() => setTexto('')}
            aria-label="Borrar búsqueda"
          >
            <IconoCerrar tamano={16} />
          </button>
        )}
      </div>

      {consulta && (
        <div className="buscador-resultados">
          <ul id={idLista} role="listbox" className="panel-personas">
            {resultados.map((u, i) => (
              <li key={u.id} role="option" aria-selected={i === indice}>
                <Link
                  to={`/u/${u.nombreUsuario}`}
                  className={`autor buscador-item ${i === indice ? 'activo' : ''}`}
                  onMouseEnter={() => setActivo(i)}
                >
                  <Avatar usuario={u} tamano={34} />
                  <span>
                    <strong>{u.nombreUsuario}</strong>
                    <span className="suave">{u === encontrado ? 'Perfil' : 'Amigo'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {buscando && <p className="buscador-nota">Buscando…</p>}
          {!buscando && resultados.length === 0 && (
            <p className="buscador-nota">No se encontró a nadie con "{consulta}".</p>
          )}
          {!buscando && resultados.length > 0 && !encontrado && NOMBRE_USUARIO.test(consulta) && (
            <p className="buscador-nota">Fuera de tus amigos, escribe el usuario completo.</p>
          )}
        </div>
      )}
    </section>
  );
}
