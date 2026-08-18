# Comparación: Versión Recibida vs. Versión Corregida

## 1. Validación en `POST /requests`
* **Versión Recibida:** Permitía crear solicitudes enviando un cuerpo JSON vacío o sin la propiedad `title`.
* **Versión Corregida:** Se añadió una validación `if (!requestData.title)` que retorna inmediatamente una respuesta con código `400 Bad Request`.
* **Justificación:** Previene la persistencia de datos corruptos o incompletos en el servidor.

## 2. Manejo de Recursos Inexistentes en `GET /requests/:id`
* **Versión Recibida:** Al buscar un ID inexistente, finalizaba devolviendo un estado `200 OK` con un valor indefinido o vacío.
* **Versión Corregida:** Se implementó una verificación con `if (!found)` que retorna un estado `404 Not Found` con la respuesta `{ "error": "Request not found" }`.
* **Justificación:** Respeta la semántica de HTTP al notificar explícitamente al cliente que el recurso solicitado no existe.

## 3. Manejo de Errores en `DELETE /requests/:id`
* **Versión Recibida:** Eliminaba sobre el arreglo mediante filtrado o índice sin comprobar si la solicitud existía previamente.
* **Versión Corregida:** Se verifica la existencia del ID antes de proceder con el borrado. Si no existe, retorna `404 Not Found`.
* **Justificación:** Evita operaciones silenciosas y proporciona retroalimentación clara sobre el estado del servidor.