import { useState } from 'react';
import { registrar } from '../../api/auth.js';
import { ErrorApi } from '../../api/cliente.js';
import {
  CampoAuth,
  CampoClave,
  EnlaceGrafiti,
  SelectorAuth,
} from '../../componentes/auth/CampoAuth.jsx';
import { ICONOS } from '../../componentes/auth/iconos.jsx';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { PAISES } from '../../config.js';
import { IconoCorreo } from '../../componentes/iconos/Iconos.jsx';

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
      <div className="auth-form">
        <h1 className="auth-titulo">
          <span className="auth-titulo-a">¡LISTO!</span>
        </h1>
        <p className="auth-texto">
          Te enviamos un enlace a <strong>{datos.correo}</strong> para verificar tu cuenta. Si no lo
          ves, revisa la carpeta de spam. <IconoCorreo tamano={18} className="icono-en-linea" />
        </p>
        <nav className="auth-enlaces auth-enlaces-centro">
          <EnlaceGrafiti to="/login">Ir a ingresar</EnlaceGrafiti>
        </nav>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      <h1 className="auth-titulo">
        <span className="auth-titulo-a">SIGN</span> <span className="auth-titulo-b">UP</span>
      </h1>

      <CampoAuth
        etiqueta="Nombre de usuario"
        icono={ICONOS.arroba}
        value={datos.nombreUsuario}
        onChange={cambiar('nombreUsuario')}
        pattern="[A-Za-z0-9_.]{3,30}"
        title="Entre 3 y 30 caracteres: letras, números, _ o ."
        autoComplete="username"
        required
      />
      <div className="auth-fila">
        <CampoAuth
          etiqueta="Nombres"
          icono={ICONOS.usuario}
          value={datos.nombres}
          onChange={cambiar('nombres')}
          maxLength={60}
          autoComplete="given-name"
          required
        />
        <CampoAuth
          etiqueta="Apellidos"
          icono={ICONOS.usuario}
          value={datos.apellidos}
          onChange={cambiar('apellidos')}
          maxLength={60}
          autoComplete="family-name"
        />
      </div>
      <SelectorAuth
        etiqueta="País"
        icono={ICONOS.globo}
        value={datos.paisCodigo}
        onChange={cambiar('paisCodigo')}
      >
        <option value="">País (opcional)</option>
        {PAISES.map((pais) => (
          <option key={pais.codigo} value={pais.codigo}>
            {pais.nombre}
          </option>
        ))}
      </SelectorAuth>
      <CampoAuth
        etiqueta="Correo"
        icono={ICONOS.correo}
        type="email"
        value={datos.correo}
        onChange={cambiar('correo')}
        autoComplete="email"
        required
      />
      <div className="auth-fila">
        <CampoClave
          etiqueta="Contraseña"
          value={datos.clave}
          onChange={cambiar('clave')}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          required
        />
        <CampoClave
          etiqueta="Repetir contraseña"
          value={datos.confirmarClave}
          onChange={cambiar('confirmarClave')}
          autoComplete="new-password"
          required
        />
      </div>

      <MensajeError error={error} />
      <button className="auth-boton auth-boton-rosa" disabled={enviando}>
        <span>{enviando ? 'Creando…' : 'Crear cuenta'}</span>
      </button>

      <nav className="auth-enlaces auth-enlaces-centro">
        <span>
          ¿Ya tienes cuenta? <EnlaceGrafiti to="/login">Ingresa</EnlaceGrafiti>
        </span>
      </nav>
    </form>
  );
}
