# iBlog — Frontend

Interfaz web de iBlog: React + Vite + React Router + Socket.io.
Versión funcional y sencilla, pensada para probar todo el backend; el diseño se mejora después.

## Arranque rápido

```bash
npm install
cp .env.example .env.local     # en PowerShell: Copy-Item .env.example .env.local
npm run dev                    # http://localhost:5173
```

El backend debe estar corriendo y su `.env` debe tener `FRONTEND_URL=http://localhost:5173`
(lo usa para CORS y Socket.io).

| Script            | Qué hace                                  |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga        |
| `npm run build`   | Genera la versión de producción (`dist/`) |
| `npm run preview` | Sirve `dist/` para revisarla              |
| `npm run lint`    | Revisa el código con oxlint               |
| `npm run formato` | Formatea con Prettier                     |

## Qué incluye

| Pantalla                        | Ruta                                          |
| ------------------------------- | --------------------------------------------- |
| Ingresar / Crear cuenta         | `/login`, `/registro`                         |
| Verificar correo (enlace)       | `/verificar-correo?token=…`                   |
| Recuperar / restablecer clave   | `/olvide-clave`, `/restablecer-clave?token=…` |
| Feed + crear post con imágenes  | `/`                                           |
| Publicación + comentarios       | `/publicaciones/:id`                          |
| Perfil + botones de amistad     | `/u/:nombreUsuario`                           |
| Editar perfil y foto            | `/ajustes`                                    |
| Amigos y solicitudes + buscador | `/amigos`                                     |
| Chat en tiempo real             | `/mensajes`, `/mensajes/:id`                  |

En tiempo real: publicaciones nuevas, reacciones, comentarios, solicitudes de amistad,
mensajes, "escribiendo…" y no leídos. El punto verde junto a tu foto indica que el socket
está conectado.

## Contrato con el backend

**[docs/API.md](docs/API.md)** describe cada endpoint y evento: qué recibe y qué devuelve.
El frontend lo sigue al pie de la letra. Cada módulo del backend que se implemente con ese
contrato hace funcionar su pantalla sin tocar el frontend.

## Estructura

```
src/
├─ main.jsx               Punto de entrada: router + proveedores
├─ App.jsx                Mapa de rutas (públicas, solo invitados, privadas)
├─ config.js              URL del backend y constantes (reacciones, países, límites)
├─ api/                   Una función por endpoint, agrupadas por módulo
│  └─ cliente.js          fetch con token, cookies, renovación automática y errores
├─ sockets/
│  ├─ eventos.js          COPIA del catálogo de eventos del backend
│  └─ socket.js           Crea la conexión de Socket.io
├─ contexto/              Estado global: sesión (usuario + socket) y avisos
├─ hooks/                 useSesion, useAvisos, useEventoSocket, useDatos, usePaginado
├─ componentes/           Piezas reutilizables (tarjetas, formularios, chat…)
├─ paginas/               Una por pantalla (auth/ agrupa las de autenticación)
├─ utils/formato.js       Fechas y nombres
└─ estilos/global.css     Estilos base con modo claro/oscuro
```

### Reglas

1. **Las páginas y componentes nunca llaman a `fetch`**: usan las funciones de `src/api/`.
2. **Los nombres de eventos salen de `sockets/eventos.js`**, idéntico al del backend.
3. **Para escuchar un evento** usa `useEventoSocket(EVENTOS.X, manejador)`: se limpia solo.
4. **Cargar datos**: `useDatos` para un objeto, `usePaginado` para listas con "cargar más".
5. **El token de acceso vive solo en memoria** (nunca en `localStorage`); al recargar la página
   la sesión se recupera con la cookie httpOnly del refresh token.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (detecta Vite solo).
2. En **Settings → Environment Variables**: `VITE_API_URL=https://tu-backend.onrender.com`.
3. `vercel.json` ya redirige todas las rutas a `index.html` (necesario para React Router).
4. En Render, pon `FRONTEND_URL` con tu dominio de Vercel.
5. Configura el CORS del bucket de Neon para permitir `PUT` y `GET` desde ese dominio.

> Vercel y Render son dominios distintos: la cookie del refresh token debe crearse con
> `sameSite: 'none'` y `secure: true` en producción (detalle en docs/API.md).

## Preguntas frecuentes

- **Veo un 401 en la consola al abrir la app.** Es normal: la app pregunta si hay sesión y,
  si no la hay, el backend responde 401.
- **"No se pudo conectar con el servidor".** El backend no está corriendo o Render gratis está
  despertando (tarda ~1 minuto).
- **"No existe la ruta…".** Ese módulo del backend aún no está implementado (ver docs/API.md).
