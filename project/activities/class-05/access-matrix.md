# Matriz de acceso — Request API v5

Dos roles exactos: `requester` y `agent`. Sin `admin`.

**Cómo llenar:** cada celda pendiente está marcada con tres guiones bajos.
Reemplaza cada marca por UNA de estas palabras, escrita tal cual:

`Sí` · `No` · `Propias` · `Propia` · `Propia y abierta`

No borres filas ni toques la columna Operación. Ejemplo de una fila resuelta:

| `GET /example` | No | Propia | Todas |

La matriz puede discutirse en la puesta en común, pero la implementación
converge en la baseline del taller (lámina "Contrato fijo" del bloque 02).

| Operación | Anónimo | Requester | Agent |
| --------- | ------- | --------- | ----- |
| `POST /auth/register` | Sí | Sí | Sí |
| `POST /auth/login` | Sí | Sí | Sí |
| `GET /auth/me` | No | Sí | Sí |
| `GET /requests` | No | Propias | Propia y abierta |
| `GET /requests/:id` | No | Propia | Propia y abierta |
| `GET /requests/:id/history` | No | Propia | Propia y abierta |
| `POST /requests` | No | Sí | Sí |
| Editar título/descripción | No | Propia | Propia y abierta |
| Cambiar prioridad | No | No | Propia y abierta |
| Cambiar estado | No | No | Propia y abierta |

## Campos controlados por el servidor

* **En el registro (`POST /auth/register`)**: Enviar campos como `id`, `role`, o `createdAt` produce `400 SERVER_CONTROLLED_FIELD`.
* **En creación de solicitudes (`POST /requests`)**: Enviar campos como `id`, `createdAt`, o forzar un `created_by` ajeno produce `400 SERVER_CONTROLLED_FIELD`.
* **En actualización de solicitudes**: Enviar campos inmutables o de control como `id`, `createdAt`, o `passwordHash` produce `400 SERVER_CONTROLLED_FIELD`.

## Solicitudes heredadas

* **¿Quién las ve?**: Únicamente los usuarios con rol `agent`.
* **¿Por qué?**: Porque el rol `agent` opera bajo el permiso **`Propia y abierta`**, lo que le otorga visibilidad sobre las solicitudes abiertas o sin propietario (`created_by IS NULL`), mientras que el rol `requester` está estrictamente limitado a visualizar únicamente sus propias solicitudes (**`Propias`** / **`Propia`**).