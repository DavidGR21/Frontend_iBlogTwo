/**
 * Campos y enlaces de la pantalla de acceso.
 * Las contraseñas llevan `data-secreto`: la mascota cierra los ojos cuando tienen el foco.
 */
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { ICONOS } from './iconos.jsx';

export function CampoAuth({ etiqueta, icono, extra, ...props }) {
  return (
    <label className="auth-campo">
      <span className="solo-lector">{etiqueta}</span>
      {icono}
      <input placeholder={etiqueta} {...props} />
      {extra}
    </label>
  );
}

export function CampoClave(props) {
  const [visible, setVisible] = useState(false);
  return (
    <CampoAuth
      {...props}
      icono={ICONOS.candado}
      type={visible ? 'text' : 'password'}
      data-secreto=""
      extra={
        <button
          type="button"
          className="auth-ojo"
          // Sin robar el foco: así la mascota sigue sabiendo que estás en la contraseña
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? ICONOS.ojo : ICONOS.ojoTachado}
        </button>
      }
    />
  );
}

export function SelectorAuth({ etiqueta, icono, children, ...props }) {
  return (
    <label className="auth-campo">
      <span className="solo-lector">{etiqueta}</span>
      {icono}
      <select {...props}>{children}</select>
    </label>
  );
}

/** Enlace entre login y registro que dispara la transición de grafiti. */
export function EnlaceGrafiti({ to, children }) {
  const { cambiarModo } = useOutletContext();

  function alHacerClic(evento) {
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
    evento.preventDefault();
    cambiarModo(to);
  }

  return (
    <Link to={to} onClick={alHacerClic}>
      {children}
    </Link>
  );
}
