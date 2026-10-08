# Refactor vs feature

**Clasificación:** lectura interna · **Dificultad:** baja · **Tiempo estimado:** 8 minutos · **Sección:** El cambio que toca todo

"Refactorizar" se usa a veces para cualquier edición, desde renombrar una variable hasta reescribir una API. En esta clase usamos una definición operativa precisa para distinguir el trabajo interno de los cambios que afectan a quien consume el sistema.

## Definición operativa

> Refactorizar es cambiar la **estructura interna** del código sin cambiar su **comportamiento observable**.

En un backend HTTP, lo observable incluye:

- **Rutas:** qué endpoints existen y cuál es su forma.
- **Status:** qué código responde en cada caso.
- **Bodies:** qué campos entran y salen, con qué nombres.
- **Permisos:** quién puede hacer qué.

Regla del taller: **si cambia la ruta, el status, el body o el permiso, no fue solamente un refactor.** Aunque el cambio parezca razonable o "de paso", alguien debe decidirlo como cambio de contrato o de producto.

## Ejemplos

| Cambio | Clasificación | Por qué |
| --- | --- | --- |
| Extraer el mapeo fila→JSON a una función que devuelve lo mismo | Refactor | Cambia la estructura interna, no la respuesta. |
| Mover SQL de la route al store, conservando parámetros y filas | Refactor | La ubicación cambia; la operación y su resultado no. |
| Renombrar una variable interna o dividir una función larga | Refactor | No altera el contrato observable. |
| Agregar `POST /requests/:id/claim` | Feature | Aparece una operación nueva solicitada por FEATURE-801. |
| Cambiar de 403 a 404 o renombrar `INVALID_REQUEST_ID` a `BAD_ID` | Cambio de contrato | Cambian status o body de error; requieren una decisión explícita. |
| Permitir que un requester ejecute una acción antes prohibida | Cambio de permiso | Cambia quién puede hacer qué; no es una limpieza interna. |

## Por qué separar los commits

En este taller se buscan dos commits: `class-08-refactor` y luego `class-08-feature`. Cada diff debe responder una sola pregunta:

- El diff de refactor responde: **¿cambió algo observable?** La respuesta debe ser no; se comprueba con la suite y revisando rutas, status, bodies y permisos.
- El diff de feature responde: **¿cumple el ticket?** Se comprueba contra la matriz de FEATURE-801.

Si se mezclan, el revisor tiene que adivinar qué línea pertenece a cada intención. Por eso primero se registra el baseline verde, después se refactoriza y verifica, y solo entonces se implementa la feature.

## Laboratorio: separar `GET /requests/:id/history`

La meta no es reescribir el endpoint: las piezas necesarias ya existen o tienen un destino claro. Reorganiza una responsabilidad por vez y ejecuta `npm test` después de cada paso.

1. **Fija la red:** ejecuta `npm test` antes de editar y anota pass, todo y fail en `refactor-log.md`. En el baseline de esta clase se esperan 39 pass, 13 todo y 0 fail.
2. **Elige una sola responsabilidad:** empieza por la validación del id del handler.
3. **Identifica su destino:** `parseIdParam` ya existe en `src/http/parse-id.js`.
4. **Mueve sin cambiar lógica:** sustituye la regex y conversión inline del handler por `parseIdParam(req.params.id)`; corre la suite.
5. **Reutiliza piezas existentes:** elimina la decisión de visibilidad inline y llama a `canViewHistory` de `request.policy.js`; reutiliza `findHistory` de `requests.store.js` y `mapHistoryEventRow` de `request.mapper.js`. Las tres piezas ya existen; corre la suite.
6. **Agrega solo coordinación:** crea `getHistory(actor, id)` en `requests.service.js` para buscar la solicitud, comprobar visibilidad, consultar eventos y mapearlos; corre la suite.
7. **Deja delgada la route:** `GET /:id/history` parsea el id, llama al service y responde JSON. Anota el paso y su resultado real en `refactor-log.md`.
8. **Revisa antes del commit:** compara rutas, status, body y permisos contra el baseline; comprueba que no hay SQL en routes. El refactor debe conservar 39 pass, 13 todo y 0 fail. Después registra el commit `class-08-refactor`; implementa FEATURE-801 en un cambio separado.

Si un paso rompe la suite, detente y deshaz únicamente ese paso antes de continuar. Los pasos pequeños reducen el área sospechosa a una responsabilidad.

En el estado final de este starter, la route ya quedó reducida a parsear el id, llamar a `getHistory` y responder. La suite completa de después de FEATURE-801 tiene 52 pass, 0 todo y 0 fail; ese conteo final no reemplaza el resultado de regresión que debe quedar registrado para el refactor antes de mezclar la feature.

## Papel de la suite

La suite verde anterior al refactor describe el comportamiento que ya existe. Si sigue verde después, demuestra que el comportamiento cubierto por esas pruebas se conservó. No demuestra lo que la suite no cubre: también hay que revisar el diff y comparar explícitamente el contrato observable.

Sin pruebas, no hay evidencia de conservación: solo una apuesta. Para este módulo, `GET /requests/:id/history` debe conservar autenticación, autorización (agentes pueden ver cualquier historial; requesters solo el propio), status, forma del JSON y orden de eventos.

## Comprobación de lectura

1. ¿Por qué cambiar un mensaje/código de error no es refactor? Porque el body de error forma parte del contrato observable y sus consumidores pueden depender de él.
2. ¿Qué pregunta responde el diff de un commit de refactor? Si cambió algo observable; la respuesta correcta es no.
3. ¿Qué papel juega la suite? Captura el comportamiento existente antes del cambio y ayuda a demostrar que lo cubierto se conserva después. Se complementa con la revisión del contrato y del diff.

## Actividad

Revisa un proyecto personal y busca un commit que mezcle refactor con cambios de comportamiento. Escribe dos líneas: una para el commit de refactor y otra para el de feature o cambio de contrato. No inventes un ejemplo personal si no tienes ese historial; en ese caso, usa el handler de este starter y separa una extracción interna de FEATURE-801.

- Refactor (`class-08-refactor`): __________________________________________
- Feature/contrato (`class-08-feature`): ____________________________________

Ejemplo modelo basado en este starter (no afirma que estos commits ya existan):

- Refactor: mover consulta, visibilidad y mapeo del handler de historial a store/service/policy/mapper, conservando su contrato.
- Feature: agregar `POST /requests/:id/claim` según FEATURE-801, con sus permisos, respuestas e historial transaccional.

Conecta esta lectura con las prácticas del taller: el mapa de responsabilidades y el handler antes/después sirven para localizar qué se mueve; el clasificador refactor/feature sirve para decidir si el cambio altera el comportamiento observable.