#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const backendDir = path.join(repoRoot, 'backend');
const mobileDir = path.join(repoRoot, 'mobile');

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  return child;
}

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(iface.address)) return iface.address;
      }
    }
  }
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  throw new Error('No LAN IPv4 address found');
}

async function main() {
  // Keep machine-specific LAN settings in .env.local and start both servers from the repo root.
  const ip = getLanIp();
  const ipDetector = run('node', [path.join(repoRoot, 'scripts', 'set-lan-ip.js')], { cwd: repoRoot });

  await new Promise((resolve, reject) => {
    ipDetector.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`LAN IP setup failed with exit code ${code}`));
    });
  });

  const backend = run('npm', ['run', 'dev'], { cwd: backendDir });
  const expo = run('npx', ['expo', 'start', '--host', 'lan', '--port', '8082'], {
    cwd: mobileDir,
    env: {
      REACT_NATIVE_PACKAGER_HOSTNAME: ip
    }
  });

  const children = [backend, expo];
  const shutdown = () => {
    for (const child of children) {
      if (child && !child.killed) child.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const watchExit = child =>
    new Promise(resolve =>
      child.on('exit', code => resolve(code))
    );

  const exitCode = await Promise.race([watchExit(backend), watchExit(expo)]);
  shutdown();
  process.exit(exitCode || 0);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
