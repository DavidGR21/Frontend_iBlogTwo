/** Destino del enlace del correo: /restablecer-clave?token=… */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { restablecerClave } from '../../api/auth.js';
import { ErrorApi } from '../../api/cliente.js';
import { MensajeError } from '../../componentes/MensajeError.jsx';

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
      <section className="tarjeta tarjeta-centrada">
        <h1>Enlace inválido</h1>
        <p>Este enlace no es válido. Pide uno nuevo.</p>
        <Link to="/olvide-clave">Recuperar contraseña</Link>
      </section>
    );
  }

  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Nueva contraseña</h1>
      {listo ? (
        <>
          <p className="exito">✔ Tu contraseña se cambió. Ya puedes ingresar.</p>
          <Link to="/login">Ir a ingresar</Link>
        </>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
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
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <MensajeError error={error} />
          <button className="boton" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </section>
  );
}
