# Mapa de Errores

| Código HTTP | Causa del Error | Mensaje JSON de Respuesta |
| :--- | :--- | :--- |
| `400 Bad Request` | Faltan campos obligatorios o el formato JSON es inválido. | `{"error": "El título de la solicitud es obligatorio"}` |
| `404 Not Found` | El ID proporcionado no existe en la base de datos. | `{"error": "Solicitud no encontrada"}` |
| `500 Internal Error` | Fallo en la conexión con la base de datos o error interno. | `{"error": "Error interno del servidor"}` |