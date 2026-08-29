# Ticket de Salida - Reflexión Clase 03

1. **¿Por qué una representación JSON no es el recurso?**  
   El recurso es la entidad conceptual del dominio (`Request`); el JSON es solo el formato para transferir su estado en HTTP.

2. **¿Qué diferencia existe entre PUT y PATCH?**  
   `PUT` reemplaza todo el recurso; `PATCH` aplica modificaciones parciales.

3. **¿Qué significa que una operación sea idempotente?**  
   Que ejecutar la petición múltiples veces produce el mismo resultado que ejecutarla una sola vez.

4. **¿Por qué HTTP stateless no impide guardar datos en backend?**  
   Porque *stateless* aplica a la sesión de red entre peticiones, mientras que los datos se persisten en la memoria o base de datos del servidor.

5. **¿Por qué pasar de open a closed devuelve 409?**  
   Porque viola el flujo obligatorio del negocio (requiere pasar primero por `in_progress` y `resolved`).

6. **¿Por qué se cancela en lugar de eliminar?**  
   Para preservar la trazabilidad, auditoría e integridad de la información.

7. **¿Responsabilidad de cada archivo del módulo?**  
   * `request-status.js`: Reglas de transición de estados.
   * `requests.store.js`: Almacenamiento y operaciones CRUD en memoria.
   * `requests.routes.js`: Endpoints y manejo de peticiones/respuestas HTTP.

8. **¿Limitación del proyecto?**  
   Almacenamiento volátil en memoria que se borra al reiniciar el servidor.