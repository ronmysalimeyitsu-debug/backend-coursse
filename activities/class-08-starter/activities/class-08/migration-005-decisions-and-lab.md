# Migración 005: decisiones y laboratorio

**Clasificación:** lectura técnica y laboratorio · **Dificultad:** media · **Sección:** Migraciones sobre datos vivos

La migración `005_add_request_assignment.sql` agrega la asignación de solicitudes para FEATURE-801. Una migración aplicada es parte de la historia de la base: se amplía con otra migración, no se reescribe para que coincida con el código actual.

## La 005 por dentro: tres decisiones

### 1. La columna acepta `NULL`

```sql
ALTER TABLE requests
ADD COLUMN assigned_to UUID REFERENCES users(id);
```

`NULL` significa «todavía no hay agente asignado». Las filas anteriores permanecen válidas sin inventar un responsable ni actualizar datos existentes. La operación suma una capacidad nueva sin exigir que el pasado se comporte como si esa capacidad hubiera existido.

### 2. La foreign key garantiza existencia, no intención

`REFERENCES users(id)` impide guardar un UUID que no corresponda a un usuario existente. No comprueba que el usuario tenga rol `agent`, que la solicitud siga `open` ni que se haya escrito un evento de historial. Esas decisiones pertenecen a la policy y al service; la FK protege integridad referencial.

### 3. Se amplía el CHECK sin editar la migración 003

El tipo nuevo `request_claimed` debe estar permitido por el CHECK de `request_history`. La 005 reemplaza la restricción con una versión que conserva los tipos previos y añade el nuevo:

```sql
ALTER TABLE request_history
DROP CONSTRAINT request_history_type_check;

ALTER TABLE request_history
ADD CONSTRAINT request_history_type_check
CHECK (type IN ('status_changed', 'priority_changed', 'request_claimed'));
```

La 003 pudo haberse aplicado en otras bases. Editarla no ejecutaría el cambio en esas bases y haría que el historial del repositorio dejara de describir lo ocurrido. La migración runner aplica cada archivo pendiente en orden, con transacción y fila de ledger por migración; si la 005 falla, sus cambios y su registro se revierten juntos.

## Laboratorio: ¿compatible, destructiva o mala historia?

Clasifica cada propuesta. «Compatible» significa que conserva las filas y reglas existentes mientras añade capacidad; no implica que toda operación carezca de costo operativo.

| # | Cambio propuesto | Clasificación | Motivo |
| --- | --- | --- | --- |
| 1 | Añadir `assigned_to UUID REFERENCES users(id)` aceptando `NULL`. | **Compatible** | Las filas antiguas reciben `NULL`; no se inventa asignación y cada UUID no nulo debe referenciar un usuario. |
| 2 | Añadir `assigned_to UUID NOT NULL REFERENCES users(id)` sin valor por defecto ni backfill. | **Destructiva/inaplicable sobre datos existentes** | Las filas actuales no tienen agente asignado; no pueden satisfacer `NOT NULL` sin una decisión de backfill. |
| 3 | Añadir la columna nullable y asignar inmediatamente todas las solicitudes existentes a María. | **Destructiva en significado** | La base podría aceptar el cambio, pero altera el significado de datos previos y finge que todas fueron reclamadas. |
| 4 | Añadir la FK a `users(id)`. | **Compatible y aditiva** | Protege existencia del usuario. No autoriza el rol ni garantiza historial; esas reglas quedan en la aplicación. |
| 5 | Crear un índice sobre `assigned_to`. | **Compatible y aditiva** | No cambia filas ni contrato; ayuda a las consultas por agente. En tablas grandes hay que considerar el bloqueo del `CREATE INDEX` normal y planearlo operativamente. |
| 6 | En una nueva migración, reemplazar el CHECK por otro que conserva los dos tipos y añade `request_claimed`. | **Compatible** | Amplía la regla y mantiene válidos los eventos anteriores; el cambio queda versionado en una migración nueva. |
| 7 | Editar `003_create_request_history.sql` porque es «más simple». | **Mala práctica de historial** | Las bases que ya aplicaron 003 no la vuelven a ejecutar; una base nueva y una existente quedarían con historias distintas. |
| 8 | Eliminar el CHECK y no volver a crearlo, o recrearlo permitiendo solo `request_claimed`. | **Destructiva** | La primera variante elimina integridad; la segunda rechaza eventos previos. La 005 debe preservar los tipos anteriores y añadir el nuevo. |

Regla de diagnóstico: primero pregunta qué pasa con las filas vivas; después, si la migración es repetible/versionada; por último, qué garantía real ofrece cada constraint.

## Lo que la base garantiza y lo que no

| Garantía | Dueño | No garantiza |
| --- | --- | --- |
| `assigned_to` nulo o UUID referenciable a `users.id` | FK de PostgreSQL | Que el usuario referenciado sea agente. |
| Solo un agente reclama una solicitud abierta y no asignada | `canClaimRequest` en `request.policy.js` | Que el UUID exista; eso lo protege la FK. |
| Asignación y evento `request_claimed` se guardan juntos o ninguno | Transacción coordinada por `claimRequest` | Que todos los otros caminos de escritura sigan la regla de negocio sin pruebas. |
| El CHECK permite únicamente los tipos de evento declarados | `request_history_type_check` | Que el evento corresponda a una transición autorizada de negocio. |

Son defensas distintas, en capas distintas: policy para intención y permisos; FK/CHECK para integridad; transacción para atomicidad.

## Checkpoint SQL: inspecciona el seed

Ejecuta esta consulta de solo lectura en el SQL Editor de Supabase después de `npm run db:seed`:

```sql
SELECT
  r.id,
  r.title,
  r.status,
  r.assigned_to,
  assigned_user.role AS assigned_role,
  count(h.id) FILTER (WHERE h.type = 'request_claimed') AS claim_events
FROM requests AS r
JOIN users AS owner ON owner.id = r.created_by
LEFT JOIN users AS assigned_user ON assigned_user.id = r.assigned_to
LEFT JOIN request_history AS h ON h.request_id = r.id
WHERE owner.email = 'ana.requester.seed@example.test'
GROUP BY r.id, assigned_user.role
ORDER BY r.id;
```

**Resultado esperado:** tres filas para Ana. La VPN queda `in_progress`, `assigned_to` no nulo, `assigned_role = agent` y `claim_events = 1`. Sus otras solicitudes no reclamadas muestran `assigned_to = NULL` y cero eventos de claim.

El seed completo crea seis solicitudes, cubre estados y deja una solicitud ya reclamada por el agente demo. Es repetible, pero al ejecutarlo borra y reconstruye las solicitudes e historial de sus usuarios `*.seed@example.test`; no trunca ni borra solicitudes de otros usuarios. No lo ejecutes en una base cuyos datos seed quieras conservar sin entender ese efecto.

## Respuestas de verificación

1. **¿Qué impide asignar una solicitud a un requester?** La policy de la aplicación comprueba `actor.role === 'agent'` antes de permitir el claim.
2. **¿Qué impide asignar a un UUID falso?** La FK `requests.assigned_to REFERENCES users(id)`.
3. **¿Son dos guardias distintas?** Sí. Una valida permiso/rol y la otra integridad referencial; ninguna sustituye a la otra.
4. **¿Por qué la columna nueva es nullable?** Para que cada fila existente siga siendo válida como no asignada, sin backfill inventado.
5. **¿Por qué no modificar 003?** Porque bases existentes ya registraron esa migración; una 005 versiona el cambio que aún falta aplicar.
6. **¿Qué protege la transacción del claim?** Evita que una solicitud quede asignada sin su evento de historial, o que exista el evento sin la asignación correspondiente.