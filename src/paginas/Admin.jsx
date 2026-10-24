/**
 * Panel de administración (solo rol admin; ver RutaAdmin). Pestañas:
 *  - Resumen: cifras, actividad, quién más publica y limpieza del almacenamiento.
 *  - Usuarios: buscar cuentas y abrir su ficha (suspender, reactivar, verificar…).
 *  - Publicaciones / Comentarios: todo el contenido del sitio para moderarlo.
 *  - Registro: lo que ha hecho cada administrador.
 * La ficha de una cuenta se abre en una ventana desde cualquier pestaña; "Ver sus
 * publicaciones/comentarios" cambia de pestaña con el filtro de esa cuenta.
 */
import { useState } from 'react';
import { ComentariosAdmin, PublicacionesAdmin } from '../componentes/admin/ContenidoAdmin.jsx';
import { FichaUsuario } from '../componentes/admin/FichaUsuario.jsx';
import { RegistroAdmin } from '../componentes/admin/RegistroAdmin.jsx';
import { ResumenAdmin } from '../componentes/admin/ResumenAdmin.jsx';
import { UsuariosAdmin } from '../componentes/admin/UsuariosAdmin.jsx';
import { IconoEscudo } from '../componentes/iconos/Iconos.jsx';
import '../estilos/admin.css';

const PESTANAS = [
  { valor: 'resumen', nombre: 'Resumen' },
  { valor: 'usuarios', nombre: 'Usuarios' },
  { valor: 'publicaciones', nombre: 'Publicaciones' },
  { valor: 'comentarios', nombre: 'Comentarios' },
  { valor: 'registro', nombre: 'Registro' },
];

export function Admin() {
  const [pestana, setPestana] = useState('resumen');
  const [fichaId, setFichaId] = useState(null);
  const [cuentaCambiada, setCuentaCambiada] = useState(null);
  const [autor, setAutor] = useState(null); // filtro de Publicaciones/Comentarios

  function verContenido(usuario, destino) {
    setAutor({ id: usuario.id, nombreUsuario: usuario.nombreUsuario });
    setFichaId(null);
    setPestana(destino);
  }

  return (
    <>
      <header className="admin-cabecera">
        <IconoEscudo tamano={30} />
        <div>
          <h1>Administración</h1>
          <p className="suave">Revisa la actividad, modera el contenido y gestiona las cuentas.</p>
        </div>
      </header>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.valor}
            role="tab"
            aria-selected={pestana === p.valor}
            className={pestana === p.valor ? 'activa' : ''}
            onClick={() => setPestana(p.valor)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {pestana === 'resumen' && <ResumenAdmin alVerUsuario={setFichaId} />}
      {pestana === 'usuarios' && (
        <UsuariosAdmin alVerUsuario={setFichaId} cuentaCambiada={cuentaCambiada} />
      )}
      {pestana === 'publicaciones' && (
        <PublicacionesAdmin autor={autor} alFiltrarAutor={setAutor} />
      )}
      {pestana === 'comentarios' && <ComentariosAdmin autor={autor} alFiltrarAutor={setAutor} />}
      {pestana === 'registro' && <RegistroAdmin alVerUsuario={setFichaId} />}

      {fichaId && (
        <FichaUsuario
          usuarioId={fichaId}
          alCerrar={() => setFichaId(null)}
          alCambiar={setCuentaCambiada}
          alVerContenido={verContenido}
        />
      )}
    </>
  );
}
