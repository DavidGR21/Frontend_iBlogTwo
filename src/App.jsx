/** Mapa de pantallas de la aplicación. */
import { Route, Routes } from 'react-router';
import { Layout } from './componentes/Layout.jsx';
import { RutaInvitado, RutaPrivada } from './componentes/Rutas.jsx';
import { Ajustes } from './paginas/Ajustes.jsx';
import { Amigos } from './paginas/Amigos.jsx';
import { DetallePublicacion } from './paginas/DetallePublicacion.jsx';
import { Inicio } from './paginas/Inicio.jsx';
import { Login } from './paginas/auth/Login.jsx';
import { OlvideClave } from './paginas/auth/OlvideClave.jsx';
import { PantallaAuth } from './paginas/auth/PantallaAuth.jsx';
import { Registro } from './paginas/auth/Registro.jsx';
import { RestablecerClave } from './paginas/auth/RestablecerClave.jsx';
import { VerificarCorreo } from './paginas/auth/VerificarCorreo.jsx';
import { Mensajes } from './paginas/Mensajes.jsx';
import { NoEncontrado } from './paginas/NoEncontrado.jsx';
import { Perfil } from './paginas/Perfil.jsx';

export function App() {
  return (
    <Routes>
      {/* Login, registro y recuperar/restablecer contraseña comparten pantalla completa
          (mascota 3D + transición de grafiti) */}
      <Route element={<PantallaAuth />}>
        <Route element={<RutaInvitado />}>
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
          <Route path="olvide-clave" element={<OlvideClave />} />
        </Route>
        {/* Enlace que llega por correo: funciona con o sin sesión */}
        <Route path="restablecer-clave" element={<RestablecerClave />} />
      </Route>

      <Route element={<Layout />}>
        {/* Enlace que llega por correo: funciona con o sin sesión */}
        <Route path="verificar-correo" element={<VerificarCorreo />} />

        {/* Solo con sesión */}
        <Route element={<RutaPrivada />}>
          <Route index element={<Inicio />} />
          <Route path="publicaciones/:id" element={<DetallePublicacion />} />
          <Route path="u/:nombreUsuario" element={<Perfil />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="amigos" element={<Amigos />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="mensajes/:conversacionId" element={<Mensajes />} />
        </Route>

        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
