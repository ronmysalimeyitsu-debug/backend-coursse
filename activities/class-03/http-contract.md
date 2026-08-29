# Contrato HTTP — API v3

## Formato Estándar de Error
Todas las respuestas de error utilizan la siguiente estructura JSON:
```json
{
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Descripción legible del error"
  }
}