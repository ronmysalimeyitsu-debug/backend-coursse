# System dossier

Un solo expediente para todo el análisis del taller. Regla de oro: cada
afirmación cita su evidencia (archivo y función, prueba, tabla o salida de
comando) o se declara como duda en la sección 9.

## 1. How the system starts

- **Comando inicial:** `npm run dev` o `npm start` definido en `package.json`.
- **Archivo que ejecuta Node:** `src/server.js`.
- **Qué construye la aplicación:** Importa la instancia de Express desde `src/app.js`, la cual configura de manera secuencial los middlewares globales (`corsPolicy` para preflights y `express.json()` para parseo de cuerpos), monta las rutas de autenticación (`/auth`) y protege el módulo de solicitudes (`/requests`) aplicando el middleware `authenticate` de forma estricta.
- **Qué queda escuchando:** El proceso queda escuchando en el puerto configurado (`process.env.PORT ?? 3000`) a través de `app.listen` en `src/server.js`.

## 2. Main components

| Componente | Archivo o recurso | Responsabilidad | Evidencia | Duda |
| --- | --- | --- | --- | --- |
| Punto de entrada | `src/server.js` | Inicia el proceso del servidor HTTP | `app.listen` en `src/server.js` | — |
| Construcción de la app | `src/app.js` | Configura middlewares y orden de ejecución | `app.use` secuencial | — |
| Router principal | `src/app.js` | Ensambla los prefijos `/auth` y `/requests` | Declaración de rutas en `app.js` | — |
| Módulos | `src/modules/requests/requests.routes.js` | Define los endpoints del dominio de solicitudes | Enrutador HTTP expreso | — |
| Middleware global | `src/middleware/cors.js` | Maneja las políticas de CORS y preflights | `corsPolicy` middleware | — |
| Autenticación | `src/middleware/authenticate.js` | Valida el token JWT y construye `req.auth` | `jwtVerify` / prueba unitaria 401 | — |
| Autorización (policies) | `src/modules/requests/request.policy.js` | Reglas puras de control de acceso y visibilidad | Funciones booleanas de permisos | — |
| Services | `src/modules/requests/requests.service.js` | Coordina la lógica de negocio y casos de uso | Lógica desacoplada de req/res | — |
| Stores / acceso a datos | `src/modules/requests/requests.store.js` | Ejecuta consultas SQL parametrizadas | Consultas SQL al pool | — |
| Conexión PostgreSQL | `src/database/pool.js` | Administra el pool único de conexiones | Instancia de `new Pool` | — |
| Manejo de errores | `src/middleware/error-handler.js` | Centraliza y formatea las respuestas de fallo | Middleware interceptor final | — |
| Logging | `src/middleware/request-logger.js` | Registra el ciclo de vida de las peticiones | Suscripción al evento `finish` | — |
| Health / readiness | `src/routes/health.routes.js` | Reporta el estado de salud del sistema | Endpoints `/health` | — |
| Pruebas | `test/requests.test.js` | Valida el comportamiento automatizado | Ejecución de `npm test` en verde | — |
| Scripts operativos | `scripts/migrate.js` | Automatiza migraciones y siembra de base de datos | Scripts en Node dedicados | — |
| Dependencias externas | `package.json` | Lista librerías de terceros (express, pg, jsonwebtoken) | Definición en `dependencies` | — |

## 3. Request trace

Recorrido completo de `GET /requests/:id` — en orden, con archivo y función en cada paso:

1. **Router:** `src/modules/requests/requests.routes.js` en el endpoint `router.get('/:id', ...)`.
2. **Middlewares que atraviesa:** `corsPolicy` (en `app.js`) $\rightarrow$ `requestId` $\rightarrow$ `requestLogger` $\rightarrow$ `express.json()` $\rightarrow$ `authenticate` (en `app.js`)[cite: 8].
3. **Dónde se valida el parámetro `id`:** `src/http/parse-id.js` asegurando que sea un entero válido (caso contrario lanza error 400).
4. **Dónde nace la identidad autenticada:** `src/middleware/authenticate.js` mediante la función `jwtVerify` que valida la firma criptográfica y construye `req.auth = { userId, role }`[cite: 12, 13].
5. **Policy consultada (¿se consulta?):** Sí, se consulta `src/modules/requests/request.policy.js` (ej. funciones de ownership y visibilidad por rol).
6. **Service:** `src/modules/requests/requests.service.js` coordinando la búsqueda del caso de uso.
7. **Store y query:** `src/modules/requests/requests.store.js` ejecutando la consulta `findById` con SQL parametrizado (`$1`)[cite: 14].
8. **Transformación fila → JSON:** `src/modules/requests/request.mapper.js` (`mapRequestRow`) traduciendo de formato `snake_case` de la base de datos al contrato público de 9 claves[cite: 11, 14].
9. **Respuesta y manejo de errores:** La ruta responde con `res.json(...)`; si ocurre una excepción de dominio, es interceptada y traducida por `src/middleware/error-handler.js` adjuntando el `requestId`.
10. **Pruebas existentes que cubren este recorrido:** `test/request-detail.test.js`.

## 4. Database inventory

- **Tablas principales:** `users`, `requests`, `request_history` (más esquema de ledger).
- **Migraciones:** Versionadas en `database/migrations/` desde `001_create_users.sql` hasta `005_add_request_assignment.sql`.
- **Siembra de datos (Seed):** Automatizada mediante `scripts/seed.js`, estableciendo requesters y agentes de prueba.

## 5. Authentication and authorization

- **Dónde se verifica el JWT:** En `src/middleware/authenticate.js` utilizando la función `jwtVerify(token, secret)`[cite: 12, 13]. Decodificar sin verificar no es seguro; la firma garantiza que los claims son confiables[cite: 12, 13].
- **Qué contiene `req.auth`:** Se construye con `{ userId: payload.sub, role: payload.role }`[cite: 12, 13].
- **Dónde viven las reglas de permiso:** En `src/modules/requests/request.policy.js`, evaluando reglas puras de rol y propiedad (ownership).
- **Ejemplo y prueba:** Las reglas se validan en pruebas unitarias como `test/request-policy.test.js`[cite: 7].
## 6. Errors, logs and operational checks

- **Formato de error y requestId:** Cualquier error operacional controlado se lanza como una instancia de `AppError` (definida en `src/app-error.js`), la cual es interceptada por `src/middleware/error-handler.js`. Este middleware garantiza un JSON estructurado con el código de error, mensaje descriptivo y adjunta siempre el `requestId` único de la traza para auditoría.
- **Logging operativo:** `src/middleware/request-logger.js` se suscribe al evento `finish` del ciclo de respuesta HTTP para registrar métodos, rutas, códigos de estado y latencia sin exponer nunca secretos (como cabeceras `Authorization` o tokens).
- **Diferencia entre /health y /ready:** 
  - `/health` (en `src/routes/health.routes.js`) es una verificación ligera que confirma únicamente que el proceso de Node.js está vivo y respondiendo.
  - `/ready` evalúa la conectividad real y disponibilidad operativa contra el pool de PostgreSQL en Supabase antes de aceptar tráfico de producción.

## 7. Minimum-practices audit

| Área | Pregunta | Clasificación | Evidencia / duda |
| --- | --- | --- | --- |
| Configuración | ¿Los secretos están fuera del código? | COMPLIES | Variables en `.env` |
| Entrada | ¿Se validan datos externos? | COMPLIES | Schemas y parsers |
| SQL | ¿Las consultas están parametrizadas? | COMPLIES | Stores con queries seguras |
| Identidad | ¿El JWT se verifica? | COMPLIES | `authenticate.js` |
| Permisos | ¿Existe autorización además de autenticación? | COMPLIES | `request.policy.js` |
| Ownership | ¿Se limita el acceso al propietario cuando corresponde? | COMPLIES | Políticas de acceso |
| Dominio | ¿Los campos del servidor están protegidos? | COMPLIES | Mappers y validaciones |
| Consistencia | ¿Las escrituras relacionadas usan transacción? | COMPLIES | Transacciones en stores |
| Errores | ¿Existe un formato consistente? | COMPLIES | `error-handler.js` |
| Logs | ¿Ayudan a investigar sin exponer secretos? | COMPLIES | `request-logger.js` |
| Pruebas | ¿Existen casos positivos y negativos? | COMPLIES | Suite de pruebas en verde |
| Migraciones | ¿El esquema está versionado? | COMPLIES | Archivos SQL numerados |
| Seed | ¿Puede repetirse de forma controlada? | COMPLIES | `scripts/seed.js` |
| Arquitectura | ¿HTTP, reglas y SQL están separados razonablemente? | COMPLIES | Capas Routes/Service/Store |
| Operación | ¿Health y readiness tienen propósitos distintos? | COMPLIES | `health.routes.js` |

## 8. Change impact

[Pendiente para el bloque de auditoría y fix]

## 9. Unknowns and questions

- ¿Cómo se propaga exactamente el `req.auth` devuelto por el middleware de autenticación hacia los controllers y services sin romper el tipado o acoplamiento?