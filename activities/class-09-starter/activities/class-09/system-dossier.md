# System dossier

Un solo expediente para todo el análisis del taller. Regla de oro: cada afirmación cita su evidencia (archivo y función, prueba, tabla o salida de comando) o se declara como duda en la sección 9.

## 1. How the system starts

- **Comando inicial:** `npm run dev` o `npm start` definido en `package.json`.
- **Archivo que ejecuta Node:** `src/server.js`.
- **Qué construye la aplicación:** Importa la instancia de Express desde `src/app.js`, la cual configura de manera secuencial los middlewares globales (`corsPolicy` para preflights, `requestId`, `requestLogger` y `express.json()` para parseo de cuerpos), monta las rutas de salud/readiness (`healthRoutes`), las rutas de autenticación (`/auth`) y protege el módulo de solicitudes (`/requests`) aplicando el middleware `authenticate` de forma estricta.
- **Qué queda escuchando:** El proceso queda escuchando en el puerto configurado (`process.env.PORT ?? 3000`) a través de `app.listen` en `src/server.js`.

## 2. Main components

| Componente | Archivo o recurso | Responsabilidad | Evidencia | Duda |
| --- | --- | --- | --- | --- |
| **Punto de entrada** | `src/server.js` | Inicia el proceso del servidor HTTP en el puerto designado | `app.listen` en `src/server.js` | — |
| **Construcción de la app** | `src/app.js` | Configura la secuencia estricta de middlewares y montajes | `app.use` ordenados en `src/app.js` | — |
| **Router principal** | `src/app.js` | Ensambla los prefijos `/auth` y `/requests` | Declaración de rutas en `app.js` | — |
| **Módulos** | `src/modules/requests/requests.routes.js` | Define los endpoints del dominio de solicitudes | Enrutador HTTP expreso | — |
| **Middleware global** | `src/middleware/cors.js` | Maneja las políticas de CORS y respuestas a preflights | `corsPolicy` middleware | — |
| **Identificación de traza** | `src/middleware/request-id.js` | Genera o propaga un `requestId` único por petición | Inserta `req.requestId` | — |
| **Autenticación** | `src/middleware/authenticate.js` | Valida el token JWT y construye `req.auth` | `jwtVerify` / prueba unitaria 401 | — |
| **Autorización (policies)** | `src/modules/requests/request.policy.js` | Reglas puras de control de acceso y visibilidad | Funciones booleanas `canViewRequest`, etc. | — |
| **Services** | `src/modules/requests/requests.service.js` | Coordina la lógica de negocio y casos de uso (unidades de trabajo) | Lógica desacoplada de req/res | — |
| **Stores / acceso a datos** | `src/modules/requests/requests.store.js` | Ejecuta consultas SQL parametrizadas | Consultas SQL al pool | — |
| **Conexión PostgreSQL** | `src/database/pool.js` | Administra el pool único de conexiones a la base de datos | Instancia de `new Pool` | — |
| **Manejo de errores** | `src/middleware/error-handler.js` | Centraliza y formatea las respuestas de fallo | Middleware interceptor final | — |
| **Logging** | `src/middleware/request-logger.js` | Registra el ciclo de vida de las peticiones en JSON estructurado | Suscripción al evento `finish` | — |
| **Health / readiness** | `src/routes/health.routes.js` | Reporta el estado de salud y disponibilidad operativa | Endpoints `/health` y `/ready` | — |
| **Pruebas de detalle** | `test/request-detail.test.js` | Valida el comportamiento de visibilidad, IDOR y esquema | Ejecución `npm run test:detail` en verde (6/6) | — |
| **Scripts operativos** | `scripts/migrate.js` | Automatiza migraciones y siembra de base de datos | Scripts en Node dedicados | — |
| **Dependencias externas** | `package.json` | Lista librerías de terceros (`express`, `pg`, `jsonwebtoken`) | Definición en `dependencies` | — |

## 3. Request trace

Recorrido completo de `GET /requests/:id` — en orden, con archivo y función en cada paso:

1. **Router:** `src/modules/requests/requests.routes.js` en el endpoint `router.get('/:id', ...)`.
2. **Middlewares que atraviesa (en `src/app.js`):**
   - `corsPolicy`: Procesa políticas de origen cross-domain.
   - `requestId`: Asigna un id de traza único a la petición (`req.requestId`).
   - `requestLogger`: Se suscribe al evento `finish` de la respuesta para emitir el log JSON.
   - `express.json()`: Parsea el cuerpo en JSON de ser necesario.
   - `authenticate`: Extrae la cabecera `Authorization: Bearer <token>`, valida la firma y emite `req.auth`.
3. **Dónde se valida el parámetro `id`:** `src/http/parse-id.js` asegurando que sea un entero válido (caso contrario lanza error `contract` `400`).
4. **Dónde nace la identidad autenticada:** `src/middleware/authenticate.js` mediante la función `jwtVerify` que valida la firma criptográfica y construye `req.auth = { userId, role }`.
5. **Policy consultada:** `src/modules/requests/request.policy.js` invocando `canViewRequest(actor, request)` para verificar la relación de propiedad o rol de agente.
6. **Service:** `src/modules/requests/requests.service.js` en la función `getRequest(actor, id)`.
7. **Store y query:** `src/modules/requests/requests.store.js` ejecutando la consulta `findById(id)` con SQL parametrizado (`$1`).
8. **Transformación fila → JSON:** `src/modules/requests/request.mapper.js` (`mapRequestRow`) traduciendo de formato `snake_case` de la base de datos al contrato público.
9. **Respuesta y manejo de errores:** La ruta responde con `res.json(...)`. Si el recurso no existe o el usuario no tiene permisos (`!canViewRequest`), el servicio lanza `notFound(id)` (`AppError('resource', 'REQUEST_NOT_FOUND', ...)`), el cual es capturado por `src/middleware/error-handler.js` devolviendo `404 Not Found` y adjuntando el `requestId`.
10. **Evidencia real de ejecución (Salida de `npm run test:detail`):**
    ```json
    {"timestamp":"2026-10-19T20:55:47.781Z","level":"info","event":"request_completed","requestId":"req_180e4fb4-b1cc-457b-9d3a-bcf3dc2e52cb","method":"GET","path":"/requests/810","status":404,"durationMs":132,"userId":"397ad4b3-988d-4b6c-b366-06735bd27870","errorCode":"REQUEST_NOT_FOUND"}
    ✔ a different requester receives the same 404 as a missing request (2047.5181ms)
    ```

## 4. Database inventory

- **Tablas principales:** `users`, `requests`, `request_history` (más esquema de ledger/transacciones).
- **Migraciones:** Versionadas en `database/migrations/` desde `001_create_users.sql` hasta `005_add_request_assignment.sql`.
- **Siembra de datos (Seed):** Automatizada mediante `scripts/seed.js`, estableciendo requesters y agentes de prueba.

## 5. Authentication and authorization

- **Dónde se verifica el JWT:** En `src/middleware/authenticate.js` utilizando la función `jwtVerify(token, secret)`. Decodificar sin verificar no es seguro; la firma garantiza que los claims son confiables.
- **Qué contiene `req.auth`:** Se construye con `{ userId: payload.sub, role: payload.role }`.
- **Dónde viven las reglas de permiso:** En `src/modules/requests/request.policy.js`, evaluando reglas puras de rol y propiedad (ownership).
- **Estrategia anti-enumeración (IDOR):** Implementada en `requests.service.js` dentro de `getRequest`: si un usuario no es el propietario ni un agente autorizado (`!canViewRequest(actor, request)`), el sistema responde exactamente igual que con un ID inexistente: `404 Not Found` con código `REQUEST_NOT_FOUND`.
- **Ejemplo y prueba:** `test/request-detail.test.js` (6 pruebas pasadas en verde).

## 6. Errors, logs and operational checks

- **Formato de error y requestId:** Cualquier error operacional controlado se lanza como una instancia de `AppError` (definida en `src/app-error.js`), la cual es interceptada por `src/middleware/error-handler.js`. Este middleware garantiza un JSON estructurado con el código de error, mensaje descriptivo y adjunta siempre el `requestId` único de la traza para auditoría.
- **Logging operativo:** `src/middleware/request-logger.js` se suscribe al evento `finish` del ciclo de respuesta HTTP para registrar métodos, rutas, códigos de estado y latencia en formato JSON estructurado, sin exponer secretos (como cabeceras `Authorization` o tokens).
- **Diferencia entre /health y /ready:** 
  - `/health` (en `src/routes/health.routes.js`) es una verificación ligera que confirma únicamente que el proceso de Node.js está vivo y respondiendo.
  - `/ready` evalúa la conectividad real y disponibilidad operativa contra el pool de PostgreSQL antes de aceptar tráfico de producción.

## 7. Minimum-practices audit

| Área | Pregunta | Clasificación | Evidencia / duda |
| --- | --- | --- | --- |
| Configuración | ¿Los secretos están fuera del código? | COMPLIES | Variables en `.env` |
| Entrada | ¿Se validan datos externos? | COMPLIES | Schemas y parsers (`parse-id.js`) |
| SQL | ¿Las consultas están parametrizadas? | COMPLIES | Stores con queries seguras (`$1`) |
| Identidad | ¿El JWT se verifica? | COMPLIES | `authenticate.js` con `jwtVerify` |
| Permisos | ¿Existe autorización además de autenticación? | COMPLIES | `request.policy.js` |
| Ownership | ¿Se limita el acceso al propietario cuando corresponde? | COMPLIES | `canViewRequest` en `requests.service.js` |
| Dominio | ¿Los campos del servidor están protegidos? | COMPLIES | Mappers y `rejectServerControlledFields` |
| Consistencia | ¿Las escrituras relacionadas usan transacción? | COMPLIES | `withTransaction` en stores/services |
| Errores | ¿Existe un formato consistente? | COMPLIES | `AppError` y `error-handler.js` |
| Logs | ¿Ayudan a investigar sin exponer secretos? | COMPLIES | `request-logger.js` emitiendo JSON con `requestId` |
| Pruebas | ¿Existen casos positivos y negativos? | COMPLIES | Suite `test/request-detail.test.js` (6/6 pass) |
| Migraciones | ¿El esquema está versionado? | COMPLIES | Archivos SQL numerados en `database/migrations/` |
| Seed | ¿Puede repetirse de forma controlada? | COMPLIES | `scripts/seed.js` |
| Arquitectura | ¿HTTP, reglas y SQL están separados razonablemente? | COMPLIES | Capas Routes/Service/Store/Policy |
| Operación | ¿Health y readiness tienen propósitos distintos? | COMPLIES | `health.routes.js` |

## 8. Change impact

### 1. What changes (Qué cambia)
- Se actualizará la función del servicio (`src/modules/requests/requests.service.js` en `getRequest`) para incorporar la validación explícita de la política de visibilidad (`canViewRequest`) antes de retornar el recurso.
- Se eliminará cualquier comentario temporal de parche previo si existiera.

### 2. What must NOT change (Qué NO debe cambiar)
- El dueño de una solicitud o un agente autorizado deben seguir recibiendo un código HTTP `200 OK` con exactamente el mismo formato JSON y contrato de claves.
- La lista general de solicitudes (`GET /requests`) debe seguir filtrando por rol exactamente igual que antes.
- La política (`src/modules/requests/request.policy.js`) debe mantenerse pura (sin dependencias de Express ni SQL, evaluándose en milisegundos).
- El error devuelto al intentar ver un recurso no visible u omitido debe ser un `404 Not Found` uniforme, usando el código exacto `REQUEST_NOT_FOUND` para evitar la enumeración de IDs (prevención IDOR).

### 3. Risks (Riesgos)
- **Riesgo:** Si por error la política se evalúa con el actor incorrecto, los agentes podrían perder visibilidad sobre solicitudes que necesitan atender.
- **Riesgo:** Responder un error `403 Forbidden` en vez de `404 Not Found` confirmaría la existencia real de los identificadores ajenos, facilitando ataques de enumeración horizontal.
- **Mitigación:** Reutilizar estrictamente la función de política existente y validar mediante pruebas automatizadas rigurosas con múltiples usuarios.

### 4. How it will be verified (Cómo se verificará)
- **Observable behavior:** Un usuario requester sin permisos no puede acceder al detalle ni historial de peticiones ajenas; el sistema responde con `404 Not Found` de forma indistinguible de un recurso inexistente.
- **Files affected:** `src/modules/requests/requests.service.js`, `src/modules/requests/request.policy.js`, y `test/request-detail.test.js`.
- **Data required:** `actor.userId`, `actor.role`, y el campo `createdBy` del recurso `request`.
- **Status codes:** 
  - Acceso autorizado (owner / agent): `200 OK`
  - Recurso no encontrado o ajeno (anti-enumeración IDOR): `404 Not Found`
  - Sin token / inválido: `401 Unauthorized`
- **Tests verified:** Ejecución de la suite `npm run test:detail`, validando los 6 casos de prueba en verde (`pass 6 / fail 0`).

## 9. Unknowns and questions

- **Resuelta:** ¿Cómo se propaga el objeto `req.auth`? El middleware `authenticate.js` descodifica y valida el JWT, adscribiendo el resultado a `req.auth = { userId, role }`. Luego, el controlador o router extrae `req.auth` y lo pasa como primer argumento `actor` a las funciones del servicio (`requests.service.js`), garantizando que la capa de servicio nunca dependa de objetos HTTP (`req` o `res`).