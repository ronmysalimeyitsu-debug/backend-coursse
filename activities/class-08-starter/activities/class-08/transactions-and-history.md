# Transacciones e historial: juntos o nada

**Clasificación:** lectura interna y laboratorio · **Dificultad:** media · **Tiempo estimado:** 8 minutos · **Sección:** Implementación por capas

Un claim escribe dos hechos que describen una sola acción: asigna la solicitud y registra quién la reclamó. Si solo uno queda guardado, el estado y su historia dejan de coincidir.

## El estado mentiroso

Sin una transacción, el `UPDATE requests` y el `INSERT request_history` pueden confirmar por separado. Si el segundo falla, puede quedar una solicitud `in_progress` asignada sin un evento que explique cuándo ni quién lo hizo. Si el evento queda confirmado y la asignación no, el historial afirma algo que no ocurrió.

En ambos casos el sistema pierde consistencia: la solicitud y su auditoría cuentan historias distintas.

## Una transacción, un resultado

El caso de uso equivale a:

```sql
BEGIN;
UPDATE requests
SET assigned_to = $2, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
INSERT INTO request_history
  (request_id, type, from_status, to_status, changed_by)
VALUES ($1, 'request_claimed', 'open', 'in_progress', $2);
COMMIT;
```

Si cualquier operación falla, la transacción ejecuta `ROLLBACK`. El resto del sistema ve el estado anterior o el final, no una asignación parcial.

En este starter, `withTransaction(async (client) => ...)` abre la transacción y entrega un client PostgreSQL ligado a esa conexión. Toda consulta dentro del callback debe recibir ese mismo client:

- `findById(id, client)` lee el estado que decide el claim.
- `assignRequest(id, actor.userId, client)` actualiza asignación y estado.
- `insertHistoryEvent(event, client)` escribe el evento en la misma transacción.

`insertHistoryEvent` tiene un pool por defecto para usos fuera de una transacción. Omitir `client` dentro de `claimRequest` hace que el INSERT use otra conexión y salga del ámbito transaccional; que compile no demuestra atomicidad.

## Por qué la lectura también está dentro

El `findById` del claim ocurre con el mismo client antes de evaluar la policy. Así la decisión se basa en la lectura de la unidad de trabajo, no en una consulta independiente realizada antes de abrirla.

## Consistencia no es concurrencia

La transacción resuelve que la asignación y el evento se confirmen o reviertan juntos. No resuelve por sí sola dos agentes reclamando simultáneamente: una carrera puede hacer que ambos lean la fila como no asignada. El control de esa carrera requiere una estrategia adicional, como `SELECT ... FOR UPDATE` o un `UPDATE` condicional y comprobación de filas afectadas; queda fuera de este taller.

## Verificación de lectura

1. **¿Cuáles son los dos estados inconsistentes?** Solicitud asignada sin evento; o evento de claim guardado sin la asignación correspondiente.
2. **¿Por qué pasar el client es tan importante como abrir la transacción?** Porque solo las consultas ejecutadas con el client de esa conexión participan en la transacción; el pool puede prestar otra conexión.
3. **¿En qué difieren consistencia y concurrencia?** Atomicidad mantiene juntas dos escrituras de una acción; concurrencia coordina varias acciones simultáneas que compiten por la misma fila.

## Laboratorio: asignación e historial

| Escenario | Resultado esperado en la base |
| --- | --- |
| Claim válido, ambas escrituras con el client | `status = in_progress`, `assigned_to` con el agente y un evento `request_claimed`. |
| El INSERT de historial falla dentro de la transacción | `ROLLBACK`: `status = open`, `assigned_to IS NULL` y cero eventos `request_claimed` nuevos. |
| Se omite el client del INSERT | La escritura sale de la transacción; la propiedad de atomicidad ya no está garantizada. No hagas este experimento en una base compartida: usa un entorno descartable, impón un tiempo límite y restaura el código de inmediato. |

El validador de clase 08 automatiza el segundo caso. Crea una solicitud sintética, ejecuta el UPDATE con el client y fuerza la FK de `changed_by` con un UUID inexistente; después confirma que la solicitud sigue abierta, no asignada y sin evento de claim. También comprueba que el service pasa `client` tanto a `assignRequest` como a `insertHistoryEvent`.

```bash
npm run validate:class-08
```

La prueba no modifica solicitudes seed ni datos ajenos: el validador limpia sus datos sintéticos al terminar.