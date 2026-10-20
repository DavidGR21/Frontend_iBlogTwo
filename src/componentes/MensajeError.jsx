/**
 * Muestra un ErrorApi del backend: el mensaje general y, si hay, el detalle por campo.
 */
export function MensajeError({ error, alReintentar }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <p>{error.message}</p>
      {error.detalles?.length > 0 && (
        <ul>
          {error.detalles.map((detalle) => (
            <li key={detalle.campo}>
              <strong>{detalle.campo.split('.').pop()}:</strong> {detalle.mensaje}
            </li>
          ))}
        </ul>
      )}
      {alReintentar && (
        <button className="boton-secundario" onClick={alReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
