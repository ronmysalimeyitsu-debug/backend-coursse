# Autoevaluación asistida por IA — checkpoint 1-7

Guarda aquí la salida COMPLETA y SIN EDITAR de tu única ejecución del
prompt ITSU-CHECKPOINT-01-07-1.0.

> Este reporte es un insumo de la evaluación del curso: el docente lo
> revisa junto con tu evidencia y puede verificarlo oralmente. Si no
> estás de acuerdo con algo, cuestiónalo con argumentos en la
> metacognición.

## Metadata de mi ejecución

* Modelo utilizado: GitHub Copilot
* Fecha: 2026-10-07
* Commit evaluado: `a40d8e5` (referencia declarada en el paquete 1-7)
* ¿Necesité el prompt de reparación?: no

## BLOQUE 1 — RESULT_CODE

```text
ITSU-PROGRESS|V=1.0|R=BACKEND-01-07-R1|STATUS=PARTIAL|C01=3-3-X-3|C02=3-3-X-3|C03=2-3-X-2|C04=2-3-X-2|C05=3-3-2-3|C06=3-3-2-3|C07=3-3-2-3|ACTION=VERIFY
```

## BLOQUE 2 — JSON

```json
{
  "protocolVersion": "ITSU-CHECKPOINT-01-07-1.0",
  "rubricVersion": "BACKEND-01-07-R1",
  "status": "PARTIAL",
  "action": "VERIFY",
  "studentId": "RONMY SALIMEY",
  "modelReportedByStudent": "GitHub Copilot",
  "classes": [
    {
      "classId": "01",
      "title": "Fundamentos de backend",
      "levels": { "knowledge": 3, "practice": 3, "verification": "X", "explanation": 3 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-01/README.md", "reference": "server flow, routes, HTTP 200/404" },
        { "artifact": "activities/class-01/src/main.py", "reference": "server implementation listed as FOUND" }
      ],
      "strength": "Explica entrada, routing, respuesta y por qué el servidor permanece activo.",
      "gap": "El paquete no incluye una salida de ejecución verificable para esta clase.",
      "nextAction": "Adjuntar una ejecución breve del servidor con una ruta válida y una inexistente."
    },
    {
      "classId": "02",
      "title": "HTTP y contratos",
      "levels": { "knowledge": 3, "practice": 3, "verification": "X", "explanation": 3 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-02/Request API Full/docs/http-contract.md", "reference": "métodos, rutas, body y status documentados" },
        { "artifact": "activities/class-02/Request API Full/spec.txt", "reference": "salida guardada como NOT_VERIFIED" }
      ],
      "strength": "La respuesta relaciona POST, body, validación de prioridad, 400 y 201.",
      "gap": "La especificación guardada no demuestra que las peticiones se ejecutaran.",
      "nextAction": "Conservar una petición reproducible y su respuesta observada."
    },
    {
      "classId": "03",
      "title": "Recursos, estado y reglas",
      "levels": { "knowledge": 2, "practice": 3, "verification": "X", "explanation": 2 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-03/resource-model.md", "reference": "campos y estados permitidos" },
        { "artifact": "activities/class-03/transition-map.md", "reference": "transiciones y estados terminales" },
        { "artifact": "course-progress-evidence-01-07.md", "reference": "respuesta C03 explica mapper y representación" }
      ],
      "strength": "Identifica que la representación pública debe separarse de las columnas internas.",
      "gap": "La respuesta C03 no distingue explícitamente dato inválido de transición incompatible ni desarrolla PATCH/idempotencia.",
      "nextAction": "Explicar con un ejemplo 400 por entrada inválida frente a 409 por estado incompatible."
    },
    {
      "classId": "04",
      "title": "PostgreSQL y persistencia",
      "levels": { "knowledge": 2, "practice": 3, "verification": "X", "explanation": 2 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-04/data-model.md", "reference": "modelo relacional encontrado" },
        { "artifact": "activities/class-04/transaction-plan.md", "reference": "plan de transacción encontrado" },
        { "artifact": "course-progress-evidence-01-07.md", "reference": "respuesta C04 describe migración, seed y CTE" }
      ],
      "strength": "Reconoce el papel de migraciones, seed y atomicidad en la persistencia.",
      "gap": "La respuesta llama transacción a un CTE de una sola sentencia; conviene precisar qué atomicidad ofrece la sentencia frente a una transacción de varias escrituras.",
      "nextAction": "Distinguir atomicidad de una sentencia SQL de BEGIN/COMMIT/ROLLBACK entre varias operaciones."
    },
    {
      "classId": "05",
      "title": "Autenticación y autorización",
      "levels": { "knowledge": 3, "practice": 3, "verification": 2, "explanation": 3 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "project/activities/class-05/auth-contract.md", "reference": "contrato de autenticación encontrado" },
        { "artifact": "project/activities/class-05/validation-evidence.md", "reference": "evidencia guardada, ejecución no verificada por el paquete" },
        { "artifact": "course-progress-evidence-01-07.md", "reference": "respuesta C05 diferencia identidad y permisos" }
      ],
      "strength": "Distingue autenticación de autorización y menciona la verificación criptográfica del JWT.",
      "gap": "La evidencia de validación aparece como texto guardado, no como ejecución verificada en este paquete.",
      "nextAction": "Confirmar con una salida del validador o una prueba positiva y otra negativa."
    },
    {
      "classId": "06",
      "title": "Onboarding y pruebas",
      "levels": { "knowledge": 3, "practice": 3, "verification": 2, "explanation": 3 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-06-starter/activities/class-06/work-log.md", "reference": "preparación, BUG-106 y prueba de colección vacía" },
        { "artifact": "activities/class-06-starter/activities/class-06/validation-evidence.txt", "reference": "salida guardada como NOT_VERIFIED" }
      ],
      "strength": "Describe preparación, acción, aserción y regresión de una colección vacía.",
      "gap": "La salida del validador está guardada, pero el paquete no la confirma como ejecución verificada.",
      "nextAction": "Vincular el caso descrito con una corrida actual reproducible."
    },
    {
      "classId": "07",
      "title": "Diagnóstico y errores",
      "levels": { "knowledge": 3, "practice": 3, "verification": 2, "explanation": 3 },
      "confidence": "medium",
      "evidence": [
        { "artifact": "activities/class-07-starter/activities/class-07/incident-report.md", "reference": "INC-701, reproducción e hipótesis" },
        { "artifact": "activities/class-07-starter/activities/class-07/validation-evidence.txt", "reference": "salida guardada como NOT_VERIFIED" },
        { "artifact": "course-progress-evidence-01-07.md", "reference": "respuesta C07 describe NaN, fail-fast y health" }
      ],
      "strength": "Explica síntoma, hipótesis, causa y validación temprana para un id inválido.",
      "gap": "Falta confirmar la ejecución de las pruebas del incidente y precisar la diferencia entre liveness y readiness.",
      "nextAction": "Mostrar el resultado de la prueba INC-701 y explicar qué dependencia comprueba readiness."
    }
  ],
  "progressPattern": {
    "label": "stable",
    "explanation": "Las respuestas mantienen referencias técnicas a través de las clases; la evidencia de ejecución no está confirmada de forma uniforme."
  },
  "priorityConceptGaps": [
    "C03: diferenciar validación de entrada (400) de conflicto de estado (409).",
    "C04: distinguir una sentencia CTE atómica de una transacción que agrupa varias escrituras.",
    "C05-C07: los archivos de validación están guardados, pero el paquete los marca NOT_VERIFIED como ejecución.",
    "C01-C02: el paquete incluye implementación y contrato, pero no una salida directa que confirme su ejecución."
  ],
  "studentNextSteps": [
    "Confirmar que el studentId copiado del transcript coincide con el identificador oficial.",
    "Aportar una salida verificable de los validadores o pruebas marcados NOT_VERIFIED.",
    "Repasar 400 frente a 409 y la diferencia entre CTE de una sentencia y transacción multi-escritura."
  ],
  "teacherFeedback": {
    "supportPriority": "medium",
    "focusClassIds": ["03", "04", "07"],
    "topicsToReinforce": [
      "Validación de datos frente a transiciones incompatibles.",
      "Atomicidad de una sentencia SQL frente a transacción explícita.",
      "Diferencia operacional entre health y readiness."
    ],
    "oralVerificationRecommended": true,
    "oralQuestions": [
      "Da un ejemplo de entrada inválida que produce 400 y de transición incompatible que produce 409.",
      "¿Qué garantiza una CTE de una sentencia y cuándo necesitas BEGIN/COMMIT/ROLLBACK?",
      "¿Qué dependencia externa comprueba readiness que health no comprueba?"
    ],
    "integrityReview": "recommended",
    "integritySignals": ["TEST_OUTPUT_MISSING"],
    "reviewReason": "El paquete marca varias salidas históricas como NOT_VERIFIED. Se recomienda confirmar su ejecución con evidencia; esto no implica una irregularidad.",
    "teacherDigest": "Comprensión e implementación descritas en las siete clases; varias salidas son texto no verificado. Aclarar 400/409, CTE/transacción y health/readiness; corroborar ejecuciones."
  }
}
```

## BLOQUE 3 — Reporte del estudiante

### Panorama general

El paquete muestra implementación y explicaciones técnicas a lo largo de las siete clases. El resultado es **PARTIAL**: varias salidas están identificadas expresamente como `NOT_VERIFIED`, por lo que el informe no afirma que esas ejecuciones no ocurrieron; indica que el paquete no permite confirmarlas. No se calcula una nota final.

### Fortalezas demostradas

- Se describe el recorrido de una petición HTTP y se citan archivos de servidor y rutas.
- Hay contratos, modelo de recursos, estados, migraciones y pruebas documentados en los artefactos encontrados.
- Las respuestas sobre autenticación/JWT, regresión de colecciones vacías e INC-701 incluyen ejemplos concretos.

### Temas para reforzar

- En clase 3, distinguir explícitamente un dato de entrada inválido de una transición incompatible con el estado.
- En clase 4, separar la atomicidad de una sentencia CTE de una transacción que agrupa varias escrituras.
- Precisar qué comprueba `health` y qué dependencia externa comprueba `readiness`.

### Evolución y prioridades

El patrón se clasifica como `stable`: las respuestas mantienen referencias técnicas, pero no hay evidencia suficiente para afirmar una mejora o caída entre clases. Las prioridades son aclarar validación frente a conflicto, precisar CTE frente a transacción y aportar salidas de ejecución comprobables para los archivos marcados `NOT_VERIFIED`.

### Preguntas para comprobar comprensión

1. Da un ejemplo de entrada inválida que responda 400 y otro de transición incompatible que responda 409.
2. ¿Qué garantiza una CTE de una sentencia y cuándo necesitas `BEGIN`/`COMMIT`/`ROLLBACK`?
3. ¿Qué dependencia comprueba readiness que health no comprueba?

### Evidencia faltante

El paquete contiene salidas guardadas de validadores de las clases 5–7 marcadas `NOT_VERIFIED` y no una salida directa para confirmar la ejecución de los artefactos de las clases 1–2. Confirma también que `RONMY SALIMEY` coincide con el identificador oficial antes de entregar.

## BLOQUE 4 — Feedback docente

### Riesgo conceptual y prioridad de apoyo

Prioridad media. Conviene repasar la distinción entre validación de entrada y conflicto de negocio (clase 3), entre atomicidad de sentencia y transacción explícita (clase 4), y entre liveness y readiness (clase 7).

### Evidencia insuficiente

Los archivos de validación de las clases 5–7 aparecen como texto guardado, `NOT_VERIFIED` como ejecución. Esto requiere corroboración de evidencia, no implica una irregularidad. Las respuestas de las clases 3 y 4 están fundamentadas en archivos, pero no responden por completo a todas las distinciones preguntadas.

### Verificación oral recomendada

1. **Pregunta:** Da un ejemplo de entrada inválida y de transición incompatible. **Respuesta mínima esperada:** entrada inválida → 400 antes de persistir; recurso existente con transición no permitida → 409.
2. **Pregunta:** ¿Una CTE equivale a una transacción multi-escritura? **Respuesta mínima esperada:** una sentencia SQL es atómica; una unidad con varias sentencias requiere transacción explícita para commit o rollback conjunto.
3. **Pregunta:** ¿Qué comprueba readiness? **Respuesta mínima esperada:** si una dependencia necesaria, como PostgreSQL, está disponible; health/liveness indica si el proceso puede responder.

**Confianza:** media. El paquete ofrece artefactos y explicaciones de las siete clases, pero la ejecución de varias evidencias no queda verificada en el propio paquete.

---

## Mi lectura del reporte (metacognición — esto SÍ lo escribes tú)

* ¿Estoy de acuerdo con el reporte?

  Estoy parcialmente de acuerdo. Reconoce que describí implementaciones y conceptos, pero el paquete no permite verificar algunas ejecuciones. También es justo señalar que en la respuesta de la clase 3 expliqué el mapper, pero no diferencié con claridad un dato inválido de una transición incompatible.

* ¿Qué criterio considero incorrecto?

  No cuestiono la rúbrica, pero matizaría que `NOT_VERIFIED` significa que el paquete no demuestra una ejecución; no prueba que nunca se haya ejecutado. Acepto que, para evaluar esa parte, hace falta adjuntar la salida correspondiente.

* ¿Qué evidencia adicional aportaría?

  Adjuntaría las salidas reales de `npm test` y de los validadores pertinentes, sin secretos, además de señalar en qué archivos están las pruebas. Para la clase 4, aclararía si el ejemplo CTE cubre una sola sentencia o una transacción con varias operaciones.

* ¿Qué recomendación voy a seguir?

  Voy a precisar la diferencia entre error de entrada y conflicto de estado, y entre atomicidad de una sentencia y una transacción explícita. También revisaré qué comprueban health y readiness y dejaré referencias concretas a la evidencia, sin volver a ejecutar la autoevaluación.
