# Matriz de Consultas

| Endpoint | Método | Tabla Afectada | Operación SQL / Descripción |
| :--- | :--- | :--- | :--- |
| `/api/requests` | GET | `requests` | `SELECT * FROM requests;` (Obtiene la lista de solicitudes). |
| `/api/requests` | POST | `requests`, `request_status_history` | Inserta una nueva solicitud y registra su historial inicial. |
| `/api/requests/:id` | GET | `requests` | `SELECT * FROM requests WHERE id = $1;` (Busca una solicitud por ID). |