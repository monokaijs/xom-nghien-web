import { createServer, type Server } from 'node:http';
import type { Client } from 'discord.js';
import { pingDatabase } from './activity-store.js';
import { log } from './logger.js';

export function startHealthServer(client: Client, port: number): Server {
  const server = createServer(async (request, response) => {
    if (request.url !== '/healthz') {
      response.writeHead(404).end('not found');
      return;
    }
    try {
      await pingDatabase();
      const ready = client.isReady();
      response.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ready, discord: ready, database: true }));
    } catch {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ready: false, discord: client.isReady(), database: false }));
    }
  });
  server.listen(port, '0.0.0.0', () => log('info', 'health_server_started', { port }));
  return server;
}
