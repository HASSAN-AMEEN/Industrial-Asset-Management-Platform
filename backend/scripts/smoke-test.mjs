/**
 * End-to-end smoke test for the Tayyab Traders backend API.
 *
 * Walks a machine through its full lifecycle and exercises every module's
 * endpoints against a running server, printing a pass/fail table with the
 * actual error messages so we can see exactly what is broken.
 *
 * Usage:
 *   node scripts/smoke-test.mjs
 *   BASE=http://localhost:5000 EMAIL=admin@tayyab.com PASSWORD=admin123 node scripts/smoke-test.mjs
 */

const BASE = process.env.BASE || 'http://localhost:5000';
const EMAIL = process.env.EMAIL || 'admin@tayyab.com';
const PASSWORD = process.env.PASSWORD || 'admin123';

let token = null;
const results = [];
const ctx = {}; // shared ids created during the run

const stamp = Date.now().toString(36).toUpperCase();

async function call(method, path, { body, auth = true, query } = {}) {
  const url = new URL(BASE + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, v);

  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

/**
 * Record a test step. `check` may return a string error to mark failure,
 * or throw. Returning nothing = pass.
 */
async function step(module, name, fn) {
  try {
    const err = await fn();
    if (err) {
      results.push({ module, name, ok: false, detail: err });
      console.log(`  ✗ [${module}] ${name} -> ${err}`);
    } else {
      results.push({ module, name, ok: true });
      console.log(`  ✓ [${module}] ${name}`);
    }
  } catch (e) {
    results.push({ module, name, ok: false, detail: e.message });
    console.log(`  ✗ [${module}] ${name} -> ${e.message}`);
  }
}

const fail = (r, label) =>
  `HTTP ${r.status} ${label || ''} ${JSON.stringify(r.data?.message ?? r.data?.error ?? r.data)}`.trim();

async function main() {
  console.log(`\nSmoke testing ${BASE} as ${EMAIL}\n`);

  // ---- Health ----
  await step('health', 'GET /health', async () => {
    const r = await call('GET', '/health', { auth: false });
    if (!r.ok || r.data?.status !== 'OK') return fail(r);
  });

  // ---- Auth ----
  await step('auth', 'POST /api/auth/login', async () => {
    const r = await call('POST', '/api/auth/login', { auth: false, body: { email: EMAIL, password: PASSWORD } });
    if (!r.ok) return fail(r);
    token = r.data?.token || r.data?.data?.token;
    if (!token) return `no token in response: ${JSON.stringify(r.data)}`;
    ctx.userId = r.data?.user?.id || r.data?.data?.user?.id;
  });

  if (!token) {
    console.log('\nCannot continue without auth token. Aborting.\n');
    return report();
  }

  await step('auth', 'GET /api/auth/me', async () => {
    const r = await call('GET', '/api/auth/me');
    if (!r.ok) return fail(r);
  });

  // ---- Dashboard ----
  await step('dashboard', 'GET /api/dashboard', async () => {
    const r = await call('GET', '/api/dashboard');
    if (!r.ok) return fail(r);
  });

  // ---- Notifications ----
  await step('notifications', 'GET /api/notifications/unread-count', async () => {
    const r = await call('GET', '/api/notifications/unread-count');
    if (!r.ok) return fail(r);
  });

  // ---- Training ----
  await step('training', 'GET /api/training', async () => {
    const r = await call('GET', '/api/training');
    if (!r.ok) return fail(r);
  });

  // ---- Warehouses ----
  await step('warehouse', 'GET /api/warehouses', async () => {
    const r = await call('GET', '/api/warehouses');
    if (!r.ok) return fail(r);
    const list = r.data?.data ?? r.data;
    if (Array.isArray(list) && list[0]) ctx.existingWarehouseId = list[0].id;
  });

  await step('warehouse', 'GET /api/warehouses/managers', async () => {
    const r = await call('GET', '/api/warehouses/managers');
    if (!r.ok) return fail(r);
  });

  await step('warehouse', 'POST /api/warehouses (create)', async () => {
    const r = await call('POST', '/api/warehouses', {
      body: { name: `SMOKE WH ${stamp}`, address: 'Test Rd', city: 'Karachi', capacity: 100 },
    });
    if (!r.ok) return fail(r);
    ctx.warehouseId = (r.data?.data ?? r.data)?.id;
    if (!ctx.warehouseId) return `no warehouse id: ${JSON.stringify(r.data)}`;
  });

  await step('warehouse', 'GET /api/warehouses/:id', async () => {
    const id = ctx.warehouseId || ctx.existingWarehouseId;
    if (!id) return 'skipped: no warehouse id';
    const r = await call('GET', `/api/warehouses/${id}`);
    if (!r.ok) return fail(r);
  });

  await step('warehouse', 'GET /api/warehouses/:id/machines', async () => {
    const id = ctx.warehouseId || ctx.existingWarehouseId;
    if (!id) return 'skipped: no warehouse id';
    const r = await call('GET', `/api/warehouses/${id}/machines`);
    if (!r.ok) return fail(r);
  });

  await step('warehouse', 'GET /api/warehouses/:id/inventory', async () => {
    const id = ctx.warehouseId || ctx.existingWarehouseId;
    if (!id) return 'skipped: no warehouse id';
    const r = await call('GET', `/api/warehouses/${id}/inventory`);
    if (!r.ok) return fail(r);
  });

  await step('warehouse', 'PUT /api/warehouses/:id (update)', async () => {
    if (!ctx.warehouseId) return 'skipped: no created warehouse';
    const r = await call('PUT', `/api/warehouses/${ctx.warehouseId}`, {
      body: { name: `SMOKE WH ${stamp} upd`, address: 'Test Rd 2', city: 'Karachi', capacity: 150 },
    });
    if (!r.ok) return fail(r);
  });

  // ---- Clients ----
  await step('client', 'GET /api/clients', async () => {
    const r = await call('GET', '/api/clients');
    if (!r.ok) return fail(r);
  });

  await step('client', 'POST /api/clients (create)', async () => {
    const r = await call('POST', '/api/clients', {
      body: { name: `SMOKE Client ${stamp}`, contact: '0300', address: 'Addr', city: 'Karachi', country: 'PK' },
    });
    if (!r.ok) return fail(r);
    ctx.clientId = (r.data?.data ?? r.data)?.id;
    if (!ctx.clientId) return `no client id: ${JSON.stringify(r.data)}`;
  });

  await step('client', 'GET /api/clients/:id', async () => {
    if (!ctx.clientId) return 'skipped: no client id';
    const r = await call('GET', `/api/clients/${ctx.clientId}`);
    if (!r.ok) return fail(r);
  });

  await step('client', 'PUT /api/clients/:id (update)', async () => {
    if (!ctx.clientId) return 'skipped: no client id';
    const r = await call('PUT', `/api/clients/${ctx.clientId}`, {
      body: { name: `SMOKE Client ${stamp} upd`, contact: '0301', address: 'Addr2', city: 'Lahore', country: 'PK' },
    });
    if (!r.ok) return fail(r);
  });

  // ---- Machines (full lifecycle) ----
  const whForMachine = ctx.warehouseId || ctx.existingWarehouseId;

  await step('machine', 'GET /api/machines', async () => {
    const r = await call('GET', '/api/machines');
    if (!r.ok) return fail(r);
  });

  await step('machine', 'POST /api/machines (create)', async () => {
    if (!whForMachine) return 'skipped: no warehouse';
    const r = await call('POST', '/api/machines', {
      body: { serialNumber: `SMOKE-${stamp}`, model: 'Test Model', category: 'TEST', warehouseId: whForMachine },
    });
    if (!r.ok) return fail(r);
    ctx.machineId = (r.data?.data ?? r.data)?.id;
    if (!ctx.machineId) return `no machine id: ${JSON.stringify(r.data)}`;
  });

  await step('machine', 'GET /api/machines/:id', async () => {
    if (!ctx.machineId) return 'skipped: no machine id';
    const r = await call('GET', `/api/machines/${ctx.machineId}`);
    if (!r.ok) return fail(r);
  });

  await step('machine', 'GET /api/machines/:id/history', async () => {
    if (!ctx.machineId) return 'skipped: no machine id';
    const r = await call('GET', `/api/machines/${ctx.machineId}/history`);
    if (!r.ok) return fail(r);
  });

  await step('machine', 'PUT /api/machines/:id (update fields)', async () => {
    if (!ctx.machineId) return 'skipped: no machine id';
    const r = await call('PUT', `/api/machines/${ctx.machineId}`, {
      body: { serialNumber: `SMOKE-${stamp}`, model: 'Test Model v2', category: 'TEST', warehouseId: whForMachine },
    });
    if (!r.ok) return fail(r);
  });

  await step('machine', 'PATCH /api/machines/:id/status -> RESERVED', async () => {
    if (!ctx.machineId) return 'skipped: no machine id';
    const r = await call('PATCH', `/api/machines/${ctx.machineId}/status`, {
      body: { status: 'RESERVED', comment: 'smoke test reserve' },
    });
    if (!r.ok) return fail(r);
  });

  // Dedicated throwaway machine to cover the DELETE endpoint (kept simple/in-warehouse).
  await step('machine', 'DELETE /api/machines/:id', async () => {
    if (!whForMachine) return 'skipped: no warehouse';
    const c = await call('POST', '/api/machines', {
      body: { serialNumber: `SMOKE-DEL-${stamp}`, model: 'Del Model', category: 'TEST', warehouseId: whForMachine },
    });
    if (!c.ok) return `create-for-delete failed: ${fail(c)}`;
    const delId = (c.data?.data ?? c.data)?.id;
    const r = await call('DELETE', `/api/machines/${delId}`);
    if (!r.ok) return fail(r);
  });

  // ---- Shipment (machine -> client) ----
  await step('shipment', 'GET /api/shipments', async () => {
    const r = await call('GET', '/api/shipments');
    if (!r.ok) return fail(r);
  });

  await step('shipment', 'POST /api/shipments (create to client)', async () => {
    if (!ctx.machineId || !ctx.clientId || !whForMachine) return 'skipped: missing prerequisites';
    const r = await call('POST', '/api/shipments', {
      body: { fromWarehouseId: whForMachine, toClientId: ctx.clientId, machineIds: [ctx.machineId], notes: 'smoke' },
    });
    if (!r.ok) return fail(r);
    ctx.shipmentId = (r.data?.data ?? r.data)?.id;
    if (!ctx.shipmentId) return `no shipment id: ${JSON.stringify(r.data)}`;
  });

  await step('shipment', 'GET /api/shipments/:id', async () => {
    if (!ctx.shipmentId) return 'skipped: no shipment id';
    const r = await call('GET', `/api/shipments/${ctx.shipmentId}`);
    if (!r.ok) return fail(r);
  });

  await step('shipment', 'GET /api/shipments/:id/history', async () => {
    if (!ctx.shipmentId) return 'skipped: no shipment id';
    const r = await call('GET', `/api/shipments/${ctx.shipmentId}/history`);
    if (!r.ok) return fail(r);
  });

  await step('shipment', 'PATCH /api/shipments/:id/status -> DISPATCHED', async () => {
    if (!ctx.shipmentId) return 'skipped: no shipment id';
    const r = await call('PATCH', `/api/shipments/${ctx.shipmentId}/status`, { body: { status: 'DISPATCHED' } });
    if (!r.ok) return fail(r);
  });

  await step('shipment', 'PATCH /api/shipments/:id/deliver', async () => {
    if (!ctx.shipmentId) return 'skipped: no shipment id';
    const r = await call('PATCH', `/api/shipments/${ctx.shipmentId}/deliver`, {
      body: { deliveryConfirmation: 'smoke-signed', notes: 'delivered by smoke test' },
    });
    if (!r.ok) return fail(r);
  });

  // ---- Machine -> INSTALLED (creates installation) ----
  await step('machine', 'PATCH /api/machines/:id/status -> INSTALLED', async () => {
    if (!ctx.machineId) return 'skipped: no machine id';
    const r = await call('PATCH', `/api/machines/${ctx.machineId}/status`, {
      body: {
        status: 'INSTALLED',
        comment: 'smoke install',
        installation: {
          siteAddress: 'Plot 1, Karachi',
          // Exercise the Google Maps link -> coordinates path.
          locationUrl: 'https://www.google.com/maps/place/X/@24.8615,67.0099,17z/data=!3m1!4b1!4m6!3d24.8615!4d67.0099',
          siteNotes: 'smoke',
        },
      },
    });
    if (!r.ok) return fail(r);
    // Confirm the parsed coordinates match the link (not a geocode guess).
    const installed = r.data?.data ?? r.data;
    const inst = installed?.installation;
    if (inst && (Math.abs(inst.latitude - 24.8615) > 1e-4 || Math.abs(inst.longitude - 67.0099) > 1e-4)) {
      return `coordinates from link not applied: got ${inst.latitude},${inst.longitude}`;
    }
  });

  // ---- Installations ----
  await step('installation', 'GET /api/installations', async () => {
    const r = await call('GET', '/api/installations');
    if (!r.ok) return fail(r);
    const list = r.data?.data ?? r.data;
    const mine = Array.isArray(list) ? list.find((i) => i.machine?.id === ctx.machineId || i.machineId === ctx.machineId) : null;
    if (mine) ctx.installationId = mine.id;
  });

  await step('installation', 'GET /api/installations/map', async () => {
    const r = await call('GET', '/api/installations/map');
    if (!r.ok) return fail(r);
  });

  await step('installation', 'GET /api/installations/unmapped', async () => {
    const r = await call('GET', '/api/installations/unmapped');
    if (!r.ok) return fail(r);
  });

  await step('installation', 'GET /api/installations/:id', async () => {
    if (!ctx.installationId) return 'skipped: no installation id';
    const r = await call('GET', `/api/installations/${ctx.installationId}`);
    if (!r.ok) return fail(r);
  });

  // ---- Guard assertions: client/warehouse with an active shipment must be
  // protected (expect a graceful 400, not a raw DB error). ----
  await step('warehouse', 'DELETE /api/warehouses/:id blocked while shipment exists', async () => {
    if (!ctx.warehouseId || !ctx.shipmentId) return 'skipped: no warehouse/shipment';
    const r = await call('DELETE', `/api/warehouses/${ctx.warehouseId}`);
    if (r.ok) return 'expected 400 (warehouse has a shipment) but delete succeeded';
    const msg = String(r.data?.message ?? r.data?.error ?? '');
    if (r.status !== 400) return fail(r, 'expected 400');
    if (/Invalid `|prisma\.|Foreign key/i.test(msg)) return `leaked raw DB error instead of friendly message: ${msg}`;
  });

  await step('client', 'DELETE /api/clients/:id blocked while shipment exists', async () => {
    if (!ctx.clientId || !ctx.shipmentId) return 'skipped: no client/shipment';
    const r = await call('DELETE', `/api/clients/${ctx.clientId}`);
    if (r.ok) return 'expected 400 (client has a shipment) but delete succeeded';
    if (r.status !== 400) return fail(r, 'expected 400');
  });

  // ---- Teardown: remove everything this run created so it stays repeatable.
  // Done via Prisma because shipments have no DELETE endpoint. Best-effort; not
  // counted as API test results. ----
  await teardown();

  report();
}

async function teardown() {
  console.log('\nTeardown (Prisma, best-effort):');
  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  } catch (e) {
    console.log(`  ! could not load Prisma for teardown: ${e.message}`);
    return;
  }
  try {
    if (ctx.shipmentId) {
      await prisma.shipment_status_history.deleteMany({ where: { shipmentId: ctx.shipmentId } });
      await prisma.shipment_items.deleteMany({ where: { shipmentId: ctx.shipmentId } });
      await prisma.shipments.delete({ where: { id: ctx.shipmentId } }).catch(() => {});
    }
    if (ctx.machineId) {
      // Null the active-installation pointer first to break the circular FK
      // (machines.installationId -> installations.id).
      await prisma.machines.update({ where: { id: ctx.machineId }, data: { installationId: null } }).catch(() => {});
      await prisma.machine_status_history.deleteMany({ where: { machineId: ctx.machineId } });
      await prisma.installations.deleteMany({ where: { machineId: ctx.machineId } });
      await prisma.machines.delete({ where: { id: ctx.machineId } }).catch(() => {});
    }
    if (ctx.clientId) await prisma.clients.delete({ where: { id: ctx.clientId } }).catch(() => {});
    if (ctx.warehouseId) await prisma.warehouses.delete({ where: { id: ctx.warehouseId } }).catch(() => {});
    console.log('  ✓ test data removed');
  } catch (e) {
    console.log(`  ! teardown error (non-fatal): ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

function report() {
  const failed = results.filter((r) => !r.ok && !String(r.detail).startsWith('skipped'));
  const skipped = results.filter((r) => String(r.detail).startsWith('skipped'));
  const passed = results.filter((r) => r.ok);

  console.log('\n========== SUMMARY ==========');
  console.log(`Passed:  ${passed.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Failed:  ${failed.length}`);
  if (failed.length) {
    console.log('\n--- FAILURES ---');
    for (const f of failed) console.log(`✗ [${f.module}] ${f.name}\n    ${f.detail}`);
  }
  console.log('=============================\n');
  process.exitCode = failed.length ? 1 : 0;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exitCode = 1;
});
