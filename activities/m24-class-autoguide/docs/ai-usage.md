# Registro de uso de IA

## Herramientas utilizadas

- Asistente de programación Copilot en VS Code para lectura del repositorio, implementación y verificación.
- Node.js, npm, PostgreSQL y navegador integrado para ejecutar pruebas locales.

## Alcance de la asistencia

Se implementaron y revisaron migraciones, seed, autenticación, permisos, aislamiento multitenant, rutas de administración, compra y despacho, reportes, interfaces web y pruebas.

## Decisiones aceptadas

- Aislar M24 en un esquema dedicado al detectar tablas preexistentes en `public`.
- Mantener claves de dispositivo y contraseñas fuera del repositorio y almacenar solo hashes.
- Añadir una pantalla separada para el administrador de plataforma y servir assets same-origin sin relajar CORS para otros orígenes.
- Añadir una prueba de integración ejecutable en vez de depender únicamente de una corrida manual.

## Verificación realizada

- `npm test`: 7 pruebas pasan.
- `npm run test:integration`: pasa contra la API y PostgreSQL sembrados.
- Migración repetida y seed repetido: completan sin error.
- Migraciones `001`–`003` en un esquema temporal vacío: 21 tablas creadas.
- Validador de compra: 11/11 comprobaciones.

## Trabajo que debe completar el estudiante

Este registro describe asistencia técnica, no acredita aprendizaje individual. El estudiante debe añadir con sus propias palabras:

- qué conceptos podía explicar antes y después;
- qué partes del código comprende y cuáles necesita estudiar;
- qué sugerencia rechazó y por qué;
- cómo explicará aislamiento, transacciones, idempotencia y despacho;
- qué preguntas espera responder durante la defensa.
