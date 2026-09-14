# Registro de uso de IA

- Se revisó el contrato HTTP existente del backend antes de crear el cliente.
- Se generó una estructura React/Vite con componentes separados por responsabilidad.
- La decisión de seguridad fue centralizar el header Bearer en `src/api/httpClient.js` y mantener la autorización en el backend.
- Se documentó el uso educativo de `sessionStorage` y el riesgo XSS asociado.
- Se contrastaron las transiciones de estado del frontend con las reglas existentes del backend; la UI no autoriza, solo evita ofrecer cambios imposibles.
- La validación técnica del frontend se realiza con `npm run build`.
