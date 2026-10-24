/**
 * Ficha de una cuenta en una ventana modal, con las acciones de moderación:
 * suspender (con motivo y, si se quiere, borrando todo su contenido), reactivar, verificar
 * el correo, cerrar sus sesiones, quitar la foto y borrar su contenido.
 * Con otros administradores (y con uno mismo) solo se puede mirar.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import {
  borrarContenidoUsuario,
  cerrarSesionesUsuario,
  obtenerUsuario,
  quitarFotoUsuario,
  reactivarUsuario,
  suspenderUsuario,
  verificarCorreoUsuario,
} from '../../api/admin.js';
import { PAISES } from '../../config.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useConfirmar } from '../../hooks/useConfirmar.js';
import { useDatos } from '../../hooks/useDatos.js';
import { useSesion } from '../../hooks/useSesion.js';
import { fechaCompleta, haceCuanto, nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { Cargando } from '../Cargando.jsx';
import { IconoCheck, IconoProhibido, IconoSalir } from '../iconos/Iconos.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { Modal } from '../Modal.jsx';
import { InsigniasCuenta } from './Comunes.jsx';

function FormSuspender({ usuario, alSuspender, alCancelar }) {
  const [motivo, setMotivo] = useState('');
  const [borrarContenido, setBorrarContenido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      alSuspender(await suspenderUsuario(usuario.id, { motivo: motivo.trim(), borrarContenido }));
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  return (
    <form className="formulario admin-suspender" onSubmit={enviar}>
      <p className="suave">
        @{usuario.nombreUsuario} no podrá ingresar y se cerrarán sus sesiones al instante. Sus
        publicaciones, comentarios y perfil dejan de verse mientras siga suspendida.
      </p>
      <label>
        Motivo (lo verá al intentar ingresar)
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={300}
          placeholder="Ej.: spam, acoso, contenido inapropiado…"
          disabled={enviando}
          autoFocus
        />
      </label>
      <label className="admin-casilla">
        <input
          type="checkbox"
          checked={borrarContenido}
          onChange={(e) => setBorrarContenido(e.target.checked)}
          disabled={enviando}
        />
        Borrar también todas sus publicaciones (con sus imágenes) y comentarios
      </label>
      <MensajeError error={error} />
      <div className="confirmar-acciones">
        <button type="button" className="boton-secundario" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button className="boton-confirmar-peligro" disabled={enviando}>
          {enviando ? 'Suspendiendo…' : 'Suspender cuenta'}
        </button>
      </div>
    </form>
  );
}

export function FichaUsuario({ usuarioId, alCerrar, alCambiar, alVerContenido }) {
  const { usuario: yo } = useSesion();
  const { avisar } = useAvisos();
  const confirmar = useConfirmar();
  const {
    datos: usuario,
    cargando,
    error,
    recargar,
    setDatos,
  } = useDatos(() => obtenerUsuario(usuarioId), usuarioId);
  const [suspendiendo, setSuspendiendo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  function actualizar(nuevo) {
    setDatos(nuevo);
    alCambiar?.(nuevo);
  }

  /** Pregunta (si hay `pregunta`), ejecuta y avisa. */
  async function ejecutar(accion, mensaje, pregunta) {
    if (pregunta && !(await confirmar(pregunta))) return;
    setOcupado(true);
    try {
      const resultado = await accion();
      avisar(typeof mensaje === 'function' ? mensaje(resultado) : mensaje);
      // Casi todas devuelven la ficha actualizada; las que no, se vuelve a pedir
      actualizar(resultado?.id ? resultado : await obtenerUsuario(usuario.id));
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
    }
  }

  const titulo = usuario ? `@${usuario.nombreUsuario}` : 'Cuenta';

  if (cargando || error) {
    return (
      <Modal titulo={titulo} alCerrar={alCerrar}>
        {cargando ? <Cargando /> : <MensajeError error={error} alReintentar={recargar} />}
      </Modal>
    );
  }

  const esYo = usuario.id === yo.id;
  const moderable = !esYo && usuario.rol !== 'admin';
  const suspendida = usuario.estado === 'suspendido';
  const pais = PAISES.find((p) => p.codigo === usuario.pais)?.nombre;

  return (
    <Modal titulo={titulo} alCerrar={alCerrar} className="admin-ficha">
      <div className="admin-ficha-cabecera">
        <Avatar usuario={usuario} tamano={72} ampliable />
        <div>
          <h3>{nombreCompleto(usuario)}</h3>
          <p className="suave">
            {usuario.correo}
            {pais && ` · ${pais}`}
          </p>
          <div className="admin-insignias">
            <InsigniasCuenta usuario={usuario} />
            {!suspendida && usuario.estado === 'activo' && usuario.correoVerificado && (
              <span className="insignia insignia-ok">Activa</span>
            )}
          </div>
        </div>
      </div>

      {usuario.biografia && <p className="texto-libre">{usuario.biografia}</p>}

      {suspendida && (
        <div className="error" role="note">
          <p>
            Suspendida {haceCuanto(usuario.suspendidoEn)}
            {usuario.suspendidoPor && ` por @${usuario.suspendidoPor}`}.
            {usuario.motivoSuspension && ` Motivo: ${usuario.motivoSuspension}`}
          </p>
        </div>
      )}

      <dl className="admin-datos">
        <div>
          <dt>Miembro desde</dt>
          <dd title={fechaCompleta(usuario.creadoEn)}>{fechaCompleta(usuario.creadoEn)}</dd>
        </div>
        <div>
          <dt>Último acceso</dt>
          <dd>{usuario.ultimoAccesoEn ? haceCuanto(usuario.ultimoAccesoEn) : 'Nunca'}</dd>
        </div>
        <div>
          <dt>Publicaciones</dt>
          <dd>{usuario.totalPublicaciones}</dd>
        </div>
        <div>
          <dt>Comentarios</dt>
          <dd>{usuario.totalComentarios}</dd>
        </div>
        <div>
          <dt>Reacciones</dt>
          <dd>{usuario.totalReacciones}</dd>
        </div>
        <div>
          <dt>Amigos</dt>
          <dd>{usuario.totalAmigos}</dd>
        </div>
        <div>
          <dt>Mensajes enviados</dt>
          <dd>{usuario.totalMensajes}</dd>
        </div>
        <div>
          <dt>Sesiones abiertas</dt>
          <dd>{usuario.sesionesActivas}</dd>
        </div>
      </dl>

      <div className="admin-ficha-enlaces">
        {usuario.estado === 'activo' && usuario.correoVerificado && (
          <Link to={`/u/${usuario.nombreUsuario}`} className="boton-secundario">
            Ver perfil
          </Link>
        )}
        <button
          type="button"
          className="boton-secundario"
          onClick={() => alVerContenido(usuario, 'publicaciones')}
        >
          Ver sus publicaciones
        </button>
        <button
          type="button"
          className="boton-secundario"
          onClick={() => alVerContenido(usuario, 'comentarios')}
        >
          Ver sus comentarios
        </button>
      </div>

      {suspendiendo ? (
        <FormSuspender
          usuario={usuario}
          alCancelar={() => setSuspendiendo(false)}
          alSuspender={(nuevo) => {
            setSuspendiendo(false);
            actualizar(nuevo);
            avisar(`@${nuevo.nombreUsuario} fue suspendida`);
          }}
        />
      ) : (
        <div className="admin-acciones" aria-busy={ocupado}>
          {!usuario.correoVerificado && (
            <button
              className="accion"
              disabled={ocupado}
              onClick={() =>
                ejecutar(() => verificarCorreoUsuario(usuario.id), 'Correo verificado')
              }
            >
              <IconoCheck tamano={18} /> Verificar correo
            </button>
          )}
          {!esYo && usuario.sesionesActivas > 0 && (
            <button
              className="accion"
              disabled={ocupado}
              onClick={() =>
                ejecutar(() => cerrarSesionesUsuario(usuario.id), 'Sesiones cerradas', {
                  titulo: '¿Cerrar todas sus sesiones?',
                  mensaje: `@${usuario.nombreUsuario} tendrá que volver a ingresar en todos sus dispositivos.`,
                  confirmar: 'Cerrar sesiones',
                })
              }
            >
              <IconoSalir tamano={18} /> Cerrar sesiones
            </button>
          )}
          {moderable && usuario.fotoPerfilUrl && (
            <button
              className="accion accion-peligro"
              disabled={ocupado}
              onClick={() =>
                ejecutar(() => quitarFotoUsuario(usuario.id), 'Foto de perfil quitada', {
                  titulo: '¿Quitar su foto de perfil?',
                  mensaje: 'La foto se borrará del almacenamiento. No se puede deshacer.',
                  confirmar: 'Quitar foto',
                })
              }
            >
              Quitar foto
            </button>
          )}
          {moderable && (
            <button
              className="accion accion-peligro"
              disabled={ocupado}
              onClick={() =>
                ejecutar(
                  () => borrarContenidoUsuario(usuario.id),
                  (r) =>
                    `Se borraron ${r.publicaciones} publicación(es) y ${r.comentarios} comentario(s)`,
                  {
                    titulo: '¿Borrar todo su contenido?',
                    mensaje: `Se borrarán todas las publicaciones (con sus imágenes) y comentarios de @${usuario.nombreUsuario}. No se puede deshacer.`,
                    confirmar: 'Borrar todo',
                  },
                )
              }
            >
              Borrar su contenido
            </button>
          )}
          {moderable &&
            (suspendida ? (
              <button
                className="accion accion-principal"
                disabled={ocupado}
                onClick={() =>
                  ejecutar(
                    () => reactivarUsuario(usuario.id),
                    `@${usuario.nombreUsuario} vuelve a estar activa`,
                    {
                      titulo: '¿Reactivar la cuenta?',
                      mensaje: 'Podrá volver a ingresar y su contenido volverá a verse.',
                      confirmar: 'Reactivar',
                      peligro: false,
                    },
                  )
                }
              >
                <IconoCheck tamano={18} /> Reactivar cuenta
              </button>
            ) : (
              <button
                className="accion accion-peligro"
                disabled={ocupado}
                onClick={() => setSuspendiendo(true)}
              >
                <IconoProhibido tamano={18} /> Suspender cuenta
              </button>
            ))}
          {!moderable && (
            <p className="suave">
              {esYo
                ? 'Esta es tu cuenta: no puedes moderarte a ti mismo.'
                : 'Es administrador: no se puede moderar desde aquí.'}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
