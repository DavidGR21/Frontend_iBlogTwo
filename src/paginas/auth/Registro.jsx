import { useState } from 'react';
import { Link } from 'react-router';
import { registrar } from '../../api/auth.js';
import { ErrorApi } from '../../api/cliente.js';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { PAISES } from '../../config.js';

const VACIO = {
  nombreUsuario: '',
  nombres: '',
  apellidos: '',
  correo: '',
  clave: '',
  confirmarClave: '',
  paisCodigo: '',
};

export function Registro() {
  const [datos, setDatos] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [registrado, setRegistrado] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    if (datos.clave !== datos.confirmarClave) {
      setError(new ErrorApi(400, 'CLAVES_DISTINTAS', 'Las contraseñas no coinciden'));
      return;
    }
    setEnviando(true);
    try {
      const { confirmarClave: _omitir, ...cuerpo } = datos;
      await registrar({
        ...cuerpo,
        apellidos: cuerpo.apellidos || undefined,
        paisCodigo: cuerpo.paisCodigo || undefined,
      });
      setRegistrado(true);
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  if (registrado) {
    return (
      <section className="tarjeta tarjeta-centrada">
        <h1>¡Revisa tu correo! 📬</h1>
        <p>
          Te enviamos un enlace a <strong>{datos.correo}</strong> para verificar tu cuenta. Si no lo
          ves, revisa la carpeta de spam.
        </p>
        <Link to="/login">Ir a ingresar</Link>
      </section>
    );
  }

  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Crear cuenta</h1>
      <form className="formulario" onSubmit={enviar}>
        <label>
          Nombre de usuario
          <input
            value={datos.nombreUsuario}
            onChange={cambiar('nombreUsuario')}
            pattern="[A-Za-z0-9_.]{3,30}"
            title="Entre 3 y 30 caracteres: letras, números, _ o ."
            autoComplete="username"
            required
          />
        </label>
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
          Correo
          <input
            type="email"
            value={datos.correo}
            onChange={cambiar('correo')}
            autoComplete="email"
            required
          />
        </label>
        <div className="dos-columnas">
          <label>
            Contraseña
            <input
              type="password"
              value={datos.clave}
              onChange={cambiar('clave')}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Repetir contraseña
            <input
              type="password"
              value={datos.confirmarClave}
              onChange={cambiar('confirmarClave')}
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        <MensajeError error={error} />
        <button className="boton" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="suave">
        ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
      </p>
    </section>
  );
}
