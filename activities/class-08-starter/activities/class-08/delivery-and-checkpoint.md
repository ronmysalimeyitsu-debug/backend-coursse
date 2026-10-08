# Entrega 08: entrega, checkpoint y ticket de salida

**Clasificación:** consigna de entrega · **Dificultad:** media · **Tiempo:** 15 minutos para empaquetar y verificar · **Sección:** Entrega y cierre

La entrega reúne dos actos: el checkpoint acumulativo de las clases 1–7 y el taller de arquitectura de la clase 8. El resultado final debe funcionar y el historial debe contar cómo se llegó ahí. Un claim correcto no compensa un refactor que alteró el contrato.

## Qué se entrega

- El proyecto `class-08-starter` con el refactor de historial y FEATURE-801 completos.
- `responsibility-map.md`: clasificación del handler cargado antes del refactor.
- `refactor-log.md`: pasos pequeños y resultados de la suite.
- `validation-evidence.txt`: salida literal de `npm run validate:class-08`, sin editar.
- `course-progress-evidence-01-07.md`: paquete de checkpoint con el `studentId` confirmado y las siete respuestas.
- `ai-self-evaluation-01-07.md`: salida íntegra de una ejecución, metadata y las cuatro respuestas de metacognición.
- `ai-knowledge-exam-01-07.md`: transcript íntegro de la segunda conversación y su cierre.
- `class-08-evidence.md`: resumen técnico y reflexión integradora del tema 8.

No se entrega `.env`, tokens, `Authorization`, cadenas de conexión ni `node_modules/`. Antes de preparar el commit, confirma que `.env` esté ignorado:

```bash
git check-ignore .env
git status --short
git diff --check
```

En evidencias pegadas, sustituye cualquier credencial por `[configured]`. No pegues logs que contengan headers de autorización.

## Cuatro commits del curso

| Orden | Debe demostrar | Mensaje |
| --- | --- | --- |
| 1 | Baseline verde antes de tocar el código | `class-08-baseline` |
| 2 | Refactor del historial, contrato conservado | `class-08-refactor` |
| 3 | FEATURE-801 completa con pruebas | `class-08-feature` |
| 4 | Evidencias y entrega completas | `class-08-submission` |

Después de cada commit, el procedimiento del curso pide `git push` y comprobar el commit en el repositorio remoto. No llames “baseline” a otro commit si su contenido o momento no lo demuestra; tampoco inventes hashes. Conserva commits previos y consulta con el docente antes de reescribir una historia que ya se publicó.

**Trazabilidad del baseline:** `origin/main` parte de `5429366`, que contiene el snapshot inicial de `class-08-starter` pero conserva el asunto original `feat: agrega carpeta class-08-starter con evidencias, autoevaluacion y examen`. Para no reescribir un commit ya publicado, se usa el tag `class-08-baseline` sobre ese hash; el tag identifica el punto de partida, pero no cambia el mensaje del commit.

## Material del día y evidencia personal

Los recursos técnicos del taller están en:

- `refactor-vs-feature.md` y `refactor-log.md` para el diff que conserva el contrato.
- `responsibility-map.md` y `cohesion-coupling-dependencies.md` para responsabilidades, cohesión y flechas.
- `evitar-sobrearquitectura.md` para podar capas sin problema presente.
- `migration-005-decisions-and-lab.md` para compatibilidad, FK y seed.
- `transactions-and-history.md` para atomicidad y rollback.
- `matriz-del-claim-y-contrato.md`, `api-tests-and-validator.md` y `FEATURE-801.md` para la matriz por API.

Los archivos de checkpoint son evidencia propia: no se rellenan con un ejemplo genérico ni con una salida inventada. El `studentId` se tomó del transcript existente (`RONMY SALIMEY`); confirma que coincide con tu identificador oficial antes de entregar. El informe actual se generó con GitHub Copilot y es `PARTIAL`; sus cuatro respuestas de metacognición ya están registradas. El transcript del examen existente contiene respuestas personales: consérvalo íntegro y no lo sustituyas por un transcript modelo.

## Verificación final del taller

```bash
npm test
npm run validate:class-08
```

Estado verificado en este checkout: **53 pass, 0 todo, 0 fail** y **13/13 checks PASSED**. La lámina anterior muestra `12/12`; la evidencia actual correcta es `13/13` porque se añadió el check de rollback ante fallo FK. Guarda la salida real actual, no edites el denominador para que coincida con la captura.

El check 11 del validador induce una FK inválida y verifica que la solicitud quede abierta, no asignada y sin evento. Los checks 12 y 13 comprueban routes sin SQL y service sin Express.

## Checkpoint diferido del tema 8

El tema 8 se evalúa al comienzo de la clase 9, no durante este cierre: checkpoint breve solo del tema 8 y máximo dos preguntas orales. No vuelvas a ejecutar el checkpoint 1–7 para buscar un resultado distinto. Lleva la evidencia y repasa lo que puedas explicar sin abrir el código:

1. Qué cambió en estructura durante el refactor y qué quedó idéntico en el contrato.
2. Qué regla vive en policy y cómo se prueba sin HTTP.
3. Qué convierte `claimRequest` en una acción de negocio y no en un PATCH genérico.
4. Qué garantiza la FK y qué regla sigue perteneciendo a la aplicación.
5. Por qué update e historial reciben el mismo client y qué prueba el rollback.
6. Qué comprueban las fronteras del validador y dónde está guardada su salida.

## Lectura: cómo leer una autoevaluación de IA

El reporte del checkpoint es una **clasificación de la evidencia entregada**, no una sentencia sobre lo que sabes. Una `X` indica “no encontré esta evidencia”; no demuestra “no conoces este tema”. El modelo puede equivocarse y dos modelos pueden asignar niveles distintos a la misma respuesta; por eso importan la rúbrica, la evidencia y la revisión docente.

Lee el reporte en este orden:

1. `ACTION` al final del `RESULT_CODE`: `NONE` significa seguir; `SUPPORT`, revisar focos; `VERIFY`, conversar brevemente con el docente.
2. Las `X`: suelen convertirse en acciones concretas y baratas, como ejecutar un validador y guardar su salida.
3. `focusClassIds`: hasta tres temas para repasar; compáralos con tu propia evaluación.
4. Los niveles numéricos, interpretados como señales gruesas, no como ranking de estudiantes.

La metacognición completa el reporte: ¿estás de acuerdo?, ¿qué cuestionas con evidencia?, ¿qué evidencia agregarías?, ¿qué recomendación seguirás? La salida del modelo se conserva íntegra; la lectura crítica se escribe aparte.

**Comprobación:** las X se revisan primero porque señalan evidencia que falta y suele ser recuperable; una objeción es valiosa cuando cita evidencia concreta; el reporte se guarda sin editar y se revisa junto con la metacognición y la evaluación docente.

**Actividad:** elige la X más sencilla y conviértela en evidencia real esta semana: vuelve a ejecutar la comprobación pertinente, guarda su salida y regístrala en tu evidencia de clase 8.

## Lectura: limitaciones y variación entre modelos

Un prompt controla relativamente bien el formato y el procedimiento: esquema JSON, límites de campos, orden de pasos y abstención explícita cuando falta evidencia. Controla peor el juicio, la sensibilidad al fraseo y la consistencia perfecta entre ejecuciones.

El checkpoint asume esas limitaciones: usa niveles enteros para evitar precisión falsa, hace los cálculos con código, permite `X` en vez de forzar una respuesta inventada y deja la decisión final al docente. El modelo inicia el análisis; no decide por sí solo la calificación.

**Comprobación:** los niveles son enteros porque el juicio no admite decimales fiables; el cálculo se saca del modelo porque la aritmética debe ser determinista; el mismo diseño sirve para procesos de revisión o triage si incluye formato verificable, abstención y revisión humana.

**Actividad:** no vuelvas a evaluar tu propio paquete con un segundo modelo. Puedes pedir a dos modelos que expliquen qué hace compatible una migración y comparar claridad y criterios; registra la diferencia sin tratarla como una segunda nota.

## Ticket de salida: 12 preguntas, 5 minutos

Responde individualmente, sin IA y sin abrir el código. Apunta a 1–3 líneas por pregunta; después compara las diez respuestas técnicas con la clave breve. Las preguntas 11 y 12 son personales y no tienen respuesta modelo.

1. ¿Qué es refactorizar y qué no puede cambiar?
2. ¿Cómo detectas que un handler reúne demasiadas responsabilidades?
3. ¿En qué se diferencian cohesión y acoplamiento?
4. ¿Por qué claim es una acción de negocio y no un PATCH genérico?
5. ¿Qué garantiza la FK de `assigned_to` y qué no garantiza?
6. ¿Por qué la migración 005 amplía el CHECK sin editar la 003?
7. ¿Por qué asignación e historial comparten transacción?
8. ¿Por qué la policy devuelve razones y no solo `true/false`?
9. ¿Qué comprueban los checks de frontera del validador actual?
10. ¿Cómo se usa el reporte del checkpoint 1–7 en la evaluación del curso?
11. ¿Qué pediste a la IA durante el taller y qué decisión conservaste tú?
12. ¿Qué parte del módulo entiendes mejor ahora y cuál sigue confusa?

### Clave breve para las preguntas técnicas

1. Cambiar estructura interna sin cambiar rutas, status, bodies ni permisos observables.
2. Describe el archivo; cada “y además” puede señalar otra razón de cambio.
3. Cohesión mira hacia dentro: qué cambia junto. Acoplamiento mira hacia fuera: cuánto conoce de detalles ajenos.
4. Claim expresa intención, aplica reglas de rol/estado/asignación, deriva identidad del token y crea historial atómicamente.
5. La FK garantiza que el UUID referencie un usuario existente; no que sea agente ni que la solicitud esté abierta.
6. Las bases ya aplicaron 003; una migración nueva registra la evolución y se ejecuta en las bases pendientes.
7. Para confirmar asignación y evento juntos o revertir ambos si una escritura falla.
8. Hay razones de rechazo distintas que el service convierte en respuestas HTTP diferentes.
9. El check 12 comprueba routes sin SQL; el 13, service sin dependencias de Express. El check 11 verifica rollback ante FK inválida.
10. Como evidencia de progreso y foco de repaso; una X es evidencia no encontrada, no una sentencia de conocimiento.

Al terminar, conserva tus respuestas 11 y 12 en `class-08-evidence.md`. No copies la clave como si fuera reflexión personal.