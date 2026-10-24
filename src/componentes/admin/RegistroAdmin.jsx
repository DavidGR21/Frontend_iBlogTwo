/** Registro de auditoría: qué hizo cada administrador y cuándo. */
import { listarRegistro } from '../../api/admin.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { fechaCompleta, haceCuanto } from '../../utils/formato.js';
import { Insignia, PieLista } from './Comunes.jsx';

const ACCIONES = {
  suspender_usuario: { nombre: 'Suspendió una cuenta', tono: 'peligro' },
  reactivar_usuario: { nombre: 'Reactivó una cuenta', tono: 'ok' },
  verificar_correo: { nombre: 'Verificó un correo', tono: 'ok' },
  cerrar_sesiones: { nombre: 'Cerró sesiones', tono: 'aviso' },
  quitar_foto: { nombre: 'Quitó una foto de perfil', tono: 'aviso' },
  borrar_contenido: { nombre: 'Borró el contenido de una cuenta', tono: 'peligro' },
  eliminar_publicacion: { nombre: 'Eliminó una publicación', tono: 'peligro' },
  eliminar_comentario: { nombre: 'Eliminó un comentario', tono: 'peligro' },
  limpiar_archivos: { nombre: 'Limpió el almacenamiento', tono: 'neutro' },
};

export function RegistroAdmin({ alVerUsuario }) {
  const lista = usePaginado(listarRegistro, 'registro');

  return (
    <section className="tarjeta admin-lista">
      <ul className="admin-registro">
        {lista.items.map((r) => {
          const info = ACCIONES[r.accion] ?? { nombre: r.accion, tono: 'neutro' };
          return (
            <li key={r.id}>
              <span className="admin-registro-cabecera">
                <Insignia tono={info.tono}>{info.nombre}</Insignia>
                <span className="suave" title={fechaCompleta(r.creadaEn)}>
                  {haceCuanto(r.creadaEn)} · por @{r.admin ?? 'cuenta borrada'}
                </span>
              </span>
              {r.detalle && <span className="texto-libre">{r.detalle}</span>}
              {r.objetivoTipo === 'usuario' && r.objetivoId && (
                <button
                  type="button"
                  className="boton-enlace"
                  onClick={() => alVerUsuario(r.objetivoId)}
                >
                  Ver ficha de la cuenta
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <PieLista lista={lista} textoVacio="Todavía no hay acciones registradas." />
    </section>
  );
}
