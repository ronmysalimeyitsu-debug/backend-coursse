# Contrato HTTP v3 - API de Solicitudes

## Estados del Dominio
* `open`
* `in_progress`
* `resolved`
* `closed`
* `cancelled`

## Máquina de Estados (Transiciones Permitidas)
* `open` ➔ `in_progress`, `cancelled`
* `in_progress` ➔ `resolved`, `cancelled`
* `resolved` ➔ `closed`
* `closed` ➔ (Estado terminal, no permite cambios)
* `cancelled` ➔ (Estado terminal, no permite cambios)

## Formato Unificado de Respuestas de Error
```json
{
  "error": {
    "code": "NOMBRE_DEL_CODIGO",
    "message": "Descripción legible del problema"
  }
}