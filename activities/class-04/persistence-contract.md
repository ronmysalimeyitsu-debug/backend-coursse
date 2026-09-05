# Persistence Contract

* Conexión basada en pool de PostgreSQL utilizando `pg` y la variable de entorno `DATABASE_URL`.
* Garantiza la ejecución atómica de inserciones en la tabla de historial ante cambios de estado.