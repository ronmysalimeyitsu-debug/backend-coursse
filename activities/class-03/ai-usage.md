# Registro de Uso de IA (AI Usage Log)

## My design before using AI
Diseñé el contrato de la API, el modelo de datos en memoria, los campos obligatorios/opcionales y el diagrama de estados iniciales.

## What I asked the AI
Solicité asistencia para organizar el proyecto modularmente en Express (`store`, `routes`, `status`) y estructurar los archivos de documentación.

## What the AI proposed
Propuso desacoplar la máquina de estados en un archivo auxiliar y estandarizar la estructura de errores HTTP.

## What I accepted
Acepté la arquitectura modular por capas dentro de `src/modules/requests/`.

## What I rejected or changed
Rechacé implementar librerías de validación complejas o persistencia en base de datos para mantener los requisitos simples del ejercicio.

## How I verified the result
Ejecuté peticiones HTTP locales comprobando las respuestas 200, 201, 400, 404 y 409.