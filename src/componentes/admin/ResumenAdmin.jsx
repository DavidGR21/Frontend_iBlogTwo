/**
 * Resumen del sitio: cifras principales, actividad de los últimos 14 días, las cuentas que
 * más publican y el mantenimiento del bucket (borrar ya las imágenes que no se usan).
 */
import { useState } from 'react';
import { limpiarArchivos, obtenerEstadisticas } from '../../api/admin.js';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useDatos } from '../../hooks/useDatos.js';
import { Cargando } from '../Cargando.jsx';
import { MensajeError } from '../MensajeError.jsx';
import { tamanoLegible } from '../../utils/formato.js';
import { AutorAdmin } from './Comunes.jsx';

const SERIES = [
  { clave: 'registros', nombre: 'Registros' },
  { clave: 'publicaciones', nombre: 'Publicaciones' },
  { clave: 'comentarios', nombre: 'Comentarios' },
];

const diaCorto = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function Cifra({ valor, nombre, detalle, tono }) {
  return (
    <div className={`admin-cifra ${tono ? `admin-cifra-${tono}` : ''}`}>
      <strong>{valor.toLocaleString('es')}</strong>
      <span>{nombre}</span>
      {detalle && <small>{detalle}</small>}
    </div>
  );
}

function GraficoActividad({ actividad }) {
  const maximo = Math.max(1, ...actividad.flatMap((d) => SERIES.map((s) => d[s.clave])));
  return (
    <figure className="admin-grafico">
      <div className="admin-grafico-barras" role="img" aria-label="Actividad por día">
        {actividad.map((dia) => {
          const fecha = diaCorto.format(new Date(dia.dia));
          return (
            <div
              key={dia.dia}
              className="admin-grafico-dia"
              title={`${fecha}: ${SERIES.map((s) => `${dia[s.clave]} ${s.nombre.toLowerCase()}`).join(', ')}`}
            >
              <div className="admin-grafico-grupo">
                {SERIES.map((s) => (
                  <span
                    key={s.clave}
                    className={`admin-barra admin-barra-${s.clave}`}
                    style={{ height: `${(dia[s.clave] / maximo) * 100}%` }}
                  />
                ))}
              </div>
              <span className="admin-grafico-etiqueta">{fecha}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="admin-leyenda">
        {SERIES.map((s) => (
          <span key={s.clave}>
            <i className={`admin-barra-${s.clave}`} aria-hidden="true" /> {s.nombre}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function ResumenAdmin({ alVerUsuario }) {
  const { avisar } = useAvisos();
  const { datos, cargando, error, recargar } = useDatos(obtenerEstadisticas, 'estadisticas');
  const [limpiando, setLimpiando] = useState(false);

  async function limpiar() {
    setLimpiando(true);
    try {
      const { pendientes, sinUso } = await limpiarArchivos();
      const total = pendientes + sinUso;
      avisar(
        total
          ? `Se borraron ${total} archivo(s) del bucket (${pendientes} sin confirmar, ${sinUso} sin uso)`
          : 'El bucket ya estaba limpio',
      );
      recargar();
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setLimpiando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;

  const { usuarios, publicaciones } = datos;

  return (
    <>
      <section className="admin-cifras" aria-label="Cifras del sitio">
        <Cifra
          valor={usuarios.total}
          nombre="Cuentas"
          detalle={`+${usuarios.nuevos7d} esta semana · ${usuarios.conectados24h} activas hoy`}
        />
        <Cifra
          valor={usuarios.suspendidos}
          nombre="Suspendidas"
          tono={usuarios.suspendidos ? 'peligro' : null}
        />
        <Cifra
          valor={usuarios.sinVerificar}
          nombre="Sin verificar"
          tono={usuarios.sinVerificar ? 'aviso' : null}
        />
        <Cifra
          valor={publicaciones.total}
          nombre="Publicaciones"
          detalle={`+${publicaciones.ultimos7d} esta semana · ${publicaciones.eliminadas} eliminadas`}
        />
        <Cifra valor={datos.comentarios} nombre="Comentarios" />
        <Cifra valor={datos.reacciones} nombre="Reacciones" />
        <Cifra
          valor={datos.mensajes}
          nombre="Mensajes"
          detalle={`${datos.conversaciones} conversaciones`}
        />
        <Cifra
          valor={datos.amistades}
          nombre="Amistades"
          detalle={`${datos.solicitudesPendientes} solicitudes pendientes`}
        />
      </section>

      <section className="tarjeta">
        <h2>Actividad de los últimos 14 días</h2>
        <GraficoActividad actividad={datos.actividad} />
      </section>

      <div className="admin-dos-columnas">
        <section className="tarjeta">
          <h2>Quién más publica (30 días)</h2>
          {datos.masActivos.length === 0 ? (
            <p className="vacio">Nadie ha publicado en los últimos 30 días.</p>
          ) : (
            <ol className="admin-ranking">
              {datos.masActivos.map(({ usuario, publicaciones: total }) => (
                <li key={usuario.id}>
                  <AutorAdmin autor={usuario} />
                  <button
                    type="button"
                    className="boton-enlace"
                    onClick={() => alVerUsuario(usuario.id)}
                  >
                    {total} post{total === 1 ? '' : 's'} · Ver ficha
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="tarjeta">
          <h2>Almacenamiento</h2>
          <p className="admin-almacenamiento">
            <strong>{tamanoLegible(datos.archivos.bytes)}</strong>
            <span className="suave">en {datos.archivos.total.toLocaleString('es')} imágenes</span>
          </p>
          <p className="suave">
            Cada hora se borran solas del bucket las imágenes que nadie usa (subidas que no se
            publicaron, fotos reemplazadas, posts eliminados). Puedes lanzar la limpieza ahora.
          </p>
          <button className="boton" onClick={limpiar} disabled={limpiando}>
            {limpiando ? 'Limpiando…' : 'Limpiar archivos sin uso'}
          </button>
        </section>
      </div>
    </>
  );
}
