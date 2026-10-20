# 04 — Matriz de permisos

## Catálogo

```text
tenants.read
tenants.manage
members.read
members.manage
roles.read
roles.manage
locations.read
locations.manage
machines.read
machines.manage
machines.credentials.rotate
products.read
products.manage
inventory.read
inventory.restock
inventory.adjust
orders.read
orders.manage
payments.read
dispensing.read
dispensing.retry
reports.read
audit.read
settings.manage
```

## Roles sugeridos

| Permission | Platform admin | Tenant admin | Operator | Inventory manager | Analyst |
|---|:---:|:---:|:---:|:---:|:---:|
| tenants.manage | ✓ | — | — | — | — |
| members.manage | — | ✓ | — | — | — |
| roles.manage | — | ✓ | — | — | — |
| locations.manage | — | ✓ | — | — | — |
| machines.manage | — | ✓ | ✓ | — | — |
| machines.credentials.rotate | — | ✓ | ✓ | — | — |
| products.manage | — | ✓ | — | ✓ | — |
| inventory.read | — | ✓ | ✓ | ✓ | ✓ |
| inventory.restock | — | ✓ | ✓ | ✓ | — |
| inventory.adjust | — | ✓ | — | ✓ | — |
| orders.read | — | ✓ | ✓ | — | ✓ |
| orders.manage | — | ✓ | ✓ | — | — |
| payments.read | — | ✓ | ✓ | — | ✓ |
| dispensing.retry | — | ✓ | ✓ | — | — |
| reports.read | — | ✓ | ✓ | ✓ | ✓ |
| audit.read | — | ✓ | — | — | ✓ |
| settings.manage | — | ✓ | — | — | — |

Los roles son defaults. El tenant puede crear roles personalizados.

## Reglas

- `platform_admin` no hereda automáticamente acceso a operación de tenants.
- un rol de un tenant no puede asignarse a membership de otro;
- nadie puede quitar el último `tenant_admin` activo sin reemplazo;
- cambios de roles y permisos dejan auditoría;
- el frontend usa permisos para UX;
- el backend aplica permisos realmente;
- operaciones públicas y de dispositivo utilizan contextos separados.

## Acceso de dispositivo

Permisos internos:

```text
device.heartbeat
device.jobs.read
device.jobs.update
```

Siempre limitados a su propia máquina.

