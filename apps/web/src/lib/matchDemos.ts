import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat, truncate } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { and, db, eq, matchzyDemos } from '@xom/db';

export const MAX_DEMO_BYTES = 500 * 1024 * 1024;
export const DEMO_UPLOAD_CHUNK_BYTES = 50 * 1024 * 1024;
export const DEMO_SIZE_LIMIT_MESSAGE = 'Demo exceeds the 500 MiB upload limit';

export class DemoTooLargeError extends Error {}
export class InvalidDemoError extends Error {}
export class InvalidDemoChunkError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

export function getDemoStorageRoot() {
  return path.resolve(
    process.env.MATCH_DEMO_STORAGE_DIR
      || path.join(process.cwd(), 'storage', 'match-demos'),
  );
}

export function resolveDemoStoragePath(storageKey: string) {
  const root = getDemoStorageRoot();
  const resolved = path.resolve(root, storageKey);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Demo storage key escapes the configured storage root');
  }

  return resolved;
}

export function sanitizeDemoFileName(value: string | null) {
  if (!value) return null;
  const baseName = path.basename(value).replace(/[^a-zA-Z0-9._-]+/g, '_');
  if (!baseName || !baseName.toLowerCase().endsWith('.dem')) return null;
  return `${baseName.slice(0, -4).slice(0, 251)}.dem`;
}

export interface DemoChunkRange {
  start: number;
  end: number;
  total: number;
}

export function parseDemoChunkRange(value: string | null): DemoChunkRange | null {
  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(value || '');
  if (!match) return null;

  const [, startValue, endValue, totalValue] = match;
  const start = Number(startValue);
  const end = Number(endValue);
  const total = Number(totalValue);
  if (![start, end, total].every(Number.isSafeInteger)
    || start < 0 || end < start || total <= end || total > MAX_DEMO_BYTES
    || end - start + 1 > DEMO_UPLOAD_CHUNK_BYTES) {
    return null;
  }
  return { start, end, total };
}

function uploadSessionPath(uploadId: string, matchId: number, mapNumber: number) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId)) {
    throw new InvalidDemoChunkError('Invalid demo upload ID');
  }
  return path.join(getDemoStorageRoot(), '.uploads', String(matchId), `${mapNumber}-${uploadId}.partial`);
}

async function commitMatchDemo(input: {
  temporaryPath: string;
  fileName: string;
  matchId: number;
  mapNumber: number;
  roundNumber?: number;
  fileSize: number;
  sha256: string;
}) {
  const storageRoot = getDemoStorageRoot();
  const storageKey = path.posix.join(String(input.matchId), `map-${input.mapNumber}-${randomUUID()}.dem`);
  const finalPath = path.join(storageRoot, storageKey);
  const [previous] = await db.select({ storageKey: matchzyDemos.storage_key })
    .from(matchzyDemos)
    .where(and(eq(matchzyDemos.matchid, input.matchId), eq(matchzyDemos.mapnumber, input.mapNumber)))
    .limit(1);

  await mkdir(path.dirname(finalPath), { recursive: true, mode: 0o750 });
  await rename(input.temporaryPath, finalPath);
  try {
    await db.insert(matchzyDemos).values({
      matchid: input.matchId,
      mapnumber: input.mapNumber,
      roundnumber: input.roundNumber || 0,
      file_name: input.fileName,
      storage_key: storageKey,
      file_size: input.fileSize,
      sha256: input.sha256,
    }).onDuplicateKeyUpdate({ set: {
      roundnumber: input.roundNumber || 0,
      file_name: input.fileName,
      storage_key: storageKey,
      file_size: input.fileSize,
      sha256: input.sha256,
      uploaded_at: new Date(),
      parse_status: 'queued',
      parser_version: null,
      parse_attempts: 0,
      parse_started_at: null,
      parsed_at: null,
      parse_error: null,
    } });
  } catch (error) {
    await rm(finalPath, { force: true });
    throw error;
  }

  if (previous?.storageKey && previous.storageKey !== storageKey) {
    await rm(resolveDemoStoragePath(previous.storageKey), { force: true }).catch((error) => {
      console.error('Failed to remove superseded MatchZy demo:', error);
    });
  }
  return { fileSize: input.fileSize, sha256: input.sha256, storageKey };
}

async function inspectDemoFile(filePath: string) {
  const hash = createHash('sha256');
  let fileSize = 0;
  let signature = Buffer.alloc(0);
  for await (const chunk of createReadStream(filePath)) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    fileSize += buffer.length;
    if (fileSize > MAX_DEMO_BYTES) throw new DemoTooLargeError(DEMO_SIZE_LIMIT_MESSAGE);
    if (signature.length < 8) signature = Buffer.concat([signature, buffer.subarray(0, 8 - signature.length)]);
    hash.update(buffer);
  }
  if (fileSize === 0 || signature.toString('ascii') !== 'PBDEMS2\0') {
    throw new InvalidDemoError('Body is not a CS2 demo');
  }
  return { fileSize, sha256: hash.digest('hex') };
}

export async function appendMatchDemoChunk(input: {
  body: ReadableStream<Uint8Array>;
  uploadId: string;
  range: DemoChunkRange;
  fileName: string;
  matchId: number;
  mapNumber: number;
}) {
  const sessionPath = uploadSessionPath(input.uploadId, input.matchId, input.mapNumber);
  await mkdir(path.dirname(sessionPath), { recursive: true, mode: 0o750 });

  let currentSize = 0;
  try {
    currentSize = (await stat(sessionPath)).size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (currentSize !== input.range.start) {
    throw new InvalidDemoChunkError(`Unexpected chunk offset; server has ${currentSize} bytes`, 409);
  }

  const expectedBytes = input.range.end - input.range.start + 1;
  let receivedBytes = 0;
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      receivedBytes += chunk.length;
      if (receivedBytes > expectedBytes) {
        callback(new InvalidDemoChunkError('Chunk is larger than its Content-Range'));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(input.body as never),
      meter,
      createWriteStream(sessionPath, { flags: input.range.start === 0 ? 'wx' : 'a', mode: 0o640 }),
    );
    if (receivedBytes !== expectedBytes) throw new InvalidDemoChunkError('Chunk is smaller than its Content-Range');
    if (input.range.end + 1 < input.range.total) {
      return { complete: false as const, receivedBytes: input.range.end + 1 };
    }

    const inspected = await inspectDemoFile(sessionPath);
    if (inspected.fileSize !== input.range.total) throw new InvalidDemoChunkError('Uploaded demo size does not match Content-Range');
    const stored = await commitMatchDemo({ ...input, temporaryPath: sessionPath, ...inspected });
    return { complete: true as const, ...stored };
  } catch (error) {
    if (error instanceof InvalidDemoError || error instanceof DemoTooLargeError) {
      await rm(sessionPath, { force: true });
    } else {
      // Discard a partial/bad chunk while preserving the previously accepted
      // prefix so a client can retry at the same offset.
      await truncate(sessionPath, currentSize).catch(() => undefined);
    }
    throw error;
  }
}

export async function storeMatchDemo(input: {
  body: ReadableStream<Uint8Array>;
  fileName: string;
  matchId: number;
  mapNumber: number;
  roundNumber?: number;
}) {
  const storageRoot = getDemoStorageRoot();
  const matchDirectory = path.join(storageRoot, String(input.matchId));
  const temporaryPath = path.join(matchDirectory, `.${randomUUID()}.partial`);
  const hash = createHash('sha256');
  let fileSize = 0;
  let signature = Buffer.alloc(0);

  await mkdir(matchDirectory, { recursive: true, mode: 0o750 });
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      fileSize += chunk.length;
      if (fileSize > MAX_DEMO_BYTES) {
        callback(new DemoTooLargeError(DEMO_SIZE_LIMIT_MESSAGE));
        return;
      }
      if (signature.length < 8) signature = Buffer.concat([signature, chunk.subarray(0, 8 - signature.length)]);
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(input.body as never),
      meter,
      createWriteStream(temporaryPath, { flags: 'wx', mode: 0o640 }),
    );
    if (fileSize === 0 || signature.toString('ascii') !== 'PBDEMS2\0') {
      throw new InvalidDemoError('Body is not a CS2 demo');
    }

    const sha256 = hash.digest('hex');
    return await commitMatchDemo({ ...input, temporaryPath, fileSize, sha256 });
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}
