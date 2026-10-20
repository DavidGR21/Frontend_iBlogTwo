import { useState } from 'react';

/** Caja de texto para comentar o responder. `alEnviar(texto)` debe devolver una promesa. */
export function FormComentario({ alEnviar, placeholder = 'Escribe un comentario…', autoFocus }) {
  const [texto, setTexto] = useState('');
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
    <form className="fila" onSubmit={enviar} style={{ marginTop: '0.6rem' }}>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        autoFocus={autoFocus}
        disabled={enviando}
      />
      <button className="boton" disabled={enviando || !texto.trim()}>
        Enviar
      </button>
    </form>
  );
}
