# Data model — Request API v5 (solución de referencia)

## Tablas

### `requests`

| Columna       | Tipo         | Nulo | Default             | Restricciones                          |
| ------------- | ------------ | ---- | ------------------- | -------------------------------------- |
| `id`          | BIGINT       | no   | IDENTITY            | PRIMARY KEY, generado por la base      |
| `title`       | VARCHAR(200) | no   | —                   | NOT NULL                               |
| `description` | TEXT         | sí   | —                   | NULL = "no escribió descripción"       |
| `priority`    | VARCHAR(20)  | no   | `'medium'`          | CHECK ∈ {low, medium, high}            |
| `status`      | VARCHAR(30)  | no   | `'open'`            | CHECK ∈ {open, in_progress, resolved, closed, cancelled} |
| `created_at`  | TIMESTAMPTZ  | no   | CURRENT_TIMESTAMP   | —                                      |
| `updated_at`  | TIMESTAMPTZ  | no   | CURRENT_TIMESTAMP   | la aplicación lo refresca en cada UPDATE |

### `request_status_history`

| Columna           | Tipo        | Nulo | Default           | Restricciones                                |
| ----------------- | ----------- | ---- | ----------------- | -------------------------------------------- |
| `id`              | BIGINT      | no   | IDENTITY          | PRIMARY KEY                                  |
| `request_id`      | BIGINT      | no   | —                 | FK → requests(id)                            |
| `previous_status` | VARCHAR(30) | sí   | —                 | NULL solo en el nacimiento; CHECK del conjunto |
| `new_status`      | VARCHAR(30) | no   | —                 | CHECK del conjunto                           |
| `changed_at`      | TIMESTAMPTZ | no   | CURRENT_TIMESTAMP | —                                            |

## Relaciones

`requests 1 ── * request_status_history` (una solicitud tiene muchos eventos; cada evento
pertenece a exactamente una solicitud; la FK garantiza que no existan eventos huérfanos).

## Reglas protegidas por la base

* Unicidad y generación del ID (`GENERATED ALWAYS`: además rechaza ids enviados).
* `title` obligatorio (NOT NULL).
* Conjuntos cerrados de `status` y `priority` (CHECK) — en ambas tablas.
* Integridad referencial del historial (FK).
* Valores por defecto de `priority`, `status` y fechas.

## Reglas protegidas por la aplicación

* Transiciones permitidas y estados terminales (`request-status.js`).
* Estado inicial `open` impuesto al crear (el `status` del cliente se ignora).
* `updated_at` refrescado en cada modificación.
* Atomicidad del cambio de estado + historia (`withTransaction`).
* Validación de contrato con errores 400 amables antes de tocar la base.

## Decisiones documentadas y dudas

* NULL en `description` y en `previous_status` son NULL con significado (ausencia real /
  nacimiento). Ver decisiones 001 y 002.
* Índices: ninguno adicional todavía; `requests(status)` queda como candidato justificado por
  el filtro del tablero, a crear como migración cuando el volumen lo pida.

---

## Cambios de la clase 05

### `users` (migración 003)

| Columna         | Tipo        | Nulo | Default             | Restricciones                     |
| --------------- | ----------- | ---- | ------------------- | --------------------------------- |
| `id`            | UUID        | no   | `gen_random_uuid()` | PRIMARY KEY                       |
| `email`         | TEXT        | no   | —                   | UNIQUE (normalizado por la app)   |
| `password_hash` | TEXT        | no   | —                   | scrypt$version$params$salt$key    |
| `role`          | TEXT        | no   | `'requester'`       | CHECK ∈ {requester, agent}        |
| `created_at`    | TIMESTAMPTZ | no   | CURRENT_TIMESTAMP   | —                                 |

No existe columna `password`: el texto original jamás se almacena.

### `requests.created_by` (migración 004)

UUID **nullable**, FK → `users(id)` `ON DELETE RESTRICT`. NULL = solicitud heredada
sin propietario (visible solo para `agent`). Ver `docs/decisions/004…`.

### `request_status_history.changed_by` (migración 005)

UUID nullable, FK → `users(id)` `ON DELETE RESTRICT`. Toda transición nueva registra
al actor autenticado; NULL solo en eventos anteriores a la clase 05.

### Relaciones nuevas

`users 1 ── * requests` (propietario) · `users 1 ── * request_status_history` (actor).
`ON DELETE RESTRICT`: un usuario con solicitudes o historia no puede borrarse en silencio.
