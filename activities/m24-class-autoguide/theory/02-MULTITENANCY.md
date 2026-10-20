# 02 — Multitenencia y aislamiento

## Definición

Un sistema multitenant sirve a varias organizaciones utilizando una plataforma compartida. Cada tenant debe percibir sus datos y operaciones como privados.

## Estrategia de M24

M24 utiliza:

- una base de datos;
- un esquema compartido;
- `tenant_id` en datos operativos;
- validación del contexto en el backend.

No utiliza una base por tenant.

## Identidad y membresía

`users` representa identidad global.

`tenant_memberships` representa pertenencia a una organización.

Un usuario puede pertenecer a varias empresas con permisos diferentes.

```text
user
→ membership
→ tenant
→ roles
→ permissions
```

## Tenant activo

El usuario selecciona una organización válida. El backend verifica la membresía y establece `activeTenantId` en el contexto autenticado.

No confiar en:

```json
{ "tenantId": "tenant-b" }
```

enviado libremente por el frontend.

## Consultas seguras

Incorrecto:

```sql
SELECT * FROM orders WHERE id = $1;
```

Correcto:

```sql
SELECT *
FROM orders
WHERE tenant_id = $1
  AND id = $2;
```

## Propagación

El contexto debe atravesar service y store de manera explícita:

```javascript
findOrderById({ tenantId, orderId })
```

## Datos públicos

El comprador utiliza `publicCode`. El backend resuelve máquina y tenant. La orden hereda el tenant de la máquina.

## Defensa en profundidad

Además del filtro en código:

- foreign keys compuestas cuando aporten seguridad;
- índices con `tenant_id`;
- restricciones únicas por tenant;
- pruebas cruzadas;
- auditoría;
- PostgreSQL RLS como mejora opcional.

## Fallos frecuentes

- filtrar listas, pero olvidar endpoints individuales;
- validar tenant en route y perderlo en consultas internas;
- aceptar `tenantId` desde body;
- reportes sin filtro;
- caches compartidos con keys incompletas;
- claves de idempotencia globales o sin tenant;
- jobs de dispositivo sin tenant.

## Preguntas

1. ¿Por qué un `tenant_admin` no es `platform_admin`?
2. ¿Qué debería devolver una consulta cruzada: `403` o `404`?
3. ¿Qué pruebas demuestran aislamiento?
4. ¿Qué índices necesitan comenzar por `tenant_id`?

