# 09 — Pruebas, observabilidad y operación

## Pirámide práctica

### Unitarias

Para:

- policies;
- transiciones;
- cálculo de totales;
- permisos;
- reglas puras.

### Integración

Para:

- stores;
- transacciones;
- restricciones;
- reservas;
- queries de reportes.

### API

Para:

- contratos;
- middleware;
- autenticación;
- errores;
- flujo completo.

### End to end

Para:

```text
admin configura
→ comprador compra
→ pago aprueba
→ vending despacha
→ reporte refleja
```

## Matriz mínima

Cada funcionalidad debe considerar:

- happy path;
- entrada inválida;
- sin autenticación;
- sin permiso;
- tenant incorrecto;
- recurso inexistente;
- estado incompatible;
- operación repetida;
- fallo de dependencia;
- concurrencia cuando aplique.

## Logs

Logs estructurados:

```json
{
  "level": "info",
  "event": "order.created",
  "requestId": "...",
  "tenantId": "...",
  "orderId": "..."
}
```

No incluir secretos ni cuerpos completos sensibles.

## Health y readiness

`/health` confirma que el proceso está activo.

`/ready` comprueba dependencias esenciales, al menos PostgreSQL.

## Métricas mínimas

- request count;
- latency;
- error rate;
- orders by state;
- payment declines;
- dispense failures;
- expired reservations;
- offline machines.

## Operaciones

- migraciones versionadas;
- seed controlado;
- backups de Supabase;
- variables por ambiente;
- shutdown ordenado;
- límites y timeouts;
- documentación para recuperación.

## Preguntas

1. ¿Qué prueba demuestra aislamiento multitenant?
2. ¿Cómo detectarías reservas atascadas?
3. ¿Qué diferencia existe entre log y métrica?
4. ¿Qué debe ocurrir si PostgreSQL no está disponible?

