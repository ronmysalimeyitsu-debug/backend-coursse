# Request API — Clase 06 · Tu primer ticket en un backend existente

> Es tu primera semana como desarrollador backend junior. Te asignaron este
> repositorio: administra solicitudes, usuarios, autenticación, permisos e
> historial. Recibiste el código, migraciones, un seeder, algunas pruebas y
> dos tickets. NO recibiste una base de datos configurada: esa parte es tuya.
>
> Puedes usar IA durante todo el proceso. Al terminar, demostrarás que el
> sistema cumple su contrato y explicarás qué cambiaste.

## Tu tablero

```text
[ ] Entorno      .env configurado, doctor conectando
[ ] Migraciones  npm run db:migrate (x2: la segunda omite)
[ ] Seed         npm run db:seed + datos visibles en Supabase
[ ] Aplicación   npm run dev responde
[ ] Pruebas      npm test en verde ANTES de tocar nada
[ ] Bug          tickets/BUG-106.md corregido + prueba de regresión
[ ] Feature      tickets/FEATURE-206.md implementado
[ ] Validación   npm run validate:class-06 → PASSED
[ ] Reflexión    activities/class-06/work-log.md completo
```

## Puesta en marcha

```bash
node --version        # se espera Node 20 o superior
npm install
cp .env.example .env  # Windows cmd: copy .env.example .env
npm run generate:secret   # pega el resultado como JWT_SECRET en .env
# DATABASE_URL: cópiala del diálogo Connect de TU proyecto en Supabase
npm run class-06:doctor
npm run db:migrate
npm run db:seed
npm run class-06:doctor   # ahora: Environment ready
npm test                  # todas verdes ANTES de modificar nada
npm run dev
```

## Comandos del taller

| Comando | Qué hace |
| ------- | -------- |
| `npm run class-06:doctor` | Diagnostica tu entorno sin tocar nada |
| `npm run db:migrate` | Aplica las migraciones pendientes (repetible) |
| `npm run db:seed` | Crea los datos del taller (repetible, no duplica) |
| `npm run generate:secret` | Genera un JWT_SECRET seguro |
| `npm test` | Toda la suite (`test:auth`, `test:requests` por archivo) |
| `npm run exercise:test-failure` | Un fallo controlado para practicar lectura |
| `npm run validate:class-06` | La validación final del taller |
| `npm run dev` | El servidor con recarga (`npm start` sin recarga) |

## Usuarios del seed (credenciales de demostración)

| Email | Password | Rol |
| ----- | -------- | --- |
| `ana.requester.seed@example.test` | `ana clave del taller 06` | requester |
| `luis.requester.seed@example.test` | `luis clave del taller 06` | requester |
| `maria.agent.seed@example.test` | `maria clave del taller 06` | agent |

Son datos de demostración del taller — tu `DATABASE_URL` y tu `JWT_SECRET`,
en cambio, son secretos reales: nunca en Git, nunca en un chat de IA.

## Tus tickets

1. `tickets/BUG-106.md` — una regresión reportada por soporte.
2. `tickets/FEATURE-206.md` — el endpoint de historial que pide producto.

Orden sugerido: entorno completo → suite en verde → BUG-106 → FEATURE-206.

## Si algo falla

`recovery/README.md` indexa la guía de recuperación por síntoma. Regla de
oro: no borres datos, no cambies código para ocultar un error, y ejecuta el
doctor antes de culpar a tu código.

## Reglas de IA

Puedes usar IA para entender archivos, seguir la petición, planificar,
implementar por pasos y generar pruebas. Tú conservas: los códigos HTTP, los
permisos, el ownership, el orden del historial, el formato de errores y la
verificación del resultado. Nunca compartas `DATABASE_URL` ni `JWT_SECRET`
— reemplázalos por `[configured]` al pegar un error.
