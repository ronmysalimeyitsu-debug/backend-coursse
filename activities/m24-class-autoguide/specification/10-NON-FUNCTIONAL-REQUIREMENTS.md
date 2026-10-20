# 10 — Requisitos no funcionales

## Seguridad

- passwords y device keys hasheadas;
- JWT firmado y expirado;
- refresh rotation si se implementa;
- consultas parametrizadas;
- validación de entrada;
- CORS configurado;
- headers seguros;
- rate limiting;
- logs sin secretos;
- permisos en backend;
- pruebas cross-tenant.

## Confiabilidad

- transacciones en operaciones acopladas;
- idempotencia;
- timeouts;
- retries controlados;
- estados explícitos;
- reconciliación;
- shutdown ordenado;
- errores consistentes.

## Rendimiento

- índices documentados;
- paginación;
- evitar N+1 evidente;
- reportes con filtros;
- payloads limitados;
- catálogo público cacheable sin comprometer stock final.

No fijar números irreales. Medir localmente y documentar.

## Mantenibilidad

- módulos cohesionados;
- routes sin SQL;
- services sin Express;
- reglas comprobables;
- nombres consistentes;
- documentación de decisiones;
- dependencias justificadas.

## Observabilidad

- requestId;
- logs JSON;
- eventos importantes;
- health;
- readiness;
- métricas mínimas;
- auditoría.

## Accesibilidad y UX

- admin usable con teclado;
- contraste suficiente;
- feedback de carga/error;
- buyer mobile-first;
- estado de compra comprensible;
- no depender solamente del color;
- simulator visible en pantalla desktop.

## Configuración

- `.env.example`;
- validación al iniciar;
- valores por ambiente;
- no secretos en frontend;
- URLs configurables;
- timezone explícita.

## Documentación operativa

- instalación;
- migraciones;
- seed;
- ejecución;
- pruebas;
- cuentas demo;
- recuperación;
- limitaciones.

