import "dotenv/config";
import { createHash } from "node:crypto";
import pg from "pg";
import { loadConfig } from "../src/config/env.js";
import { hashPassword } from "../src/security/passwords.js";
import { ensureDefaultRoles, permissionCatalog } from "../src/modules/access/default-roles.js";

const config = loadConfig({ requireAuth: false });
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  options: "-c search_path=m24_class_autoguide,public",
  connectionTimeoutMillis: 5000
});

async function seedTenant(client, values, deviceKey) {
  const tenant = await client.query(
    `INSERT INTO tenants (slug, name)
     VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
     RETURNING id`,
    [values.slug, values.name]
  );
  const tenantId = tenant.rows[0].id;
  const location = await client.query(
    `INSERT INTO locations (tenant_id, code, name, address)
     VALUES ($1, 'MAIN', 'Main location', '{"city":"Demo City"}'::jsonb)
     ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [tenantId]
  );
  const machine = await client.query(
    `INSERT INTO vending_machines
       (tenant_id, location_id, code, public_code, name, device_key_hash)
     VALUES ($1, $2, 'MACHINE-01', $3, $4, $5)
     ON CONFLICT (public_code) DO UPDATE
       SET name = EXCLUDED.name, device_key_hash = EXCLUDED.device_key_hash,
           status = 'active', updated_at = now()
     RETURNING id, public_code`,
    [
      tenantId,
      location.rows[0].id,
      values.publicCode,
      values.machineName,
      createHash("sha256").update(deviceKey).digest("hex")
    ]
  );
  const product = await client.query(
    `INSERT INTO products (tenant_id, sku, name, description, price_minor, currency)
     VALUES ($1, 'DEMO-DRINK', $2, 'Demonstration product', 250, 'USD')
     ON CONFLICT (tenant_id, sku) DO UPDATE
       SET name = EXCLUDED.name, price_minor = EXCLUDED.price_minor, status = 'active'
     RETURNING id`,
    [tenantId, values.productName]
  );
  await client.query(
    `INSERT INTO machine_slots (tenant_id, machine_id, product_id, position, capacity, on_hand)
     VALUES ($1, $2, $3, 'A1', 20, 10)
     ON CONFLICT (tenant_id, machine_id, position) DO UPDATE
       SET product_id = EXCLUDED.product_id, capacity = 20, status = 'active'`,
    [tenantId, machine.rows[0].id, product.rows[0].id]
  );
  return { tenantId, machineId: machine.rows[0].id, publicCode: machine.rows[0].public_code };
}

try {
  const deviceKey = process.env.DEVICE_KEY;
  if (!deviceKey || deviceKey.length < 32) {
    throw new Error("DEVICE_KEY must be set to a value of at least 32 characters before seeding.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [code, description] of permissionCatalog) {
      await client.query(
        `INSERT INTO permissions (code, description) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
        [code, description]
      );
    }

    const tenantA = await seedTenant(client, {
      slug: "m24-demo-alpha",
      name: "M24 Demo Alpha",
      publicCode: "mach-demo-alpha-01",
      machineName: "Alpha demo machine",
      productName: "Demo sparkling water"
    }, deviceKey);
    const tenantB = await seedTenant(client, {
      slug: "m24-demo-beta",
      name: "M24 Demo Beta",
      publicCode: "mach-demo-beta-01",
      machineName: "Beta demo machine",
      productName: "Demo orange juice"
    }, deviceKey);

    const tenantARoles = await ensureDefaultRoles(client, tenantA.tenantId);
    await ensureDefaultRoles(client, tenantB.tenantId);

    const adminEmail = (process.env.DEMO_ADMIN_EMAIL ?? "").trim().toLowerCase();
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const passwordHash = await hashPassword(adminPassword);
      const user = await client.query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, 'M24 Demo Admin')
         ON CONFLICT (lower(email)) DO UPDATE
           SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = now()
         RETURNING id`,
        [adminEmail, passwordHash]
      );
      const membership = await client.query(
        `INSERT INTO tenant_memberships (tenant_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (tenant_id, user_id) DO UPDATE SET status = 'active'
         RETURNING id`,
        [tenantA.tenantId, user.rows[0].id]
      );
      await client.query(
        `INSERT INTO membership_roles (tenant_id, membership_id, role_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [tenantA.tenantId, membership.rows[0].id, tenantARoles.get("tenant_admin")]
      );
    }

    const platformEmail = (process.env.PLATFORM_ADMIN_EMAIL ?? "").trim().toLowerCase();
    const platformPassword = process.env.PLATFORM_ADMIN_PASSWORD;
    if (platformEmail && platformPassword) {
      const passwordHash = await hashPassword(platformPassword);
      const platformUser = await client.query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, 'M24 Platform Admin')
         ON CONFLICT (lower(email)) DO UPDATE
           SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = now()
         RETURNING id`,
        [platformEmail, passwordHash]
      );
      await client.query(
        `INSERT INTO platform_administrators (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [platformUser.rows[0].id]
      );
    }

    await client.query("COMMIT");
    console.log("Seed completed: two tenants, machines, products, slots, and initial stock.");
    console.log(`Public machine codes: ${tenantA.publicCode}, ${tenantB.publicCode}`);
    console.log("DEVICE_KEY is stored as a hash for both seeded demo machines.");
    if (!adminEmail || !adminPassword) {
      console.log("No demo admin was created. Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD to seed a tenant admin.");
    }
    if (!platformEmail || !platformPassword) {
      console.log("No platform administrator was created. Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD to seed one.");
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Seed failed; transaction rolled back. Database error code: ${error.code ?? "unknown"}`);
    process.exitCode = 1;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(`Seed failed. Database error code: ${error.code ?? "unknown"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
