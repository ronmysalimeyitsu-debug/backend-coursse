# 03 — Autenticación, RBAC y dispositivos

## Autenticación y autorización

Autenticación responde:

> ¿Quién eres?

Autorización responde:

> ¿Puedes realizar esta acción dentro de este tenant?

## Usuarios administrativos

Las contraseñas se almacenan utilizando hashing resistente, nunca texto plano.

El access token debe ser corto y estar firmado. Decodificar no equivale a verificar.

Claims mínimos:

```json
{
  "sub": "user-id",
  "activeTenantId": "tenant-id",
  "permissions": ["inventory.adjust"],
  "iat": 0,
  "exp": 0
}
```

El backend debe verificar firma, expiración y contexto.

## RBAC

Los permisos forman un catálogo global:

```text
machines.read
machines.manage
inventory.read
inventory.adjust
orders.read
payments.read
reports.read
users.manage
roles.manage
```

Los roles pertenecen al tenant y agrupan permisos.

El código protege permisos:

```javascript
requirePermission("inventory.adjust")
```

Evitar controles repetidos como:

```javascript
if (user.role === "admin")
```

en cada handler.

## Platform admin

`platform_admin` administra tenants y salud global. No debe confundirse con los roles internos de una empresa.

## Identidad de dispositivo

La vending no inicia sesión como humano.

Cada máquina tiene una credencial de dispositivo almacenada como hash. El dispositivo obtiene un token con:

```text
machineId
tenantId
device permissions
expiration
```

El dispositivo solo puede:

- enviar heartbeat propio;
- consultar sus trabajos;
- cambiar el estado de sus trabajos;
- reportar despacho.

## Seguridad mínima

- rate limiting en login;
- mensajes que no revelan contraseñas o tokens;
- revocación o rotación de device keys;
- separación de JWT secrets si se justifica;
- auditoría de cambios de permisos;
- no guardar tokens en logs.

## Preguntas

1. ¿Qué cambia al seleccionar otro tenant?
2. ¿Por qué ocultar botones no protege un endpoint?
3. ¿Qué permisos necesita una vending?
4. ¿Cómo se invalida una credencial comprometida?

