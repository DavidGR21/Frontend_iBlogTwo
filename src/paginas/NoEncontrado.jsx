import { Link } from 'react-router';

export function NoEncontrado() {
  return (
    <section className="tarjeta tarjeta-centrada">
      <h1>Página no encontrada</h1>
      <p className="suave">La dirección que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
