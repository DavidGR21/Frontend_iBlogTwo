import { useCallback, useEffect, useRef, useState } from 'react';

const SIN_CARGAR = Symbol('sin-cargar');

/**
 * Lista paginada por cursor (formato { items, siguienteCursor } de la API).
 *   const lista = usePaginado((cursor) => listarFeed(cursor), 'feed');
 *   lista.items, lista.cargando, lista.error, lista.hayMas, lista.cargarMas(), lista.setItems(...)
 * Se reinicia cuando cambia `clave`.
 */
export function usePaginado(cargarPagina, clave) {
  const [pagina, setPagina] = useState({ clave: SIN_CARGAR, items: [], cursor: null, error: null });
  const [cargandoMas, setCargandoMas] = useState(false);
  const cargarRef = useRef(cargarPagina);

  useEffect(() => {
    cargarRef.current = cargarPagina;
  });

  useEffect(() => {
    let vigente = true;
    cargarRef
      .current(undefined)
      .then(
        (respuesta) =>
          vigente &&
          setPagina({
            clave,
            items: respuesta.items,
            cursor: respuesta.siguienteCursor ?? null,
            error: null,
          }),
      )
      .catch((error) => vigente && setPagina({ clave, items: [], cursor: null, error }));
    return () => {
      vigente = false;
    };
  }, [clave]);

  const setItems = useCallback(
    (cambio) =>
      setPagina((p) => ({ ...p, items: typeof cambio === 'function' ? cambio(p.items) : cambio })),
    [],
  );

  const cargarMas = useCallback(async () => {
    if (pagina.cursor === null) return;
    setCargandoMas(true);
    try {
      const respuesta = await cargarRef.current(pagina.cursor);
      setPagina((p) => {
        const ids = new Set(p.items.map((item) => item.id));
        return {
          ...p,
          items: [...p.items, ...respuesta.items.filter((item) => !ids.has(item.id))],
          cursor: respuesta.siguienteCursor ?? null,
          error: null,
        };
      });
    } catch (error) {
      setPagina((p) => ({ ...p, error }));
    } finally {
      setCargandoMas(false);
    }
  }, [pagina.cursor]);

  const actual = pagina.clave === clave;
  return {
    items: actual ? pagina.items : [],
    setItems,
    cargando: !actual || cargandoMas,
    error: actual ? pagina.error : null,
    hayMas: actual && pagina.cursor !== null,
    cargarMas,
  };
}
