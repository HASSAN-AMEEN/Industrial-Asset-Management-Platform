#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return null;
}

function normalizeBaseUrl(apiUrl) {
  if (!apiUrl) throw new Error('Missing --api-url');
  const trimmed = apiUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

function updateEnv(filePath, updates) {
  const localPath = path.join(path.dirname(filePath), '.env.local');
  if (!fs.existsSync(localPath)) {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, localPath);
    } else {
      fs.writeFileSync(localPath, '', 'utf8');
    }
  }

  const lines = fs.readFileSync(localPath, 'utf8').split(/\r?\n/);
  const map = {};
  for (const line of lines) {
    const match = line.match(/^\s*([^#=\s]+)=(.*)$/);
    if (match) map[match[1]] = match[2];
  }

  for (const key of Object.keys(updates)) {
    map[key] = updates[key];
  }

  const out = Object.keys(map).map(key => `${key}=${map[key]}`).join('\n') + '\n';
  fs.writeFileSync(localPath, out, 'utf8');
  console.log(`Updated ${path.relative(process.cwd(), localPath)}`);
}

function main() {
  const apiUrl = getArg('--api-url');
  const repoRoot = path.resolve(__dirname, '..');
  const mobileEnv = path.join(repoRoot, 'mobile', '.env');
  const backendEnv = path.join(repoRoot, 'backend', '.env');
  const baseUrl = normalizeBaseUrl(apiUrl);

  updateEnv(mobileEnv, {
    EXPO_PUBLIC_API_URL: apiUrl,
  });

  updateEnv(backendEnv, {
    BASE_URL: baseUrl,
  });

  console.log(`Configured demo API URL: ${apiUrl}`);
  console.log(`Configured backend base URL: ${baseUrl}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
