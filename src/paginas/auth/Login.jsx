import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { reenviarVerificacion } from '../../api/auth.js';
import { CampoAuth, CampoClave, EnlaceGrafiti } from '../../componentes/auth/CampoAuth.jsx';
import { ICONOS } from '../../componentes/auth/iconos.jsx';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useSesion } from '../../hooks/useSesion.js';

export function Login() {
  const { iniciarSesion } = useSesion();
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const { state } = useLocation();

  const [identificador, setIdentificador] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(identificador.trim(), clave);
      navegar(state?.desde ?? '/', { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar() {
    try {
      await reenviarVerificacion(identificador.trim());
      avisar('Te reenviamos el correo de verificación');
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <form className="auth-form" onSubmit={enviar}>
      <h1 className="auth-titulo">
        <span className="auth-titulo-a">LOG</span> <span className="auth-titulo-b">IN</span>
      </h1>

      <CampoAuth
        etiqueta="Usuario o correo"
        icono={ICONOS.usuario}
        extra={<span className="auth-adorno">{ICONOS.lata}</span>}
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={identificador}
        onChange={(e) => setIdentificador(e.target.value)}
        required
      />
      <CampoClave
        etiqueta="Contraseña"
        autoComplete="current-password"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        required
      />

      <MensajeError error={error} />
      {/* El reenvío necesita el correo: solo se ofrece si entró con él */}
      {error?.codigo === 'CORREO_NO_VERIFICADO' && identificador.includes('@') && (
        <button type="button" className="auth-secundario" onClick={reenviar}>
          Reenviar correo de verificación
        </button>
      )}

      <button className="auth-boton" disabled={enviando}>
        <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
      </button>

      <nav className="auth-enlaces">
        <EnlaceGrafiti to="/olvide-clave">Olvidé mi contraseña</EnlaceGrafiti>
        <EnlaceGrafiti to="/registro">Registrarse</EnlaceGrafiti>
      </nav>
    </form>
  );
}
