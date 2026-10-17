# Conversation transcript — ITSU-KNOWLEDGE-09-1.0

## Metadata

- evaluationId: K09-ronmysalimey-itu-d0b72fd
- studentId: ronmysalimey-itu
- commit: d0b72fd
- variant: D
- Inicio declarado: 1:13 p. m.
- Cierre de Q1: 1:39 p. m.
- Cierre de Q2: 1:59 p. m.
- Cierre de Q3: 2:11 p. m.
- Modelo: GitHub Copilot

## Prompt y tarjeta

El texto íntegro del prompt fuente se conserva en `assessment/evaluator-prompt.md`; la tarjeta íntegra, en `assessment/assessment-card.json`. La evaluación comenzó con `COMENZAR`. Durante la conversación se compartieron extractos de `test/requests-history.test.js` y `database/migrations/003_create_request_history.sql`. Esta exportación registra los turnos y respuestas disponibles, pero no duplica el prompt íntegro ni todos los extractos adjuntos.

## Transcripción de los turnos disponibles

**Evaluador:** Evaluación `K09-ronmysalimey-itu-d0b72fd` iniciada. ¿Qué hora es ahora?

**Estudiante:** 1:13 P.M.

**Evaluador:** Hora de inicio registrada: 1:13 p. m. Vamos con `GET /requests/:id/history`. En una frase, ¿qué promete este endpoint al cliente?

**Estudiante:** Le promete al cliente devolverle el historial cronológico completo de todos los cambios de estado y eventos registrados en una solicitud específica consultada por su ID.

**Evaluador:** Describe el contrato HTTP: método, ruta, entradas, respuestas y qué evidencia del repositorio lo comprobaría.

**Estudiante:** GET `/requests/:id/history`, parámetro `id`, autenticación Bearer; 200, 401, 403 y 404. Referencia `test/requests-history.test.js`.

**Evaluador:** Antes de inspeccionar todos los archivos, predice el recorrido.

**Estudiante:** Predijo `src/app.js`, autenticación, `requests.routes.js`, `requests.service.js`, `requests.store.js` y `src/database/pool.js`.

**Estudiante:** Como hallazgos, citó `router.get('/:id/history', ...)`, `parseIdParam`, `getHistory(actor, id)`, `canViewHistory` y `findHistory(requestId)`, con consulta parametrizada a `request_history` y orden por `created_at, id`. Mencionó propagación de errores en Express 5 y `test/requests-history.test.js`.

**Evaluador:** La prueba compartida muestra 404 tanto para un requester ajeno como para una solicitud inexistente. ¿Qué observaste y cómo rectificas el 403 inicial?

**Estudiante:** Rectificó a `404 REQUEST_NOT_FOUND` uniforme para reducir la enumeración de recursos e IDOR.

**Evaluador:** ¿Qué manejador propio del proyecto recibe la petición después de los middlewares globales?

**Estudiante:** Indicó `router.get('/:id/history', ...)` en `src/modules/requests/requests.routes.js` como frontera HTTP.

**Evaluador:** Q1 registrada. ¿Qué hora es ahora?

**Estudiante:** 1:39 P.M.

**Evaluador:** Quedan aproximadamente 34 minutos. Q2: una escritura cambia el estado, pero falla al registrar el evento en `request_history`. ¿Qué invariante debe mantenerse?

**Estudiante:** Todo o nada: la actualización en `requests` no debe ocurrir sin el rastro correspondiente en `request_history`. Compartió `003_create_request_history.sql`.

**Evaluador:** Si solo persistiera el cambio principal, ¿qué estado inconsistente observaría un cliente?

**Estudiante:** La solicitud aparecería actualizada, pero faltaría el evento que registra la transición, quién la hizo y cuándo.

**Evaluador:** ¿En qué archivo y función se realizan las escrituras?

**Estudiante:** Citó `patchRequest` en `src/modules/requests/requests.service.js` y también `claimRequest` y `createRequest`, coordinadas con el mismo cliente transaccional.

**Evaluador:** Evalúa: «Como HTTP es stateless, no importa que la base de datos quede parcialmente actualizada».

**Estudiante:** No estuvo de acuerdo: stateless describe independencia de peticiones en el transporte, no la integridad de la base.

**Evaluador:** ¿Qué hacen `commit` y `rollback` en este caso?

**Estudiante:** En `src/database/transaction.js`, `catch` ejecuta `ROLLBACK` y relanza el error; si ambas escrituras tienen éxito, `COMMIT` las consolida.

**Evaluador:** ¿Qué respuesta HTTP predices cuando falla el historial y qué evidencia lo sustenta?

**Estudiante:** Predijo 500: la excepción se relanza y el middleware centralizado trata el error no controlado.

**Evaluador:** Propón una prueba que demuestre el rollback.

**Estudiante:** Forzar un error al guardar el historial, esperar 500 y consultar que el estado siga `open`.

**Evaluador:** ¿Cómo comprobarías que no quedó un evento nuevo?

**Estudiante:** Consultaría `GET /requests/:id/history` o la tabla `request_history` y esperaría que no haya un evento de la transición fallida.

**Evaluador:** Q2 registrada. ¿Qué hora es ahora?

**Estudiante:** 1:59 p. m.

**Evaluador:** Quedan aproximadamente 14 minutos. Q3: un `requester` autenticado intenta consultar o modificar una solicitud ajena. ¿Dónde viven autenticación y autorización?

**Estudiante:** Citó `src/middlewares/`, `src/modules/requests/request.policy.js` y `requests.service.js`; dijo que la política deniega con 404.

**Evaluador:** La tarjeta lista `src/middleware/authenticate.js` en singular. Verifica la ruta. ¿Dónde se valida el JWT y de dónde sale la identidad confiable?

**Estudiante:** Insistió en `src/middlewares/authenticate.js`; describió extracción del Bearer token, validación criptográfica e identidad asignada a `req.user`.

**Evaluador:** La ruta citada no coincide con la tarjeta. ¿Por qué no confiar en un `userId` enviado en query o body?

**Estudiante:** El cliente puede alterarlo; la identidad debe venir del token verificado y no de datos controlados por el cliente.

**Evaluador:** Si el token se puede decodificar, ¿qué falta demostrar antes de confiar en sus claims?

**Estudiante:** Verificar la firma con la clave del servidor y la vigencia, incluida la expiración `exp`.

**Evaluador:** ¿Qué policy debería regir el acceso del requester a una solicitud ajena?

**Estudiante:** Citó `src/modules/requests/request.policy.js`, con comparación entre el `userId` del actor y el creador; devuelve `false` si no coincide.

**Evaluador:** ¿Qué respuesta elegirías entre 401, 403 y 404, y cómo afecta a la enumeración?

**Estudiante:** Eligió 404 uniforme para no revelar si existe el recurso.

**Evaluador:** Describe dos pruebas negativas, con actor, acción y resultado.

**Estudiante:** Requester autenticado hace GET de solicitud ajena y recibe 404; requester autenticado hace PATCH de solicitud ajena y recibe 404 sin modificar la base.

**Evaluador:** Q3 registrada. ¿Qué hora es ahora?

**Estudiante:** 2:11.

**Evaluador:** Aviso: quedan aproximadamente 2 minutos. Q4, LOG-04: falla la suite que usa la base con `ECONNREFUSED`; log `{"level":"error","requestId":"req_data1","msg":"connect ECONNREFUSED"}`; respuesta HTTP `503 {"error":{"code":"DATABASE_UNAVAILABLE"},"requestId":"req_data1"}`; `/health` 200 y `/ready` 503. Separa síntoma, hipótesis y causa a investigar.

**Estudiante:** Síntoma: `ECONNREFUSED`, 503, `/ready` 503 y `/health` 200. Hipótesis: la base está caída, apagada o mal configurada. Investigaría si está activa, las variables de conexión y la red/puerto.

**Evaluador:** ¿Qué comando ejecutarías primero y qué resultado buscarías?

**Estudiante:** `pg_isready` o `nc -zv <host> <port>`; esperaría fallo de conexión o rechazo del socket.

**Evaluador:** La evaluación cerró por tiempo antes de presentar Q5 y antes de solicitar la hora de cierre de Q4. Q5 quedó sin evaluar y Q4 parcial.

## Integrity declaration / Declaración de integridad

Este registro no es una exportación literal completa: resume los turnos conservados y remite al prompt y a la tarjeta fuente. Los adjuntos tampoco están transcritos íntegramente. Se marca `TRANSCRIPT_INCOMPLETE`; no se presenta como una captura completa del historial conversacional.
