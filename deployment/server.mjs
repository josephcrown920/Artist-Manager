import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'artifacts/api-server/package.json'));
const express = require('express');
const port = Number(process.env.PORT || 10000);
const apiPort = Number(process.env.INTERNAL_API_PORT || 3001);
if (!Number.isInteger(port) || !Number.isInteger(apiPort) || port === apiPort) {
  throw new Error('PORT and INTERNAL_API_PORT must be different valid ports');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

// Synchronize the schema before accepting traffic. Do not enable destructive pushes.
if (process.env.HOSTING_SCHEMA_PUSH !== '0') {
  const pnpm = path.join(root, '.local/hosting-tools/node_modules/.bin/pnpm');
  const migration = spawn(pnpm, ['--filter', '@workspace/db', 'run', 'push'], {
    cwd: root, env: process.env, stdio: 'inherit',
  });
  await new Promise((resolve, reject) => {
    migration.once('error', reject);
    migration.once('exit', code => code === 0 ? resolve() : reject(new Error(`Schema push failed: ${code}`)));
  });
}
const api = spawn(process.execPath, ['--enable-source-maps', 'dist/index.mjs'], {
  cwd: path.join(root, 'artifacts/api-server'),
  env: { ...process.env, PORT: String(apiPort) }, stdio: 'inherit',
});
api.once('error', err => { console.error(err); process.exit(1); });
api.once('exit', code => process.exit(code || 1));
let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const response = await fetch(`http://127.0.0.1:${apiPort}/api/healthz`);
    if (response.ok && (await response.json()).status === 'ok') { ready = true; break; }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) { api.kill(); throw new Error('API did not become ready'); }
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  if (req.path !== '/api' && !req.path.startsWith('/api/')) return next();
  const upstream = http.request({
    hostname: '127.0.0.1', port: apiPort, path: req.originalUrl,
    method: req.method, headers: { ...req.headers, host: `127.0.0.1:${apiPort}` },
  }, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'API unavailable' });
    else res.destroy();
  });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});
const manager = path.join(root, 'artifacts/manager/dist/public');
const rudy = path.join(root, 'artifacts/rudy/dist/public');
app.use('/manager', express.static(manager));
app.use('/manager', (req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) return res.sendFile(path.join(manager, 'index.html'));
  next();
});
app.use(express.static(rudy));
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) return res.sendFile(path.join(rudy, 'index.html'));
  next();
});
const server = app.listen(port, '0.0.0.0', () => console.log(`Hosting server ready on ${port}`));
server.on('error', err => { console.error(err); api.kill(); process.exit(1); });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { server.close(); api.kill(signal); });
}
