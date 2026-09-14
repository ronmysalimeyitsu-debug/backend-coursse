# Contrato de autenticación — Request API v5

**Cómo llenar:** cada endpoint es una ficha; los campos pendientes están
marcados con tres guiones bajos. Reemplaza cada marca con tu decisión; en los
bloques de código escribe la respuesta completa.

### Ficha de ejemplo (endpoint inventado, solo para ver el formato)

| Campo | Decisión |
| ----- | -------- |
| ¿Público o protegido? | Protegido (Bearer) |
| Body permitido | ninguno |

Respuesta de éxito:

```http
200 OK

{ "status": "brewing" }
```

Errores:

| Situación | HTTP | error.code |
| --------- | ---- | ---------- |
| La tetera está ocupada | 418 | TEAPOT_BUSY |

---

## POST /auth/register

| Campo | Decisión |
| ----- | -------- |
| ¿Público o protegido? | Público |
| Campos permitidos en el body | `email`, `password` |
| Campos que producen rechazo explícito | `id`, `role`, `createdAt`, `passwordHash` |
| Reglas del email | Debe ser un string con formato de correo electrónico válido y único en la base de datos |
| Reglas de la password | Debe tener un mínimo de 6 caracteres |

Respuesta de éxito (código + body con TODOS sus campos):

```http
201 Created

{
  "id": "uuid-generado-por-servidor",
  "email": "usuario@ejemplo.com",
  "role": "requester",
  "createdAt": "2026-09-13T00:00:00.000Z"
}
```

Errores:

| Situación | HTTP | error.code |
| --------- | ---- | ---------- |
| Campo controlado por el servidor en el body | 400 | SERVER_CONTROLLED_FIELD |
| Email inválido | 400 | INVALID_EMAIL |
| Password fuera de las reglas | 400 | INVALID_PASSWORD |
| Email ya registrado | 409 | EMAIL_ALREADY_EXISTS |

## POST /auth/login

| Campo | Decisión |
| ----- | -------- |
| ¿Público o protegido? | Público |
| Body permitido | `email`, `password` |

Respuesta de éxito (código + body: el token y sus dos acompañantes):

```http
200 OK

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid-generado-por-servidor",
    "email": "usuario@ejemplo.com",
    "role": "requester"
  }
}
```

Errores — atención: las tres filas deben tener EXACTAMENTE la misma respuesta.
¿Por qué?: Para prevenir ataques de enumeración de usuarios y no revelar si el error se debe a un correo inexistente, una contraseña errónea o una cuenta desactivada.

| Situación | HTTP | error.code |
| --------- | ---- | ---------- |
| Email inexistente | 401 | INVALID_CREDENTIALS |
| Password incorrecta | 401 | INVALID_CREDENTIALS |
| Cuenta no disponible | 401 | INVALID_CREDENTIALS |

## GET /auth/me

| Campo | Decisión |
| ----- | -------- |
| ¿Público o protegido? | Protegido (Bearer) |
| Qué devuelve | Objeto con la información del perfil del usuario autenticado (`id`, `email`, `role`, `createdAt`) |
| Qué JAMÁS devuelve | `password`, `passwordHash` |

Respuesta de éxito:

```http
200 OK

{
  "id": "uuid-generado-por-servidor",
  "email": "usuario@ejemplo.com",
  "role": "requester",
  "createdAt": "2026-09-13T00:00:00.000Z"
}
```

Errores:

| Situación | HTTP | error.code |
| --------- | ---- | ---------- |
| Sin header Authorization o sin esquema Bearer | 401 | UNAUTHORIZED |
| Token inválido, alterado o expirado | 401 | INVALID_TOKEN |

## Semántica de errores (el criterio, no solo ejemplos)

| Frase | Código HTTP | ¿Cuándo lo usas en esta API? |
| ----- | ----------- | ---------------------------- |
| "No sé quién eres" | 401 | Cuando falta el token de autenticación o es inválido/expirado |
| "Sé quién eres; esto no" | 403 | Cuando el usuario está autenticado pero su rol no tiene permisos para esa operación |
| "Para ti, no existe" | 404 | Cuando se consulta un recurso ajeno o que no existe, evitando revelar información sensible |
| "Existe, pero choca" | 409 | Cuando se intenta registrar un recurso duplicado, como un email ya existente |