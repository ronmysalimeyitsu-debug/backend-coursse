# 11 — Criterios de aceptación

## Setup

- [ ] README permite ejecutar el sistema.
- [ ] `.env.example` está completo y sin secretos.
- [ ] migraciones funcionan sobre una base vacía.
- [ ] seed crea dos tenants y datos demostrables.
- [ ] las tres aplicaciones arrancan.

## Multitenencia

- [ ] usuario puede pertenecer a más de un tenant.
- [ ] tenant activo se valida.
- [ ] listas están aisladas.
- [ ] consultas individuales están aisladas.
- [ ] reportes están aislados.
- [ ] dispositivos están aislados.
- [ ] datos públicos derivan tenant desde la máquina.

## Access control

- [ ] login seguro.
- [ ] roles agrupan permisos.
- [ ] backend exige permisos.
- [ ] UI refleja permisos sin reemplazar backend.
- [ ] cambios de acceso se auditan.

## Administration

- [ ] ubicaciones CRUD lógico.
- [ ] máquinas configurables.
- [ ] device key rotatable.
- [ ] productos configurables.
- [ ] slots configurables.
- [ ] restock y ajustes auditados.

## Purchase

- [ ] QR abre máquina correcta.
- [ ] catálogo muestra disponibilidad.
- [ ] orden calcula precios en servidor.
- [ ] stock se reserva atómicamente.
- [ ] reserva expira y libera stock.
- [ ] idempotencia evita duplicación.

## Payment

- [ ] approve funciona.
- [ ] decline funciona.
- [ ] timeout puede consultarse/reintentarse con seguridad.
- [ ] monto no se toma del cliente.
- [ ] aprobación crea job exactamente una vez.

## Dispensing

- [ ] device se autentica.
- [ ] solo consulta su job.
- [ ] job se reclama atómicamente.
- [ ] success completa orden e inventario.
- [ ] fail deja evidencia y permite política de retry.
- [ ] confirmación repetida no duplica movimientos.

## Reporting

- [ ] overview.
- [ ] consumption.
- [ ] sales.
- [ ] inventory.
- [ ] payments.
- [ ] dispensing.
- [ ] filtros y rango.
- [ ] seed produce totales verificables.

## Quality

- [ ] unit tests.
- [ ] integration tests.
- [ ] API tests.
- [ ] cross-tenant tests.
- [ ] concurrency test.
- [ ] end-to-end demo.
- [ ] errors consistentes.
- [ ] logs seguros.
- [ ] health/readiness.
- [ ] auditoría.
- [ ] validator final.

