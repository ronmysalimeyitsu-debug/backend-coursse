# Decisiones de arquitectura

## Esquema PostgreSQL dedicado para M24

**Contexto:** la base de datos ya contenía tablas de otras actividades en `public`, incluyendo nombres que M24 necesita.

**Decisión:** ejecutar M24 bajo el esquema `m24_class_autoguide` y configurar el `search_path` del pool y los scripts de base de datos.

**Consecuencias:** las tablas preexistentes no se mezclan con las de M24. La instalación requiere un usuario con permisos para crear el esquema.

**Evidencia:** las tres migraciones aplicaron en la base M24 y también se ejecutaron en un esquema temporal vacío, con 21 tablas al final.

## Tenant derivado de credenciales verificadas

**Contexto:** aceptar un `tenantId` libre en operaciones permitiría acceso accidental o deliberado a datos de otra empresa.

**Decisión:** el middleware comprueba firma, tipo de token, usuario, tenant, membresía y estado. La selección de otro tenant solo se realiza mediante una membresía activa.

**Consecuencias:** todas las consultas de recursos deben conservar la condición de tenant; la API devuelve 404 para recursos ajenos cuando corresponde.

**Evidencia:** la prueba de integración crea dos tenants para el mismo usuario, cambia de contexto y confirma que el recurso del tenant B no es visible desde A.

## Identidad separada de máquina

**Contexto:** las máquinas no son usuarios humanos y tienen un ciclo operativo propio.

**Decisión:** autenticar el dispositivo mediante una clave aleatoria independiente; almacenar solo SHA-256 y emitir un JWT de dispositivo ligado a máquina y tenant.

**Consecuencias:** la clave original se entrega al crear la máquina o se configura localmente para el seed; no se vuelve a leer desde la base.

**Evidencia:** el flujo de integración autentica una máquina recién creada y confirma su job.

## Reserva y despacho transaccionales

**Contexto:** un comprador puede reintentar y dos compras pueden competir por las mismas unidades.

**Decisión:** calcular el precio desde el catálogo, reservar en transacción y proteger escrituras con bloqueos de fila; crear el job solo tras el pago aprobado.

**Consecuencias:** el buyer no determina el precio ni el tenant y el job no puede ser reclamado por otra máquina.

**Evidencia:** validador 11/11; prueba de integración de compra, pago, claim y confirmación repetida.

## Pago y hardware simulados

**Contexto:** M24 define una demostración educativa, no una integración financiera o física.

**Decisión:** modelar escenarios de pago y despacho como estados internos explícitos.

**Consecuencias:** la API puede demostrar la consistencia de estados, pero no autoriza cobros ni garantiza la entrega de un producto físico.

**Evidencia:** README, endpoints del buyer y simulator y escenario integrado aprobado.
