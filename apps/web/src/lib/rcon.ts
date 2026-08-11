import { Socket } from 'node:net';

const AUTH = 3;
const AUTH_RESPONSE = 2;
const COMMAND = 2;
const RESPONSE_VALUE = 0;
const MAX_PACKET_SIZE = 4 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 1024 * 1024;

interface RconPacket {
  id: number;
  type: number;
  body: string;
}

export interface RconConnection {
  host: string;
  port: number;
  password: string;
}

function encodePacket(id: number, type: number, body: string) {
  const payload = Buffer.from(body, 'utf8');
  const packet = Buffer.alloc(payload.length + 14);
  packet.writeInt32LE(payload.length + 10, 0);
  packet.writeInt32LE(id, 4);
  packet.writeInt32LE(type, 8);
  payload.copy(packet, 12);
  return packet;
}

class PacketReader {
  private buffer = Buffer.alloc(0);
  private listeners = new Set<(packet: RconPacket) => void>();
  private errorListeners = new Set<(error: Error) => void>();
  private failedError: Error | null = null;

  push(chunk: Buffer) {
    try {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      while (this.buffer.length >= 4) {
        const size = this.buffer.readInt32LE(0);
        if (size < 10 || size > MAX_PACKET_SIZE) throw new Error('The server returned an invalid RCON packet');
        if (this.buffer.length < size + 4) return;

        const packet = this.buffer.subarray(0, size + 4);
        this.buffer = this.buffer.subarray(size + 4);
        const decoded = {
          id: packet.readInt32LE(4),
          type: packet.readInt32LE(8),
          body: packet.subarray(12, size + 2).toString('utf8'),
        };
        this.listeners.forEach((listener) => listener(decoded));
      }
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error('Invalid RCON response'));
    }
  }

  subscribe(listener: (packet: RconPacket) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeError(listener: (error: Error) => void) {
    this.errorListeners.add(listener);
    if (this.failedError) queueMicrotask(() => listener(this.failedError!));
    return () => this.errorListeners.delete(listener);
  }

  fail(error: Error) {
    if (this.failedError) return;
    this.failedError = error;
    this.errorListeners.forEach((listener) => listener(error));
  }
}

function waitForPacket(reader: PacketReader, predicate: (packet: RconPacket) => boolean, timeoutMs: number) {
  return new Promise<RconPacket>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      unsubscribeError();
      reject(new Error('The RCON server did not respond in time'));
    }, timeoutMs);
    const unsubscribeError = reader.subscribeError((error) => {
      clearTimeout(timeout);
      unsubscribe();
      unsubscribeError();
      reject(error);
    });
    const unsubscribe = reader.subscribe((packet) => {
      if (!predicate(packet)) return;
      clearTimeout(timeout);
      unsubscribe();
      unsubscribeError();
      resolve(packet);
    });
  });
}

async function connect(socket: Socket, host: string, port: number, timeoutMs: number) {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      socket.destroy();
      reject(new Error('Could not connect to the RCON server in time'));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('connect', onConnect);
      socket.off('error', onError);
    };
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    socket.once('connect', onConnect);
    socket.once('error', onError);
    socket.connect(port, host);
  });
}

export async function executeRconCommand(connection: RconConnection, command: string) {
  const socket = new Socket();
  const reader = new PacketReader();
  const timeoutMs = 5_000;
  socket.setNoDelay(true);
  socket.on('data', (chunk) => reader.push(chunk));
  socket.on('error', (error) => reader.fail(error));

  try {
    await connect(socket, connection.host, connection.port, timeoutMs);

    const authResponse = waitForPacket(
      reader,
      (packet) => packet.type === AUTH_RESPONSE && (packet.id === 1 || packet.id === -1),
      timeoutMs,
    );
    socket.write(encodePacket(1, AUTH, connection.password));
    const authenticated = await authResponse;
    if (authenticated.id === -1) throw new Error('RCON authentication failed');

    const output = await new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      let outputSize = 0;
      let idleTimer: NodeJS.Timeout | undefined;
      const hardTimeout = setTimeout(() => finish(new Error('The RCON command timed out')), timeoutMs);

      const finish = (error?: Error) => {
        clearTimeout(hardTimeout);
        if (idleTimer) clearTimeout(idleTimer);
        unsubscribe();
        unsubscribeError();
        if (error) reject(error);
        else resolve(chunks.join(''));
      };

      const unsubscribe = reader.subscribe((packet) => {
        if (packet.id === 3) {
          finish();
          return;
        }
        if (packet.id !== 2 || packet.type !== RESPONSE_VALUE) return;
        outputSize += Buffer.byteLength(packet.body);
        if (outputSize > MAX_OUTPUT_SIZE) {
          finish(new Error('RCON response exceeded the 1 MB limit'));
          return;
        }
        chunks.push(packet.body);
        if (idleTimer) clearTimeout(idleTimer);
        // Source servers do not all implement the terminator packet consistently.
        idleTimer = setTimeout(() => finish(), 250);
      });
      const unsubscribeError = reader.subscribeError((error) => finish(error));

      socket.write(encodePacket(2, COMMAND, command));
      socket.write(encodePacket(3, RESPONSE_VALUE, ''));
    });

    return output;
  } finally {
    socket.destroy();
  }
}
