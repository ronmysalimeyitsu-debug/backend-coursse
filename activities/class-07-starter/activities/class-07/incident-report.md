# Class 07 incident report

Completa cada sección MIENTRAS investigas. Separa hechos de
interpretaciones: un "creo que" pertenece a Hypotheses, no a Evidence.

## Baseline

Which command confirmed the starting state?
`npm run class-07:doctor` (confirmando 7/7 PASS) y `npm test` (mostrando las 17 pruebas pendientes).

## Incident 701

### Report
Soporte reporta que al consultar ciertas solicitudes por ID, el servidor responde con error interno 500.

### Reproduction
`GET /requests/not-a-number` con un token de autenticación válido.

### Expected result
`HTTP 400 Bad Request` con un JSON indicando error de formato/parámetro inválido (`INVALID_REQUEST_ID`).

### Actual result
`HTTP 500 Internal Server Error`
Body: `{"error": "Internal server error"}`

### Hypotheses
1. El parámetro `req.params.id` no es validado en la capa HTTP y se pasa directamente a PostgreSQL como `NaN`.
   * *Comprobación:* Seguir el flujo de `req.params.id` en el controlador de la ruta.
2. La consulta SQL a la base de datos está mal construida.
   * *Comprobación:* Probar un ID entero válido (ej. `GET /requests/1`). Si responde 200, esta hipótesis se descarta.

### Evidence
* Al consultar con un ID válido (`1`), la respuesta es `200 OK` (descarta la hipótesis 2).
* En la consola del servidor se observa el log de error de PostgreSQL: `invalid input syntax for type bigint: "NaN"`.

### Confirmed cause
`Number('not-a-number')` produce `NaN`, el cual viaja directo a la consulta SQL sin ser detenido ni verificado en el middleware/controlador HTTP.

### Correction
Validar `req.params.id` en la entrada HTTP para asegurar que sea un entero positivo. Si no lo es, retornar inmediatamente un estado `400` con `INVALID_REQUEST_ID` antes de tocar la base de datos.

### Regression test
Prueba en `test/incidents.test.js` que ejecuta `GET /requests/not-a-number` y verifica que retorne `400` y no `500`.

## Incident 702

### Report
Soporte reporta que algunos usuarios reciben errores internos al actualizar la prioridad de una solicitud.

### Reproduction
`PATCH /requests/1/priority` enviando un body con una prioridad no permitida: `{"priority": "URGENT"}`.

### Expected result
`HTTP 400 Bad Request` indicando `INVALID_PRIORITY`.

### Actual result
`HTTP 500 Internal Server Error`

### Hypotheses
1. El controlador no valida los valores permitidos para el campo `priority` antes de enviarlos a la base de datos.
   * *Comprobación:* Enviar `{"priority": "HIGH"}`. Si responde 200, se confirma que el problema ocurre solo con valores no permitidos.
2. El body no está siendo parseado correctamente por el middleware de JSON.
   * *Comprobación:* Revisar los logs del body en la petición.

### Evidence
* `PATCH /requests/1/priority` con `{"priority": "HIGH"}` responde `200 OK`.
* Log en consola: error de restricción/enum de PostgreSQL al intentar insertar `"URGENT"`.

### Confirmed cause
La capa HTTP confía ciegamente en `req.body.priority` y no valida que pertenezca al conjunto de valores válidos (`LOW`, `MEDIUM`, `HIGH`) antes de la consulta SQL.

### Correction
Validar el campo `priority` en el controlador HTTP retornando `400 Bad Request` si el valor no es válido.

### Regression test
Prueba que envía una prioridad inválida y verifica la respuesta `400`.

## Error flow

Where is the error created?
En la capa del controlador/servicio al fallar la validación o en el cliente de base de datos PostgreSQL.

How does it reach the error middleware?
Mediante `next(error)` en los bloques `catch` de las rutas asíncronas de Express.

What is returned to the client?
Un objeto JSON con la estructura `{ "error": "MENSAJE_O_CODIGO" }` y su código de estado HTTP correspondiente.

What remains only in the server log?
El stack trace completo del error y detalles internos de la base de datos (mensajes de PostgreSQL).

## Request ID

How did I prove that the response and log belong to the same request?
Comparando el encabezado `X-Request-ID` retornado en la respuesta HTTP con el identificador registrado en los logs del servidor.

## AI assistance

What did AI help me understand?
La diferencia entre tratar un síntoma (capturar el 500) y corregir la causa raíz (validar en el límite HTTP).

Which hypothesis did it propose?
Que el parámetro ingresaba a la consulta SQL como `NaN`.

How did I verify it?
Revisando la consola del servidor para confirmar el error `invalid input syntax for type bigint: "NaN"`.

What suggestion was incomplete or incorrect?
Cualquier sugerencia de envolver la consulta en un `try/catch` genérico sin validar la entrada en el controlador.

## Remaining doubt

What part do I still not understand?
Ninguna por el momento.