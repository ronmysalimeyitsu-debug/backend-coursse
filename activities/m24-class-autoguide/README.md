# M24 — Proyecto integrador de backend

## ¿Qué vas a construir?

Durante esta semana construirás individualmente una plataforma multitenant para operar redes de máquinas vending.

El producto final tendrá cuatro piezas:

1. **Admin web:** administración de empresas, usuarios, roles, ubicaciones, máquinas, productos, inventario, órdenes y reportes.
2. **Vending web:** simulador de la máquina y experiencia móvil que abre el QR.
3. **Backend:** API, autenticación, permisos, reglas, transacciones, pagos simulados, despacho, auditoría y reportes.
4. **Base de datos:** PostgreSQL en Supabase, con migraciones, seed e aislamiento por tenant.

No construirás una integración bancaria ni una máquina física. El pago y el despacho serán simulados.

## Objetivo de la clase de hoy

Hoy no tienes que terminar el producto.

Hoy debes:

1. estudiar los conceptos necesarios con Gemini como tutor;
2. comprender la especificación completa;
3. registrar tus dudas y decisiones;
4. preparar el repositorio y la base de datos;
5. diseñar el modelo inicial;
6. ejecutar la primera vertical funcional;
7. dejar un plan verificable para completar el sistema durante la semana.

## Antes de comenzar

Necesitas:

- Node.js instalado;
- Git;
- una cuenta de Supabase;
- un proyecto PostgreSQL en Supabase;
- acceso a Gemini o a otro modelo capaz de seguir el prompt;
- editor de código;
- navegador.

Nunca compartas con una IA:

- contraseñas;
- `.env`;
- JWT secrets;
- connection strings;
- service role keys;
- tokens reales;
- información personal innecesaria.

## Orden obligatorio de hoy

### Fase 1 — Aprender

Tiempo sugerido: 70 minutos.

1. Abre `prompts/01-GEMINI-TUTOR.md`.
2. Copia el prompt completo en una conversación nueva.
3. Adjunta o pega los archivos de `theory/` cuando el tutor los solicite.
4. Trabaja un módulo a la vez.
5. Responde las preguntas con tus palabras.
6. Completa `templates/learning-log.md`.
7. Conserva el reporte final del tutor.

Durante esta fase no debes pedir que Gemini construya el sistema.

### Descanso

Tiempo: 10 minutos.

### Fase 2 — Diseñar y comenzar

Tiempo disponible en clase: 100 minutos.

1. Lee `specification/01-PRODUCT-SCOPE.md`.
2. Revisa arquitectura, datos, permisos, estados y API.
3. Completa `templates/implementation-plan.md`.
4. Crea el repositorio.
5. Configura los cuatro componentes.
6. Conecta Supabase.
7. Crea las primeras migraciones.
8. Implementa el primer flujo vertical.
9. Registra decisiones y uso de IA.
10. Realiza el checkpoint final de clase.

Después de la clase sigue `specification/13-WEEKLY-ROADMAP.md`. Para preparar la entrega usa `specification/14-FINAL-DEMO-AND-DEFENSE.md`.

## Primera vertical recomendada

Antes de salir del aula intenta completar:

```text
Tenant de ejemplo
→ ubicación
→ máquina
→ producto
→ slot con inventario
→ QR o publicCode
→ catálogo público de la máquina
```

Si avanzas más, continúa con creación de orden y reserva de inventario.

## Estructura recomendada del repositorio

```text
m24-vending-platform/
├── apps/
│   ├── api/
│   ├── admin-web/
│   └── vending-web/
├── database/
│   ├── migrations/
│   └── seed/
├── docs/
├── scripts/
├── tests/
├── .env.example
├── package.json
└── README.md
```

Puedes utilizar otra estructura si puedes justificarla.

## Entregables de hoy

```text
docs/
├── learning-log.md
├── implementation-plan.md
├── architecture-decisions.md
├── ai-usage.md
└── class-checkpoint.md
```

Commit esperado:

```text
m24-class-kickoff
```

## Entregables finales

- código fuente de los tres proyectos;
- migraciones y seed;
- `.env.example` sin secretos;
- pruebas;
- documentación;
- historial de decisiones;
- registro de uso de IA;
- evidencia de ejecución;
- video o demostración del flujo completo;
- reporte final.
- salida del validador común.

Tag esperado:

```text
m24-final-submission
```

## Flujo que debe demostrarse

1. Un administrador de plataforma crea o consulta dos tenants.
2. Un administrador de tenant configura ubicación, máquina, productos y stock.
3. La máquina simulada muestra su QR.
4. El comprador escanea el QR desde su teléfono.
5. Consulta el catálogo disponible.
6. Crea una orden.
7. Realiza un pago simulado.
8. La vending recibe el trabajo.
9. La vending simula el despacho.
10. Inventario, orden, pago y auditoría quedan consistentes.
11. El administrador consulta la operación en reportes.
12. Un usuario de otro tenant no puede acceder a esos datos.

## Qué significa trabajar con IA

Puedes utilizar IA para investigar, planificar, programar, probar y revisar.

No puedes entregar silenciosamente algo que no comprendes.

Cada vez que aceptes una propuesta importante debes poder responder:

- ¿Qué problema resuelve?
- ¿Qué archivos cambia?
- ¿Qué alternativa descartaste?
- ¿Qué podría romper?
- ¿Cómo lo verificaste?

## Si te bloqueas

1. Escribe qué intentabas lograr.
2. Copia el mensaje de error sin secretos.
3. Formula dos posibles causas.
4. Busca una evidencia que diferencie las causas.
5. Pide ayuda a la IA mostrando contexto limitado.
6. Verifica la respuesta antes de aplicarla.
7. Registra el aprendizaje.

## Regla final

No se espera que memorices todo.

Sí se espera que puedas navegar tu sistema, explicar sus reglas, encontrar evidencia y comprobar que el resultado funciona.

## Mapa rápido del paquete

- `index.html`: guía interactiva para la sesión de hoy;
- `00-CLASS-PLAN.md`: cronograma de tres horas;
- `prompts/`: tutor de aprendizaje y asistente de implementación;
- `prompts/03-BEHAVIOR-RECOVERY.md`: mecanismo para devolver al asistente al objetivo cuando se desvía;
- `theory/`: diez guías cortas de conceptos;
- `specification/`: alcance, arquitectura, datos, reglas, API, calidad y ruta semanal;
- `templates/`: archivos que debes completar como evidencia;
- `validator/`: comprobador común y sus instrucciones.

