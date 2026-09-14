# Matriz de escenarios 05A

| Rol | Acción | Resultado esperado | Evidencia |
| --- | --- | --- | --- |
| Anónimo | Abrir la app | Se muestra login, sin datos protegidos | Captura de login |
| Anónimo | Login con contraseña incorrecta | `401 INVALID_CREDENTIALS` en banner de sesión | Captura de error |
| Requester | Registrar cuenta válida | Cuenta creada y sesión iniciada | Respuesta `201` del backend |
| Requester | Crear solicitud | `201`; el servidor asigna `createdBy` y `open` | Tarjeta de solicitud |
| Requester | Listar solicitudes | Solo aparecen sus solicitudes | Bandeja requester |
| Requester | Filtrar por estado/prioridad | La lista refleja los filtros reales | Barra de filtros |
| Requester | Ver detalle e historial | Se consultan `GET /requests/:id` y `/history` | Panel de detalle |
| Requester | Editar solicitud propia abierta | `200`; título/descripción actualizados | Confirmación verde |
| Requester | Intentar cambiar prioridad | `403 FORBIDDEN` desde el backend | Banner de prohibición |
| Agent | Listar solicitudes | Se muestra la colección global | Cola agent |
| Agent | Filtrar por estado/prioridad | La lista se filtra en la API | Barra de filtros |
| Agent | Ver detalle e historial | Se consultan los endpoints protegidos reales | Panel de detalle |
| Agent | Cambiar prioridad | `200` en solicitud no terminal | Confirmación verde |
| Agent | Cambiar estado válido | Solo se ofrecen transiciones del dominio | Selector de estado |
| Agent | Cambiar estado inválido | El backend responde `409`; se muestra conflicto | Banner `409` |
| Cualquier rol | Cerrar sesión | Se elimina el token de `sessionStorage` | Regreso al login |
| Cualquier rol | Backend apagado | Error de red distinguible | Banner de conexión |

El cliente nunca envía `role`, `createdBy` ni `changedBy`. El backend mantiene la autorización definitiva.
