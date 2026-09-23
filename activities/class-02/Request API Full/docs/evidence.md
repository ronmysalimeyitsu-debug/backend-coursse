# Evidencias de Funcionamiento — Request API Full

## Comprobaciones Mínimas Realizadas

1. **GET /requests** -> `200 OK` (retorna listado completo).
2. **GET /requests?status=open** -> `200 OK` (retorna elementos filtrados por estado abierto).
3. **GET /requests/999** -> `404 Not Found` (`{ "error": "Request not found" }`).
4. **POST /requests** con body `{}` -> `400 Bad Request` (`{ "error": "Title is required" }`).