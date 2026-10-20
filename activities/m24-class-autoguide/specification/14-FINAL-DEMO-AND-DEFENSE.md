# 14 — Demostración y defensa final

## Propósito

La demostración no es un recorrido por pantallas. Debe probar que los componentes forman un sistema coherente y que su autor puede investigarlo, explicarlo y operarlo.

## Preparación

- utiliza datos de demostración, nunca secretos reales;
- ten disponibles dos tenants, dos usuarios y un dispositivo;
- ejecuta el validador antes de presentar;
- conserva logs visibles sin información sensible;
- prepara una ruta de recuperación si una dependencia falla;
- no ocultes limitaciones conocidas.

## Recorrido obligatorio

1. Explica la topología en menos de dos minutos.
2. Inicia sesión en el admin y muestra tenant activo.
3. Muestra que un rol autorizado puede abastecer inventario.
4. Muestra que un rol limitado no puede hacerlo.
5. Abre el simulador y enseña el QR de una máquina.
6. Abre el buyer web con ese QR.
7. Crea una orden y observa la reserva.
8. Simula un pago aprobado.
9. Deja que el dispositivo reclame y complete el despacho.
10. Comprueba orden, pago, job, inventario y auditoría.
11. Consulta el reporte correspondiente.
12. Intenta acceder al mismo dato desde otro tenant.
13. Repite una operación crítica con la misma idempotency key.
14. Explica una decisión y una limitación.

## Escenarios que el docente puede solicitar

- pago rechazado;
- máquina en mantenimiento;
- reserva expirada;
- último producto solicitado por dos compradores;
- dispositivo con credencial inválida;
- usuario sin permiso;
- mismo idempotency key con payload diferente;
- confirmación de despacho repetida;
- base de datos no disponible;
- recurso perteneciente a otro tenant.

## Preguntas de defensa

- ¿Dónde se establece el tenant context y por qué confías en esa fuente?
- ¿Qué evita que una consulta olvide filtrar por tenant?
- ¿Qué datos calcula el servidor y cuáles acepta del cliente?
- ¿Cuál es la frontera de la transacción al crear una orden?
- ¿Cómo impedirías vender dos veces la última unidad?
- ¿Qué sucede si el cliente no recibe la respuesta y reintenta?
- ¿Por qué usuario y dispositivo no comparten el mismo mecanismo de identidad?
- ¿Qué prueba demuestra el permiso y no solo la apariencia de la UI?
- ¿Cómo reconstruyes el movimiento de inventario?
- ¿Qué señal diferencia proceso vivo de servicio listo?
- ¿Qué decisión generó la IA que decidiste no aceptar?
- ¿Qué cambiarías antes de conectar pagos o hardware reales?

## Evidencia final

Entrega:

- URL o repositorio;
- tag final;
- README;
- reporte del validador;
- evidencia del flujo completo;
- matriz de pruebas completada;
- decisiones de arquitectura;
- registro de IA;
- limitaciones conocidas;
- reporte final.

## Honestidad técnica

Una defensa fuerte no afirma que todo está perfecto. Distingue:

- lo implementado y verificado;
- lo implementado parcialmente;
- lo simulado;
- lo diseñado pero no implementado;
- el riesgo aceptado;
- el siguiente paso razonable.

