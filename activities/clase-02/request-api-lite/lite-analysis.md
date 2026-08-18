# Análisis de API Lite y Propuesta de Contrato

## Tabla de Análisis de Endpoints

| ENDPOINT | INTENCIÓN | ENTRADA | RESPUESTA ACTUAL | PROBLEMA DETECTADO | PROPUESTA DE CONTRATO |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET /requests** | Listar todas las solicitudes | Ninguna | 200 OK con el listado de elementos | Ninguno. Muestra el listado correctamente | Mantener `200 OK` retornando el arreglo completo |
| **GET /requests/:id** | Obtener una solicitud por ID | `req.params.id` | 200 OK aun si el ID no existe | No notifica cuando el ID no existe (`undefined`) | Retornar `404 Not Found` si el recurso no existe |
| **POST /requests** | Crear una nueva solicitud | `req.body` | 201 Created (incluso con body vacío `{}`) | No valida que existan los datos obligatorios | Exigir campo `title` y retornar `400 Bad Request` si falta |
| **DELETE /requests/:id** | Eliminar una solicitud por ID | `req.params.id` | 200 OK sin verificar existencia | Intenta eliminar sin validar si el registro existe | Verificar existencia; retornar `404` si no existe o `200` al eliminar |

## Contrato Propuesto

1. **Semántica de Errores:** Toda búsqueda o eliminación de un recurso inexistente debe responder con estado HTTP `404 Not Found`.
2. **Validación de Datos:** Peticiones de creación (`POST`) sin el campo requerido `title` deben rechazarse inmediatamente con estado `400 Bad Request`.
3. **Consistencia en Respuestas:** Mantener código `200 OK` para lecturas y eliminaciones exitosas, y `201 Created` para creaciones correctas.