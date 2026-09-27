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

### Evidence
* Al consultar con un ID válido (`1`), la API responde `200 OK` (esto descarta por completo la hipótesis 2).
* En los logs de la terminal del servidor se registra el error nativo de PostgreSQL: `invalid input syntax for type bigint: "NaN"`.

### Confirmed cause
La instrucción `Number('not-a-number')` produce un valor `NaN`. Al carecer de validaciones en el controlador HTTP, este valor viaja hasta la base de datos, violando el tipo de dato `bigint` de la columna `id` en PostgreSQL.

### Correction
Implementar una validación del parámetro `req.params.id` en el límite de la petición HTTP. Si el valor no es un número entero positivo válido, el controlador debe interceptar la petición y retornar un `400 Bad Request` con el código `INVALID_REQUEST_ID`, evitando así que la consulta SQL llegue a ejecutarse.

### Regression test
Escribir una prueba automatizada en `test/incidents.test.js` que ejecute `GET /requests/not-a-number` y afirme estáticamente que el código de estado retornado es `400` y no `500`.

## Incident 702

### Report
Soporte reporta que algunos usuarios reciben errores internos (500) al intentar actualizar la prioridad de sus solicitudes.

### Reproduction
Ejecutar `PATCH /requests/1/priority` enviando un payload con una prioridad no contemplada por el sistema: `{"priority": "URGENT"}`.

### Expected result
El servidor debe retornar un `HTTP 400 Bad Request` con un código de error específico como `INVALID_PRIORITY`.

### Actual result
El servidor retorna un `HTTP 500 Internal Server Error`.

### Hypotheses
1. El controlador actualiza la prioridad enviando el valor crudo (`req.body.priority`) a la base de datos sin validar previamente si pertenece al conjunto de enumeraciones permitidas.
   * *Comprobación:* Enviar una petición con una prioridad válida (`{"priority": "HIGH"}`). Si responde 200, confirma que el error radica exclusivamente en el rechazo de valores no permitidos.
2. El body de la petición no se está parseando correctamente, enviando un valor nulo u objeto vacío a la base de datos.
   * *Comprobación:* Imprimir el objeto `req.body` mediante `console.log` antes de la consulta SQL.

### Evidence
* La petición `PATCH /requests/1/priority` con el body `{"priority": "HIGH"}` responde exitosamente con `200 OK`.
* Los logs de la consola muestran un error de PostgreSQL indicando una violación de restricción (constraint/enum) al intentar procesar el valor `"URGENT"`.

### Confirmed cause
El middleware HTTP confía implícitamente en el payload del cliente (`req.body.priority`) y omite la validación contra los valores válidos del dominio (`LOW`, `MEDIUM`, `HIGH`). Esto transfiere la responsabilidad del error a la base de datos, la cual crashea y genera un error 500 no manejado en la aplicación Node.

### Correction
Intervenir el controlador HTTP de la ruta `PATCH` para validar estrictamente el campo `priority`. Si el string recibido no coincide con las opciones permitidas, retornar un `400 Bad Request` de inmediato.

### Regression test
Construir una prueba de regresión que envíe intencionalmente una prioridad inválida y aserte que el servidor responde con el estado `400`.

## Error flow

**Where is the error created?**
En la interacción con el cliente de PostgreSQL, específicamente cuando la base de datos rechaza la consulta por incompatibilidad de tipos o restricciones.

**How does it reach the error middleware?**
A través del pase de la excepción capturada (`next(error)`) dentro de los bloques `try/catch` en los controladores asíncronos de las rutas de Express.

**What is returned to the client?**
Una respuesta sanitizada en formato JSON (ej. `{ "error": "Internal server error" }`) junto con un código de estado HTTP (500).

**What remains only in the server log?**
La información sensible, incluyendo el stack trace completo de Node.js, mensajes nativos del motor PostgreSQL y variables de entorno internas.

## Request ID

**How did I prove that the response and log belong to the same request?**
Correlacionando el valor de la cabecera HTTP `X-Request-ID` recibida en la respuesta del cliente con el identificador único impreso en los logs estructurados del servidor.

## AI assistance

**What did AI help me understand?**
La distinción fundamental entre silenciar un síntoma (capturar genéricamente el 500) y resolver la causa raíz estructural (establecer validaciones de frontera en la capa HTTP).

**Which hypothesis did it propose?**
Que la conversión de un string no numérico estaba inyectando silenciosamente un valor `NaN` en la consulta SQL.

**How did I verify it?**
Auditando el registro de la terminal del servidor para aislar el mensaje de error de sintaxis emitido por el motor `bigint` de PostgreSQL.

**What suggestion was incomplete or incorrect?**
Cualquier propuesta orientada a envolver ciegamente la consulta SQL en un bloque `try/catch` para devolver un código HTTP 400 sin implementar una lógica de validación de entrada explícita.

## Remaining doubt

**What part do I still not understand?**
El flujo de diagnóstico conceptual está claro; el enfoque actual es la implementación técnica de las validaciones y el middleware.
# Reporte de Incidentes - Clase 07

## INC-701: Invalid Request ID (500 -> 400)

* **Sintoma:** Al realizar `GET /requests/not-a-number`, el servidor responde `500 Internal Server Error`[cite: 22, 23].
* **Evidencia:** 
  * Cliente recibe: `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}`[cite: 23].
  * Terminal del servidor: `[internal] error: invalid input syntax for type bigint: "NaN" at .../requests.store.js (findById)`[cite: 23].
* **Causa Raiz:** `req.params.id` se convierte mediante `Number("not-a-number")`, produciendo `NaN`[cite: 23, 24]. Este valor cruza la frontera de red hacia el Store sin ser validado, ejecutando la consulta SQL donde PostgreSQL revienta al intentar convertir `NaN` a `bigint`[cite: 23, 24].
* **Solucion:** Creacion de `isValidId()` en `requests.routes.js` que verifica que el ID sea un entero positivo mediante `Number.isInteger(id) && id > 0`. Si no lo es, retorna `400 INVALID_REQUEST_ID` antes de ejecutar SQL[cite: 25].

---

## INC-702: Invalid Priority Enum (500 -> 400)

### Diagnóstico según Tarjeta 3 (Propuesta de Hipótesis)

* **Hipótesis 1 (Frontera HTTP sin filtrado):** La ruta no valida el cuerpo de la petición (`req.body.priority`) contra una lista blanca (`LOW`, `MEDIUM`, `HIGH`).
  * *Cómo comprobarla:* Enviar `PATCH /requests/1` con `{"priority": "URGENT"}` y revisar si el error proviene de la base de datos.
  * *Criterio de descarte:* Si el sistema responde `400` antes de invocar el store, la hipótesis queda descartada.
* **Hipótesis 2 (Fallo de casteo/Case Sensitivity):** La base de datos rechaza cadenas válidas enviadas en minúsculas (`"low"`).
  * *Cómo comprobarla:* Enviar `{"priority": "low"}` y verificar si lanza un error de restricción `CHECK`.
  * *Criterio de descarte:* Si `"LOW"` y `"low"` fallan por igual, el problema es la falta de validación del contrato y no solo un tema de formato.
* **Hipótesis 3 (Ausencia de restricción en base de datos):** La base de datos permite la inserción de cualquier texto, corrompiendo la persistencia.
  * *Cómo comprobarla:* Revisar el esquema SQL del Store.
  * *Criterio de descarte:* Si la base de datos tiene una restricción `CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))`, esta hipótesis se descarta.

* **Hipótesis comprobada primero y por qué:** Comprobamos la **Hipótesis 1** primero porque, de acuerdo con las especificaciones de API REST y la RFC 9110, cualquier valor no contemplado en la enumeración enviada por un cliente es un error de cliente (entrante) que debe detenerse con estado `400 Bad Request` en la capa de entrada HTTP, sin delegar la responsabilidad a la base de datos.

* **Solucion:** Se agrego la constante `ALLOWED_PRIORITIES` y la funcion `isInvalidPriority()`, transformando las cadenas recibidas a mayúsculas (`.toUpperCase()`) para cumplir con el Principio de Robustez.