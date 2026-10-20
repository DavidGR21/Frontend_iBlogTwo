export function Cargando({ texto = 'Cargando…' }) {
  return (
    <p className="cargando" role="status">
      <span className="spinner" aria-hidden="true" /> {texto}
    </p>
  );
}
