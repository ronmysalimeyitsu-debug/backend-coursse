# course-progress-evidence-01-07

Paquete de evidencia para el diagnóstico acumulativo 7 en 1.
Generado automáticamente — completa las secciones marcadas con [COMPLETAR] antes de ejecutar el prompt.

## Metadata

* studentId: [RONMY SALIMEY]
* promptVersion: ITSU-CHECKPOINT-01-07-1.0
* rubricVersion: BACKEND-01-07-R1
* generatedAt: 2026-10-04T09:27:38.928Z (EXECUTED_NOW)
* repoRoot: backend-coursse
* commit: a40d8e5 (EXECUTED_NOW)
* repositorioRemoto: https://github.com/ronmysalimeyitsu-debug/backend-coursse.git (EXECUTED_NOW) — verifica que sea TU repositorio antes de continuar
* modeloUtilizado: [COMPLETAR después de ejecutar el prompt]

### Contexto de git (informativo, EXECUTED_NOW)

El curso se trabaja en computadoras compartidas: el historial local puede
estar incompleto o pertenecer a otra sesión sin que falte trabajo real.
Este contexto NO es evidencia requerida — la evidencia son los archivos
del repositorio remoto del estudiante y sus respuestas. La ausencia de
commits aquí no debe interpretarse como evidencia faltante.

```text
a40d8e5 class-07-incidents-resolved
4488a52 class-07-baseline
c7dce66 fix: elimina carpeta project redundante y actualiza archivos en docs con contenido real
cce0f00 fix: implementa endpoint DELETE y remueve node_modules
c380768 chore: remove duplicate incomplete class 06
389ff6e Merge remote-tracking branch 'origin/main'
75caefe feat: complete class 06 backend activity
4cecc1b avances clase 6
```

## Evidencia por clase

Los archivos listados existen en el repositorio (FOUND). Un archivo de salida guardado, como validation-evidence.txt, es TEXTO: demuestra que se guardó, no que se ejecutó (NOT_VERIFIED como ejecución).

### Clase 01 — Fundamentos de backend

* FOUND: activities\class-01\README.md
* FOUND: activities\class-01\src\main.py

Extracto de activities\class-01\README.md (redactado automáticamente):

```text
# Actividad 01: Servidor HTTP Básico

Servidor web funcional desarrollado en Python utilizando únicamente módulos nativos (`http.server` y `json`).

## Rutas Implementadas
* `GET /`: Información general del servidor y rutas disponibles.
* `GET /health`: Comprobación del estado de salud del servicio.
* `GET /api/info`: Metadatos de la aplicación y versión actual.
* **Rutas Inexistentes**: Captura automática retornando código HTTP `404` y respuesta JSON informativa.

---

## Diagrama del Recorrido de una Petición

```text
[ Cliente / Navegador ]
         |
         | 1. Envía solicitud HTTP (ej. GET /api/info)
         v
[ Servidor TCP (127.0.0.1:8000) ]
         |
         | 2. Deriva la conexión al manejador
         v
[ RequestHandler (do_GET) ]
         |
         +---> Evaluador de Rutas:
         |       |-- ¿Coincide con /, /health, /api/info? --> HTTP 200 + JSON
         |       '-- ¿Ruta no mapeada?                   --> HTTP 404 + JSON
         |
         | 3. Método log_message() imprime registro en consola
[... 2 líneas más]
```

### Clase 02 — HTTP y contratos

* FOUND: activities\class-02\Request API Full\.gitignore
* FOUND: activities\class-02\Request API Full\docs\ai-usage.md
* FOUND: activities\class-02\Request API Full\docs\evidence.md
* FOUND: activities\class-02\Request API Full\docs\http-contract.md
* FOUND: activities\class-02\Request API Full\package-lock.json
* FOUND: activities\class-02\Request API Full\package.json
* FOUND: activities\class-02\Request API Full\spec.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities\class-02\Request API Full\src\app.js
* FOUND: activities\class-02\Request API Full\src\data\requests.js
* FOUND: activities\class-02\Request API Full\src\routes\requests.js
* FOUND: activities\class-02\Request API Full\src\routes\requests.routes.js
* FOUND: activities\class-02\Request API Full\src\server.js
* … 10 archivo(s) más con el mismo patrón

Extracto de activities\class-02\Request API Full\docs\http-contract.md (redactado automáticamente):

```text
# Contrato HTTP - Request API Full

## Endpoints

### 1. GET /requests
* **Descripción:** Retorna el listado completo de solicitudes o las filtra por estado.
* **Query Parameter:** `?status=open` o `?status=closed` (opcional).
* **Respuesta (`200 OK`):** Arreglo de objetos JSON.

### 2. GET /requests/:id
* **Descripción:** Retorna una solicitud específica por ID.
* **Path Parameter:** `id` (número).
* **Respuestas:**
  * `200 OK`: Retorna el objeto JSON si existe.
  * `404 Not Found`: `{ "error": "Request not found" }` si no existe.

### 3. POST /requests
* **Descripción:** Crea una nueva solicitud en el sistema.
* **Headers:** `Content-Type: application/json`
* **Body:** `{ "title": "...", "description": "..." }`
* **Respuestas:**
  * `201 Created`: Retorna la solicitud creada con su ID.
  * `400 Bad Request`: `{ "error": "Title is required" }` si falta el título.
```

Extracto de activities\class-02\Request API Full\docs\ai-usage.md (redactado automáticamente):

```text
# Protocolo de Uso de IA con Conciencia Humana (ai-usage.md)

## 1. Criterio de Control
* La IA fue utilizada como un asistente de velocidad, no como el tomador de decisiones del proyecto.
* Se redactó la especificación (`spec.txt`) antes de realizar cualquier solicitud a la IA.

## 2. Auditoría del Código Generado
* **Cumplimiento del alcance:** Se verificó que únicamente se generaran los 3 endpoints solicitados.
* **Exclusiones aplicadas:** Se rechazaron intentos automáticos de incluir TypeScript, base de datos o arquitecturas complejas (controllers/services).
* **Verificación de dependencias:** Se mantuvo el proyecto liviano, utilizando únicamente `express` como dependencia de ejecución.

## 3. Conclusión
El 100% de la arquitectura, la organización de archivos y la validación de respuestas responden al contrato definido por la especificación.
```

### Clase 03 — Recursos, estado y reglas

* FOUND: activities\class-03\README.md
* FOUND: activities\class-03\ai-usage.md
* FOUND: activities\class-03\http-contract.md
* FOUND: activities\class-03\reflection.md
* FOUND: activities\class-03\resource-model.md
* FOUND: activities\class-03\test-matrix.md
* FOUND: activities\class-03\transition-map.md
* FOUND: activities\class-04\test-matrix.md
* FOUND: activities\class-04\transition-map.md
* FOUND: frontend\app\test-matrix.md

Extracto de activities\class-03\resource-model.md (redactado automáticamente):

```text
# Modelo del Recurso: Request

## Nombre del Recurso
`Request` (Solicitud de Soporte)

## Campos del Recurso
* **Campos Requeridos**:
  * `title` (string): Título o resumen breve de la solicitud.
* **Campos Opcionales**:
  * `description` (string): Detalle explicativo del requerimiento.
  * `priority` (enum: `low` | `medium` | `high`): Prioridad asignada (valor por defecto: `medium`).
* **Campos Generados por el Servidor**:
  * `id` (number): Identificador único correlativo.
  * `status` (enum): Estado inicial asignado como `open`.
  * `createdAt` (string ISO8601): Fecha y hora de creación.
  * `updatedAt` (string ISO8601): Fecha y hora de última modificación.

## Estados Permitidos
`open`, `in_progress`, `resolved`, `closed`, `cancelled`.
```

Extracto de activities\class-03\README.md (redactado automáticamente):

```text
# Actividad Clase 03: Modelo del Recurso y Máquina de Estados

## Descripción
Esta actividad documenta el diseño conceptual, las reglas de negocio y las especificaciones técnicas para la API del recurso `Request` (Solicitud de Soporte).

## Contenido del Módulo
* `resource-model.md`: Definición del modelo de datos, campos requeridos, opcionales y autogenerados.
* `http-contract.md`: Contrato de endpoints HTTP (`GET`, `POST`, `PATCH`), códigos de estado y respuestas de error.
* `transition-map.md`: Definición de la máquina de estados, transiciones permitidas y estados terminales.
* `test-matrix.md`: Matriz de pruebas de endpoints y validaciones de errores HTTP.
* `ai-usage.md`: Bitácora de uso e interacción con herramientas de IA.
* `reflection.md`: Respuestas analíticas al ticket de salida de la clase 03.

## Objetivos Alcanzados
* Definición formal de la entidad `Request` con soporte para prioridades (`low`, `medium`, `high`).
* Restricción estricta de flujo entre estados (`open`, `in_progress`, `resolved`, `closed`, `cancelled`).
* Manejo de bloqueos sobre recursos en estados terminales (`closed`, `cancelled`).
```

### Clase 04 — PostgreSQL y persistencia

* FOUND: activities\class-04\README.md
* FOUND: activities\class-04\ai-usage.md
* FOUND: activities\class-04\data-model.md
* FOUND: activities\class-04\error-map.md
* FOUND: activities\class-04\persistence-contract.md
* FOUND: activities\class-04\query-matrix.md
* FOUND: activities\class-04\reflection.md
* FOUND: activities\class-04\test-matrix.md
* FOUND: activities\class-04\transaction-plan.md
* FOUND: activities\class-04\transition-map.md
* FOUND: activities\class-06-starter\scripts\seed.js
* FOUND: activities\class-07-starter\scripts\seed.js
* … 1 archivo(s) más con el mismo patrón

Extracto de activities\class-04\README.md (redactado automáticamente):

```text
# Módulo Entrega 04 - Backend

Implementación de la API REST conectada a PostgreSQL (Supabase) con soporte para gestión de solicitudes y auditoría de estados.

## Contenido de la Entrega
- **Modelo de datos (`data-model.md`)**: Definición de las tablas `requests` y `request_status_history`.
- **Mapa de errores (`error-map.md`)**: Códigos HTTP y respuestas estructuradas en JSON.
- **Matriz de consultas (`query-matrix.md`)**: Operaciones SQL utilizadas en los endpoints.
- **Matriz de pruebas (`test-matrix.md`)**: Validación de rutas mediante Postman.
- **Plan de transacción (`transaction-plan.md`)**: Manejo atómico de actualizaciones de estado.
- **Mapa de transiciones (`transition-map.md`)**: Ciclo de vida de los estados de las solicitudes.
- **Contrato de persistencia (`persistence-contract.md`)**: Conexión al pool de PostgreSQL.
- **Bitácora y Reflexión (`ai-usage.md`, `reflection.md`)**: Registro de asistencia técnica y análisis del desarrollo.
```

### Clase 05 — Autenticación y autorización

* FOUND: project\activities\class-05\README.md
* FOUND: project\activities\class-05\access-matrix.md
* FOUND: project\activities\class-05\ai-usage.md
* FOUND: project\activities\class-05\auth-contract.md
* FOUND: project\activities\class-05\decision-log.md
* FOUND: project\activities\class-05\reflection.md
* FOUND: project\activities\class-05\threat-cases.md
* FOUND: project\activities\class-05\validation-evidence.md — salida guardada, NOT_VERIFIED como ejecución
* FOUND: project\scripts\validate-class-05.js

Extracto de project\activities\class-05\auth-contract.md (redactado automáticamente):

```text
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
[... 100 líneas más]
```

Extracto de project\activities\class-05\validation-evidence.md (redactado automáticamente):

```text
# Evidencia de validación — Clase 05

Pega aquí la salida del validador al cerrar cada estación (SIN secretos: el
validador ya evita imprimirlos, no agregues capturas de tu `.env`).

## stage setup

## stage access-design

## stage register

## stage password

## stage login

## stage authentication

## stage ownership

**Escenario:** Alice (requester) intenta acceder a un recurso de Bob (ID 42) y a un recurso que no existe (ID 999).

**1. GET /requests/42 (Recurso ajeno - de Bob)**
```json
{
  "error": "REQUEST_NOT_FOUND",
  "message": "The requested resource could not be found."
}
```

### Clase 06 — Onboarding y pruebas

* FOUND: activities\class-06-starter\.gitignore
* FOUND: activities\class-06-starter\.vscode\settings.json
* FOUND: activities\class-06-starter\README.md
* FOUND: activities\class-06-starter\activities\class-06\README.md
* FOUND: activities\class-06-starter\activities\class-06\validation-evidence.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities\class-06-starter\activities\class-06\work-log.md
* FOUND: activities\class-06-starter\database\migrations\001_create_users.sql
* FOUND: activities\class-06-starter\database\migrations\002_create_requests.sql
* FOUND: activities\class-06-starter\database\migrations\003_create_request_history.sql
* FOUND: activities\class-06-starter\database\migrations\004_add_constraints_and_indexes.sql
* FOUND: activities\class-06-starter\package-lock.json
* FOUND: activities\class-06-starter\package.json
* … 43 archivo(s) más con el mismo patrón

Extracto de activities\class-06-starter\activities\class-06\work-log.md (redactado automáticamente):

```text
# Class 06 work log

## Environment

What did I configure?
Which command confirmed that it worked?

## Request flow

Where does the request enter?
Where is authentication checked?
Where is authorization checked?
Where is PostgreSQL accessed?

## Bug fixed

**BUG-106 — Empty filtered collection answers 404**

- **Qué estaba pasando:** `GET /requests?status=closed` devolvía `404` cuando el filtro era válido pero no encontraba solicitudes.
- **Qué debe pasar:** una colección vacía sigue existiendo; debe responder `200` con `[]`.
- **Archivos modificados:** `src/modules/requests/requests.service.js` y `test/requests.test.js`.
- **Prueba de regresión:** `a valid filter with no matches returns an empty array`, que confirma el `200` y el cuerpo `[]`.

Validación: `npm run test:requests` terminó con 7 tests pasados y 0 fallos.

## Pruebas asistidas · matriz de FEATURE-206

Convertí cuatro casos de la matriz en pruebas ejecutables: owner lee su historial (`200`), stranger recibe el mismo `404` que una solicitud inexistente, agent lee cualquier historial (`200`) y una solicitud inexistente responde `404`. Las pruebas preparan usuarios y solicitudes con emails únicos, envían la petición con el token correspondiente y comprueban estado, código de error, tipo de evento y forma del cuerpo. El cleanup común elimina únicamente los IDs creados por la corrida.

Las aserciones no son débiles: no uso solo `assert.ok(response)`; comparo códigos HTTP y, cuando corresponde, `REQUEST_NOT_FOUND`, un arreglo y el tipo del evento. El defecto que cubren es una autorización incorrecta o una diferencia de contrato entre recurso ajeno y recurso inexistente. No prueban paginación ni filtros del historial porque están fuera de alcance.
[... 169 líneas más]
```

Extracto de activities\class-06-starter\activities\class-06\validation-evidence.txt (redactado automáticamente):

```text
> npm run validate:class-06

CLASS 06 FINAL VALIDATION

Environment
[01/12] Database is reachable .............. PASS
[02/12] Migrations are complete ............ PASS
[03/12] Seed data is available ............. PASS

Regression
[04/12] Valid empty collection returns 200 .. PASS
[05/12] Empty collection returns [] ........ PASS

History endpoint
[06/12] Authentication is required ......... PASS
[07/12] Owner can read history ............. PASS
[08/12] Stranger cannot read history ....... PASS
[09/12] Agent can read history ............. PASS
[10/12] Missing request returns 404 ........ PASS
[11/12] Events are ordered correctly ....... PASS
[12/12] Sensitive information is hidden .... PASS

Cleanup
Temporary validation data removed successfully.

FINAL RESULT: PASSED

```

### Clase 07 — Diagnóstico y errores

* FOUND: activities\class-07-starter\.gitignore
* FOUND: activities\class-07-starter\.vscode\settings.json
* FOUND: activities\class-07-starter\README.md
* FOUND: activities\class-07-starter\activities\class-07\README.md
* FOUND: activities\class-07-starter\activities\class-07\incident-report.md
* FOUND: activities\class-07-starter\activities\class-07\validation-evidence.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities\class-07-starter\database\migrations\001_create_users.sql
* FOUND: activities\class-07-starter\database\migrations\002_create_requests.sql
* FOUND: activities\class-07-starter\database\migrations\003_create_request_history.sql
* FOUND: activities\class-07-starter\database\migrations\004_add_constraints_and_indexes.sql
* FOUND: activities\class-07-starter\incidents\INC-701-invalid-request-id.md
* FOUND: activities\class-07-starter\incidents\INC-702-invalid-priority.md
* … 55 archivo(s) más con el mismo patrón

Extracto de activities\class-07-starter\activities\class-07\incident-report.md (redactado automáticamente):

```text
# Class 07 incident report

Completa cada sección MIENTRAS investigas. Separa hechos de interpretaciones: un "creo que" pertenece a Hypotheses, no a Evidence.

## Baseline

**Which command confirmed the starting state?**
El comando `npm run class-07:doctor` (confirmando 7/7 PASS en la configuración del entorno) y `npm test` (mostrando las 17 pruebas pendientes por resolver).

## Incident 701

### Report
Soporte reporta que al consultar ciertas solicitudes por ID, el servidor responde con un error interno genérico.

### Reproduction
Ejecutar `GET /requests/not-a-number` incluyendo un token de autenticación válido en las cabeceras.

### Expected result
El servidor debe devolver un `HTTP 400 Bad Request` con un body en formato JSON indicando un error de parámetro inválido (ej. `INVALID_REQUEST_ID`).

### Actual result
El servidor devuelve un `HTTP 500 Internal Server Error`.
Body: `{"error": "Internal server error"}`

### Hypotheses
1. El parámetro `req.params.id` no está siendo validado en la capa de red (HTTP) y se transfiere directamente a la consulta de PostgreSQL como un valor `NaN` tras intentar parsearlo.
   * *Comprobación:* Seguir la traza de `req.params.id` en el controlador de la ruta y verificar si hay validaciones previas a la ejecución de la consulta.
2. La consulta SQL a la base de datos tiene un error de sintaxis nativo.
   * *Comprobación:* Realizar una petición con un ID entero válido (`GET /requests/1`). Si la base de datos responde correctamente con un status `200`, esta hipótesis se descarta automáticamente.

[... 113 líneas más]
```

Extracto de activities\class-07-starter\activities\class-07\validation-evidence.txt (redactado automáticamente):

```text
CLASS 07 INCIDENT VALIDATION

Baseline
[01/12] Existing contract preserved .......... PASS

Input and errors
[02/12] Invalid id returns 400 ............... PASS
[03/12] Invalid priority returns 400 ......... PASS
[04/12] Unknown request returns 404 .......... PASS
[05/12] Invalid transition returns 409 ....... PASS
[06/12] Unexpected errors return 500 ......... PASS
[07/12] Internal details remain hidden ....... PASS

Traceability
[08/12] Response contains request id ......... PASS
[09/12] Log contains the same request id ..... PASS
[10/12] Authorization header is not logged ... PASS

Operation
[11/12] Health endpoint responds ............. PASS
[12/12] Readiness checks PostgreSQL .......... PASS

Cleanup
Temporary validation data removed successfully.

FINAL RESULT: PASSED (12/12)
```

## Estado previo a la clase 8

* Validadores disponibles (clases 1-7): activities\class-06-starter\scripts\validate-class-06.js, activities\class-07-starter\scripts\validate-class-06.js, activities\class-07-starter\scripts\validate-class-07.js, activities\class-08-starter\scripts\validate-class-06.js, activities\class-08-starter\scripts\validate-class-07.js, project\scripts\validate-class-05.js
* Carpetas de pruebas: NOT_FOUND
* Último commit antes del taller: a40d8e5

## Cuestionario diagnóstico (responde aquí, 3-6 líneas cada una)

Sé específico: cita archivos o rutas concretas de TU proyecto cuando puedas. La extensión no suma.

### Pregunta clase 01

Describe qué ocurre desde que una petición llega al backend hasta que sale una respuesta y explica por qué el servidor debe permanecer activo.

Respuesta: En mi proyecto, la separación de responsabilidades divide este viaje: src/app.js configura el pipeline secuencial (CORS, requestId, rutas y errorHandler), mientras que src/server.js actúa como el listener en el puerto 3000 (o process.env.PORT). Tras responder al cliente, el proceso no finaliza; el servidor permanece activo indefinidamente a la espera de nuevas conexiones de red gracias a la naturaleza asíncrona y no bloqueante del Event Loop de Node.js.

### Pregunta clase 02

Elige un endpoint del proyecto y explica cómo método, ruta, body y status forman su contrato.

Respuesta: En mi módulo diseñé el endpoint POST /requests dentro de src/modules/requests/requests.routes.js. Como contrato, recibe un payload JSON en el que, si se incluye el campo priority, mi función isInvalidPriority valida que pertenezca a la lista blanca ('low', 'medium', 'high'). Si falla, respondo con 400 Bad Request; si el servicio procesa la creación con éxito, devuelvo el recurso creado junto a un código de estado HTTP 201 Created.

### Pregunta clase 03

Explica, usando una solicitud del proyecto, la diferencia entre representación, dato inválido y transición incompatible con el estado actual.

Respuesta: La representación enviada al cliente no debe exponer la estructura interna de la base de datos. En mi proyecto utilizo src/modules/requests/request.mapper.js como puente de traducción. Allí, la función mapRequestRow convierte las columnas snake_case de PostgreSQL (como created_at) a camelCase (createdAt). Además, en mapHistoryEventRow excluyo intencionalmente el campo changed_by para que permanezca interno, garantizando que el contrato HTTP solo devuelva los datos acordados y oculte la infraestructura subyacente.

### Pregunta clase 04

Explica la diferencia entre migración, seed y transacción, e indica dónde aparece cada concepto en el proyecto.

Respuesta: En mi repositorio, las migraciones como database/migrations/002_create_requests.sql definen la estructura inmutable de las tablas, mientras que database/seed.sql puebla la base de datos con registros iniciales (ej. solicitudes de proyectores o sillas rotas) para el entorno de desarrollo. Una transacción SQL garantiza que múltiples operaciones se ejecuten como una unidad atómica (todo o nada); en mi seed simulo este principio atómico usando CTEs (WITH) para insertar una solicitud y, de forma segura en la misma ejecución, registrar su estado en request_status_history sin riesgo de dejar datos huérfanos.

### Pregunta clase 05

Explica la diferencia entre autenticación y autorización y por qué un JWT decodificado todavía debe verificarse.

Respuesta: La autenticación verifica la identidad, y la autorización los permisos. En mi API utilizo el middleware src/middleware/authenticate.js, el cual inyecto antes de las rutas de negocio en app.js. Al ser el protocolo HTTP completamente stateless (sin estado), el servidor no guarda sesiones activas; por ello, debo descifrar y validar criptográficamente el JWT en cada petición para confiar en la identidad del cliente.

### Pregunta clase 06

Elige una prueba del proyecto, identifica preparación, acción y comprobación, y explica qué regresión protege.

Respuesta: Las pruebas automatizadas actúan como guardianes del comportamiento esperado, evitando que nuevos cambios rompan contratos establecidos. En mi archivo test/requests.test.js implementé una prueba de regresión (BUG-106) que verifica mediante Supertest que, si un usuario filtra la colección pero no hay coincidencias, el servidor responde correctamente con un 200 OK y un array vacío [], garantizando que un filtro sin resultados no se confunda con un recurso inexistente.

### Pregunta clase 07

Describe un fallo investigado distinguiendo síntoma, hipótesis y causa; luego indica qué señal correspondería a health o readiness.

Respuesta: Durante el proyecto diagnostiqué el incidente INC-701: enviar texto en una ruta como GET /requests/not-a-number generaba un error 500 porque el motor de PostgreSQL fallaba al intentar procesar un NaN como bigint. Apliqué el patrón Fail-Fast implementando la guarda isValidId(idParam) en requests.routes.js, retornando un 400 tempranamente. Fallos lógicos como este no afectan a la sonda /health, ya que esta solo reporta si el Event Loop de Node está bloqueado.

---
Nota de seguridad: este paquete fue generado excluyendo .env y redactando
posibles secretos. Revisa una vez más antes de pegarlo en un modelo:
si ves una credencial real, reemplázala por [REDACTED] y avisa al docente.
