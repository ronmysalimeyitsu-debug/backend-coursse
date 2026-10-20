# 06 — Transacciones, concurrencia e idempotencia

## Transacción

Agrupa operaciones que deben confirmarse o revertirse juntas.

Ejemplo de despacho exitoso:

```text
actualizar dispense_job
actualizar order
consumir reserva
reducir stock
crear movimiento
crear auditoría
```

Un fallo intermedio no debe dejar media operación aplicada.

## Concurrencia

Dos peticiones pueden leer el mismo estado antes de actualizarlo.

```text
Cliente A observa 1 unidad
Cliente B observa 1 unidad
A compra
B compra
```

La regla debe protegerse en la base de datos mediante:

- update condicional;
- lock cuando corresponda;
- transacción;
- restricción;
- control optimista.

Una transacción por sí sola no elimina toda condición de carrera.

## Idempotencia

Repetir una operación idempotente produce el mismo efecto final.

Casos M24:

- doble clic en pagar;
- respuesta perdida;
- retry del frontend;
- dispositivo repite confirmación;
- job reintentado.

Header:

```http
Idempotency-Key: 5e91...
```

La clave debe estar acotada por tenant y operación.

Registro aproximado:

```text
tenant_id
key
operation
request_hash
status
response_status
response_body
expires_at
```

La misma key con contenido diferente debe rechazarse.

## Deadlocks y reintentos

Transacciones concurrentes pueden bloquear recursos en distinto orden. Mantener transacciones cortas y orden consistente reduce riesgos.

Los errores transitorios pueden reintentarse, pero solamente cuando la operación posee semántica segura o idempotencia.

## Preguntas

1. ¿Qué parte del checkout requiere transacción?
2. ¿Qué ocurre si se repite `complete dispense`?
3. ¿Por qué idempotency key necesita `request_hash`?
4. ¿Cómo demostrarías que no existe overselling?

