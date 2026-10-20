/** Destino del enlace del correo: /verificar-correo?token=… */
import { Link, useSearchParams } from 'react-router';
import { verificarCorreo } from '../../api/auth.js';
import { Cargando } from '../../componentes/Cargando.jsx';
import { MensajeError } from '../../componentes/MensajeError.jsx';
import { useDatos } from '../../hooks/useDatos.js';

// Un token solo se puede usar una vez. En desarrollo, StrictMode monta la página
// dos veces: guardamos la promesa para no enviar el mismo token dos veces.
const verificaciones = new Map();
function verificarUnaVez(token) {
  if (!verificaciones.has(token)) verificaciones.set(token, verificarCorreo(token));
  return verificaciones.get(token);
}

export function VerificarCorreo() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token');

  const { datos, cargando, error } = useDatos(
    () => (token ? verificarUnaVez(token) : Promise.reject(new Error('El enlace no tiene token'))),
    token,
  );

  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Verificación de correo</h1>
      {cargando && <Cargando texto="Verificando…" />}
      {error && <MensajeError error={error} />}
      {datos && <p className="exito">✔ {datos.mensaje ?? 'Tu correo quedó verificado.'}</p>}
      {!cargando && <Link to="/login">Ir a ingresar</Link>}
    </section>
  );
}
