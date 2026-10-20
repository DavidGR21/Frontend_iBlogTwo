# Contrato de la API de iBlog

Este documento es el acuerdo entre frontend y backend. El frontend lo sigue al pie
de la letra; cada módulo del backend debe responder exactamente con estas formas.

- Base: `{VITE_API_URL}/api/v1`
- JSON en `camelCase`. Fechas en ISO 8601 (`2026-10-20T09:00:00.000Z`).
- Rutas marcadas 🔒 exigen `Authorization: Bearer <tokenAcceso>`.
- Todas las peticiones del frontend usan `credentials: 'include'` (cookie del refresh token).

## Errores

Siempre con este formato (ya implementado en `middlewares/manejarErrores.js`):

```json
{
  "error": {
    "codigo": "NO_ENCONTRADO",
    "mensaje": "Texto para mostrar",
    "detalles": [{ "campo": "body.correo", "mensaje": "…" }]
  }
}
```

El frontend muestra `mensaje` y, si hay `detalles`, los muestra junto a cada campo.
Códigos que el frontend trata de forma especial:

| Código                 | Estado | Qué hace el frontend                                          |
| ---------------------- | ------ | ------------------------------------------------------------- |
| `NO_AUTENTICADO`       | 401    | Intenta `POST /auth/refrescar` una vez; si falla, va al login |
| `CORREO_NO_VERIFICADO` | 403    | En el login ofrece "Reenviar correo de verificación"          |

## Paginación por cursor

Las listas devuelven `{ "items": [...], "siguienteCursor": <valor> | null }`.
Para la siguiente página el frontend envía `?antesDe=<siguienteCursor>&limite=20`.
`null` significa que no hay más.

---

## Objetos comunes

```jsonc
// UsuarioResumen: se usa como autor, amigo, participante…
{ "id": "uuid", "nombreUsuario": "david", "nombres": "David", "apellidos": "Giler", "fotoPerfilUrl": "https://…" | null }

// UsuarioYo: la cuenta del usuario con sesión
{ "id": "uuid", "nombreUsuario": "david", "correo": "david@…", "nombres": "David", "apellidos": "Giler",
  "biografia": "…", "pais": "EC", "telefono": "+593…", "fechaNacimiento": "2001-05-10",
  "fotoPerfilUrl": "https://…" | null, "fotoPerfilId": "uuid" | null }

// Publicacion
{ "id": "uuid", "autor": UsuarioResumen, "contenido": "texto", "visibilidad": "publico|amigos|privado",
  "imagenes": [{ "id": "uuid", "url": "https://…" }],
  "reacciones": { "me_gusta": 3, "me_encanta": 1 },      // solo tipos con total > 0
  "miReaccion": "me_gusta" | null, "totalComentarios": 4, "editada": false, "creadaEn": "fecha" }

// Comentario
{ "id": "uuid", "publicacionId": "uuid", "comentarioPadreId": "uuid" | null, "autor": UsuarioResumen,
  "contenido": "texto" | null /* null si eliminado */, "eliminado": false, "totalRespuestas": 2, "creadoEn": "fecha" }

// Mensaje
{ "id": 123, "conversacionId": "uuid", "remitenteId": "uuid", "contenido": "texto", "imagenUrl": null, "creadoEn": "fecha" }
```

Tipos de reacción (igual que el enum de la BD):
`me_gusta`, `me_encanta`, `me_divierte`, `me_asombra`, `me_entristece`, `me_enoja`, `me_disgusta`.

---

## Auth — `/auth`

| Método | Ruta                     | Cuerpo                                                               | Respuesta                                            |
| ------ | ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| POST   | `/registro`              | `{ nombreUsuario, correo, clave, nombres, apellidos?, paisCodigo? }` | `201 { mensaje }`                                    |
| POST   | `/verificar-correo`      | `{ token }`                                                          | `{ mensaje }`                                        |
| POST   | `/reenviar-verificacion` | `{ correo }`                                                         | `{ mensaje }` (igual exista o no)                    |
| POST   | `/login`                 | `{ correo, clave }`                                                  | `{ tokenAcceso, usuario: UsuarioYo }` + cookie       |
| POST   | `/refrescar`             | — (usa la cookie)                                                    | `{ tokenAcceso, usuario: UsuarioYo }` + cookie nueva |
| POST   | `/logout`                | —                                                                    | `204`, borra la cookie                               |
| POST   | `/olvide-clave`          | `{ correo }`                                                         | `{ mensaje }` (igual exista o no)                    |
| POST   | `/restablecer-clave`     | `{ token, clave }`                                                   | `{ mensaje }`                                        |

Enlaces que el backend pone en los correos:

- Verificación: `{FRONTEND_URL}/verificar-correo?token=<token>`
- Restablecer clave: `{FRONTEND_URL}/restablecer-clave?token=<token>`

Cookie del refresh token: `httpOnly`, `path=/api/v1/auth`, y en producción
`secure: true, sameSite: 'none'` (Vercel y Render son dominios distintos).
En desarrollo (`localhost`), `sameSite: 'lax'` y `secure: false`.

## Usuarios — `/usuarios`

| Método | Ruta              | Cuerpo / Query                                                                                  | Respuesta       |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| GET    | `/yo` 🔒          |                                                                                                 | `UsuarioYo`     |
| PATCH  | `/yo/perfil` 🔒   | `{ nombres?, apellidos?, biografia?, paisCodigo?, telefono?, fechaNacimiento?, fotoPerfilId? }` | `UsuarioYo`     |
| GET    | `/:nombreUsuario` | — (si llega token, incluir `amistad`)                                                           | `PerfilPublico` |

En `PATCH /yo/perfil`, un campo enviado como `null` borra ese dato; un campo ausente no se toca.

```jsonc
// PerfilPublico (ya implementado, falta el campo opcional "amistad")
{ "id", "nombreUsuario", "nombres", "apellidos", "biografia", "pais", "fotoPerfilUrl", "miembroDesde",
  "amistad": null | { "id": "uuid", "estado": "pendiente|aceptada", "soyElSolicitante": true } }
```

## Archivos — `/archivos` 🔒

1. `POST /subidas` `{ tipoMime, tamanoBytes, destino: "perfil" | "post" | "mensaje" }` → `{ archivoId, urlSubida }`
2. El navegador hace `PUT urlSubida` con el archivo y el header `Content-Type: <tipoMime>`.
3. `POST /:id/confirmar` → `{ id, url }`

> El bucket debe permitir CORS para `PUT` y `GET` desde el dominio del frontend.

## Publicaciones — `/publicaciones`

| Método | Ruta                  | Cuerpo / Query                               | Respuesta                                   |
| ------ | --------------------- | -------------------------------------------- | ------------------------------------------- |
| GET    | `/`                   | `?antesDe&limite`                            | `{ items: Publicacion[], siguienteCursor }` |
| GET    | `/usuario/:usuarioId` | `?antesDe&limite`                            | `{ items: Publicacion[], siguienteCursor }` |
| POST   | `/` 🔒                | `{ contenido, visibilidad, archivoIds: [] }` | `201 Publicacion`                           |
| GET    | `/:id`                |                                              | `Publicacion`                               |
| PATCH  | `/:id` 🔒             | `{ contenido?, visibilidad? }`               | `Publicacion`                               |
| DELETE | `/:id` 🔒             |                                              | `204`                                       |
| PUT    | `/:id/reaccion` 🔒    | `{ tipo }`                                   | `{ reacciones, miReaccion }`                |
| DELETE | `/:id/reaccion` 🔒    |                                              | `{ reacciones, miReaccion: null }`          |

## Comentarios — `/comentarios`

| Método | Ruta              | Cuerpo / Query                                     | Respuesta                                                               |
| ------ | ----------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/`               | `?publicacionId&antesDe&limite`                    | `{ items: Comentario[], siguienteCursor }` (raíz, más antiguos primero) |
| GET    | `/:id/respuestas` |                                                    | `{ items: Comentario[] }`                                               |
| POST   | `/` 🔒            | `{ publicacionId, contenido, comentarioPadreId? }` | `201 Comentario`                                                        |
| PATCH  | `/:id` 🔒         | `{ contenido }`                                    | `Comentario`                                                            |
| DELETE | `/:id` 🔒         |                                                    | `204`                                                                   |

## Amistades — `/amistades` 🔒

| Método | Ruta                       | Cuerpo / Query              | Respuesta                                                |
| ------ | -------------------------- | --------------------------- | -------------------------------------------------------- |
| GET    | `/`                        |                             | `{ items: [{ id, usuario: UsuarioResumen, desde }] }`    |
| GET    | `/solicitudes`             | `?tipo=recibidas\|enviadas` | `{ items: [{ id, usuario: UsuarioResumen, creadaEn }] }` |
| POST   | `/solicitudes`             | `{ destinatarioId }`        | `201 { id, usuario, creadaEn }`                          |
| POST   | `/solicitudes/:id/aceptar` |                             | `{ id, usuario, desde }`                                 |
| DELETE | `/:id`                     |                             | `204` (rechazar, cancelar o eliminar amigo)              |

`usuario` es siempre **la otra persona**, no el usuario con sesión.

## Conversaciones — `/conversaciones` 🔒

| Método | Ruta            | Cuerpo / Query    | Respuesta                                                           |
| ------ | --------------- | ----------------- | ------------------------------------------------------------------- |
| GET    | `/`             |                   | `{ items: Conversacion[] }` ordenadas por último mensaje            |
| POST   | `/`             | `{ amigoId }`     | `Conversacion` (la existente si ya había una)                       |
| GET    | `/:id/mensajes` | `?antesDe&limite` | `{ items: Mensaje[], siguienteCursor }` (**más recientes primero**) |

```jsonc
// Conversacion
{ "id": "uuid", "otroUsuario": UsuarioResumen,
  "ultimoMensaje": { "contenido": "…", "remitenteId": "uuid", "creadoEn": "fecha" } | null, "noLeidos": 0 }
```

---

## Socket.io

Conexión: `io(VITE_API_URL, { auth: { token: tokenAcceso } })`.
Si el token expiró, el servidor rechaza con `connect_error` = `NO_AUTENTICADO` y el
frontend renueva el token y reconecta.

### Cliente → servidor

| Evento                     | Datos                           | Respuesta (ack)                                                     |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `publicacion:unirse`       | `publicacionId`                 | —                                                                   |
| `publicacion:salir`        | `publicacionId`                 | —                                                                   |
| `mensaje:enviar`           | `{ conversacionId, contenido }` | `{ ok: true, mensaje: Mensaje }` o `{ ok: false, error: "CODIGO" }` |
| `mensaje:leido`            | `{ conversacionId, mensajeId }` | —                                                                   |
| `conversacion:escribiendo` | `{ conversacionId }`            | —                                                                   |

### Servidor → cliente

| Evento                     | Datos                                               | A quién                             |
| -------------------------- | --------------------------------------------------- | ----------------------------------- |
| `publicacion:nueva`        | `Publicacion`                                       | todos (solo si es pública)          |
| `reaccion:actualizada`     | `{ publicacionId, reacciones }`                     | sala `publicacion:<id>`             |
| `comentario:nuevo`         | `Comentario`                                        | sala `publicacion:<id>`             |
| `amistad:solicitud`        | `{ id, usuario, creadaEn }` (usuario = quien envía) | `usuario:<destinatario>`            |
| `amistad:aceptada`         | `{ id, usuario, desde }` (usuario = quien acepta)   | `usuario:<solicitante>`             |
| `mensaje:nuevo`            | `Mensaje`                                           | `usuario:<id>` de cada participante |
| `conversacion:escribiendo` | `{ conversacionId, usuarioId }`                     | los demás participantes             |