/**
 * Crear publicación: texto obligatorio + hasta 10 imágenes opcionales (botón o arrastrar).
 * Las imágenes se suben primero al bucket y luego se crea el post con sus ids.
 *
 * Mientras publica, el botón se va "pintando" con spray de izquierda a derecha según el
 * avance (cada imagen subida + la creación del post) y cada vista previa marca su estado.
 */
import { useEffect, useRef, useState } from 'react';
import { descartarImagenes, subirImagen, validarImagen } from '../../api/archivos.js';
import { ErrorApi } from '../../api/cliente.js';
import { crearPublicacion } from '../../api/publicaciones.js';
import {
  IMAGENES_EN_CUADRICULA,
  MAX_IMAGENES_POST,
  TIPOS_IMAGEN,
  VISIBILIDADES,
} from '../../config.js';
import { useSesion } from '../../hooks/useSesion.js';
import { Avatar } from '../Avatar.jsx';
import { ICONOS_VISIBILIDAD, IconoCerrar, IconoImagen } from '../iconos/Iconos.jsx';
import { LataLogo } from '../Logo.jsx';
import { MensajeError } from '../MensajeError.jsx';

const MAX_CARACTERES = 5000;
const AVISO_CARACTERES = 4500; // a partir de aquí el contador se pone en alerta
const PAUSA_FINAL = 450; // ms con el botón pintado del todo antes de limpiar el formulario

/** `sinCabecera`: sin el título (p. ej. dentro de una ventana modal que ya lo tiene). */
export function FormPublicacion({ alPublicar, sinCabecera = false }) {
  const { usuario } = useSesion();
  const [contenido, setContenido] = useState('');
  const [visibilidad, setVisibilidad] = useState('publico');
  const [imagenes, setImagenes] = useState([]); // [{ archivo, vista }]
  const [verTodas, setVerTodas] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  // null = en reposo; { subidas, creando, listo } mientras publica
  const [avance, setAvance] = useState(null);
  const [error, setError] = useState(null);
  const inputArchivos = useRef(null);

  // Liberar las vistas previas al salir de la página.
  const imagenesRef = useRef(imagenes);
  useEffect(() => {
    imagenesRef.current = imagenes;
  });
  useEffect(() => () => imagenesRef.current.forEach((i) => URL.revokeObjectURL(i.vista)), []);

  const publicando = avance !== null;
  const llenas = imagenes.length >= MAX_IMAGENES_POST;

  function agregarImagenes(archivos) {
    const elegidas = [...archivos];
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
    setError(
      elegidas.length > disponibles
        ? new ErrorApi(400, 'DEMASIADAS', `Solo se pueden añadir ${MAX_IMAGENES_POST} imágenes.`)
        : null,
    );
  }

  function quitarImagen(indice) {
    URL.revokeObjectURL(imagenes[indice].vista);
    const restantes = imagenes.filter((_, i) => i !== indice);
    setImagenes(restantes);
    if (restantes.length <= IMAGENES_EN_CUADRICULA) setVerTodas(false);
  }

  async function publicar(evento) {
    evento.preventDefault();
    if (!contenido.trim() || publicando) return;
    setError(null);
    setAvance({ subidas: 0, creando: false, listo: false });
    const archivoIds = [];
    try {
      for (const { archivo } of imagenes) {
        const subido = await subirImagen(archivo, 'post');
        archivoIds.push(subido.id);
        setAvance((a) => ({ ...a, subidas: a.subidas + 1 }));
      }
      setAvance((a) => ({ ...a, creando: true }));
      const publicacion = await crearPublicacion({
        contenido: contenido.trim(),
        visibilidad,
        archivoIds,
      });

      setAvance((a) => ({ ...a, listo: true }));
      await new Promise((r) => setTimeout(r, PAUSA_FINAL));
      imagenes.forEach((i) => URL.revokeObjectURL(i.vista));
      setContenido('');
      setImagenes([]);
      setVerTodas(false);
      alPublicar(publicacion);
    } catch (e) {
      setError(e);
      // La publicación no se creó: las imágenes que sí se subieron no deben quedar en el bucket
      descartarImagenes(archivoIds);
    } finally {
      setAvance(null);
    }
  }

  // Avance de 0 a 1: cada imagen es un paso y crear el post es el último
  const pasos = imagenes.length + 1;
  const progreso = !avance
    ? 0
    : avance.listo
      ? 1
      : Math.max(0.08, (avance.subidas + (avance.creando ? 0.6 : 0.25)) / pasos);

  const visibles = verTodas ? imagenes : imagenes.slice(0, IMAGENES_EN_CUADRICULA);
  const ocultas = imagenes.length - visibles.length;

  return (
    <form
      className={`tarjeta crear-post ${arrastrando ? 'arrastrando' : ''} ${publicando ? 'publicando' : ''}`}
      onSubmit={publicar}
      onDragOver={(e) => {
        if (publicando || llenas || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        if (!publicando) agregarImagenes(e.dataTransfer.files);
      }}
    >
      <header className="crear-post-cabecera">
        <Avatar usuario={usuario} tamano={42} />
        <div>
          {sinCabecera ? (
            <strong>{usuario?.nombreUsuario}</strong>
          ) : (
            <>
              <h2>Crear un nuevo post</h2>
              <span className="suave">{usuario?.nombreUsuario}</span>
            </>
          )}
        </div>
      </header>

      <div className="crear-post-texto">
        <textarea
          placeholder="¿Qué quieres compartir?"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          maxLength={MAX_CARACTERES}
          disabled={publicando}
          aria-label="Contenido de la publicación"
        />
        {contenido.length > 0 && (
          <span
            className={`crear-post-contador ${contenido.length > AVISO_CARACTERES ? 'alerta' : ''}`}
          >
            {contenido.length}/{MAX_CARACTERES}
          </span>
        )}
      </div>

      {imagenes.length > 0 && (
        <div className="crear-post-previas">
          <div className="previas-cuadricula">
            {visibles.map((imagen, i) => {
              const conMas = ocultas > 0 && i === visibles.length - 1;
              const estado = !avance
                ? ''
                : i < avance.subidas
                  ? 'subida'
                  : i === avance.subidas
                    ? 'subiendo'
                    : 'en-cola';
              return (
                <div key={imagen.vista} className={`previa ${estado}`}>
                  <img src={imagen.vista} alt={`Imagen ${i + 1}`} />
                  {conMas && (
                    <button type="button" className="previa-mas" onClick={() => setVerTodas(true)}>
                      <strong>+{ocultas}</strong>
                      Ver más
                    </button>
                  )}
                  {!publicando && !conMas && (
                    <button
                      type="button"
                      className="previa-quitar"
                      onClick={() => quitarImagen(i)}
                      aria-label={`Quitar imagen ${i + 1}`}
                    >
                      <IconoCerrar tamano={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {verTodas && imagenes.length > IMAGENES_EN_CUADRICULA && (
            <button type="button" className="previas-menos" onClick={() => setVerTodas(false)}>
              Ver menos
            </button>
          )}
        </div>
      )}

      {arrastrando && <div className="crear-post-soltar">Suelta las imágenes aquí</div>}

      <MensajeError error={error} />

      <div className="crear-post-opciones">
        <button
          type="button"
          className="crear-post-imagenes"
          onClick={() => inputArchivos.current.click()}
          disabled={publicando || llenas}
        >
          <IconoImagen />
          Foto
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
            agregarImagenes(e.target.files);
            e.target.value = '';
          }}
        />

        <fieldset className="chips" disabled={publicando}>
          <legend className="solo-lector">¿Quién puede verlo?</legend>
          {VISIBILIDADES.map(({ valor, nombre }) => {
            const Icono = ICONOS_VISIBILIDAD[valor];
            return (
              <label
                key={valor}
                className={`chip ${visibilidad === valor ? 'chip-activo' : ''}`}
                title={nombre}
              >
                <input
                  type="radio"
                  name="visibilidad"
                  value={valor}
                  checked={visibilidad === valor}
                  onChange={() => setVisibilidad(valor)}
                />
                <Icono tamano={15} />
                <span>{nombre}</span>
              </label>
            );
          })}
        </fieldset>
      </div>

      <button
        className={`boton-spray ${publicando ? 'cargando' : ''}`}
        disabled={publicando || !contenido.trim()}
        style={{ '--progreso': progreso }}
        aria-live="polite"
      >
        {publicando && (
          <span className="spray-avance" aria-hidden="true">
            <span className="spray-pintura" />
            <span className="spray-lata">
              <LataLogo />
              <span className="spray-niebla">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
          </span>
        )}
        <span className="boton-spray-texto">{publicando ? 'Publicando' : 'Publicar'}</span>
      </button>
    </form>
  );
}
