# Request Desk · Entrega 05A

Frontend React/Vite para consumir la REST API de la clase 05.

## Ejecutar

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

La API debe estar activa en `http://localhost:3000`. Si cambia, actualiza `VITE_API_URL`.
El backend debe permitir el origen del frontend con `FRONTEND_ORIGIN=http://localhost:5173`.

## Seguridad de sesión

El token JWT se conserva en `sessionStorage` para esta entrega educativa y se envía únicamente como `Authorization: Bearer <token>` desde `src/api/httpClient.js`. El frontend no decodifica ni confía en claims para autorizar operaciones: el backend sigue siendo la autoridad. Al cerrar la pestaña, el navegador elimina la sesión local.

En una aplicación de producción se preferiría una cookie `HttpOnly`, `Secure` y `SameSite` para reducir la exposición del token ante XSS. Aunque `sessionStorage` limita la persistencia, cualquier script ejecutado en el origen podría leerlo durante la sesión; por eso no se debe insertar HTML no confiable con `dangerouslySetInnerHTML`, se deben escapar valores y aplicar una política CSP.

## Roles

`requester` crea, lista, filtra, consulta detalles e historial y edita sus solicitudes abiertas. `agent` ve la colección global, filtra, consulta detalles e historial y cambia prioridad/estado solo entre transiciones válidas. Los errores de la API se muestran con una presentación específica para red, `400`, `401`, `403`, `404`, `409`, `500` y `503`.

## Evidencias de entrega

- Matriz de escenarios: `test-matrix.md`.
- Reflexión: `reflection.md`.
- Registro de IA: `ai-usage.md`.
- Build: `npm run build` debe terminar con `built successfully`.
- La captura o video final debe mostrar registro/login, una solicitud creada, filtros, detalle/historial, un cambio de agente y un error `409` o `403` visible.
