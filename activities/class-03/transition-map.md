# Mapa de Transiciones de Estado

## Estados
* **Válidos**: `open`, `in_progress`, `resolved`, `closed`, `cancelled`
* **Terminales**: `closed`, `cancelled`

## Matriz de Transiciones
* `open` -> `in_progress`, `cancelled`
* `in_progress` -> `resolved`, `cancelled`
* `resolved` -> `closed`
* `closed` -> (sin transiciones permitidas)
* `cancelled` -> (sin transiciones permitidas)

## Justificación de Negocio
Los estados terminales previenen la alteración destructiva de solicitudes que han finalizado o han sido anuladas, garantizando la trazabilidad histórica del sistema.