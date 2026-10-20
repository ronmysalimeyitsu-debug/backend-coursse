# 06 — Contrato API

Prefijo recomendado:

```text
/api/v1
```

## Convenciones

- JSON;
- fechas ISO 8601 UTC;
- dinero en unidades menores;
- IDs generados por servidor;
- paginación `limit` y `cursor` o estrategia consistente;
- filtros explícitos;
- error envelope común;
- `Idempotency-Key` en creación de orden, pago y confirmaciones críticas.

## Auth

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
GET  /auth/tenants
POST /auth/switch-tenant
```

## Platform

```http
GET   /platform/tenants
POST  /platform/tenants
GET   /platform/tenants/:id
PATCH /platform/tenants/:id
POST  /platform/tenants/:id/suspend
POST  /platform/tenants/:id/activate
```

## Memberships and roles

```http
GET    /members
POST   /members
PATCH  /members/:id
DELETE /members/:id
GET    /roles
POST   /roles
PATCH  /roles/:id
DELETE /roles/:id
GET    /permissions
PUT    /roles/:id/permissions
PUT    /members/:id/roles
```

## Locations

```http
GET   /locations
POST  /locations
GET   /locations/:id
PATCH /locations/:id
POST  /locations/:id/archive
```

## Machines

```http
GET   /machines
POST  /machines
GET   /machines/:id
PATCH /machines/:id
POST  /machines/:id/activate
POST  /machines/:id/maintenance
POST  /machines/:id/suspend
POST  /machines/:id/device-key/rotate
GET   /machines/:id/slots
PUT   /machines/:id/slots/:slotId
```

## Products and inventory

```http
GET   /products
POST  /products
GET   /products/:id
PATCH /products/:id
POST  /products/:id/archive

GET  /inventory
GET  /inventory/movements
POST /machines/:id/restocks
POST /machines/:id/inventory-adjustments
```

## Orders, payments and dispensing

```http
GET  /orders
GET  /orders/:id
POST /orders/:id/cancel
GET  /payments
GET  /payments/:id
GET  /dispense-jobs
POST /dispense-jobs/:id/retry
```

## Reports

```http
GET /reports/overview
GET /reports/consumption
GET /reports/sales
GET /reports/inventory
GET /reports/payments
GET /reports/dispensing
GET /reports/machines
```

Filtros:

```text
from
to
locationId
machineId
productId
status
```

Tenant proviene del contexto, nunca de un filtro libre.

## Audit

```http
GET /audit-events
GET /audit-events/:id
```

## Public buyer API

```http
GET  /public/machines/:publicCode
GET  /public/machines/:publicCode/catalog
POST /public/machines/:publicCode/orders
GET  /public/orders/:publicToken
POST /public/orders/:publicToken/payments/simulate
POST /public/orders/:publicToken/cancel
```

Crear orden:

```json
{
  "items": [
    { "slotId": "uuid", "quantity": 1 }
  ]
}
```

El backend obtiene producto, precio, tenant y máquina.

Pago simulado:

```json
{
  "outcome": "approved"
}
```

Valores admitidos para pruebas:

- `approved`;
- `declined`;
- `timeout`.

El cliente nunca envía el monto autorizado. El backend utiliza el total vigente de la orden. Creación de orden y simulación de pago requieren `Idempotency-Key`.

## Device API

```http
POST /devices/authenticate
POST /devices/heartbeat
GET  /devices/jobs/next
POST /devices/jobs/:id/processing
POST /devices/jobs/:id/complete
POST /devices/jobs/:id/fail
```

El dispositivo no envía libremente machineId o tenantId después de autenticarse.

## Operational

```http
GET /health
GET /ready
```

## Status codes

- `200` consulta o modificación exitosa;
- `201` creación;
- `202` operación aceptada para procesamiento;
- `204` acción exitosa sin body;
- `400` contrato inválido;
- `401` no autenticado;
- `403` autenticado sin permiso;
- `404` inexistente o invisible por aislamiento;
- `409` estado, stock o idempotencia incompatible;
- `422` opcional para datos semánticamente inválidos si se usa consistentemente;
- `429` límite;
- `500` inesperado;
- `503` dependencia no disponible/readiness.

