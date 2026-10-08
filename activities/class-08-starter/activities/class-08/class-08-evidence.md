# Class 08 evidence — para el checkpoint de la PRÓXIMA clase

El tema 8 NO se evalúa hoy: primero se aprende y se practica. Al comenzar
la próxima clase ejecutarás un checkpoint breve SOLO del tema 8. Este
archivo reúne desde ya la evidencia que ese checkpoint pedirá.

## Evidencia mínima del tema 8

* Baseline anterior al refactor (commit `class-08-baseline`): `5429366`
* Commits separados de refactor y feature (`class-08-refactor`, `class-08-feature`): `67a7a9d` y `12ae761`.
* `responsibility-map.md` completo: sí
* Separación route/service/store/policy:
  - `routes`: extracción y validación de parámetros HTTP (`req.params.id`, `req.auth`, `req.body`), respuesta JSON. Sin SQL ni lógica de negocio.
  - `service`: coordinación de casos de uso (`getHistory`, `claimRequest`), manejo de transacciones (`withTransaction`), mapeo de errores (`AppError`). Sin dependencias de Express (`req`/`res`).
  - `store`: consultas SQL parametrizadas (`assignRequest`, `findHistory`, `insertHistoryEvent`), acceso a PostgreSQL.
  - `policy`: reglas puras de autorización y negocio (`canClaimRequest`, `canViewHistory`), testeable con objetos planos en milisegundos sin BD ni HTTP.
* Migración de assignment aplicada (005): 005_add_request_assignment.sql (columna assigned_to agregada, índice creado, check constraint ampliado a 'request_claimed')
* Endpoint claim funcionando: `POST /requests/:id/claim` responde 200 con `status: "in_progress"` y `assignedTo: "<uuid>"`.
* Historial y transacción consistentes: Evento `request_claimed` generado en `request_history` dentro de la misma transacción con `withTransaction(client)`.
* Pruebas de policy (sin HTTP) y de API:
  - `test/request-policy.test.js`: 5 pruebas unitarias puras en verde (5 pass)
  - `test/requests-claim.test.js`: 8 pruebas de integración HTTP en verde (8 pass)
  - Total suite: 52 pass, 0 fail, 0 todo
* Rollback de historial ante FK inválida: comprobado por el check 11 del validador; estado abierto/no asignado y cero eventos de claim.
* Resultado del validador: FINAL RESULT: PASSED (13/13) registrado en `validation-evidence.txt`

## Explicación integradora (bórrala de memoria: escríbela con el proyecto abierto)

> Explica qué parte de tu trabajo fue refactor y cuál fue nueva
> funcionalidad. Ubica una regla en policy, una coordinación en service,
> una operación SQL en store y explica cómo las pruebas demostraron que el
> comportamiento anterior se conservó.

El refactor consistió en desacoplar el handler monolítico de `GET /requests/:id/history`, moviendo el SQL a `requests.store.js`, las reglas de visibilidad a `request.policy.js` (`canViewHistory`), el formateo a `request.mapper.js` y la orquestación a `requests.service.js` (`getHistory`), dejando la ruta delgada y sin SQL.
La nueva funcionalidad (FEATURE-801) añadió el reclamo de solicitudes (`POST /requests/:id/claim`): la regla de negocio pura se definió en `canClaimRequest` (`request.policy.js`) verificando que solo un agente pueda reclamar y que la solicitud esté abierta y sin asignar; la coordinación se ubicó en `claimRequest` (`requests.service.js`) gestionando la transacción atómica; y la persistencia se ubicó en `assignRequest` (`requests.store.js`) actualizando `assigned_to`, `status` y `updated_at`.
Las 39 pruebas de la suite de regresión previa se mantuvieron 100% en verde tras el refactor, y las 13 pruebas nuevas (5 de policy y 8 de claim) verificaron la nueva funcionalidad para un total de 52/52 pruebas aprobadas.
