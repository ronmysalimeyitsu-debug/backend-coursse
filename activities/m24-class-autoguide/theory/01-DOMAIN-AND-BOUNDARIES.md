# 01 — Dominio y límites del sistema

## La idea

M24 es una plataforma SaaS que permite a diferentes empresas operar redes de máquinas vending. Cada empresa es un `tenant`.

El sistema no controla hardware real ni procesa dinero real. Coordina representaciones de esas operaciones mediante un simulador de pago y una vending web.

## Actores

- `platform_admin`: opera la plataforma M24.
- `tenant_admin`: configura una empresa operadora.
- `operator`: monitorea máquinas, órdenes y despachos.
- `inventory_manager`: administra productos, slots y existencias.
- `analyst`: consulta reportes.
- comprador: usuario público que escanea un QR.
- dispositivo: vending simulada que consulta trabajos y reporta resultados.

## Componentes

### Admin web

Interfaz privada para operación y reportes.

### Vending web

Contiene dos superficies:

- `/machine/:publicCode`: simulador visual de la máquina;
- `/buy/:publicCode`: experiencia móvil del comprador.

### Backend

Protege contratos, identidad, permisos, estados, consistencia y persistencia.

### PostgreSQL

Conserva estado, aplica restricciones y participa en el control de concurrencia.

## Límites

El backend no debe asumir que:

- el precio enviado por el frontend es correcto;
- el stock mostrado sigue disponible;
- el tenant enviado por el cliente es confiable;
- un pago repetido representa otra compra;
- un dispositivo pertenece a la máquina indicada;
- una respuesta perdida significa que la operación no ocurrió.

## Flujo central

```text
QR
→ catálogo
→ carrito
→ orden
→ reserva
→ pago
→ trabajo de despacho
→ confirmación de máquina
→ movimiento de inventario
→ orden completada
```

## Preguntas de estudio

1. ¿Qué componente decide el precio final?
2. ¿Por qué el comprador no debería enviar `tenantId`?
3. ¿Qué ocurre si el pago se aprueba y la máquina está fuera de línea?
4. ¿Cuál es la diferencia entre orden, pago y despacho?

