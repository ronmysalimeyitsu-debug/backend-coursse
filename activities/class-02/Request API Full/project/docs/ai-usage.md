# Protocolo de Uso de IA con Conciencia Humana (ai-usage.md)

## 1. Criterio de Control
* La IA fue utilizada como un asistente de velocidad, no como el tomador de decisiones del proyecto.
* Se redactó la especificación (`spec.txt`) antes de realizar cualquier solicitud a la IA.

## 2. Auditoría del Código Generado
* **Cumplimiento del alcance:** Se verificó que únicamente se generaran los 3 endpoints solicitados.
* **Exclusiones aplicadas:** Se rechazaron intentos automáticos de incluir TypeScript, base de datos o arquitecturas complejas (controllers/services).
* **Verificación de dependencias:** Se mantuvo el proyecto liviano, utilizando únicamente `express` como dependencia de ejecución.

## 3. Conclusión
El 100% de la arquitectura, la organización de archivos y la validación de respuestas responden al contrato definido por la especificación.