/**
 * Cuadrícula de imágenes de una publicación, al estilo de Facebook:
 *  1 → grande · 2 → dos columnas · 3 → una grande y dos al lado · 4+ → 2 × 2.
 * Si hay más de IMAGENES_EN_CUADRICULA, la última casilla muestra "+N".
 * Al pulsar una imagen se abre el visor en la misma página.
 */
import { useState } from 'react';
import { IMAGENES_EN_CUADRICULA } from '../../config.js';
import { VisorImagenes } from './VisorImagenes.jsx';

export function GaleriaImagenes({ imagenes }) {
  const [abierta, setAbierta] = useState(null); // índice en el visor, o null

  const visibles = imagenes.slice(0, IMAGENES_EN_CUADRICULA);
  const ocultas = imagenes.length - visibles.length;

  return (
    <>
      <div className={`galeria galeria-${visibles.length}`}>
        {visibles.map((imagen, i) => {
          const conMas = ocultas > 0 && i === visibles.length - 1;
          return (
            <button
              key={imagen.id}
              type="button"
              className="galeria-celda"
              onClick={() => setAbierta(i)}
              aria-label={
                conMas
                  ? `Ver las ${imagenes.length} imágenes`
                  : `Abrir imagen ${i + 1} de ${imagenes.length}`
              }
            >
              <img src={imagen.url} alt="" loading="lazy" />
              {conMas && (
                <span className="galeria-mas">
                  <strong>+{ocultas}</strong>
                  Ver más
                </span>
              )}
            </button>
          );
        })}
      </div>

      {abierta !== null && (
        <VisorImagenes imagenes={imagenes} inicial={abierta} alCerrar={() => setAbierta(null)} />
      )}
    </>
  );
}
