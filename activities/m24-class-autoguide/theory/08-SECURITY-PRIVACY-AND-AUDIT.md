# 08 — Seguridad, privacidad y auditoría

## Principio

Todo dato externo es no confiable hasta validarse y autorizarse.

## Controles mínimos

### Validación

- tipos;
- formatos;
- rangos;
- enumeraciones;
- campos desconocidos;
- tamaño de payload.

### SQL

Utilizar queries parametrizadas. Nunca concatenar entrada en SQL.

### Secretos

- `.env` fuera del repositorio;
- `.env.example` sin valores reales;
- hashing de contraseñas y device keys;
- rotación;
- no incluir secretos en errores o logs.

### Autorización

Comprobar:

```text
identity
tenant membership
permission
resource tenant
business rule
```

### Rate limiting

Aplicar especialmente a:

- login;
- catálogo público;
- creación de orden;
- pago simulado;
- autenticación de dispositivos.

### CORS

Definir orígenes conocidos. CORS no reemplaza autenticación.

### Headers

Configurar headers seguros y evitar exponer información de implementación.

## Auditoría

Eventos recomendados:

- login exitoso/fallido;
- cambio de tenant;
- roles y permisos;
- máquina creada/suspendida;
- ajuste de inventario;
- pago;
- despacho;
- cambio de estado manual;
- rotación de credencial.

Una auditoría incluye:

- tenant;
- actor type/id;
- action;
- resource type/id;
- requestId;
- timestamp;
- metadata segura.

No registrar passwords, tokens ni información completa de pago.

## Preguntas

1. ¿Qué ataques permite confiar en `tenantId` del body?
2. ¿Qué eventos requieren auditoría?
3. ¿Qué datos deben omitirse de logs?
4. ¿Por qué `404` puede ser preferible para acceso cruzado?

