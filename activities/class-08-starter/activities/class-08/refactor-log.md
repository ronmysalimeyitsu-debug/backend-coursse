# Refactor log — Clase 08

Registro del refactor seguro. Un cambio pequeño por fila, SIEMPRE con las
pruebas como red. Regla: si cambió la ruta, el status, el body o el
permiso, no fue solamente un refactor.

## Antes de empezar

* Prueba(s) que protegen la operación: `test/requests-history.test.js` (todas las pruebas del endpoint GET /requests/:id/history)
* Resultado de la suite ANTES del refactor: 39 pass · 13 todo · 0 fail
* Commit de partida: `5429366`

## Pasos

| # | Qué extraje / moví | ¿A dónde? | Suite después (pass/fail) |
| --- | --- | --- | --- |
| 1 | Reemplacé la regex/conversión inline por el parser existente `parseIdParam` | `src/modules/requests/requests.routes.js` | 39 pass · 13 todo · 0 fail |
| 2 | Reemplacé la decisión de visibilidad inline por la llamada a `canViewHistory`, que ya existía | `src/modules/requests/request.policy.js` | 39 pass · 13 todo · 0 fail |
| 3 | Reutilicé la consulta `findHistory` y el mapeo `mapHistoryEventRow`, ya existentes | `src/modules/requests/requests.store.js` y `request.mapper.js` | 39 pass · 13 todo · 0 fail |
| 4 | Creé `getHistory(actor, id)` para coordinar búsqueda, permiso, consulta y mapeo | `src/modules/requests/requests.service.js` | 39 pass · 13 todo · 0 fail |
| 5 | Dejé la route en parsear id, delegar al service y responder JSON | `src/modules/requests/requests.routes.js` | 39 pass · 13 todo · 0 fail |

## Verificación final

* Diff revisado: ¿algún cambio observable accidental? Ninguno. Mismas rutas, mismos códigos HTTP, mismo contrato JSON y sin SQL en las rutas.
* Suite de regresión del refactor: 39 pass · 13 todo · 0 fail (los `todo` corresponden a FEATURE-801, que va en otro cambio).
* Suite completa después de FEATURE-801: 52 pass · 0 fail · 0 todo.
* Commit del refactor: `class-08-refactor` (este cambio).

## Qué preguntaste a la IA (y qué verificaste)

* Se consultó cómo desacoplar el handler monolítico de `GET /requests/:id/history` manteniendo intacto el contrato de errores de la clase 7 (404 REQUEST_NOT_FOUND para recursos ajenos) y se verificó ejecutando la suite con `test/requests-history.test.js`.

## Qué propuesta de la IA descartaste por sobrearquitectura

* Se descartó la creación de abstracciones complejas innecesarias (como capas de Repository genéricas, decoradores o CQRS), respetando la estructura limpia y pragmática del curso: routes (HTTP) -> service (coordinación) -> store/policy/mapper.
