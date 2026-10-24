# M24 — Informe de implementación

## Estudiante

Pendiente de completar por el estudiante.

## Repositorio y commit

- Repositorio: `ronmysalimeyitsu-debug/backend-coursse`
- Ruta de actividad: `activities/m24-class-autoguide`
- Commit: pendiente de preparar y revisar con el usuario.

## Resumen del producto

Plataforma educativa multitenant para operar máquinas vending, con API Express/PostgreSQL, panel administrativo, buyer web, simulador de dispositivo y validador común.

## Arquitectura

La API y los scripts de datos utilizan el esquema aislado `m24_class_autoguide`. JWT de usuario/máquina/plataforma representan identidades separadas. Las rutas tenant verifican membresía y filtran recursos con el contexto autenticado. PostgreSQL almacena catálogo, inventario, órdenes, reservas, pagos simulados, trabajos de despacho, auditoría e idempotencia.

## Capacidades implementadas

- Migraciones versionadas, seed repetible y configuración `.env.example`.
- Dos tenants de demo con ubicación, máquina, catálogo y stock.
- Autenticación de tenant y plataforma, cambio de tenant y rotación de refresh tokens.
- Membresías y roles/permisos, incluida asignación de un usuario existente a otro tenant.
- Administración de tenants, ubicaciones, máquinas, credenciales, productos y slots.
- Restock, ajustes, ledger y auditoría.
- Catálogo y QR públicos, orden, reserva de stock, pago simulado, polling/claim de job y despacho.
- Reportes de ventas, consumo, inventario, pago, despacho y máquinas.
- Admin web, buyer web y simulador.
- Suite unitaria, smoke de integración y validador común.

## Decisiones importantes

Las decisiones y sus consecuencias se detallan en [architecture-decisions.md](./architecture-decisions.md).

## Seguridad y aislamiento

Las consultas usan parámetros; las rutas protegidas validan identidad, estado de tenant/membresía y permisos. Las credenciales no se versionan. Las claves de dispositivo se guardan como hashes. Se validó acceso cruzado denegado entre tenants en la prueba integrada.

## Consistencia y concurrencia

La reserva de inventario y la creación de órdenes se realizan transaccionalmente. La prueba de integración envía dos compras concurrentes para la última unidad y verifica una única creación exitosa. También verifica que un rol de solo lectura no pueda abastecer stock. La confirmación repetida de despacho no duplica movimientos. No se ejecutó una prueba de carga sostenida.

## Pruebas y verificación

- `npm test`: 7/7 pruebas aprobadas.
- `npm run test:integration`: aprobado, incluidos tenant switch/refresh, aislamiento, última unidad, resultados de pago, despacho, reportes y auditoría.
- `npm run db:migrate` y `npm run db:seed` repetidos: aprobados.
- Migraciones `001`–`003` en un esquema temporal vacío: 21 tablas.
- Validador `purchase`: 11/11.

Los detalles están en [evidence.md](./evidence.md) y en `m24-validation-report.json`.

## Uso de IA

El asistente de programación ayudó con análisis, implementación y pruebas. El registro está en [ai-usage.md](./ai-usage.md). El estudiante debe completar la reflexión de aprendizaje y preparar la defensa con sus propias palabras.

## Limitaciones conocidas

- Cobro y despacho son simulados; no hay banco ni hardware real.
- No hay reconciliación periódica ni prueba de carga sostenida.
- Algunas acciones de edición y asignación de permisos están disponibles por API, pero todavía no tienen un formulario específico.
- No se adjunta grabación de demostración ni reflexión personal.

## Próximas mejoras

Completar formularios restantes y cubrir con pruebas los roles limitados, todos los cambios de estado, expiración de reservas y polling de varios dispositivos. Completar la defensa y la evidencia personal.

## Instrucciones de demo

Seguir [README.md](../README.md), aplicar migraciones, ejecutar seed y arrancar el servidor. Presentar `/admin/`, `/admin/platform.html`, `/simulator` y el catálogo público del `publicCode` Alpha. No mostrar ni compartir `.env`.
