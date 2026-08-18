# Actividad 01: Servidor HTTP Básico

Servidor web funcional desarrollado en Python utilizando únicamente módulos nativos (`http.server` y `json`).

## Rutas Implementadas
* `GET /`: Información general del servidor y rutas disponibles.
* `GET /health`: Comprobación del estado de salud del servicio.
* `GET /api/info`: Metadatos de la aplicación y versión actual.
* **Rutas Inexistentes**: Captura automática retornando código HTTP `404` y respuesta JSON informativa.

---

## Diagrama del Recorrido de una Petición

```text
[ Cliente / Navegador ]
         |
         | 1. Envía solicitud HTTP (ej. GET /api/info)
         v
[ Servidor TCP (127.0.0.1:8000) ]
         |
         | 2. Deriva la conexión al manejador
         v
[ RequestHandler (do_GET) ]
         |
         +---> Evaluador de Rutas:
         |       |-- ¿Coincide con /, /health, /api/info? --> HTTP 200 + JSON
         |       '-- ¿Ruta no mapeada?                   --> HTTP 404 + JSON
         |
         | 3. Método log_message() imprime registro en consola
         v
[ Respuesta HTTP devuelta al Cliente ]