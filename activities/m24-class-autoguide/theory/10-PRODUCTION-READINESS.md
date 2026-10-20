# 10 — Preparación para producción

## Qué significa “apto para producción” en este proyecto

No significa integración con hardware o bancos reales. Significa que el software, dentro de su alcance simulado, considera seguridad, consistencia, operación y recuperación.

## Checklist

### Contrato

- endpoints documentados;
- status codes consistentes;
- errores estructurados;
- versionado considerado;
- límites de payload.

### Datos

- migraciones repetibles;
- constraints;
- índices;
- timestamps;
- tenant isolation;
- backups;
- rollback plan.

### Seguridad

- hashing;
- JWT verificado;
- RBAC;
- device identity;
- rate limiting;
- secrets management;
- no sensitive logs.

### Consistencia

- transacciones;
- conditional updates;
- idempotencia;
- retries controlados;
- estados terminales;
- reconciliación.

### Operación

- configuración por ambiente;
- health/readiness;
- request IDs;
- logs estructurados;
- métricas;
- timeouts;
- manejo central de errores.

### Calidad

- lint;
- tests;
- coverage útil;
- documentación;
- runbook;
- seed de demo;
- validator.

## SLO académico

Definir expectativas simples:

- ninguna fuga conocida entre tenants;
- no overselling en pruebas concurrentes;
- una operación repetida no duplica pagos ni despachos;
- toda operación crítica deja auditoría;
- la API falla de forma predecible;
- el sistema puede levantarse desde README.

## Runbook

Debe explicar:

- cómo configurar;
- cómo migrar;
- cómo seedear;
- cómo ejecutar;
- cómo probar;
- cómo diagnosticar DB caída;
- cómo liberar reservas expiradas;
- cómo rotar device key;
- cómo suspender tenant o máquina.

## Preguntas

1. ¿Qué riesgo sigue existiendo aunque las pruebas pasen?
2. ¿Qué operación necesita reconciliación?
3. ¿Qué pasos permiten a otra persona ejecutar el proyecto?
4. ¿Qué evidencia sustenta la frase “production-ready dentro del alcance”?

