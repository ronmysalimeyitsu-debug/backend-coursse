# Plan de implementación M24

## Alcance

Implementación de la plataforma vending multitenant descrita en `../specification/01-PRODUCT-SCOPE.md`, con PostgreSQL, API Express, admin web, buyer web y simulador de máquina.

## Estructura

- `src/`: API, configuración, acceso a datos, seguridad y módulos de permisos.
- `database/migrations/`: esquema inicial y migraciones versionadas.
- `scripts/`: migración, seed e integración HTTP reproducible.
- `apps/admin-web/`: panel de tenant y administración de plataforma.
- `apps/vending-web/`: compra pública y simulador de dispositivo.
- `test/`: pruebas unitarias y de comportamiento HTTP sin base de datos.
- `validator/`: validador proporcionado por la actividad.

## Primera vertical

`tenant → location → machine → product → slot/stock → QR/publicCode → catálogo → order/reservation → payment → dispense job → inventory movement/report`.

## Decisiones de identidad y aislamiento

- La API obtiene el tenant de un JWT de usuario validado contra una membresía activa.
- El cambio de tenant emite un token para una membresía existente; no acepta un tenant ajeno.
- Las rutas de recursos y reportes filtran por el tenant del token.
- Los dispositivos se autentican separadamente con una clave cuya representación en la base es un hash.
- Las migraciones y conexiones de M24 usan el esquema PostgreSQL `m24_class_autoguide` para aislar la actividad de tablas preexistentes en `public`.

## Transacciones e idempotencia

- La reserva de inventario y creación de orden se realizan dentro de una transacción.
- El despacho descuenta stock y registra el movimiento junto con el resultado de la orden.
- El polling reclama trabajos con bloqueo de fila y `SKIP LOCKED`.
- Las claves de idempotencia protegen creación de orden y pago; las confirmaciones repetidas de despacho no vuelven a descontar stock.

## Verificación

- `npm test`: pruebas unitarias y operativas.
- `npm run test:integration`: multitenencia, operaciones administrativas, compra, despacho, reportes y auditoría contra un servidor y base sembrada.
- `validator/validate.mjs`: contrato común en modos `smoke` y `purchase`.
- La integración incluye dos compras concurrentes por la última unidad y exige una única reserva exitosa.
- Para una entrega final se recomienda ampliar la prueba a concurrencia sostenida y polling de varios dispositivos y recorrer toda la matriz de aceptación.

## Riesgos y trabajo restante

- Algunas acciones de edición y asignación de permisos no están expuestas en las pantallas.
- No hay prueba de estrés sostenido ni reconciliación periódica.
- Las integraciones de pago y despacho son simuladas.
- El registro de aprendizaje y la defensa técnica requieren respuestas propias del estudiante.
