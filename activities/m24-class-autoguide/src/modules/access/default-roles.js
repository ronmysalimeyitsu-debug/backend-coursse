export const permissionCatalog = [
  ["tenants.read", "Read tenant records"],
  ["tenants.manage", "Manage tenant lifecycle"],
  ["members.read", "Read tenant members"],
  ["members.manage", "Manage tenant members"],
  ["roles.read", "Read roles"],
  ["roles.manage", "Manage roles"],
  ["locations.read", "Read locations"],
  ["locations.manage", "Manage locations"],
  ["machines.read", "Read machines"],
  ["machines.manage", "Manage machines"],
  ["machines.credentials.rotate", "Rotate machine device credentials"],
  ["products.read", "Read products"],
  ["products.manage", "Manage products"],
  ["inventory.read", "Read inventory"],
  ["inventory.restock", "Restock inventory"],
  ["inventory.adjust", "Adjust inventory"],
  ["orders.read", "Read orders"],
  ["orders.manage", "Manage orders"],
  ["payments.read", "Read payments"],
  ["dispensing.read", "Read dispense jobs"],
  ["dispensing.retry", "Retry dispense jobs"],
  ["reports.read", "Read reports"],
  ["audit.read", "Read audit events"],
  ["settings.manage", "Manage tenant settings"]
];

export const defaultRoles = [
  { name: "tenant_admin", description: "Tenant administrator", permissions: permissionCatalog.map(([code]) => code) },
  {
    name: "operator",
    description: "Operations operator",
    permissions: ["locations.read", "machines.read", "machines.manage", "machines.credentials.rotate", "inventory.read", "inventory.restock", "orders.read", "orders.manage", "payments.read", "dispensing.read", "dispensing.retry", "reports.read"]
  },
  {
    name: "inventory_manager",
    description: "Inventory and product manager",
    permissions: ["products.read", "products.manage", "inventory.read", "inventory.restock", "inventory.adjust", "reports.read"]
  },
  {
    name: "analyst",
    description: "Read-only analyst",
    permissions: ["locations.read", "machines.read", "products.read", "inventory.read", "orders.read", "payments.read", "dispensing.read", "reports.read", "audit.read"]
  }
];

export async function ensureDefaultRoles(client, tenantId) {
  const roles = new Map();
  for (const template of defaultRoles) {
    const role = await client.query(
      `INSERT INTO roles (tenant_id, name, description, is_system)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (tenant_id, lower(name)) WHERE tenant_id IS NOT NULL
       DO UPDATE SET description = EXCLUDED.description, is_system = true
       RETURNING id`,
      [tenantId, template.name, template.description]
    );
    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [role.rows[0].id]);
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT $1, id FROM permissions WHERE code = ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [role.rows[0].id, template.permissions]
    );
    roles.set(template.name, role.rows[0].id);
  }
  return roles;
}
