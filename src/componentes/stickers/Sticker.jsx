/**
 * Un sticker enviado (en un comentario o un mensaje). El tamaño lo pone el CSS con la clase
 * (`sticker-comentario`, `sticker-chat`); width/height solo reservan el hueco para que la
 * página no salte mientras carga. Si KLIPY ya no lo sirve, se muestra un aviso en su lugar.
 */
import { useState } from 'react';
import { IconoSticker } from '../iconos/Iconos.jsx';

export function Sticker({ sticker, className = '' }) {
  const [fallo, setFallo] = useState(false);
  const ancho = sticker.ancho || 1;
  const alto = sticker.alto || 1;

  if (fallo) {
    return (
      <span className={`sticker-no-disponible ${className}`}>
        <IconoSticker tamano={18} /> Sticker no disponible
      </span>
    );
  }

  return (
    <img
      className={`sticker ${className}`}
      src={sticker.url}
      alt={sticker.titulo ? `Sticker: ${sticker.titulo}` : 'Sticker'}
      width={ancho}
      height={alto}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFallo(true)}
    />
  );
}
