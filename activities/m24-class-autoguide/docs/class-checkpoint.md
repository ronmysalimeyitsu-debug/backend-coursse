# Checkpoint M24

## Funciona y se verificó

- Migraciones versionadas aplicadas en el esquema M24; las mismas tres migraciones se ejecutaron en un esquema temporal vacío.
- Seed repetible con tenants Alpha y Beta, ubicación, máquina, producto, slot y stock.
- Health/readiness y API pública.
- Cambio de tenant y creación de membresía para un usuario existente.
- Revocación de refresh tokens anterior al cambiar tenant; reuse detection revoca la familia completa.
- Roles, ubicaciones, máquinas, productos, slots e inventario por API.
- Rol solo de reportes permitido para consultas y denegado al intentar abastecer stock.
- Compra con reserva, pago simulado, claim del dispositivo, despacho, actualización de stock y auditoría.
- Reportes con filtros de tenant, máquina, ubicación, producto, estado y rango temporal donde aplica.
- Pantalla de administración de plataforma para crear/listar/suspender/reactivar tenants.

## Evidencia ejecutada

- `npm test`: 7/7.
- `npm run test:integration`: pasó.
- La integración prueba dos compras simultáneas sobre una unidad disponible y confirma que una se rechaza.
- `npm run db:migrate` y `npm run db:seed` repetidos: pasaron.
- Migraciones en esquema temporal limpio: 3 migraciones, 21 tablas.
- Validador de compra: 11/11.

## Límites conocidos

- El panel web de tenant no incluye todas las operaciones de edición/asignación disponibles por API.
- No se probó carga sostenida ni múltiples dispositivos compitiendo bajo estrés.
- No hay reconciliación programada ni integración real de pagos/hardware.
- La reflexión de aprendizaje, la defensa y la grabación de demo requieren participación del estudiante.

## Siguiente paso

Completar los estados de interfaz que faltan, cubrir la matriz restante —en especial roles limitados—, completar evidencia personal, revisar cambios M24 en Git y publicar solo los archivos de la actividad.
