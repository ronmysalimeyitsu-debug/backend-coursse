# BLOQUE 1 — RESULT_CODE
ITSU-KNOWLEDGE|V=1.0|R=BACKEND-01-08-K1|ID=K09-ronmysalimey-itu-d0b72fd|Q1=3-3-3-3|Q2=3-3-3-2|Q3=4-2-4-3|Q4=2-1-2-2|Q5=X-X-X-X|ACTION=VERIFY

# BLOQUE 3 — Reporte del estudiante
# Reporte de evaluación de conocimientos
## Resultado general
Evaluación parcial. Se completaron Q1 a Q3; Q4 se evaluó parcialmente y Q5 no pudo evaluarse porque se agotó el tiempo.

## Desempeño por pregunta
- **Q1:** Reconstruiste el recorrido de `GET /requests/:id/history` con referencias a rutas, servicio, store y prueba. Rectificaste el `403` inicial a un `404` uniforme con evidencia.
- **Q2:** Explicaste la atomicidad entre la solicitud y su historial, el papel de `commit` y `rollback`, y propusiste comprobar que no haya cambios ni eventos tras un fallo.
- **Q3:** Diferenciaste autenticación y autorización, explicaste el riesgo de confiar en datos del cliente y justificaste el `404` para reducir enumeración. La ruta del middleware citada contradice la tarjeta.
- **Q4:** Identificaste `ECONNREFUSED` y `/ready` en `503` como señales de indisponibilidad, y propusiste comprobar conectividad. El diagnóstico quedó incompleto.
- **Q5:** No evaluada por límite de tiempo.

## Conceptos demostrados
Atomicidad transaccional, separación entre autenticación y autorización, identidad derivada de un token verificado y mitigación de enumeración de recursos mediante respuestas uniformes.

## Vacíos prioritarios
Resolver la discrepancia sobre la ruta del middleware de autenticación y completar el análisis de evidencia y regresión para LOG-04. Q5 queda pendiente de evaluación.

## Rectificaciones valiosas
En Q1 cambiaste la respuesta esperada para una solicitud ajena de `403` a `404 REQUEST_NOT_FOUND`, explicando cómo evita revelar si el recurso existe.

## Tres acciones de estudio
1. Contrasta las rutas citadas con la estructura real y sigue el middleware de autenticación hasta la validación del JWT.
2. Practica diagnósticos separando síntoma, hipótesis y causa; interpreta `/health`, `/ready` y los resultados de pruebas.
3. Completa el análisis de CHANGE-04: contrato, permisos, persistencia, compatibilidad y pruebas para cambios de prioridad.

## Evidencia faltante
Faltó resolver la discrepancia de ruta del middleware y completar la interpretación de LOG-04. No se obtuvo evidencia para calificar Q5. El transcript referencia el prompt fuente en lugar de reproducirlo íntegro.

# BLOQUE 4 — Feedback para el docente
## Feedback para el docente
- **Q3, grounding:** se citó `src/middlewares/authenticate.js`, pero la tarjeta lista `src/middleware/authenticate.js`. Confianza media; conviene verificar oralmente la ruta y la función de validación JWT.
- **Q4, grounding y verificación:** propuso `pg_isready` o una comprobación de puerto, pero no los conectó a un comando concreto del repositorio ni continuó con la evidencia de diagnóstico. Confianza baja; requiere apoyo.
- **Q5:** no evaluada por tiempo; no asignar niveles.

Preguntas orales:
1. ¿Cuál es la ruta exacta del middleware de autenticación y dónde se verifica el JWT? **Respuesta mínima esperada:** resolver la discrepancia con el archivo y función reales, y ubicar la validación de firma y expiración.
2. En LOG-04, ¿qué evidencia o comando del repositorio distingue indisponibilidad de la base de un defecto del código? **Respuesta mínima esperada:** relacionar `ECONNREFUSED` y `/ready` 503 con la base no disponible, distinguirlo de `/health` 200 y citar una comprobación concreta.
