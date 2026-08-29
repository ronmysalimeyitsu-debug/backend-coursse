# Actividad Clase 03: Modelo del Recurso y Máquina de Estados

## Descripción
Esta actividad documenta el diseño conceptual, las reglas de negocio y las especificaciones técnicas para la API del recurso `Request` (Solicitud de Soporte).

## Contenido del Módulo
* `resource-model.md`: Definición del modelo de datos, campos requeridos, opcionales y autogenerados.
* `http-contract.md`: Contrato de endpoints HTTP (`GET`, `POST`, `PATCH`), códigos de estado y respuestas de error.
* `transition-map.md`: Definición de la máquina de estados, transiciones permitidas y estados terminales.
* `test-matrix.md`: Matriz de pruebas de endpoints y validaciones de errores HTTP.
* `ai-usage.md`: Bitácora de uso e interacción con herramientas de IA.
* `reflection.md`: Respuestas analíticas al ticket de salida de la clase 03.

## Objetivos Alcanzados
* Definición formal de la entidad `Request` con soporte para prioridades (`low`, `medium`, `high`).
* Restricción estricta de flujo entre estados (`open`, `in_progress`, `resolved`, `closed`, `cancelled`).
* Manejo de bloqueos sobre recursos en estados terminales (`closed`, `cancelled`).