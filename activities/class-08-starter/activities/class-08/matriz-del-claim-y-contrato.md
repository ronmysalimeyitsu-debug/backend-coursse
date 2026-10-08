# POST /requests/:id/claim — El Contrato y la Matriz de Comportamiento

**Clasificación:** lectura técnica y resolución de laboratorio · **Sección:** El cambio que toca todo (FEATURE-801)

---

## 1. El contrato HTTP de la acción Claim

```http
POST /requests/:id/claim
```

### Las reglas del ticket
* **Sin body:** No se requiere ningún cuerpo en la petición. La identidad del agente proviene exclusivamente del token JWT autenticado (`req.auth.userId`).
* **Permisos estrictos:** Solo un `agent` puede reclamar. Si un `requester` intenta reclamar, recibe `403 FORBIDDEN`.
* **Precondiciones del recurso:** La solicitud debe existir (si no, `404 REQUEST_NOT_FOUND`), estar en estado `open` y no estar previamente asignada (`assigned_to IS NULL`).
* **Efecto observable:**
  * El estado cambia a `in_progress`.
  * La columna `assigned_to` se fija con el `userId` del agente autenticado.
  * La marca temporal `updated_at` se actualiza al instante actual.
* **Historial consistente:** Se genera un evento de historial con `type: 'request_claimed'`, `fromStatus: 'open'`, `toStatus: 'in_progress'` y `changedBy: actor.userId`.
* **Atomicidad en la base de datos:** La asignación y el registro del evento de historial se ejecutan dentro de la **misma transacción PostgreSQL** (`withTransaction`).
* **Contrato de errores unificado (Clase 07):** Toda respuesta de error incluye `requestId` y `{ error: { code, message } }`.

### Respuestas del endpoint

#### Primer reclamo (Éxito)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 42,
  "title": "Projector failure",
  "status": "in_progress",
  "assignedTo": "3419e548-0b19-4720-8da2-028c53f62c67",
  "updatedAt": "2026-10-07T21:40:00.000Z"
}
```

#### Segundo reclamo (Conflicto / Repetido)
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": {
    "code": "REQUEST_ALREADY_ASSIGNED",
    "message": "The request is already assigned."
  },
  "requestId": "req_877c11aa-02c8-45ed-b037-49d105b94ad3"
}
```

> *"El 409 no es un error del cliente torpe: es el contrato DICIENDO el estado del mundo."*

---

## 2. Nueve casos — Cero ambigüedad (La Matriz del Ticket)

La matriz formal de comportamiento elimina cualquier suposición sobre las reglas del endpoint:

| Usuario | Estado de la Solicitud | ¿Ya Asignada? | Resultado HTTP | Código de Error / Razón |
| :--- | :--- | :---: | :---: | :--- |
| `agent` | `open` | No | **`200 OK`** | *(Asignación exitosa, evento en historial)* |
| `requester` | `open` | No | **`403 Forbidden`** | `FORBIDDEN` (`NOT_AGENT`) |
| `agent` | `open` | Sí | **`409 Conflict`** | `REQUEST_ALREADY_ASSIGNED` |
| `agent` | `in_progress` | No | **`409 Conflict`** | `INVALID_STATUS_TRANSITION` |
| `agent` | `resolved` | No | **`409 Conflict`** | `INVALID_STATUS_TRANSITION` |
| `agent` | `closed` | No | **`409 Conflict`** | `REQUEST_IN_TERMINAL_STATUS` |
| `agent` | `cancelled` | No | **`409 Conflict`** | `REQUEST_IN_TERMINAL_STATUS` |
| Sin token | `open` | No | **`401 Unauthorized`** | `AUTHENTICATION_REQUIRED` |
| `agent` | *Inexistente* | — | **`404 Not Found`** | `REQUEST_NOT_FOUND` |

### La matriz como plan de pruebas
* Cada fila se traduce directamente a una prueba de integración HTTP (en `test/requests-claim.test.js`).
* Las filas de lógica pura se verifican con submilisegundos en `test/request-policy.test.js`.
* Cuando todos los casos de la matriz pasan en verde, la funcionalidad está terminada.

---

## 3. Resolución del Laboratorio: La matriz del claim

Predicciones exactas de los 10 escenarios interactivos del laboratorio:

1. **María (`agent`) reclama la solicitud 3: está `open` y sin asignar.**
   * **Respuesta:** `200` — `status: in_progress`, `assignedTo: María`.
2. **Ana (`requester`) reclama la solicitud 3: está `open` y sin asignar.**
   * **Respuesta:** `403 FORBIDDEN` (la regla de rol prima; solo los agentes atienden solicitudes).
3. **Luis (`agent`) reclama la solicitud 3: ya asignada a María.**
   * **Respuesta:** `409 REQUEST_ALREADY_ASSIGNED`.
4. **María (`agent`) vuelve a reclamar la solicitud 3 (ya asignada a ella misma).**
   * **Respuesta:** `409 REQUEST_ALREADY_ASSIGNED` (la regla de idempotencia no permite reasignar).
5. **Agente reclama una solicitud en estado `in_progress` no asignada.**
   * **Respuesta:** `409 INVALID_STATUS_TRANSITION` (solo las solicitudes en estado `open` son reclamables).
6. **Agente reclama una solicitud en estado `resolved`.**
   * **Respuesta:** `409 INVALID_STATUS_TRANSITION`.
7. **Agente reclama una solicitud en estado `closed`.**
   * **Respuesta:** `409 REQUEST_IN_TERMINAL_STATUS` (los estados terminales están sellados).
8. **Agente reclama una solicitud en estado `cancelled`.**
   * **Respuesta:** `409 REQUEST_IN_TERMINAL_STATUS`.
9. **Petición `POST /requests/3/claim` sin cabecera `Authorization`.**
   * **Respuesta:** `401 AUTHENTICATION_REQUIRED` (interceptado por middleware antes de tocar la ruta).
10. **Agente reclama la solicitud 999 (id que no existe en base de datos).**
    * **Respuesta:** `404 REQUEST_NOT_FOUND` (se valida la existencia antes de ejecutar la política).

---

## 4. ¿Y si el body trae `assignedTo`?

Cuando un cliente envía `POST /requests/42/claim` con `{ "assignedTo": "otro-agente" }`, el backend enfrenta tres alternativas de diseño:

1. **Opción 1: Confiar en el body**
   * *Problema:* Cualquier cliente podría autoasignar solicitudes a otros agentes o suplantar responsabilidades. La identidad dejaría de ser verificada por el token criptográfico y se volvería arbitraria. **Inaceptable por seguridad.**
2. **Opción 2: Ignorar el body en silencio**
   * *Problema:* El cliente cree que asignó la solicitud a X, pero el servidor asignó a Y (el dueño del token). El endpoint parecería funcionar, pero crea confusión y propaga bugs silenciosos en frontend.
3. **Opción 3: Rechazar con 400 Bad Request (Decisión del Curso)**
   * *Solución:* Responder inmediatamente con `400 SERVER_CONTROLLED_FIELD`. El contrato se vuelve **explícito y visible** en el momento exacto en que el cliente comete el error.

```http
POST /requests/42/claim
Content-Type: application/json

{ "assignedTo": "otro-agente" }
```
```http
HTTP/1.1 400 Bad Request

{
  "error": {
    "code": "SERVER_CONTROLLED_FIELD",
    "message": "Field \"assignedTo\" is controlled by the server."
  },
  "requestId": "req_965e96af-2c38-40aa-9104-3022db2b6a21"
}
```

### Bonus del diseño
Al incluir `'assignedTo'` en la constante central `SERVER_CONTROLLED_FIELDS` en `requests.service.js`:
```javascript
const SERVER_CONTROLLED_FIELDS = ['id', 'createdBy', 'createdAt', 'updatedAt', 'changedBy', 'assignedTo'];
```
Se protegen automáticamente **dos endpoints a la vez**:
* `POST /requests/:id/claim`: rechaza cualquier intento de pasar `assignedTo`.
* `PATCH /requests/:id`: impide que un cliente altere la asignación a través de una actualización parcial genérica.
Una única decisión de arquitectura blindó ambos puntos de entrada.
