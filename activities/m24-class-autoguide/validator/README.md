# Validador común M24

Este validador realiza comprobaciones de caja negra contra la API. No reemplaza las pruebas internas ni demuestra por sí solo seguridad de producción.

## Requisitos

- Node.js 18 o superior;
- API ejecutándose;
- datos creados por el seed;
- un `publicCode` conocido;
- para el recorrido de compra, un `slotId` con al menos dos unidades disponibles.

## Configuración

1. Copia `validator.config.example.json` como `validator.config.json`.
2. Completa valores públicos de demostración.
3. No escribas contraseñas, JWT, service role keys ni connection strings.

## Ejecución

Desde la raíz del material:

```bash
node validator/validate.mjs validator/validator.config.json
```

Modo smoke:

- health;
- readiness;
- máquina pública;
- catálogo;
- recurso inexistente;
- orden inválida.

Modo purchase añade:

- creación de orden;
- retry con la misma idempotency key;
- conflicto al reutilizar la key con otro payload;
- pago aprobado;
- retry del pago.

## Resultado

El script muestra una tabla y crea:

```text
m24-validation-report.json
```

Código de salida:

- `0`: todas las comprobaciones ejecutadas pasaron;
- `1`: al menos una falló;
- `2`: configuración o ejecución inválida.

## Importante

El validador acepta respuestas exitosas directas o bajo una propiedad `data`. Los errores deben usar el envelope definido en la especificación.

Si el contrato del proyecto difiere intencionalmente, documenta la decisión y adapta una copia del validador. Conserva también la salida del validador original para mostrar la diferencia.

