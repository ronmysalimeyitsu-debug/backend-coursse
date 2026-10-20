# 05 — Inventario, reservas y movimientos

## Tres cantidades diferentes

```text
on_hand: unidades físicamente registradas
reserved: unidades comprometidas con órdenes activas
available: on_hand - reserved
```

Mostrar solamente `on_hand` puede vender dos veces la última unidad.

## Slots

Un slot pertenece a una máquina y contiene un producto.

Datos típicos:

- capacity;
- on_hand;
- reserved;
- product_id;
- position;
- active.

## Reservar

La creación de orden debe comprobar y reservar en una operación protegida.

Ejemplo conceptual:

```sql
UPDATE machine_slots
SET reserved = reserved + $quantity
WHERE tenant_id = $tenantId
  AND id = $slotId
  AND active = true
  AND on_hand - reserved >= $quantity
RETURNING *;
```

Cero filas significa disponibilidad insuficiente o contexto inválido.

## Movimientos

No depender solamente de editar un número. Registrar un ledger:

```text
restock
sale
release
manual_adjustment
correction
dispense_failure
```

Cada movimiento incluye:

- tenant;
- machine;
- slot;
- product;
- quantity signed;
- reason;
- reference type/id;
- actor;
- timestamp.

## Ciclo

### Pago rechazado o reserva expirada

Reduce `reserved`, no `on_hand`.

### Despacho exitoso

Reduce `on_hand` y `reserved`; registra `sale`.

### Despacho fallido

La regla puede liberar reserva o enviarla a revisión. Debe estar explícita.

## Reconciliación

Un reporte operativo debe detectar:

- reservas expiradas aún activas;
- slot negativo;
- `reserved > on_hand`;
- movimientos sin referencia;
- orden completada sin movimiento de venta;
- despacho exitoso con orden incompleta.

## Preguntas

1. ¿Por qué reservar antes de pagar?
2. ¿Cuándo se descuenta físicamente el producto?
3. ¿Qué diferencia existe entre ajuste y venta?
4. ¿Cómo reconstruirías el inventario desde movimientos?

