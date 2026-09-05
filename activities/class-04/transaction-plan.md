# Plan de Transacción: Actualización de Estado de Solicitud

## Resumen
El plan de transacción garantiza que la actualización del estado de una solicitud y el registro de su historial de auditoría ocurran de forma atómica. Si alguna de las operaciones falla, ambas se revierten para mantener la consistencia de la base de datos.

## Alcance
- **Operaciones Involucradas**:
  1. `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`
  2. `INSERT INTO request_status_history (request_id, previous_status, new_status, changed_at) VALUES ($1, $2, $3, NOW())`
- **Nivel de Aislamiento**: Read Committed (predeterminado en PostgreSQL).

## Pasos de Ejecución
1. Adquirir una conexión de cliente del pool de la base de datos.
2. Ejecutar `BEGIN` para iniciar el bloque de transacción.
3. Consultar el estado actual de la solicitud para validar su existencia y comprobar si la transición de estado solicitada es válida.
4. Ejecutar la consulta de actualización de estado en la tabla `requests`.
5. Ejecutar la consulta de inserción en la tabla `request_status_history` utilizando los valores de estado anterior y nuevo.
6. Ejecutar `COMMIT` si todos los pasos tienen éxito; de lo contrario, ejecutar `ROLLBACK` en caso de error.
7. Liberar el cliente de la base de datos de vuelta al pool dentro de un bloque `finally`.