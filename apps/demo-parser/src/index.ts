import { createServer } from 'node:http';
import { pool } from '@xom/db';
import { config } from './config.js';
import { DemoWorker } from './worker.js';

const worker = new DemoWorker();
await worker.start();

const server = createServer((request, response) => {
  if (request.method !== 'GET' || request.url !== '/healthz') {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ ready: true, ...worker.getHealth() }));
});

server.listen(config.port, '0.0.0.0', () => {
  console.info(`Demo parser listening on port ${config.port}`);
});

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  worker.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));
