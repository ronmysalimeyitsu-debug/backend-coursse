# Request API v5 — Starter (Clase 05 · taller autodirigido)

Punto de partida del taller: tu API de la clase 04, con la infraestructura de
la clase 05 preparada. Si tu propio proyecto está sano, puedes continuar sobre
el tuyo copiando las piezas nuevas; este starter es el plan B garantizado.

## Qué está listo y qué te toca

| Pieza | Estado |
| ----- | ------ |
| `database/migrations/001..002` | ✅ De la clase 04 |
| `database/migrations/003..005` | ✅ Listas — **aplícalas en orden** (estación 0) |
| `src/database/` (pool, transaction) | ✅ Listas |
| `src/app-error.js` · `src/http/respond-error.js` | ✅ Errores tipados compartidos (401/403 ya mapeados) |
| `src/modules/auth/password.js` | ✅ Helper scrypt completo — NO diseñes tu propia criptografía |
| `src/middleware/cors.js` | ✅ Para la entrega 05A |
| `scripts/validate-class-05.js` | ✅ La especificación ejecutable del taller |
| `activities/class-05/` | 📝 Estación 1 — diseño ANTES de código |
| `src/modules/users/` | 🔨 Estación 2 (store + mapper) |
| `src/modules/auth/auth.service.js` | 🔨 Estaciones 2, 3 y 4 |
| `src/modules/auth/token.js` | 🔨 Estación 4 (guiado) |
| `src/middleware/authenticate.js` | 🔨 Estación 5 |
| `src/modules/requests/*` | 🔨 Estaciones 6 y 7 (llega como en la clase 04, con notas de evolución) |
| `src/modules/requests/request.policy.js` | 🔨 Estación 7 |

## Estación 0 — Preparar el campo

```bash
npm install
cp .env.example .env    # DATABASE_URL de tu proyecto + JWT_SECRET propio
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
                        # → pega el resultado como JWT_SECRET en .env
npm run db:check
# SQL Editor de Supabase: 003, 004 y 005, en orden
npm run validate:class-05 -- --stage setup
```

## El ciclo de cada estación

```text
leer el requisito → predecir el riesgo → decidir → implementar →
intentar el abuso → npm run validate:class-05 -- --stage <name> → corregir
```

Etapas: `setup` · `access-design` · `register` · `password` · `login` ·
`authentication` · `ownership` · `authorization` · (sin argumentos: boss battle).

## Reglas que no se negocian

* La IA solo después del checkpoint `class-05-access-design`.
* `.env` es local y jamás se sube; `.env.example` solo lleva placeholders.
* Las passwords no se registran en logs ni viajan en respuestas — nunca.
* `createdBy` y `changedBy` salen del token verificado, jamás del body.
* Las reglas de estado de la clase 03 siguen vigentes para todos los roles.

## La prueba reina

```bash
npm run validate:class-05
```

`RESULT: 12/12 · CLASS 05 COMPLETED` — con tu servidor apagado y encendido de
nuevo antes, para recordar que nada vive en memoria.
