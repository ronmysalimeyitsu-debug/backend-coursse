# 09 — Reportes y reconciliación

## Dashboard

- máquinas activas/offline/maintenance;
- ventas completadas;
- órdenes por estado;
- pagos aprobados/declinados;
- trabajos fallidos;
- productos con bajo stock;
- reservas expiradas.

## Consumo

Dimensiones:

- periodo;
- ubicación;
- máquina;
- producto;
- slot.

Métricas:

- unidades despachadas;
- ingreso simulado;
- orden promedio;
- participación por producto.

## Inventario

- on_hand;
- reserved;
- available;
- capacidad;
- nivel porcentual;
- stock bajo;
- movimientos por tipo;
- ajustes manuales.

## Pagos

- intentos;
- aprobados;
- rechazados;
- timeouts;
- refunds simulados;
- aprobación sin despacho.

## Despacho

- queued;
- processing;
- dispensed;
- failed;
- tiempo medio;
- retries;
- fallos por máquina.

## Reconciliación

Crear una consulta o script que detecte:

- orden paid sin job;
- orden completed sin job dispensed;
- job dispensed sin movimiento;
- reserva active vencida;
- reserved mayor que on_hand;
- pago approved con monto distinto;
- movimiento cruzado de tenant;
- máquina sin heartbeat dentro del umbral.

La reconciliación reporta. No debe corregir silenciosamente sin una política explícita.

## Exportación

CSV es opcional. Si se implementa debe:

- respetar tenant;
- respetar filtros;
- evitar fórmulas peligrosas en celdas;
- controlar tamaño.

