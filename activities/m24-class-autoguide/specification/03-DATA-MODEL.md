# 03 — Modelo de datos

Utiliza UUIDs o identificadores equivalentes generados por el servidor.

Todas las tablas deben incluir timestamps apropiados. Las tablas operativas incluyen `tenant_id`.

## Plataforma y acceso

### tenants

- id;
- slug unique;
- name;
- status: active/suspended/archived;
- settings jsonb;
- created_at;
- updated_at.

### users

- id;
- email unique;
- password_hash;
- display_name;
- status;
- last_login_at;
- timestamps.

### tenant_memberships

- id;
- tenant_id;
- user_id;
- status;
- joined_at;
- unique `(tenant_id, user_id)`.

### permissions

- id;
- code unique;
- description.

### roles

- id;
- tenant_id nullable only for system templates;
- name;
- description;
- is_system;
- unique `(tenant_id, name)`.

### role_permissions

- role_id;
- permission_id;
- unique pair.

### membership_roles

- membership_id;
- role_id;
- unique pair.

### refresh_tokens

- id;
- user_id;
- family_id;
- token_hash;
- expires_at;
- used_at;
- revoked_at;
- timestamps.

## Operación

### locations

- id;
- tenant_id;
- code;
- name;
- address fields;
- timezone;
- status;
- unique `(tenant_id, code)`.

### vending_machines

- id;
- tenant_id;
- location_id;
- code;
- public_code globally unique;
- name;
- status;
- device_key_hash;
- device_key_version;
- last_heartbeat_at;
- software_version;
- settings jsonb;
- unique `(tenant_id, code)`.

### products

- id;
- tenant_id;
- sku;
- name;
- description;
- price_minor;
- currency;
- image_url nullable;
- status;
- unique `(tenant_id, sku)`.

### machine_slots

- id;
- tenant_id;
- machine_id;
- product_id nullable;
- position;
- capacity;
- on_hand;
- reserved;
- price_override_minor nullable;
- status;
- unique `(tenant_id, machine_id, position)`;
- checks for nonnegative values and capacity.

## Compra

### orders

- id;
- tenant_id;
- machine_id;
- public_token_hash;
- status;
- currency;
- subtotal_minor;
- total_minor;
- reservation_expires_at;
- completed_at;
- cancelled_at;
- timestamps.

### order_items

- id;
- tenant_id;
- order_id;
- product_id;
- slot_id;
- quantity;
- unit_price_minor;
- total_minor;
- product_snapshot jsonb.

### inventory_reservations

- id;
- tenant_id;
- order_id;
- slot_id;
- quantity;
- status;
- expires_at;
- consumed_at;
- released_at;
- unique `(tenant_id, order_id, slot_id)`.

### payments

- id;
- tenant_id;
- order_id;
- provider: simulation;
- external_reference;
- status;
- amount_minor;
- currency;
- scenario;
- failure_code nullable;
- approved_at;
- timestamps.

### dispense_jobs

- id;
- tenant_id;
- machine_id;
- order_id;
- status;
- attempt_count;
- claimed_at;
- started_at;
- completed_at;
- failed_at;
- failure_code;
- payload jsonb;
- unique order where appropriate.

## Evidencia y operación

### inventory_movements

- id;
- tenant_id;
- machine_id;
- slot_id;
- product_id;
- type;
- quantity_delta;
- reason;
- reference_type;
- reference_id;
- actor_type;
- actor_id;
- created_at.

### audit_events

- id;
- tenant_id nullable for platform events;
- actor_type;
- actor_id;
- action;
- resource_type;
- resource_id;
- request_id;
- metadata jsonb;
- created_at.

### idempotency_records

- id;
- tenant_id;
- key;
- operation;
- request_hash;
- status;
- response_status;
- response_body jsonb;
- expires_at;
- unique `(tenant_id, operation, key)`.

## Índices mínimos

- tenant + status para órdenes, máquinas y productos;
- tenant + created_at para reportes;
- machine + status para jobs;
- reservation status + expires_at;
- last_heartbeat_at;
- audit tenant + created_at;
- foreign keys frecuentes.

## Integridad

- totales monetarios en unidades menores enteras;
- currency explícita;
- `reserved <= on_hand`;
- relaciones dentro del mismo tenant verificadas por código y, cuando sea práctico, constraints;
- no hard delete de transacciones financieras u operativas;
- soft delete/status para catálogos referenciados.

