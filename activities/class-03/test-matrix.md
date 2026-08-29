# Matriz de Pruebas cURL - API v3

| Caso de Prueba | Método | Endpoint | Body / Query | Código Esperado |
| :--- | :--- | :--- | :--- | :--- |
| Crear solicitud | `POST` | `/requests` | `{"title": "Falla de red"}` | `201 Created` |
| Listar solicitudes | `GET` | `/requests` | N/A | `200 OK` |
| Cambiar a en progreso | `PATCH` | `/requests/1` | `{"status": "in_progress"}` | `200 OK` |
| Cancelar solicitud | `PATCH` | `/requests/1` | `{"status": "cancelled"}` | `200 OK` |
| Estado no permitido | `PATCH` | `/requests/1` | `{"status": "open"}` | `409 Conflict` |