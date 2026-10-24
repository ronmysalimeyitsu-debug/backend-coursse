# Evidencia de verificación

## Entorno

- Node.js 24.19.0 y npm 11.17.0.
- API Express local y PostgreSQL conectado mediante la configuración local no versionada.
- La URL de base y los secretos no se guardan en esta evidencia.

## Migraciones y seed

- `npm run db:migrate`: aplicó `001-initial-schema.sql`, `002-bind-refresh-tokens-to-membership.sql` y `003-platform-administrators.sql`.
- Repetición de `npm run db:migrate`: las tres aparecen como aplicadas.
- Repetición de `npm run db:seed`: completó correctamente.
- Ejecución de las tres migraciones en un esquema temporal vacío: 21 tablas creadas; el esquema temporal se eliminó al acabar.

## Pruebas automatizadas

- `npm test`: 7 pruebas, 7 aprobadas.
- `npm run test:integration`: aprobado; cubre membresías multitenant, cambio/reuso de refresh token, aislamiento de ubicación, enforcement RBAC, administración, competencia por la última unidad, inventario, outcomes de pago, despacho, reportes y auditoría.

## Compra y operación

- `validator/validate.mjs` en modo `purchase`: 11 de 11 comprobaciones aprobadas.
- Confirmación repetida del mismo job devuelve resultado duplicado sin volver a descontar inventario.

## CORS y pantallas

- Asset modular same-origin `/admin/platform.js`: HTTP 200.
- Asset solicitado desde origen externo no autorizado: HTTP 403.
- La página de administración de plataforma se sirvió desde `/admin/platform.html`.

## Alcance de la evidencia

Las pruebas no certifican producción, concurrencia bajo carga, hardware real, pago real, accesibilidad completa ni todos los escenarios de la matriz docente. No se incluye video ni reflexión personal.
