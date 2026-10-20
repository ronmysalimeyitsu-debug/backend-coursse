# 08 — Catálogo de errores

Formato:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "The requested quantity is not available.",
    "requestId": "uuid",
    "details": []
  }
}
```

No exponer SQL, stack traces, secrets ni existencia de recursos de otro tenant.

| Code | HTTP | Uso |
|---|---:|---|
| VALIDATION_ERROR | 400 | Entrada inválida |
| INVALID_CREDENTIALS | 401 | Login inválido |
| TOKEN_EXPIRED | 401 | Access token vencido |
| AUTHENTICATION_REQUIRED | 401 | Sin identidad |
| PERMISSION_DENIED | 403 | Sin permiso dentro del contexto visible |
| RESOURCE_NOT_FOUND | 404 | Inexistente o invisible |
| TENANT_NOT_ACTIVE | 409 | Tenant suspendido/archivado |
| MACHINE_NOT_ACTIVE | 409 | Máquina no acepta compra |
| INVALID_STATUS_TRANSITION | 409 | Cambio de estado inválido |
| INSUFFICIENT_STOCK | 409 | Stock no disponible |
| RESERVATION_EXPIRED | 409 | Reserva vencida |
| ORDER_NOT_PAYABLE | 409 | Orden no acepta pago |
| PAYMENT_ALREADY_PROCESSED | 409 | Intento repetido incompatible |
| IDEMPOTENCY_CONFLICT | 409 | Key usada con request diferente |
| DISPENSE_JOB_NOT_AVAILABLE | 409 | Job no reclamable |
| DEVICE_NOT_AUTHORIZED | 403 | Dispositivo inválido para operación |
| RATE_LIMITED | 429 | Límite excedido |
| DATABASE_UNAVAILABLE | 503 | Readiness falla |
| INTERNAL_ERROR | 500 | Error inesperado |

## Reglas

- código estable para consumidores;
- mensaje legible y no sensible;
- requestId siempre que exista;
- details solo para validación segura;
- logs internos conservan causa y stack cuando corresponda;
- status se decide en una capa consistente.

