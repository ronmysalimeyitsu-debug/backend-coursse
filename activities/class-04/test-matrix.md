# Test Matrix

| Método | Ruta | Cuerpo (Body) | Resultado Esperado | Estatus Real |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/requests` | Ninguno | `200 OK` | `200 OK` |
| POST | `/api/requests` | `{"title": "Prueba de solicitud"}` | `201 Created` | `201 Created` |