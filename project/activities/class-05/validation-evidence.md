# Evidencia de validación — Clase 05

Pega aquí la salida del validador al cerrar cada estación (SIN secretos: el
validador ya evita imprimirlos, no agregues capturas de tu `.env`).

## stage setup

## stage access-design

## stage register

## stage password

## stage login

## stage authentication

## stage ownership

**Escenario:** Alice (requester) intenta acceder a un recurso de Bob (ID 42) y a un recurso que no existe (ID 999).

**1. GET /requests/42 (Recurso ajeno - de Bob)**
```json
{
  "error": "REQUEST_NOT_FOUND",
  "message": "The requested resource could not be found."
}