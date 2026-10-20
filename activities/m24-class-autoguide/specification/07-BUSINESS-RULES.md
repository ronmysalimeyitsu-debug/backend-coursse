# 07 — Reglas del negocio

## Tenant

- tenant suspendido no permite operaciones administrativas mutables ni compras;
- historial y reportes permanecen consultables por plataforma autorizada;
- un tenant archivado no se reactiva mediante flujo normal;
- no eliminar físicamente datos operativos.

## Usuarios

- email identifica usuario global;
- membership determina acceso al tenant;
- permisos se calculan por roles activos;
- último tenant admin no puede eliminarse;
- usuario suspendido no obtiene nuevos tokens.

## Máquina

- QR utiliza `publicCode` aleatorio y no ID secuencial;
- solo máquina active y tenant active acepta órdenes;
- mantenimiento permite visualización administrativa, no compra;
- device key se muestra una sola vez al rotar;
- heartbeat no concede permisos administrativos.

## Productos y slots

- producto y máquina deben pertenecer al mismo tenant;
- un slot contiene como máximo un producto activo;
- capacidad y cantidades no pueden ser negativas;
- `reserved <= on_hand <= capacity`;
- precio efectivo es override del slot o precio de producto;
- precio se captura como snapshot en order item.

## Orden

- se calcula en servidor;
- contiene items de una sola máquina;
- solo utiliza stock disponible;
- crea reservas en la misma transacción;
- posee expiración;
- public token se almacena como hash;
- repetir creación con misma idempotency key devuelve el mismo resultado;
- modificar carrito después de crear orden no está permitido: crear otra orden.

## Pago

- monto viene de la orden;
- solo awaiting_payment acepta intento;
- pago aprobado cambia orden y crea job de forma consistente;
- pago rechazado no crea job;
- timeout deja resultado consultable y seguro para retry;
- no duplicar aprobación por reintento;
- refund simulado requiere autorización administrativa y auditoría.

## Despacho

- un job pertenece a una máquina;
- solo esa identidad de dispositivo lo obtiene;
- claim de job es atómico;
- confirmación duplicada no duplica movimientos;
- éxito consume reserva y completa orden;
- fallo registra causa y activa política de recuperación;
- retry está limitado y autorizado.

## Inventario

- restock y adjustment dejan movement;
- adjustment requiere reason;
- venta solo se registra al despacho;
- expiración libera reserved;
- operaciones concurrentes no producen negativo;
- reconciliación detecta inconsistencias.

## Reportes

- siempre tenant scoped;
- rangos utilizan timezone de ubicación o regla documentada;
- ventas usan órdenes completed;
- pagos aprobados no equivalen necesariamente a ventas completadas;
- resultados sin coincidencias devuelven `200` y colección vacía o ceros.

