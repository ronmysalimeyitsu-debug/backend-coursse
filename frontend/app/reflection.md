# Reflexión personal — Entrega 05A

La interfaz no reemplaza la autorización del backend. La separación por rol mejora la experiencia, pero cada creación, consulta y actualización sigue viajando con Bearer y se valida en la API.

La decisión educativa de esta entrega es conservar el JWT en `sessionStorage`: reduce la persistencia frente a `localStorage`, pero no elimina el riesgo de XSS durante la sesión. Por eso el cliente no usa HTML inyectado, no guarda secretos del servidor y mantiene la URL de la API en variables de entorno.

El detalle y el historial se consultan mediante los endpoints reales. Los cambios de estado del agente reflejan la máquina de estados existente, pero el backend continúa siendo la fuente de verdad y puede responder `409` si hay una condición de carrera o un conflicto.

La comprobación final combina `npm run build` con pruebas manuales de registro, login, creación, filtros, detalle/historial, edición del requester y workflow del agent.
