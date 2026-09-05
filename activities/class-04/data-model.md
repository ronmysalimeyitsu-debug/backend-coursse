# Data Model

* **`requests`**: Almacena las solicitudes principales con los campos `id` (UUID), `title` (VARCHAR), `status` (VARCHAR, con restricción CHECK en 'open', 'in_progress', 'closed'), `created_at` y `updated_at`.
* **`request_status_history`**: Registra los cambios de estado asociados mediante clave foránea `request_id`, guardando `previous_status`, `new_status` y `changed_at`.