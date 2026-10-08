# Responsibility map — Clase 08

Mapa de responsabilidades del handler cargado ANTES de refactorizar.
Complétalo mientras lees `GET /:id/history` en `requests.routes.js`.

## El handler analizado

Ruta/operación: `GET /requests/:id/history`

## Clasificación de bloques

Para cada bloque del handler, anota a qué categoría pertenece y qué líneas
lo forman (aprox.):

| Categoría | ¿Qué hace ese bloque aquí? | ¿A qué archivo debería moverse? |
| --- | --- | --- |
| HTTP (leer params/identidad) | Lee `req.params.id`, valida el formato con `parseIdParam` y toma el actor autenticado de `req.auth`. | `requests.routes.js` lee la entrada; `parse-id.js` valida el parámetro. La autenticación se mantiene en middleware. |
| Aplicación (coordinar el caso) | Llama `getHistory(actor, id)` y devuelve el resultado con status 200. | `requests.routes.js` conserva la coordinación HTTP; `requests.service.js` coordina el caso de uso. |
| Negocio (¿puede verse?) | Comprueba si el actor puede ver la solicitud: agent puede ver cualquiera; requester solo la propia. Una solicitud ajena responde igual que una inexistente. | `request.policy.js` (`canViewHistory` / `canViewRequest`) y decisión de ocultar existencia en `requests.service.js`. |
| Persistencia (SQL) | Busca primero la solicitud y obtiene sus eventos, ordenados del más antiguo al más nuevo. | `requests.store.js` (`findById`, `findHistory`). |
| Presentación (construir respuesta) | Convierte las filas snake_case al JSON público camelCase y excluye datos internos como `changed_by`. | `request.mapper.js` (`mapHistoryEventRow`); el route serializa con `res.json`. |
| Observabilidad (errores/requestId) | Los errores se propagan al middleware central; el requestId se conserva en el log y en la respuesta de error. | `middleware/request-id.js`, `middleware/request-logger.js` y `middleware/error-handler.js`; no duplicarlo en el handler. |

## Las preguntas del análisis

* ¿Cuántas RAZONES distintas tiene esta función para cambiar?

  Se distinguen seis responsabilidades: transporte/entrada HTTP, coordinación del caso, autorización, consulta SQL, presentación de filas y manejo/registro de errores. Cada una puede cambiar por una razón distinta.

* ¿Qué piezas ya existentes del proyecto duplica? (pista: mira store, mapper y policy)

  Duplica la validación de ids (`parseIdParam`), la consulta del store (`findById`/`findHistory`), la regla de visibilidad (`canViewHistory`/`canViewRequest`) y el mapeo de filas (`mapHistoryEventRow`). El requestId y la traducción de errores ya pertenecen al middleware compartido.

* ¿Qué NO se puede probar de forma aislada mientras todo viva junto?

  La policy no se puede probar como función pura sin Express ni base; la consulta y el orden del store no se pueden verificar aparte del HTTP; y el mapper no puede probarse contra filas simples sin atravesar toda la ruta. Al separarlos, cada límite puede probarse con la herramienta adecuada.
