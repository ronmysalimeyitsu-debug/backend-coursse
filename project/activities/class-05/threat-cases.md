# Casos de Amenaza y Respuestas del Sistema

A continuación, documentamos cómo reacciona nuestra API frente a distintos escenarios donde un atacante intenta vulnerar la seguridad:

1. **Escalada de privilegios (role escalation):** Si un usuario intenta inyectar `{ "role": "admin" }` durante el registro para darse permisos extra, lo bloqueamos con un `400 + SERVER_CONTROLLED_FIELD`.
2. **Falsificación de autor (forged createdBy):** Si un atacante envía un POST con `{ "createdBy": "uuid" }` para asignar la creación a otra persona, el servidor lo rechaza con `400 + SERVER_CONTROLLED_FIELD`.
3. **Acceso a datos ajenos (foreign ID access):** Si un usuario hace un GET a un ID que no le pertenece, el sistema protege la privacidad devolviendo un `404 + NOT_FOUND`.
4. **Token manipulado (tampered token):** Si alguien altera el contenido del token y rompe la firma, le negamos la entrada inmediatamente con `401 + INVALID_TOKEN`.
5. **Inyección en PATCH (mixed PATCH body):** Si intentan modificar campos que solo maneja el sistema enviando `{ "updatedAt": "fecha" }`, arrojamos un `400 + SERVER_CONTROLLED_FIELD`.
6. **Ausencia de credenciales (missing header):** Si la petición llega directamente sin el header `Authorization`, la frenamos con `401 + UNAUTHORIZED`.
7. **Token vencido (expired token):** Si envían un token que ya superó su tiempo límite, es rechazado con un `401 + INVALID_TOKEN`.
8. **Acción prohibida (forbidden action):** Si alguien sin rol de administrador intenta hacer un DELETE, le cortamos el paso con `403 + FORBIDDEN`.

---

## Análisis de amenaza: Filtración de Token Bearer (RFC 6750)

**Escenario:** Un token de nuestra API queda expuesto en el historial del navegador o en los logs de un proxy intermedio.

**¿Qué podría hacer quien lo encuentre?**
El estándar Bearer establece un principio muy claro: quien "porta" (tiene) el token, es el dueño de la identidad. Si alguien malintencionado logra copiar ese token desde un log, no va a necesitar averiguar la contraseña del usuario. Con solo inyectarlo en el header `Authorization: Bearer <token>`, nuestro servidor lo dejará pasar como si fuera la víctima real, dándole acceso libre a rutas protegidas (como `/requests` o `/auth/me`) para husmear o alterar información.

**¿Durante cuánto tiempo tendrá acceso y qué límite pone el `exp`?**
Ese acceso sin restricciones dura exactamente hasta que el token caduca. Para evitar que el atacante tenga una llave maestra eterna, limitamos esta ventana de vulnerabilidad usando el claim `exp` (expiration) dentro del payload del JWT. 

Esto acorta la vida útil del token a un periodo breve (por ejemplo, apenas 1 hora desde que se emite). En cuanto ese tiempo se agota, la llave deja de funcionar; el servidor la rechaza automáticamente con un `401 INVALID_TOKEN` y el atacante se queda afuera. Es precisamente por este riesgo que es innegociable enviar siempre los tokens a través de canales seguros (HTTPS) y configurarles tiempos de vida muy cortos.