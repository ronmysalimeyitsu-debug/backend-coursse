# 13 — Ruta de trabajo de una semana

Esta ruta no convierte los días en límites artificiales. Su propósito es evitar que el equipo construya tres interfaces desconectadas antes de comprobar las reglas críticas.

## Principio de avance

Trabaja en **verticales demostrables**:

```text
datos → regla → endpoint → interfaz mínima → prueba → evidencia
```

No avances solo por cantidad de pantallas. Una vertical termina cuando puede probarse y explicarse.

## Día 1 — Fundaciones y primera lectura pública

Objetivo:

- repositorio y aplicaciones ejecutables;
- variables documentadas;
- Supabase conectado;
- migraciones iniciales;
- dos tenants de demostración;
- ubicación, máquina, producto, slot y stock;
- catálogo público obtenido desde `publicCode`.

Evidencia mínima:

- migración sobre una base vacía;
- seed ejecutable;
- `GET /health`;
- catálogo público en navegador o cliente HTTP;
- primer test de aislamiento.

## Día 2 — Identidad, tenant context y permisos

Objetivo:

- login y sesión;
- memberships;
- tenant activo validado;
- roles y permisos;
- middleware o mecanismo equivalente;
- navegación del admin según permisos;
- enforcement real en backend.

Evidencia mínima:

- usuario con acceso a dos tenants;
- usuario sin permiso recibe `403`;
- recurso de otro tenant no se filtra ni se revela;
- cambios de permisos quedan auditados.

## Día 3 — Inventario, órdenes y concurrencia

Objetivo:

- restock y ajustes;
- ledger de movimientos;
- carrito y creación de orden;
- precio calculado por servidor;
- reserva atómica;
- expiración y liberación;
- idempotencia.

Evidencia mínima:

- dos compras concurrentes sobre la última unidad;
- una sola reserva exitosa;
- reintento con la misma key no duplica orden;
- inventario derivable desde movimientos.

## Día 4 — Pago y despacho simulados

Objetivo:

- pago aprobado, rechazado y timeout;
- creación única del dispense job;
- autenticación separada del dispositivo;
- polling o consulta de trabajo;
- claim atómico;
- success, fail y retry limitado;
- máquina y experiencia del comprador actualizadas.

Evidencia mínima:

- pago repetido no duplica job;
- dos simuladores no reclaman el mismo trabajo;
- confirmación repetida no descuenta dos veces;
- fallo conserva trazabilidad.

## Día 5 — Administración y reportes

Objetivo:

- operaciones administrativas completas;
- dashboard;
- filtros;
- reportes de ventas, consumo, inventario, pagos y despacho;
- conciliación entre orden, pago, job e inventario;
- auditoría navegable.

Evidencia mínima:

- totales comprobables contra el seed;
- filtros por fecha, ubicación, máquina y producto;
- reportes aislados por tenant;
- discrepancia intencional detectable.

## Día 6 — Endurecimiento

Objetivo:

- validación consistente;
- catálogo de errores;
- rate limiting razonado;
- logs estructurados y sanitizados;
- request IDs;
- health y readiness;
- índices y revisión de consultas;
- pruebas unitarias, integración, API y aislamiento;
- accesibilidad y estados de interfaz.

Evidencia mínima:

- errores no revelan SQL, stack ni secretos;
- caída de base afecta readiness;
- flujo principal tiene pruebas automatizadas;
- el validador común produce reporte.

## Día 7 — Recuperación, documentación y defensa

Objetivo:

- ejecutar todo desde instrucciones limpias;
- probar migraciones y seed desde cero;
- completar decisiones y uso de IA;
- grabar o preparar demostración;
- conservar limitaciones reales;
- etiquetar entrega.

Evidencia mínima:

- otra persona puede arrancar el sistema siguiendo README;
- demo de dos tenants;
- demo completa QR → compra → pago → despacho → reporte;
- reporte del validador;
- tag `m24-final-submission`.

## Regla de recuperación

Si una vertical se rompe, reduce presentación visual antes que eliminar invariantes. Prioriza, en este orden:

1. aislamiento de tenant;
2. integridad de inventario y dinero simulado;
3. autenticación y autorización;
4. idempotencia y concurrencia;
5. pruebas y trazabilidad;
6. experiencia funcional;
7. refinamiento visual.

## Checkpoint diario

Al terminar cada jornada registra:

- qué funciona;
- cómo lo comprobaste;
- qué no funciona;
- decisión principal;
- riesgo principal;
- siguiente vertical;
- ayuda recibida de IA;
- algo que aún no puedes explicar.

