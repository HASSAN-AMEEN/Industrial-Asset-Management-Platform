/**
 * Validates that the Neon DIRECT (non-pooler) endpoint can run Prisma interactive
 * transactions reliably, and contrasts it with the current pooled endpoint.
 *
 * Reads DATABASE_URL from backend/.env (no credentials on the command line),
 * derives the direct endpoint by removing "-pooler", and stress-tests both.
 *
 * Usage: node scripts/test-direct-db.mjs
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pooled = process.env.DATABASE_URL;
if (!pooled) {
  console.log('DATABASE_URL not found in .env');
  process.exit(1);
}
const direct = pooled.replace('-pooler', '');

const N = 12;

async function stress(label, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  let ok = 0;
  let fail = 0;
  let firstError = '';
  for (let i = 0; i < N; i++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.machines.count();
          await tx.warehouses.count();
          await tx.installations.count();
        },
        { timeout: 15000, maxWait: 10000 }
      );
      ok++;
      process.stdout.write('.');
    } catch (e) {
      fail++;
      process.stdout.write('X');
      if (!firstError) firstError = String(e.message).slice(0, 160);
    }
  }
  console.log(`\n${label}: ${ok}/${N} ok, ${fail} failed${firstError ? `  (first error: ${firstError})` : ''}`);
  await prisma.$disconnect();
  return fail;
}

(async () => {
  const isPooler = pooled.includes('-pooler');
  console.log(`Pooled URL is ${isPooler ? '' : 'NOT '}a -pooler endpoint.\n`);
  console.log('Testing CURRENT (pooled) endpoint:');
  await stress('  pooled', pooled);
  console.log('\nTesting DIRECT (non-pooler) endpoint:');
  const directFails = await stress('  direct', direct);
  console.log('');
  process.exitCode = directFails ? 1 : 0;
})();
