#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // prefer typical private ranges
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(iface.address)) return iface.address;
      }
    }
  }
  // fallback to first non-internal IPv4
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  throw new Error('No LAN IPv4 address found');
}

function updateEnv(filePath, updates) {
  // Prefer writing to an env.local file to avoid changing committed .env used in other contexts.
  const localPath = path.join(path.dirname(filePath), '.env.local');
  let target = localPath;

  // If .env.local doesn't exist but .env does, copy .env -> .env.local first to preserve other keys
  if (!fs.existsSync(target)) {
    const orig = filePath;
    if (fs.existsSync(orig)) {
      fs.copyFileSync(orig, target);
      console.log(`Created ${path.relative(process.cwd(), target)} from ${path.relative(process.cwd(), orig)}`);
    } else {
      // create empty file
      fs.writeFileSync(target, '', 'utf8');
      console.log(`Created empty ${path.relative(process.cwd(), target)}`);
    }
  }

  let content = fs.readFileSync(target, 'utf8');
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const l of lines) {
    const m = l.match(/^\s*([^#=\s]+)=(.*)$/);
    if (m) map[m[1]] = m[2];
  }
  for (const k of Object.keys(updates)) map[k] = updates[k];
  const out = Object.keys(map).map(k => `${k}=${map[k]}`).join('\n') + '\n';
  fs.writeFileSync(target, out, 'utf8');
  console.log(`Updated ${path.relative(process.cwd(), target)}`);
}

function main() {
  const ip = getLanIp();
  console.log('Detected LAN IP:', ip);

  const repoRoot = path.resolve(__dirname, '..');

  const mobileEnv = path.join(repoRoot, 'mobile', '.env');
  const backendEnv = path.join(repoRoot, 'backend', '.env');

  updateEnv(mobileEnv, {
    EXPO_PUBLIC_API_URL: `http://${ip}:5000/api`
  });

  // Update backend FRONTEND_URL (Expo dev tools) and BASE_URL used by uploads
  updateEnv(backendEnv, {
    FRONTEND_URL: `http://${ip}:19006`,
    BASE_URL: `http://${ip}:5000`
  });

  console.log('Done. Restart your servers (backend and Expo) for changes to take effect.');
}

try { main(); } catch (err) { console.error(err.message); process.exit(1); }
