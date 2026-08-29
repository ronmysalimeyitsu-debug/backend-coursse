# Modelo del Recurso: Request

## Nombre del Recurso
`Request` (Solicitud de Soporte)

## Campos del Recurso
* **Campos Requeridos**:
  * `title` (string): Título o resumen breve de la solicitud.
* **Campos Opcionales**:
  * `description` (string): Detalle explicativo del requerimiento.
  * `priority` (enum: `low` | `medium` | `high`): Prioridad asignada (valor por defecto: `medium`).
* **Campos Generados por el Servidor**:
  * `id` (number): Identificador único correlativo.
  * `status` (enum): Estado inicial asignado como `open`.
  * `createdAt` (string ISO8601): Fecha y hora de creación.
  * `updatedAt` (string ISO8601): Fecha y hora de última modificación.

## Estados Permitidos
`open`, `in_progress`, `resolved`, `closed`, `cancelled`.