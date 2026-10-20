import { useState } from 'react';
import { Link } from 'react-router';
import { olvideClave } from '../../api/auth.js';
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

  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Recuperar contraseña</h1>
      {enviado ? (
        <p>
          Si existe una cuenta con <strong>{correo}</strong>, te llegará un enlace para crear una
          contraseña nueva.
        </p>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          <label>
            Correo de tu cuenta
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </label>
          <MensajeError error={error} />
          <button className="boton" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
      <p className="suave">
        <Link to="/login">Volver a ingresar</Link>
      </p>
    </section>
  );
}
