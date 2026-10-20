# 04 — Máquinas de estado

## Por qué utilizar estados explícitos

Una orden no es simplemente “activa” o “lista”. Pasa por situaciones con reglas distintas.

Una máquina de estados define:

- estados posibles;
- transiciones permitidas;
- quién puede ejecutarlas;
- precondiciones;
- efectos;
- estados terminales.

## Machine

```text
active
maintenance
offline
suspended
```

Solo `active` acepta órdenes nuevas.

## Order

```text
pending
awaiting_payment
paid
dispensing
completed
failed
cancelled
expired
```

Flujo principal:

```text
pending
→ awaiting_payment
→ paid
→ dispensing
→ completed
```

## Payment

```text
pending
approved
declined
refunded
```

## Inventory reservation

```text
active
consumed
released
expired
```

## Dispense job

```text
queued
processing
dispensed
failed
cancelled
```

## Reglas importantes

- pago aprobado no equivale a producto despachado;
- `completed` requiere despacho confirmado;
- un pago rechazado libera la reserva;
- una reserva expirada no puede consumirse;
- una máquina suspendida no debe consultar nuevos trabajos;
- una transición repetida debe ser idempotente o producir conflicto controlado;
- toda transición importante debe dejar auditoría.

## Implementación

Centralizar transiciones evita `if` distintos en múltiples rutas.

```javascript
canTransition({ from, to })
```

La base de datos puede añadir `CHECK` para valores permitidos, mientras la aplicación protege las transiciones.

## Preguntas

1. ¿Qué sucede si el pago se aprueba dos veces?
2. ¿Puede una orden `completed` volver a `dispensing`?
3. ¿Quién libera una reserva cuando expira?
4. ¿Qué estado representa un producto cobrado que no pudo entregarse?

