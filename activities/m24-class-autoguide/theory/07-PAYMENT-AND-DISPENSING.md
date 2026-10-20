# 07 — Pago y despacho simulados

## Separar responsabilidades

Una orden expresa intención de compra.

Un pago representa autorización financiera.

Un trabajo de despacho representa acción del dispositivo.

No combinar los tres estados en un solo booleano.

## Pago simulado

La API puede aceptar un escenario controlado:

```json
{
  "method": "simulation",
  "scenario": "approve"
}
```

Escenarios:

- `approve`;
- `decline`;
- `timeout`;
- `duplicate`.

El backend siempre calcula monto usando precios persistidos.

## Despacho

Después de pago aprobado:

1. orden pasa a `paid`;
2. se crea `dispense_job`;
3. vending obtiene job mediante polling;
4. vending marca `processing`;
5. simula movimiento;
6. reporta `dispensed` o `failed`;
7. backend finaliza orden e inventario.

## Heartbeat

La máquina reporta periódicamente:

- timestamp;
- versión del simulador;
- estado;
- errores básicos.

Readiness del dispositivo puede determinarse por el último heartbeat.

## Fallos

Considerar:

- pago aprobado sin job;
- job creado y respuesta perdida;
- máquina offline;
- job tomado dos veces;
- confirmación duplicada;
- despacho parcial;
- orden expirada;
- simulador reiniciado.

## Polling

Para este proyecto polling es suficiente.

El endpoint debe evitar entregar simultáneamente el mismo job a varios workers. La asignación del job debe ser atómica.

## Preguntas

1. ¿Cuándo una orden se considera completada?
2. ¿Qué ocurre si la máquina falla después del pago?
3. ¿Por qué el dispositivo necesita identidad propia?
4. ¿Cómo impedirías procesar el mismo job dos veces?

