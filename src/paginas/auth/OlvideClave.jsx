import { useState } from 'react';
import { olvideClave } from '../../api/auth.js';
import { CampoAuth, EnlaceGrafiti } from '../../componentes/auth/CampoAuth.jsx';
import { ICONOS } from '../../componentes/auth/iconos.jsx';
import { MensajeError } from '../../componentes/MensajeError.jsx';

export function OlvideClave() {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await olvideClave(correo);
      setEnviado(true);
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="auth-form">
        <h1 className="auth-titulo">
          <span className="auth-titulo-a">¡HECHO!</span>
        </h1>
        <p className="auth-texto">
          Si existe una cuenta con <strong>{correo}</strong>, te llegará un enlace para crear una
          contraseña nueva. Si no lo ves, revisa la carpeta de spam. 📬
        </p>
        <nav className="auth-enlaces auth-enlaces-centro">
          <EnlaceGrafiti to="/login">Volver a ingresar</EnlaceGrafiti>
        </nav>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      <h1 className="auth-titulo">
        <span className="auth-titulo-a">OLVIDÉ</span> <span className="auth-titulo-b">MI&nbsp;CLAVE</span>
      </h1>
      <p className="auth-texto">Escribe el correo de tu cuenta y te mandamos un enlace.</p>

      <CampoAuth
        etiqueta="Correo"
        icono={ICONOS.correo}
        extra={<span className="auth-adorno">{ICONOS.lata}</span>}
        type="email"
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
      />

      <MensajeError error={error} />

      <button className="auth-boton" disabled={enviando}>
        <span>{enviando ? 'Enviando…' : 'Enviar enlace'}</span>
      </button>

      <nav className="auth-enlaces">
        <EnlaceGrafiti to="/login">Volver a ingresar</EnlaceGrafiti>
        <EnlaceGrafiti to="/registro">Registrarse</EnlaceGrafiti>
      </nav>
    </form>
  );
}
