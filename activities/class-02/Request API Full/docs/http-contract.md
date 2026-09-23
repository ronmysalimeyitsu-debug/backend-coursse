# Contrato HTTP - Request API Full

## Endpoints

### 1. GET /requests
* **Descripción:** Retorna el listado completo de solicitudes o las filtra por estado.
* **Query Parameter:** `?status=open` o `?status=closed` (opcional).
* **Respuesta (`200 OK`):** Arreglo de objetos JSON.

### 2. GET /requests/:id
* **Descripción:** Retorna una solicitud específica por ID.
* **Path Parameter:** `id` (número).
* **Respuestas:**
  * `200 OK`: Retorna el objeto JSON si existe.
  * `404 Not Found`: `{ "error": "Request not found" }` si no existe.

### 3. POST /requests
* **Descripción:** Crea una nueva solicitud en el sistema.
* **Headers:** `Content-Type: application/json`
* **Body:** `{ "title": "...", "description": "..." }`
* **Respuestas:**
  * `201 Created`: Retorna la solicitud creada con su ID.
  * `400 Bad Request`: `{ "error": "Title is required" }` si falta el título.