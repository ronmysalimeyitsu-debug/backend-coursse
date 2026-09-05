# Módulo Entrega 04 - Backend

Implementación de la API REST conectada a PostgreSQL (Supabase) con soporte para gestión de solicitudes y auditoría de estados.

## Contenido de la Entrega
- **Modelo de datos (`data-model.md`)**: Definición de las tablas `requests` y `request_status_history`.
- **Mapa de errores (`error-map.md`)**: Códigos HTTP y respuestas estructuradas en JSON.
- **Matriz de consultas (`query-matrix.md`)**: Operaciones SQL utilizadas en los endpoints.
- **Matriz de pruebas (`test-matrix.md`)**: Validación de rutas mediante Postman.
- **Plan de transacción (`transaction-plan.md`)**: Manejo atómico de actualizaciones de estado.
- **Mapa de transiciones (`transition-map.md`)**: Ciclo de vida de los estados de las solicitudes.
- **Contrato de persistencia (`persistence-contract.md`)**: Conexión al pool de PostgreSQL.
- **Bitácora y Reflexión (`ai-usage.md`, `reflection.md`)**: Registro de asistencia técnica y análisis del desarrollo.