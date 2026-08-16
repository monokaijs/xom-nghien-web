import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server, type Socket } from 'node:net';
import { executeRconCommand } from './rcon';

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

function packet(id: number, type: number, body = '') {
  const payload = Buffer.from(body);
  const result = Buffer.alloc(payload.length + 14);
  result.writeInt32LE(payload.length + 10, 0);
  result.writeInt32LE(id, 4);
  result.writeInt32LE(type, 8);
  payload.copy(result, 12);
  return result;
}

function handlePackets(socket: Socket, handler: (id: number, type: number, body: string) => void) {
  let buffered = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buffered = Buffer.concat([buffered, chunk]);
    while (buffered.length >= 4) {
      const size = buffered.readInt32LE(0);
      if (buffered.length < size + 4) return;
      const current = buffered.subarray(0, size + 4);
      buffered = buffered.subarray(size + 4);
      handler(current.readInt32LE(4), current.readInt32LE(8), current.subarray(12, size + 2).toString());
    }
  });
}

async function listen(handler: (socket: Socket) => void) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server address');
  return address.port;
}

describe('executeRconCommand', () => {
  it('authenticates and joins a multipart Source RCON response', async () => {
    const port = await listen((socket) => handlePackets(socket, (id, type, body) => {
      if (type === 3) {
        expect(body).toBe('secret');
        socket.write(packet(id, 2));
      } else if (id === 2) {
        expect(body).toBe('status');
        socket.write(Buffer.concat([packet(2, 0, 'hello '), packet(2, 0, 'world')]));
      } else if (id === 3) {
        socket.write(packet(3, 0));
      }
    }));

    await expect(executeRconCommand({ host: '127.0.0.1', port, password: 'secret' }, 'status'))
      .resolves.toBe('hello world');
  });

  it('rejects an invalid RCON password', async () => {
    const port = await listen((socket) => handlePackets(socket, (_id, type) => {
      if (type === 3) socket.write(packet(-1, 2));
    }));

    await expect(executeRconCommand({ host: '127.0.0.1', port, password: 'wrong' }, 'status'))
      .rejects.toThrow('authentication failed');
  });
});
