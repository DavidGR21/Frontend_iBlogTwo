/** Destino del enlace del correo: /restablecer-clave?token=… */
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { restablecerClave } from '../../api/auth.js';
import { ErrorApi } from '../../api/cliente.js';
import { CampoClave, EnlaceGrafiti } from '../../componentes/auth/CampoAuth.jsx';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { IconoCandado } from '../../componentes/iconos/Iconos.jsx';

export function RestablecerClave() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token');

  const [clave, setClave] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    if (clave !== confirmar) {
      setError(new ErrorApi(400, 'CLAVES_DISTINTAS', 'Las contraseñas no coinciden'));
      return;
    }
    setEnviando(true);
    try {
      await restablecerClave(token, clave);
      setListo(true);
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-form">
        <h1 className="auth-titulo">
          <span className="auth-titulo-a">¡UPS!</span>
        </h1>
        <p className="auth-texto">Este enlace no es válido o le falta algo. Pide uno nuevo.</p>
        <nav className="auth-enlaces auth-enlaces-centro">
          <EnlaceGrafiti to="/olvide-clave">Recuperar contraseña</EnlaceGrafiti>
        </nav>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="auth-form">
        <h1 className="auth-titulo">
          <span className="auth-titulo-a">¡LISTO!</span>
        </h1>
        <p className="auth-texto">
          Tu contraseña se cambió. Ya puedes ingresar con la nueva.{' '}
          <IconoCandado tamano={18} className="icono-en-linea" />
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
        <span className="auth-titulo-a">NUEVA</span> <span className="auth-titulo-b">CLAVE</span>
      </h1>

      <CampoClave
        etiqueta="Nueva contraseña"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        required
      />
      <CampoClave
        etiqueta="Repetir contraseña"
        autoComplete="new-password"
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value)}
        required
      />

      <MensajeError error={error} />

      <button className="auth-boton" disabled={enviando}>
        <span>{enviando ? 'Guardando…' : 'Guardar clave'}</span>
      </button>

      <nav className="auth-enlaces auth-enlaces-centro">
        <EnlaceGrafiti to="/login">Volver a ingresar</EnlaceGrafiti>
      </nav>
    </form>
  );
}
