import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos al montar el componente (y cuando cambia `clave`).
 *   const { datos, cargando, error, recargar, setDatos } =
 *     useDatos(() => obtenerPublicacion(id), id);
 *
 * `cargando` se deduce comparando para qué clave/versión son los datos guardados,
 * así no hace falta cambiar estado al empezar cada carga.
 */
export function useDatos(cargar, clave) {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState({ datos: null, error: null, clave: undefined, version: -1 });
  const cargarRef = useRef(cargar);

  useEffect(() => {
    cargarRef.current = cargar;
  });

  useEffect(() => {
    let vigente = true;
    cargarRef
      .current()
      .then((datos) => vigente && setEstado({ datos, error: null, clave, version }))
      .catch((error) => vigente && setEstado({ datos: null, error, clave, version }));
    return () => {
      vigente = false;
    };
  }, [clave, version]);

  const setDatos = useCallback(
    (cambio) =>
      setEstado((anterior) => ({
        ...anterior,
        datos: typeof cambio === 'function' ? cambio(anterior.datos) : cambio,
      })),
    [],
  );

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const cargando = estado.clave !== clave || estado.version !== version;
  return {
    datos: estado.datos,
    error: cargando ? null : estado.error,
    cargando,
    setDatos,
    recargar,
  };
}
