/** Perfil público de un usuario y sus publicaciones. */
import { Link, useParams } from 'react-router';
import { obtenerPerfil } from '../api/usuarios.js';
import { listarDeUsuario } from '../api/publicaciones.js';
import { AccionesAmistad } from '../componentes/AccionesAmistad.jsx';
import { Avatar } from '../componentes/Avatar.jsx';
import { Cargando } from '../componentes/Cargando.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { ListaPublicaciones } from '../componentes/publicaciones/ListaPublicaciones.jsx';
import { PAISES } from '../config.js';
import { useDatos } from '../hooks/useDatos.js';
import { usePaginado } from '../hooks/usePaginado.js';
import { useSesion } from '../hooks/useSesion.js';
import { fechaCompleta, nombreCompleto } from '../utils/formato.js';

export function Perfil() {
  const { nombreUsuario } = useParams();
  const { usuario } = useSesion();
  const {
    datos: perfil,
    cargando,
    error,
    recargar,
    setDatos,
  } = useDatos(() => obtenerPerfil(nombreUsuario), nombreUsuario);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;

  const esYo = perfil.id === usuario.id;
  const pais = PAISES.find((p) => p.codigo === perfil.pais)?.nombre;

  return (
    <>
      <section className="tarjeta">
        <div className="perfil-cabecera">
          <Avatar usuario={perfil} tamano={88} />
          <div style={{ flex: 1 }}>
            <h1>{nombreCompleto(perfil)}</h1>
            <p className="suave" style={{ margin: 0 }}>
              @{perfil.nombreUsuario}
              {pais && ` · ${pais}`}
              {perfil.miembroDesde &&
                ` · Miembro desde ${fechaCompleta(perfil.miembroDesde).split(',')[0]}`}
            </p>
          </div>
        </div>

        {perfil.biografia && <p className="texto-libre">{perfil.biografia}</p>}

        <div style={{ marginTop: '0.75rem' }}>
          {esYo ? (
            <Link to="/ajustes" className="boton-secundario">
              ✏️ Editar perfil
            </Link>
          ) : (
            <AccionesAmistad
              perfil={perfil}
              alCambiar={(amistad) => setDatos((p) => ({ ...p, amistad }))}
            />
          )}
        </div>
      </section>

      <h2>Publicaciones</h2>
      <PublicacionesDeUsuario usuarioId={perfil.id} />
    </>
  );
}

function PublicacionesDeUsuario({ usuarioId }) {
  const lista = usePaginado((cursor) => listarDeUsuario(usuarioId, cursor), usuarioId);
  return <ListaPublicaciones lista={lista} textoVacio="Aún no ha publicado nada." />;
}
