import { useState } from 'react';
import { useSesion } from '../../hooks/useSesion.js';
import { Avatar } from '../Avatar.jsx';
import { IconoEnviar } from '../iconos/Iconos.jsx';

/**
 * Caja de texto para comentar o responder. `alEnviar(texto)` debe devolver una promesa.
 * Con `conAvatar` muestra la foto de quien escribe a la izquierda.
 */
export function FormComentario({
  alEnviar,
  placeholder = 'Escribe un comentario…',
  autoFocus,
  conAvatar = false,
  valorInicial = '',
}) {
  const { usuario } = useSesion();
  const [texto, setTexto] = useState(valorInicial);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await alEnviar(texto.trim());
      setTexto('');
    } catch {
      // Quien llama ya mostró el error; el texto se conserva para reintentar.
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form-comentario" onSubmit={enviar}>
      {conAvatar && <Avatar usuario={usuario} tamano={34} />}
      <div className="form-comentario-caja">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          autoFocus={autoFocus}
          disabled={enviando}
          aria-label={placeholder}
        />
        <button
          className="form-comentario-enviar"
          disabled={enviando || !texto.trim()}
          aria-label="Enviar"
        >
          <IconoEnviar tamano={18} />
        </button>
      </div>
    </form>
  );
}
