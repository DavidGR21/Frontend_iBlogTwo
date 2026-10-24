/** Lista de cuentas: buscar por usuario, nombre o correo y filtrar por estado. */
import { useEffect, useState } from 'react';
import { listarUsuarios } from '../../api/admin.js';
import { useDiferido } from '../../hooks/useDiferido.js';
import { usePaginado } from '../../hooks/usePaginado.js';
import { haceCuanto, nombreCompleto } from '../../utils/formato.js';
import { Avatar } from '../Avatar.jsx';
import { BarraFiltros, InsigniasCuenta, PieLista } from './Comunes.jsx';

const FILTROS = [
  { valor: '', nombre: 'Todas' },
  { valor: 'activos', nombre: 'Activas' },
  { valor: 'suspendidos', nombre: 'Suspendidas' },
  { valor: 'sin_verificar', nombre: 'Sin verificar' },
  { valor: 'admins', nombre: 'Admins' },
];

/** `cuentaCambiada`: la última cuenta modificada desde la ficha, para actualizar su fila. */
export function UsuariosAdmin({ alVerUsuario, cuentaCambiada }) {
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('');
  const buscar = useDiferido(texto.trim());

  const lista = usePaginado(
    (cursor) => listarUsuarios({ buscar, filtro }, cursor),
    `${buscar}|${filtro}`,
  );

  const { setItems } = lista;
  useEffect(() => {
    if (!cuentaCambiada) return;
    setItems((items) =>
      items.map((u) => (u.id === cuentaCambiada.id ? { ...u, ...cuentaCambiada } : u)),
    );
  }, [cuentaCambiada, setItems]);

  return (
    <>
      <BarraFiltros
        texto={texto}
        alCambiarTexto={setTexto}
        placeholder="Buscar por usuario, nombre o correo…"
        opciones={FILTROS}
        valor={filtro}
        alCambiarFiltro={setFiltro}
      />

      <section className="tarjeta admin-lista">
        <ul className="lista-personas">
          {lista.items.map((u) => (
            <li key={u.id} className="persona admin-usuario">
              <button
                type="button"
                className="admin-usuario-boton"
                onClick={() => alVerUsuario(u.id)}
              >
                <Avatar usuario={u} tamano={44} />
                <span className="admin-usuario-texto">
                  <span className="admin-usuario-nombre">
                    <strong>@{u.nombreUsuario}</strong>
                    <InsigniasCuenta usuario={u} />
                  </span>
                  <span className="suave">
                    {nombreCompleto(u)} · {u.correo}
                  </span>
                  <span className="suave">
                    Se unió {haceCuanto(u.creadoEn)} · {u.totalPublicaciones} post
                    {u.totalPublicaciones === 1 ? '' : 's'} · {u.totalComentarios} comentario
                    {u.totalComentarios === 1 ? '' : 's'}
                    {u.ultimoAccesoEn && ` · último acceso ${haceCuanto(u.ultimoAccesoEn)}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <PieLista lista={lista} textoVacio="No hay cuentas con esos filtros." />
      </section>
    </>
  );
}
