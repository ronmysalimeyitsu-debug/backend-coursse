# Registro de Uso de Inteligencia Artificial (ai-usage.md)

## 1. Consultas Realizadas
* Se consultó a la IA para analizar la arquitectura HTTP, diferenciar la responsabilidad entre Express y el protocolo nativo, y evaluar la semántica de las respuestas del servidor.
* Se solicitaron aclaraciones sobre códigos de estado HTTP (`200`, `201`, `400`, `404`) y sobre cómo documentar adecuadamente el comportamiento detectado.

## 2. Sugerencias Aceptadas
* Adición del middleware `express.json()` para el procesamiento automático del cuerpo de las peticiones.
* Implementación de validaciones explícitas antes de retornar estados de error (`400 Bad Request` y `404 Not Found`).
* Formato estandarizado de respuestas de error JSON (`{ "error": "Mensaje" }`).

## 3. Sugerencias Descartadas
* Se descartó la sugerencia inicial de agregar dependencias externas como librerías de validación de esquemas (ej. Zod o Joi) o bases de datos externas para mantener el proyecto liviano.

## 4. Reflexión y Criterio Técnico
La IA sirvió como herramienta de soporte para agilizar la redacción de la documentación y validar la semántica de los códigos de estado HTTP, manteniendo siempre el control y criterio humano sobre las decisiones de diseño del proyecto.