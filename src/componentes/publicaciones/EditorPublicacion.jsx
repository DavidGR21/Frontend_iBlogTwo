/**
 * Edición de una publicación propia: texto e imágenes. Se pueden quitar las imágenes que ya
 * tenía y añadir nuevas (hasta MAX_IMAGENES_POST). Las nuevas se suben al guardar; luego se
 * envía la lista final de archivoIds (solo si las imágenes cambiaron).
 */
import { useEffect, useRef, useState } from 'react';
import { descartarImagenes, subirImagen, validarImagen } from '../../api/archivos.js';
import { ErrorApi } from '../../api/cliente.js';
import { editarPublicacion } from '../../api/publicaciones.js';
import { MAX_IMAGENES_POST, TIPOS_IMAGEN } from '../../config.js';
import { IconoCerrar, IconoImagen } from '../iconos/Iconos.jsx';
import { MensajeError } from '../MensajeError.jsx';

export function EditorPublicacion({ publicacion, alGuardar, alCancelar }) {
  const [texto, setTexto] = useState(publicacion.contenido);
  // { id, url } para las que ya tenía; { archivo, url } para las nuevas (url = vista previa local)
  const [imagenes, setImagenes] = useState(publicacion.imagenes ?? []);
  const [estado, setEstado] = useState(null); // texto del botón mientras guarda
  const [error, setError] = useState(null);
  const inputArchivos = useRef(null);

  // Liberar las vistas previas locales al salir
  const imagenesRef = useRef(imagenes);
  useEffect(() => {
    imagenesRef.current = imagenes;
  });
  useEffect(
    () => () => imagenesRef.current.forEach((i) => i.archivo && URL.revokeObjectURL(i.url)),
    [],
  );

  const guardando = estado !== null;
  const originales = (publicacion.imagenes ?? []).map((i) => i.id);
  const cambiaronImagenes =
    imagenes.length !== originales.length || imagenes.some((img, i) => img.id !== originales[i]);

  function agregar(archivos) {
    const elegidas = [...archivos];
    for (const archivo of elegidas) {
      const problema = validarImagen(archivo);
      if (problema) {
        setError(new ErrorApi(400, 'IMAGEN_INVALIDA', `${archivo.name}: ${problema}`));
        return;
      }
    }
    const nuevas = elegidas
      .slice(0, MAX_IMAGENES_POST - imagenes.length)
      .map((archivo) => ({ archivo, url: URL.createObjectURL(archivo) }));
    setImagenes([...imagenes, ...nuevas]);
    setError(null);
  }

  function quitar(indice) {
    const imagen = imagenes[indice];
    if (imagen.archivo) URL.revokeObjectURL(imagen.url);
    setImagenes(imagenes.filter((_, i) => i !== indice));
  }

  async function guardar() {
    if (!texto.trim()) return;
    setError(null);
    setEstado('Guardando');
    const nuevasSubidas = []; // ids de las imágenes nuevas ya subidas al bucket
    try {
      const cambios = { contenido: texto.trim() };
      if (cambiaronImagenes) {
        const archivoIds = [];
        for (const imagen of imagenes) {
          if (imagen.archivo) {
            setEstado(`Subiendo ${archivoIds.length + 1}/${imagenes.length}`);
            const { id } = await subirImagen(imagen.archivo, 'post');
            nuevasSubidas.push(id);
            archivoIds.push(id);
          } else {
            archivoIds.push(imagen.id);
          }
        }
        cambios.archivoIds = archivoIds;
        setEstado('Guardando');
      }
      alGuardar(await editarPublicacion(publicacion.id, cambios));
    } catch (e) {
      setError(e);
      setEstado(null);
      // No se guardó: las nuevas no quedan enlazadas (las quitadas las borra el backend al guardar)
      descartarImagenes(nuevasSubidas);
    }
  }

  return (
    <div className="post-editar">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={5000}
        disabled={guardando}
        aria-label="Texto de la publicación"
        autoFocus
      />

      {imagenes.length > 0 && (
        <div className="previas-cuadricula editor-previas">
          {imagenes.map((imagen, i) => (
            <div
              key={imagen.id ?? imagen.url}
              className={`previa ${imagen.archivo ? 'nueva' : ''}`}
            >
              <img src={imagen.url} alt={`Imagen ${i + 1}`} />
              {!guardando && (
                <button
                  type="button"
                  className="previa-quitar"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar imagen ${i + 1}`}
                >
                  <IconoCerrar tamano={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <MensajeError error={error} />

      <div className="post-editar-barra">
        <button
          type="button"
          className="crear-post-imagenes"
          onClick={() => inputArchivos.current.click()}
          disabled={guardando || imagenes.length >= MAX_IMAGENES_POST}
        >
          <IconoImagen />
          Añadir fotos
          <span className="crear-post-cuenta">
            {imagenes.length}/{MAX_IMAGENES_POST}
          </span>
        </button>
        <input
          ref={inputArchivos}
          type="file"
          accept={TIPOS_IMAGEN.join(',')}
          multiple
          hidden
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="fila">
          <button className="boton-secundario" onClick={alCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button className="boton" onClick={guardar} disabled={guardando || !texto.trim()}>
            {estado ? `${estado}…` : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
