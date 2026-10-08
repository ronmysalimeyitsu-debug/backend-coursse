# Pruebas API y cierre del taller

**Clasificación:** laboratorio de verificación · **Sección:** Pruebas y validador

Este bloque conecta tres cosas: reglas puras, contrato HTTP y evidencia de que las fronteras sobreviven al cambio.

## Dos niveles de prueba, un contrato

### Sin HTTP: la regla

`test/request-policy.test.js` llama `canClaimRequest({ actor, request })` con objetos literales. Sus 5 pruebas cubren agente permitido, requester denegado, ya asignada, estados no abiertos y prioridad de la regla de rol. No levanta servidor, no conecta a PostgreSQL y corre con:

```bash
npm run test:policy
```

Esta suite prueba la decisión de policy. No prueba rutas, códigos HTTP, autenticación, JSON ni transacciones.

### Con HTTP: el contrato

`test/requests-claim.test.js` prueba `POST /requests/:id/claim` con Supertest y datos sintéticos. Las 9 pruebas principales cubren los casos de la matriz:

| Caso | Resultado comprobado |
| --- | --- |
| Sin token | `401` |
| Requester en request abierto | `403` |
| Agent en request abierto | `200`, `in_progress`, `assignedTo` del token y `updatedAt` actualizado |
| Request inexistente | `404 REQUEST_NOT_FOUND` |
| Segundo claim | `409 REQUEST_ALREADY_ASSIGNED` y `requestId` |
| Request cancelada | `409` |
| Requests `in_progress` y `resolved` | `409 INVALID_STATUS_TRANSITION` |
| Request `closed` | `409 REQUEST_IN_TERMINAL_STATUS` |
| `assignedTo` enviado en el body | `400 SERVER_CONTROLLED_FIELD` |
| Evento de historial | `request_claimed`, `open` → `in_progress` |

El caso de estados usa una sola prueba parametrizada con tres preparaciones: primero aplica las transiciones válidas de `request-status.js`, luego intenta el claim. De este modo la suite API comprueba los status y códigos que la policy pura no puede observar.

Ejemplo de la forma de una prueba de contrato:

```js
const response = await request(app)
  .post(`/requests/${created.id}/claim`)
  .set('Authorization', `Bearer ${agentToken}`);

assert.equal(response.status, 200);
assert.equal(response.body.status, 'in_progress');
assert.equal(response.body.assignedTo, agent.id);
```

La prueba del historial consulta después `GET /requests/:id/history` y comprueba el evento; no basta con que la respuesta del claim parezca correcta.

## Laboratorio: completa y lee la matriz

1. Ejecuta `npm run test:policy`: predice los 5 veredictos antes de mirar el resultado.
2. Ejecuta `npm run test:claim`: relaciona cada caso HTTP con la fila correspondiente de `tickets/FEATURE-801.md`.
3. Ejecuta `npm test`: comprueba que la regresión anterior y la nueva feature conviven.
4. Si una prueba API falla, clasifica la falla: regla incorrecta (policy), traducción de razón a error HTTP (service), ruta/autenticación (route/middleware), persistencia/historial (store/transacción) o representación JSON (mapper).

Estado actual esperado: **5 pruebas puras de policy, 9 pruebas de API de claim y 53 pruebas totales verdes**. El conteo total incluye la suite previa y el check de rollback del validador se ejecuta aparte.

## Laboratorio: consola del validador en tres momentos

Antes de mirar cada salida, predice qué sección fallaría y por qué. No confundas el resultado de un momento con el de otro:

| Momento del trabajo | Qué debe demostrar `npm run validate:class-08` |
| --- | --- |
| Starter antes de implementar | Baseline del comportamiento previo verde; los checks de claim todavía fallan porque el ticket no está implementado. La route cargada puede fallar la frontera de SQL. |
| Después del refactor, antes de FEATURE-801 | Suite de regresión idéntica al baseline y route sin SQL; los checks de claim siguen fallando. El resultado global aún puede ser `FAILED`: eso no invalida el refactor. |
| Taller completo | Baseline, matriz de claim, rollback ante FK inválida y fronteras pasan: **13/13 PASSED**. |

En este checkout, el comando actual corresponde al tercer momento. No reconstruyas ni ejecutes un estado histórico sobre tu base compartida para imitar los dos primeros; usa los commits y los registros de `refactor-log.md` para leerlos como etapas.

El check 11 fuerza una FK inválida durante una unidad con `withTransaction`, confirma el `ROLLBACK` y verifica que no queden asignación ni evento parciales. Los checks 12 y 13 verifican que routes no conozca SQL y que service no dependa de Express.

## Cierre: el mismo módulo, otra organización

Antes, el handler de historial mezclaba HTTP, validación, permisos, SQL y JSON. Ahora cada razón de cambio tiene un destino reconocible; las reglas se prueban sin infraestructura, el contrato se prueba por API y el validador hace visibles los límites.

**Prueba de fuego:** si mañana se pide `POST /requests/:id/release`, ¿qué archivos cambiarían y por qué? Una respuesta inicial razonable incluye ticket/contrato, policy, service, store, route y pruebas de policy/API; una migración solo si el nuevo comportamiento necesita persistencia adicional. No agregues capas por anticipado: decide a partir de la regla y del cambio observable.

Completa en una frase: «El próximo cambio será más fácil porque ahora sé que la regla vive en ___, la coordinación en ___ y el contrato se comprueba en ___».