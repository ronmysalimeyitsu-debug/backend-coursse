# 05 — Estados y transiciones

## Tenant

```text
active → suspended → active
active → archived
suspended → archived
```

`archived` es terminal.

## Machine

```text
active ↔ maintenance
active → offline
maintenance → offline
offline → active
any nonterminal → suspended
```

Heartbeat puede cambiar estado operativo derivado, pero no debe reactivar una máquina suspendida administrativamente.

## Order

```text
pending → awaiting_payment
awaiting_payment → paid
awaiting_payment → cancelled
awaiting_payment → expired
paid → dispensing
paid → failed
dispensing → completed
dispensing → failed
failed → cancelled
```

`completed`, `cancelled` y `expired` son terminales para el flujo normal.

## Payment

```text
pending → approved
pending → declined
approved → refunded
```

No permitir `declined → approved` sobre el mismo intento. Crear otro intento.

## Reservation

```text
active → consumed
active → released
active → expired
```

## Dispense job

```text
queued → processing
queued → cancelled
processing → dispensed
processing → failed
failed → queued  (retry autorizado y limitado)
```

## Invariantes

- orden `paid` posee pago aprobado por el total;
- orden `dispensing` posee job;
- orden `completed` posee job `dispensed`;
- reserva `consumed` corresponde a despacho confirmado;
- estados terminales no cambian mediante endpoints normales;
- cada transición crítica registra auditoría;
- retries no crean trabajos paralelos para la misma orden.

