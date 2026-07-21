import { createServer } from 'node:http';
import { db, pool, servers } from '@xom/db';
import { config } from './config.js';
import { HeartbeatCache } from './heartbeat-cache.js';
import { queryServerMetadata } from './server-metadata.js';

const cache = new HeartbeatCache(
  () => db.select({
    id: servers.id,
    game: servers.game,
    connectionLink: servers.address,
    metadataUrl: servers.metadataUrl,
  }).from(servers),
  queryServerMetadata,
  config.refreshIntervalMs,
);

cache.start();

const server = createServer((request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' }).end('method not allowed');
    return;
  }

  if (request.url === '/healthz') {
    const snapshot = cache.getSnapshot();
    response.writeHead(snapshot.refreshedAt ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      ready: snapshot.refreshedAt !== null,
      refreshing: snapshot.refreshing,
      refreshedAt: snapshot.refreshedAt,
    }));
    return;
  }

  if (request.url === '/servers') {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    });
    response.end(JSON.stringify(cache.getSnapshot()));
    return;
  }

  response.writeHead(404).end('not found');
});

server.listen(config.port, '0.0.0.0', () => {
  console.info(`Server heartbeats listening on port ${config.port}`);
});

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  cache.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
process.on('unhandledRejection', (error) => console.error('Unhandled rejection:', error));
