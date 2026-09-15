# Class 06 work log

## Environment

What did I configure?
Which command confirmed that it worked?

## Request flow

Where does the request enter?
Where is authentication checked?
Where is authorization checked?
Where is PostgreSQL accessed?

## Bug fixed

**BUG-106 — Empty filtered collection answers 404**

- **Qué estaba pasando:** `GET /requests?status=closed` devolvía `404` cuando el filtro era válido pero no encontraba solicitudes.
- **Qué debe pasar:** una colección vacía sigue existiendo; debe responder `200` con `[]`.
- **Archivos modificados:** `src/modules/requests/requests.service.js` y `test/requests.test.js`.
- **Prueba de regresión:** `a valid filter with no matches returns an empty array`, que confirma el `200` y el cuerpo `[]`.

Validación: `npm run test:requests` terminó con 7 tests pasados y 0 fallos.

## Pruebas asistidas · matriz de FEATURE-206

Convertí cuatro casos de la matriz en pruebas ejecutables: owner lee su historial (`200`), stranger recibe el mismo `404` que una solicitud inexistente, agent lee cualquier historial (`200`) y una solicitud inexistente responde `404`. Las pruebas preparan usuarios y solicitudes con emails únicos, envían la petición con el token correspondiente y comprueban estado, código de error, tipo de evento y forma del cuerpo. El cleanup común elimina únicamente los IDs creados por la corrida.

Las aserciones no son débiles: no uso solo `assert.ok(response)`; comparo códigos HTTP y, cuando corresponde, `REQUEST_NOT_FOUND`, un arreglo y el tipo del evento. El defecto que cubren es una autorización incorrecta o una diferencia de contrato entre recurso ajeno y recurso inexistente. No prueban paginación ni filtros del historial porque están fuera de alcance.

## Feature implemented

`GET /requests/:id/history` busca la solicitud, reutiliza la política de visibilidad y devuelve sus eventos sin exponer `changedBy` ni información sensible. El propietario puede consultar su solicitud y un agente puede consultar cualquiera; una solicitud inexistente o ajena responde con el mismo `404` del contrato existente. Una solicitud sin eventos responde `200` con `[]`.

Los eventos se ordenan de más antiguo a más reciente mediante `created_at, id`, usando el identificador como desempate estable. La respuesta se transforma a camelCase con `mapHistoryEventRow` y cada tipo expone solo sus campos propios.

## Test explained

Choose one test.
What data does it prepare?
What action does it perform?
What does it check?
Which rule does it protect?

## AI assistance

What did AI help me understand?
What code did it help produce?
What did I verify myself?
What suggestion was incorrect or incomplete?

## Remaining doubt

What part do I still not understand?

## Database migrations reading

Fuente consultada: [Supabase — Database migrations](https://supabase.com/docs/guides/deployment/database-migrations).

- **¿Qué problema resuelven frente a una captura de tablas?** Una migración guarda los cambios del esquema como código, con su intención y su historial. Una captura solo muestra un estado final y no explica cómo llegar a él ni qué cambios ocurrieron.
- **¿Cómo reproducen el esquema?** Otro ambiente puede ejecutar los archivos de migración en el mismo orden y reconstruir las tablas, restricciones e índices registrados.
- **¿Por qué importa el orden?** Las tablas y las claves foráneas tienen dependencias: `requests` necesita `users` y `request_history` necesita `requests` y `users`. Aplicar primero una migración que depende de otra provoca un error.
- **¿Qué pasa si una migración falla a la mitad?** Debe revertirse la transacción completa y no registrarse como aplicada. Después de corregir el problema, se puede ejecutar de nuevo sin dejar un esquema parcial.

### Comparación con `scripts/migrate.js`

- **Coincidencia:** ambos procesos registran las migraciones aplicadas, las ejecutan en orden y omiten las que ya fueron aplicadas. En este proyecto el registro vive en `schema_migrations`; el runner imprime `[SKIPPED]` en una segunda ejecución.
- **Diferencia:** la guía usa la CLI de Supabase (`supabase migration up` y `supabase db reset`), mientras que este taller usa un runner propio de Node con `pg`, una transacción por archivo y migraciones en `database/migrations`.

Comprobación inicial: las dependencias ya fueron instaladas con `npm ci`; en ese momento `npm run db:migrate` no pudo conectarse porque todavía faltaba configurar `DATABASE_URL` en `.env`. El doctor quedó en verde posteriormente.

## Fase 4 · Seeding your database

Fuente consultada: [Supabase — Seeding your database](https://supabase.com/docs/guides/local-development/seeding-your-database).

### Migración o seed

1. `ALTER TABLE requests ADD CONSTRAINT requests_status_check ...` → **Migración**: cambia una regla del esquema.
2. Insertar 6 solicitudes de demostración → **Seed**: agrega datos conocidos.
3. `CREATE INDEX idx_requests_created_by ...` → **Migración**: crea una estructura de acceso.
4. Dar a María el rol `agent` → **Seed**: es un valor de una fila.
5. `CREATE TABLE request_history (...)` → **Migración**: crea una tabla.
6. Poner una password conocida (hasheada) a Ana → **Seed**: prepara datos de demostración, sin guardar el texto plano en la base.

La pregunta decisiva es: **¿describe cómo es la base o qué contiene hoy?** La estructura pertenece a las migraciones; el contenido conocido pertenece al seed.

### Lo que hace `scripts/seed.js`

El seeder corre después de las migraciones y dentro de una transacción. Crea los tres usuarios del taller si no existen, identifica a esos usuarios por emails exclusivos con el sufijo `.seed@example.test`, elimina solo sus solicitudes e historial y vuelve a crear el escenario: 6 solicitudes y sus eventos históricos. No usa `TRUNCATE`, no borra datos de estudiantes y guarda las contraseñas como hashes.

Esto hace reproducible el entorno: al ejecutar `npm run db:seed` otra vez, los usuarios siguen siendo los mismos y el escenario vuelve a quedar con las mismas cantidades, sin duplicar solicitudes.

### Estrategia alternativa de identificación

Una alternativa sería agregar una columna `seed_key` o `scenario_key` con un valor estable por registro, por ejemplo `workshop-class-06-ana`, y definirla como `UNIQUE`. El seeder buscaría por esa clave en lugar del email. El beneficio es que la identidad del dato no depende de un correo que podría cambiar; el riesgo es que requiere una migración adicional y una clave mal elegida o no única podría hacer que el seeder actualice, borre o duplique datos equivocados.

Comprobación inicial: `npm run db:seed` necesitaba `DATABASE_URL` y las migraciones; ambos requisitos quedaron resueltos antes de ejecutar el validador final.

## Cómo leer un error

Ejecuté `npm run exercise:test-failure` y apliqué el método de los 60 segundos:

1. **Nombre del test:** `GET /requests/42 returns the request for its owner`.
2. **Esperado y obtenido:** esperaba `200`, pero obtuvo `404`.
3. **Ubicación de la aserción:** `scripts/fixtures/reading-a-failure.test.js:17:10`.
4. **Fase del fallo:** la respuesta se preparó en **Prepare** mediante `simulatedRequestWithoutAuthHeader()`, que representa una petición sin `Authorization`. No hubo una fase **Act** real; el rojo apareció en **Check**, cuando `assert.equal(response.status, 200)` comparó el `404` con el `200` esperado.
5. **Hipótesis antes de cambiar código:** el `404` no demuestra que la ruta esté rota; la petición simulada no incluye autenticación, por lo que la política de visibilidad responde como si el recurso no estuviera disponible para ese usuario.

No modifiqué el fixture: el fallo es intencional y sirve para practicar la lectura del contrato, el esperado/actual, la línea exacta y el recorrido de preparación antes de tocar la implementación.

## Pruebas como ejemplos ejecutables

### Prueba elegida: `GET /auth/me reports the identity carried by the token`

- **Prepare:** crea un usuario de prueba con `createUser({ name: 'me' })` y obtiene un token con `loginAs(user)`.
- **Act:** envía `GET /auth/me` con `Authorization: Bearer <token>`.
- **Check:** exige `200`, comprueba que el `id` y el rol coincidan con el usuario creado y verifica que `passwordHash` no aparezca en la respuesta.

1. **Regla que protege:** un token válido identifica al usuario correcto y la respuesta pública no expone su hash de contraseña.
2. **Defecto que detectaría y cuál no:** detectaría un token mal interpretado, una identidad incorrecta, un rol incorrecto o una fuga de `passwordHash`. No detectaría por sí sola que otro usuario pueda leer una solicitud ajena ni que falle el registro de cuentas.
3. **¿Podría pasar con el sistema mal?** Sí. Podría devolver `200` con el usuario correcto y aun así omitir una validación en otra ruta, filtrar otro secreto o tener una firma de token débil. Por eso esta prueba protege este contrato, no toda la seguridad de la API.

### Lectura de Node.js Test Runner

- `test('nombre', async () => { ... })` define un caso ejecutable; `node --test` descubre los archivos `*.test.js`.
- `--test-concurrency=1` ejecuta las pruebas de forma serializada. Conviene con una base compartida porque reduce interferencias entre pruebas y hace que el cleanup no compita con otra prueba.
- El hook `after` corre al terminar la suite, también cuando una prueba falla; aquí ejecuta `cleanupCreatedData()` y `closePool()` para borrar los datos creados y cerrar PostgreSQL.
- Un solo archivo se ejecuta con `npm run test:auth`, que usa `node --test --test-concurrency=1 test/auth.test.js`. La suite completa se intenta con `npm test`.

### Ejecución realizada

- `npm run test:auth`: no pudo iniciar los tests porque falta `JWT_SECRET` en `.env`; el módulo `src/modules/auth/token.js` detuvo la carga antes de ejecutar los casos.
- `npm test`: terminó con `0 tests`, `0 pass` y `0 fail`. En Windows, el patrón `'test/*.test.js'` del script quedó entre comillas y Node no recibió los archivos expandidos, por lo que este resultado no demuestra que la suite esté correcta ni que todos los tests hayan corrido.

Después de corregir el entorno, `npm run class-06:doctor` quedó en verde y las pruebas se ejecutaron explícitamente con `node --test --test-concurrency=1 test/auth.test.js test/requests.test.js`.

## Ticket de salida · Clase 06

### Sobre el entorno

**1. ¿Qué hace `npm run db:migrate` y por qué puedes ejecutarlo dos veces sin romper nada?**

Ejecuta los archivos `.sql` de `database/migrations` en orden, dentro de una transacción por migración, y registra sus nombres en `schema_migrations`. En una segunda ejecución reconoce las migraciones aplicadas y las omite.

**2. ¿Qué diferencia hay entre una migración y el seed? ¿Cuál de los dos puedes volver a ejecutar sin pensarlo y por qué?**

La migración define la estructura: tablas, restricciones e índices. El seed coloca datos conocidos para trabajar. Ambos están diseñados para repetirse: la migración omite lo aplicado y el seed identifica sus usuarios, borra solo sus solicitudes e historial y recrea el escenario.

**3. ¿Cuál de estos valores es un secreto real y cuál es dato de demostración: tu `DATABASE_URL`, tu `JWT_SECRET`, la contraseña del taller de Ana? ¿Qué harías si expusieras uno de los reales?**

`DATABASE_URL` y `JWT_SECRET` son secretos reales; la contraseña conocida de Ana es un dato de demostración. Si expusiera uno real, cambiaría inmediatamente la contraseña de la base o generaría un JWT nuevo, actualizaría `.env` y no publicaría el valor anterior.

### Sobre el código

**4. ¿En qué archivo vivía BUG-106 y qué regla del contrato estaba rompiendo?**

La decisión que causaba BUG-106 estaba en `src/modules/requests/requests.service.js`, en `listRequests`. Convertía una lista vacía en `REQUEST_NOT_FOUND`, rompiendo la regla de que un filtro válido sin coincidencias responde `200` con `[]`.

**5. Explica con tus palabras la diferencia entre un filtro válido sin resultados y un recurso que no existe.**

Un filtro válido consulta una colección que sí existe, aunque no encuentre filas; por eso devuelve `200` y `[]`. Un recurso individual inexistente no puede devolverse y responde `404`.

**6. En FEATURE-206, ¿por qué una solicitud ajena responde 404 y no 403? ¿Quién tomó esa decisión?**

Responde `404` para no revelar que la solicitud existe: para el requester ajeno se ve igual que un ID inexistente. La decisión la tomó el contrato existente del proyecto y el ticket; la IA solo ayudó a localizar y reutilizar esa regla.

**7. ¿Qué piezas existentes reutilizaste para el endpoint de historial?**

Reutilicé `findById`, `findHistory`, `mapRequestRow`, `mapHistoryEventRow`, `canViewHistory`, `respondError` y el middleware `authenticate`. Si hubiera escrito todo desde cero, habría duplicado autorización, formato de errores y transformación de datos, aumentando el riesgo de inconsistencias.

### Sobre las pruebas

**8. ¿Qué significan Preparar / Actuar / Comprobar? Señálalas en una prueba tuya.**

Preparar crea el usuario y la solicitud; Actuar envía `GET /requests/:id/history` con el token; Comprobar verifica el estado `200`, el arreglo, el tipo de evento y que no aparezca `changedBy`. Ese patrón está en `the owner can read request history in chronological order`.

**9. ¿Por qué las pruebas crean datos únicos y limpian solo lo que crearon?**

Los identificadores únicos evitan colisiones con otras corridas y con el seed. El cleanup por IDs respeta los datos de estudiantes y del taller; borrar tablas completas podría destruir información ajena y romper las claves foráneas.

**10. Cuando una prueba falló durante el taller, ¿qué leíste primero?**

Leí el nombre del test, el esperado y el actual: el ejercicio esperaba `200` y obtuvo `404`. Después miré archivo y línea y comprobé que la petición simulada no tenía `Authorization`, así que busqué el problema en la preparación y no en la implementación.

### Sobre la IA y sobre mí

**11. Da un ejemplo real de algo que la IA te respondió y que verificaste.**

La IA indicó que el historial debía reutilizar la política existente y ordenar por `created_at, id`. Lo verifiqué leyendo `request.policy.js`, `requests.store.js` y ejecutando el validador, que comprobó owner, stranger, agent, recurso inexistente, orden y ausencia de secretos.

**12. ¿Qué decisión de esta clase no le habrías delegado a la IA?**

No le delegaría compartir o conservar `DATABASE_URL`, `JWT_SECRET` ni contraseñas. Tampoco aceptaría cambiar una expectativa solo para poner la suite en verde: primero revisaría el contrato y la evidencia.

**13. ¿Qué fue lo más difícil y qué harías distinto mañana?**

Lo más difícil fue configurar correctamente `.env` y distinguir el archivo de la raíz del que estaba dentro de `activities/class-06`. Mañana localizaría primero la raíz, ejecutaría el doctor y leería el ticket, la ruta, el servicio, la política, el store y las pruebas antes de editar.
