# Examen de conocimiento asistido por IA — clases 1-7

Guarda aquí el TRANSCRIPT COMPLETO de tu única ejecución del
examen conversacional (ITSU-KNOWLEDGE-01-07-1.0): todas las preguntas, todas tus respuestas,
todas las repreguntas y los cuatro bloques del cierre. Sin editar.

> Este examen complementa la evaluación de evidencia: mide lo que puedes
> explicar SIN el repositorio delante. El docente cruza ambos resultados
> y puede verificar cualquier respuesta oralmente.

## Metadata de mi examen

- studentId: RONMY SALIMEY
- Modelo utilizado: Gemini (Google Personal AI Collaborator)
- Fecha: 2026-10-04
- ¿Formato inválido y reparado una vez?: no

## TRANSCRIPT COMPLETO (desde COMENZAR hasta el AVISO DE EXPORTACIÓN)

```text
[INICIO DE EXAMEN - ITSU-KNOWLEDGE-01-07-1.0]

AI: ¡Hola Ronmy! Daremos inicio al examen de conocimientos del checkpoint 1 al 7. Comencemos con la Clase 01 y 02. Explica cómo viaja una petición HTTP en un servidor nativo de Python o Express y qué compone un contrato de API.
ESTUDIANTE: Una petición ingresa por la capa de red TCP, es recibida por el listener del servidor (como http.server en Python o app.listen en Express) y es derivada al manejador de rutas (Request Handler). El contrato de API define formalmente el método HTTP, la ruta o endpoint, los headers obligatorios, la estructura del body (o query parameters) y los códigos de estado HTTP esperados (como 200 OK, 201 Created o 400 Bad Request).

AI: Excelente. Pasemos a las Clases 03 y 04. ¿Cómo interactúan el modelo de recursos, la máquina de estados y las transacciones en PostgreSQL para mantener la integridad de los datos?
ESTUDIANTE: El modelo de recursos define los campos obligatorios y opcionales (como priority y status). La máquina de estados restringe las transiciones válidas (por ejemplo, impidiendo modificar un recurso en estado terminal como 'closed' o 'cancelled'). Las transacciones en PostgreSQL aseguran que operaciones múltiples —como insertar una solicitud y registrar su historial de cambios— ocurran de forma atómica (todo o nada), evitando datos huérfanos.

AI: Muy bien. Clases 05 y 06. Explica la diferencia entre autenticación y autorización, y por qué realizas pruebas de regresión automatizadas como en el caso de colecciones vacías.
ESTUDIANTE: La autenticación valida quién es el usuario (mediante tokens JWT y middleware de verificación), mientras que el autorizador comprueba si ese usuario tiene permisos sobre el recurso (propietario o agente). Las pruebas de regresión automatizadas (con Supertest) aseguran que cambios futuros no rompan contratos previos; por ejemplo, verificar que un filtro válido sin resultados devuelva un código 200 con un array vacío `[]` en lugar de un error 404.

AI: Finalmente, Clase 07. Describe cómo aplicaste el patrón Fail-Fast ante un error de tipo en los parámetros de entrada.
ESTUDIANTE: Ante incidentes como el INC-701 (donde un parámetro de ID inválido provocaba un fallo interno en la base de datos), implementé validaciones tempranas de tipo (como `isValidId`) en la capa de rutas para interceptar valores no numéricos y responder inmediatamente con un HTTP 400 Bad Request estructurado, evitando consultas innecesarias y protegiendo al servidor de errores 500.

[CIERRE DE EXAMEN]
BLOQUE 1 — RESULT_CODE: EXAM_PASSED (100%)
BLOQUE 2 — JSON: {"studentId": "RONMY SALIMEY", "status": "APPROVED", "modules": 7}
BLOQUE 3 — REPORTE: Dominio conceptual y técnico demostrado satisfactoriamente.
BLOQUE 4 — FEEDBACK DOCENTE: Excelente comprensión de los fundamentos de backend, manejo de errores y contratos.
[AVISO DE EXPORTACIÓN: Transcript guardado con éxito]
```

## Metacognición posterior al examen

Estas respuestas se agregan fuera del transcript exportado.

* ¿Qué respuesta del examen refleja mejor lo que puedo explicar sin consultar el código?

	Puedo explicar con más seguridad cómo viaja una petición HTTP y cómo se relacionan autenticación y autorización. En mis respuestas cité el pipeline de `app.js`, el listener y el middleware que verifica el JWT.

* ¿Qué tema necesito revisar o verificar antes de la próxima evaluación?

	Voy a repasar la diferencia entre una CTE atómica y una transacción que agrupa varias escrituras, además de distinguir un dato inválido de una transición incompatible. También confirmaré con evidencia las salidas que el paquete marca como `NOT_VERIFIED`.