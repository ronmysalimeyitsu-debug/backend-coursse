# 02 — Arquitectura del sistema

## Topología

```text
Admin web ─────────────┐
                      │
Buyer web ─────────────┼── REST API ─── PostgreSQL/Supabase
                      │       │
Machine simulator ────┘       ├── audit/logs
                              └── scheduled maintenance jobs
```

## Repositorio recomendado

```text
apps/
├── api/
├── admin-web/
└── vending-web/

database/
├── migrations/
└── seed/

docs/
scripts/
tests/
```

No es obligatorio usar monorepo tooling. La estructura debe ser ejecutable y comprensible.

## Backend modular

```text
src/
├── app.js
├── server.js
├── config/
├── db/
├── middleware/
├── shared/
└── modules/
    ├── auth/
    ├── tenants/
    ├── access-control/
    ├── users/
    ├── locations/
    ├── machines/
    ├── products/
    ├── inventory/
    ├── orders/
    ├── payments/
    ├── dispensing/
    ├── reports/
    └── audit/
```

## Responsabilidades

### Route/controller

- protocolo HTTP;
- params, query y body;
- llamada al caso de uso;
- status y response.

### Service/use case

- coordinación;
- reglas de aplicación;
- transacciones;
- estados;
- dependencias mediante funciones o interfaces claras.

### Policy

- permisos;
- ownership;
- reglas puras;
- sin Express ni SQL.

### Store/repository

- SQL parametrizado;
- mapeo de datos;
- tenant filter;
- uso del transaction client recibido.

No exigir un archivo por cada concepto si no añade claridad.

## Contextos de seguridad

### Admin context

```text
userId
activeTenantId
membershipId
permissions
requestId
```

### Device context

```text
deviceId
machineId
tenantId
devicePermissions
requestId
```

### Public context

No tiene tenant suministrado. Se deriva de `publicCode` u order public token.

## Integración entre apps

- Admin web consume API privada.
- Buyer web consume API pública.
- Simulator consume API de dispositivo.
- Ninguna web se conecta directamente a PostgreSQL.
- Supabase se utiliza como PostgreSQL administrado, no como bypass del backend.

## Trabajos internos

Puede utilizarse un script ejecutable o scheduler externo para:

- expirar reservas;
- marcar máquinas offline;
- reconciliar órdenes;
- limpiar idempotency records vencidos.

No es obligatorio implementar una cola externa.

