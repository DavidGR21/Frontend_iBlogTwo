/** Editar mi perfil y mi foto. */
import { useRef, useState } from 'react';
import { descartarImagenes, subirImagen } from '../api/archivos.js';
import { actualizarPerfil, obtenerYo } from '../api/usuarios.js';
import { Avatar } from '../componentes/Avatar.jsx';
import { Cargando } from '../componentes/Cargando.jsx';
import { MensajeError } from '../componentes/MensajeError.jsx';
import { PAISES, TIPOS_IMAGEN } from '../config.js';
import { useAvisos } from '../hooks/useAvisos.js';
import { useDatos } from '../hooks/useDatos.js';
import { useSesion } from '../hooks/useSesion.js';

export function Ajustes() {
  const { actualizarUsuario } = useSesion();
  const { datos: yo, cargando, error, recargar, setDatos } = useDatos(obtenerYo, 'yo');

  if (cargando) return <Cargando />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;

  const alGuardar = (actualizado) => {
    setDatos(actualizado);
    actualizarUsuario(actualizado);
  };

  return <FormAjustes key={yo.id} yo={yo} alGuardar={alGuardar} />;
}

/** Convierte "" en null para que el backend borre el valor. */
const valorOpcional = (texto) => (texto.trim() === '' ? null : texto.trim());

function FormAjustes({ yo, alGuardar }) {
  const { avisar } = useAvisos();
  const inputFoto = useRef(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [hoy] = useState(() => new Date().toISOString().slice(0, 10));
  const [datos, setDatos] = useState({
    nombres: yo.nombres ?? '',
    apellidos: yo.apellidos ?? '',
    biografia: yo.biografia ?? '',
    paisCodigo: yo.pais ?? '',
    telefono: yo.telefono ?? '',
    fechaNacimiento: yo.fechaNacimiento?.slice(0, 10) ?? '',
  });

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function cambiarFoto(evento) {
    const archivo = evento.target.files[0];
    evento.target.value = '';
    if (!archivo) return;
    setSubiendoFoto(true);
    let subido = null;
    try {
      subido = await subirImagen(archivo, 'perfil');
      // La foto anterior la borra del bucket el backend al guardar la nueva
      alGuardar(await actualizarPerfil({ fotoPerfilId: subido.id }));
      avisar('Foto actualizada');
    } catch (e) {
      avisar(e.message, 'error');
      if (subido) descartarImagenes([subido.id]);
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const actualizado = await actualizarPerfil({
        nombres: datos.nombres.trim(),
        apellidos: valorOpcional(datos.apellidos),
        biografia: valorOpcional(datos.biografia),
        paisCodigo: valorOpcional(datos.paisCodigo),
        telefono: valorOpcional(datos.telefono),
        fechaNacimiento: valorOpcional(datos.fechaNacimiento),
      });
      alGuardar(actualizado);
      avisar('Perfil guardado');
    } catch (e) {
      setError(e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h1>Ajustes del perfil</h1>

      <div className="fila" style={{ marginBottom: '1rem' }}>
        <Avatar usuario={yo} tamano={72} ampliable />
        <div>
          <button
            className="boton-secundario"
            onClick={() => inputFoto.current.click()}
            disabled={subiendoFoto}
          >
            {subiendoFoto ? 'Subiendo…' : 'Cambiar foto'}
          </button>
          <input
            ref={inputFoto}
            type="file"
            accept={TIPOS_IMAGEN.join(',')}
            hidden
            onChange={cambiarFoto}
          />
          <p className="suave" style={{ margin: '0.3rem 0 0' }}>
            @{yo.nombreUsuario} · {yo.correo}
          </p>
        </div>
      </div>

      <form className="formulario" onSubmit={guardar}>
        <div className="dos-columnas">
          <label>
            Nombres
            <input value={datos.nombres} onChange={cambiar('nombres')} maxLength={60} required />
          </label>
          <label>
            Apellidos
            <input value={datos.apellidos} onChange={cambiar('apellidos')} maxLength={60} />
          </label>
        </div>
        <label>
          Biografía
          <textarea value={datos.biografia} onChange={cambiar('biografia')} maxLength={300} />
        </label>
        <div className="dos-columnas">
          <label>
            País
            <select value={datos.paisCodigo} onChange={cambiar('paisCodigo')}>
              <option value="">— Sin especificar —</option>
              {PAISES.map((pais) => (
                <option key={pais.codigo} value={pais.codigo}>
                  {pais.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Celular
            <input
              type="tel"
              value={datos.telefono}
              onChange={cambiar('telefono')}
              placeholder="+593 99 123 4567"
              pattern="\+?[0-9 ]{7,20}"
              title="Solo números, espacios y + al inicio"
            />
          </label>
        </div>
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={datos.fechaNacimiento}
            onChange={cambiar('fechaNacimiento')}
            max={hoy}
          />
        </label>

        <MensajeError error={error} />
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  );
}
