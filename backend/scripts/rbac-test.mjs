/**
 * RBAC verification against the SRD §2.1 permission matrix.
 *
 * Ensures a user exists for each role, logs them in, and probes every protected
 * action. We only care whether the request gets PAST the role gate, so:
 *   - HTTP 403 (or 401)  => DENIED by RBAC
 *   - anything else (400 validation / 404 / 2xx) => ALLOWED through the gate
 * Empty bodies are used for write probes so nothing is actually created.
 *
 * Usage: node scripts/rbac-test.mjs
 */

const BASE = process.env.BASE || 'http://localhost:5000';
const DUMMY_ID = '00000000-0000-0000-0000-000000000000';

const USERS = {
  SA: { email: 'admin@tayyab.com', password: 'admin123', role: 'SUPER_ADMIN' },
  WM: { email: 'manager@tayyab.com', password: 'manager123', role: 'WAREHOUSE_MANAGER' },
  SO: { email: 'sales@tayyab.com', password: 'sales123', role: 'SALES_OPS' },
  TECH: { email: 'tech@tayyab.com', password: 'tech123', role: 'TECHNICIAN' },
};
const ROLE_KEYS = ['SA', 'WM', 'SO', 'TECH'];

// expected[probe] = { SA, WM, SO, TECH } where 1 = should be allowed, 0 = should be denied (per SRD)
const PROBES = [
  { key: 'machines: list (view inventory)', method: 'GET', path: '/api/machines', exp: { SA: 1, WM: 1, SO: 1, TECH: 0 } },
  { key: 'machines: create', method: 'POST', path: '/api/machines', body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'machines: update status', method: 'PATCH', path: `/api/machines/${DUMMY_ID}/status`, body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'machines: delete', method: 'DELETE', path: `/api/machines/${DUMMY_ID}`, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'warehouses: list/view', method: 'GET', path: '/api/warehouses', exp: { SA: 1, WM: 1, SO: 1, TECH: 0 } },
  { key: 'warehouses: create', method: 'POST', path: '/api/warehouses', body: {}, exp: { SA: 1, WM: 0, SO: 0, TECH: 0 } },
  { key: 'warehouses: list managers', method: 'GET', path: '/api/warehouses/managers', exp: { SA: 1, WM: 0, SO: 0, TECH: 0 } },
  { key: 'shipments: list', method: 'GET', path: '/api/shipments', exp: { SA: 1, WM: 1, SO: 1, TECH: 0 } },
  { key: 'shipments: create', method: 'POST', path: '/api/shipments', body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'shipments: set status', method: 'PATCH', path: `/api/shipments/${DUMMY_ID}/status`, body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'clients: list', method: 'GET', path: '/api/clients', exp: { SA: 1, WM: 1, SO: 1, TECH: 0 } },
  { key: 'clients: create', method: 'POST', path: '/api/clients', body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'installations: list', method: 'GET', path: '/api/installations', exp: { SA: 1, WM: 1, SO: 1, TECH: 1 } },
  { key: 'installations: map', method: 'GET', path: '/api/installations/map', exp: { SA: 1, WM: 1, SO: 1, TECH: 1 } },
  { key: 'installations: create', method: 'POST', path: '/api/installations', body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 0 } },
  { key: 'installations: update status', method: 'PUT', path: `/api/installations/${DUMMY_ID}`, body: {}, exp: { SA: 1, WM: 1, SO: 0, TECH: 1 } },
  { key: 'training: list', method: 'GET', path: '/api/training', exp: { SA: 1, WM: 1, SO: 1, TECH: 1 } },
  { key: 'training: upload', method: 'POST', path: '/api/training', body: {}, exp: { SA: 1, WM: 0, SO: 0, TECH: 0 } },
  { key: 'dashboard: view', method: 'GET', path: '/api/dashboard', exp: { SA: 1, WM: 1, SO: 1, TECH: 1 } },
  { key: 'users: list (manage users)', method: 'GET', path: '/api/users', exp: { SA: 1, WM: 0, SO: 0, TECH: 0 } },
  { key: 'users: create', method: 'POST', path: '/api/users', body: {}, exp: { SA: 1, WM: 0, SO: 0, TECH: 0 } },
];

async function ensureUsers() {
  const { PrismaClient } = await import('@prisma/client');
  const bcrypt = (await import('bcryptjs')).default;
  const prisma = new PrismaClient();
  try {
    // Ensure a warehouse exists to attach the WM to.
    let warehouse = await prisma.warehouses.findFirst();
    if (!warehouse) {
      warehouse = await prisma.warehouses.create({
        data: { name: 'RBAC Test WH', address: 'x', city: 'Karachi', updatedAt: new Date() },
      });
    }

    for (const key of ROLE_KEYS) {
      const u = USERS[key];
      const existing = await prisma.users.findUnique({ where: { email: u.email } });
      if (!existing) {
        await prisma.users.create({
          data: {
            email: u.email,
            password: await bcrypt.hash(u.password, 10),
            role: u.role,
            warehouseId: key === 'WM' ? warehouse.id : null,
            updatedAt: new Date(),
          },
        });
        console.log(`  created ${u.role} (${u.email})`);
      } else if (key === 'WM' && !existing.warehouseId) {
        await prisma.users.update({ where: { id: existing.id }, data: { warehouseId: warehouse.id } });
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return data.token || data.data?.token || null;
}

async function probe(token, p) {
  const res = await fetch(BASE + p.path, {
    method: p.method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: p.body !== undefined ? JSON.stringify(p.body) : undefined,
  });
  // Allowed through the gate unless explicitly forbidden/unauthorized.
  return res.status !== 403 && res.status !== 401;
}

async function main() {
  console.log(`\nRBAC test against ${BASE}\nEnsuring role users exist...`);
  await ensureUsers();

  const tokens = {};
  for (const key of ROLE_KEYS) {
    tokens[key] = await login(USERS[key].email, USERS[key].password);
    if (!tokens[key]) {
      console.log(`\n✗ Could not log in ${key} (${USERS[key].email}). Aborting.`);
      process.exitCode = 1;
      return;
    }
  }

  const mark = (ok) => (ok ? '✓' : '·');
  const header = 'Action'.padEnd(34) + ROLE_KEYS.map((r) => r.padEnd(6)).join('');
  console.log(`\n${header}`);
  console.log('-'.repeat(header.length));

  const mismatches = [];
  for (const p of PROBES) {
    const cells = [];
    for (const key of ROLE_KEYS) {
      const allowed = await probe(tokens[key], p);
      const expected = !!p.exp[key];
      const isMismatch = allowed !== expected;
      if (isMismatch) {
        mismatches.push(
          `${p.key} → ${key}: expected ${expected ? 'ALLOW' : 'DENY'} but got ${allowed ? 'ALLOW' : 'DENY'}`
        );
      }
      // Show actual with a ! when it diverges from SRD expectation.
      cells.push(`${mark(allowed)}${isMismatch ? '!' : ' '}`.padEnd(6));
    }
    console.log(p.key.padEnd(34) + cells.join(''));
  }

  console.log('\nLegend: ✓ allowed · denied   (! = differs from SRD expectation)');
  console.log(`Roles: SA=SuperAdmin WM=WarehouseManager SO=Sales/Ops TECH=Technician\n`);

  if (mismatches.length === 0) {
    console.log('✅ RBAC matches the SRD matrix exactly.\n');
  } else {
    console.log(`⚠️  ${mismatches.length} mismatch(es) vs SRD:`);
    for (const m of mismatches) console.log(`  - ${m}`);
    console.log('');
  }
  process.exitCode = mismatches.length ? 1 : 0;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exitCode = 1;
});
