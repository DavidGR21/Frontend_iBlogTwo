/**
 * Crear publicación: texto obligatorio + hasta 10 imágenes opcionales.
 * Las imágenes se suben primero al bucket y luego se crea el post con sus ids.
 */
import { useEffect, useRef, useState } from 'react';
import { subirImagen, validarImagen } from '../../api/archivos.js';
import { ErrorApi } from '../../api/cliente.js';
import { crearPublicacion } from '../../api/publicaciones.js';
import { MAX_IMAGENES_POST, TIPOS_IMAGEN, VISIBILIDADES } from '../../config.js';
import { MensajeError } from '../MensajeError.jsx';

export function FormPublicacion({ alPublicar }) {
  const [contenido, setContenido] = useState('');
  const [visibilidad, setVisibilidad] = useState('publico');
  const [imagenes, setImagenes] = useState([]); // [{ archivo, vista }]
  const [estado, setEstado] = useState(null); // texto de progreso
  const [error, setError] = useState(null);
  const inputArchivos = useRef(null);

  // Liberar las vistas previas al salir de la página.
  const imagenesRef = useRef(imagenes);
  useEffect(() => {
    imagenesRef.current = imagenes;
  });
  useEffect(() => () => imagenesRef.current.forEach((i) => URL.revokeObjectURL(i.vista)), []);

  function agregarImagenes(evento) {
    const elegidas = [...evento.target.files];
    evento.target.value = '';
    for (const archivo of elegidas) {
      const problema = validarImagen(archivo);
      if (problema) {
        setError(new ErrorApi(400, 'IMAGEN_INVALIDA', `${archivo.name}: ${problema}`));
        return;
      }
    }
    const disponibles = MAX_IMAGENES_POST - imagenes.length;
    const nuevas = elegidas.slice(0, disponibles).map((archivo) => ({
      archivo,
      vista: URL.createObjectURL(archivo),
    }));
    setImagenes([...imagenes, ...nuevas]);
    setError(null);
  }

  function quitarImagen(indice) {
    URL.revokeObjectURL(imagenes[indice].vista);
    setImagenes(imagenes.filter((_, i) => i !== indice));
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (!contenido.trim()) return;
    setError(null);
    try {
      const archivoIds = [];
      for (const [i, { archivo }] of imagenes.entries()) {
        setEstado(`Subiendo imagen ${i + 1} de ${imagenes.length}…`);
        const subido = await subirImagen(archivo, 'post');
        archivoIds.push(subido.id);
      }
      setEstado('Publicando…');
      const publicacion = await crearPublicacion({
        contenido: contenido.trim(),
        visibilidad,
        archivoIds,
      });

      imagenes.forEach((i) => URL.revokeObjectURL(i.vista));
      setContenido('');
      setImagenes([]);
      alPublicar(publicacion);
    } catch (e) {
      setError(e);
    } finally {
      setEstado(null);
    }
  }

  const ocupado = estado !== null;

  return (
    <form className="tarjeta formulario" onSubmit={publicar}>
      <textarea
        placeholder="¿Qué quieres compartir?"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        maxLength={5000}
        disabled={ocupado}
      />

      {imagenes.length > 0 && (
        <div className="previas">
          {imagenes.map((imagen, i) => (
            <div className="previa" key={imagen.vista}>
              <img src={imagen.vista} alt={`Imagen ${i + 1}`} />
              {!ocupado && (
                <button type="button" onClick={() => quitarImagen(i)} aria-label="Quitar imagen">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <MensajeError error={error} />

      <div className="fila-espaciada">
        <div className="fila">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => inputArchivos.current.click()}
            disabled={ocupado || imagenes.length >= MAX_IMAGENES_POST}
          >
            🖼️ Imágenes ({imagenes.length}/{MAX_IMAGENES_POST})
          </button>
          <input
            ref={inputArchivos}
            type="file"
            accept={TIPOS_IMAGEN.join(',')}
            multiple
            hidden
            onChange={agregarImagenes}
          />
          <select
            value={visibilidad}
            onChange={(e) => setVisibilidad(e.target.value)}
            disabled={ocupado}
            aria-label="Visibilidad"
            style={{ width: 'auto' }}
          >
            {VISIBILIDADES.map((v) => (
              <option key={v.valor} value={v.valor}>
                {v.nombre}
              </option>
            ))}
          </select>
        </div>
        <button className="boton" disabled={ocupado || !contenido.trim()}>
          {estado ?? 'Publicar'}
        </button>
      </div>
    </form>
  );
}
