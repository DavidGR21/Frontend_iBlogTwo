import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { reenviarVerificacion } from '../../api/auth.js';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { useAvisos } from '../../hooks/useAvisos.js';
import { useSesion } from '../../hooks/useSesion.js';

export function Login() {
  const { iniciarSesion } = useSesion();
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const { state } = useLocation();

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(correo, clave);
      navegar(state?.desde ?? '/', { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar() {
    try {
      await reenviarVerificacion(correo);
      avisar('Te reenviamos el correo de verificación');
    } catch (e) {
      avisar(e.message, 'error');
    }
  }

  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Ingresar</h1>
      <form className="formulario" onSubmit={enviar}>
        <label>
          Correo
          <input
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </label>

        <MensajeError error={error} />
        {error?.codigo === 'CORREO_NO_VERIFICADO' && (
          <button type="button" className="boton-secundario" onClick={reenviar}>
            Reenviar correo de verificación
          </button>
        )}

        <button className="boton" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="suave">
        <Link to="/olvide-clave">¿Olvidaste tu contraseña?</Link>
        <br />
        ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
      </p>
    </section>
  );
}
