# 01 — Alcance del producto

## Visión

M24 es una plataforma SaaS multitenant para administrar redes de máquinas vending y simular el ciclo completo de compra y despacho.

## Componentes obligatorios

### Admin web

- autenticación;
- selección de tenant;
- dashboard;
- gestión de tenants para platform admin;
- usuarios y membresías;
- roles y permisos;
- ubicaciones;
- máquinas;
- credenciales de dispositivos;
- productos;
- slots;
- abastecimiento y ajustes;
- órdenes;
- pagos;
- trabajos de despacho;
- auditoría;
- reportes;
- configuración operativa.

### Vending web

#### Machine simulator

- identificación de máquina;
- QR visible;
- slots y stock;
- estado online/offline/maintenance;
- heartbeat;
- polling de trabajos;
- animación de despacho;
- éxito y fallo configurables;
- historial local de eventos.

#### Buyer web

- catálogo público por QR;
- stock disponible;
- carrito;
- creación de orden;
- temporizador de reserva;
- pago simulado;
- seguimiento de orden;
- estado de despacho;
- recibo de operación.

### Backend

- REST API;
- autenticación de usuarios;
- autenticación de dispositivos;
- tenant context;
- RBAC;
- contratos y validación;
- máquina de estados;
- inventario y reservas;
- pago simulado;
- despacho;
- idempotencia;
- jobs de expiración y reconciliación;
- auditoría;
- reportes;
- manejo de errores;
- logs;
- health/readiness;
- documentación OpenAPI o equivalente.

### PostgreSQL/Supabase

- migraciones versionadas;
- seed idempotente o controlado;
- constraints;
- índices;
- foreign keys;
- transacciones;
- aislamiento multitenant;
- datos para demostración.

## Funciones de plataforma

- crear tenant;
- activar, suspender y archivar tenant;
- crear primer tenant admin;
- consultar salud agregada sin exponer datos internos;
- revisar métricas globales autorizadas;
- suspender operaciones públicas de un tenant.

## Funciones del tenant

- configurar identidad básica;
- invitar o crear usuarios;
- asignar roles;
- crear roles personalizados;
- administrar ubicaciones;
- administrar máquinas;
- rotar credencial de dispositivo;
- administrar productos;
- configurar slots;
- abastecer inventario;
- hacer ajustes auditados;
- consultar operaciones;
- cambiar estados permitidos;
- consultar reportes.

## Fuera de alcance

- banco real;
- tarjeta real;
- hardware real;
- devolución bancaria real;
- factura fiscal;
- logística de reposición;
- app nativa;
- comunicación SMS o email obligatoria;
- multimoneda avanzada;
- suscripción comercial del SaaS;
- custom domains;
- white labeling completo.

## Calidad esperada

El sistema debe:

- arrancar siguiendo README;
- impedir acceso cruzado entre tenants;
- preservar inventario bajo concurrencia;
- tolerar reintentos;
- producir errores predecibles;
- registrar eventos críticos;
- ofrecer pruebas automatizadas;
- poder demostrar el flujo completo.

