ALTER TABLE tenant_memberships
  ADD CONSTRAINT tenant_memberships_user_tenant_unique UNIQUE (user_id, tenant_id);

ALTER TABLE refresh_tokens
  ADD COLUMN tenant_id uuid;

UPDATE refresh_tokens rt
SET tenant_id = (
  SELECT tm.tenant_id
  FROM tenant_memberships tm
  WHERE tm.user_id = rt.user_id
  ORDER BY tm.joined_at
  LIMIT 1
);

ALTER TABLE refresh_tokens
  ADD CONSTRAINT refresh_tokens_membership_fk
    FOREIGN KEY (user_id, tenant_id)
    REFERENCES tenant_memberships (user_id, tenant_id);
