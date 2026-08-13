import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { and, db, eq, matchzyDemos } from '@xom/db';

export const MAX_DEMO_BYTES = 2 * 1024 * 1024 * 1024;

export class DemoTooLargeError extends Error {}
export class InvalidDemoError extends Error {}

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

export async function storeMatchDemo(input: {
  body: ReadableStream<Uint8Array>;
  fileName: string;
  matchId: number;
  mapNumber: number;
  roundNumber?: number;
}) {
  const storageRoot = getDemoStorageRoot();
  const matchDirectory = path.join(storageRoot, String(input.matchId));
  const storageKey = path.posix.join(String(input.matchId), `map-${input.mapNumber}-${randomUUID()}.dem`);
  const finalPath = path.join(storageRoot, storageKey);
  const temporaryPath = path.join(matchDirectory, `.${randomUUID()}.partial`);
  const hash = createHash('sha256');
  let fileSize = 0;
  let signature = Buffer.alloc(0);

  await mkdir(matchDirectory, { recursive: true, mode: 0o750 });
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      fileSize += chunk.length;
      if (fileSize > MAX_DEMO_BYTES) {
        callback(new DemoTooLargeError('Demo exceeds the 2 GiB upload limit'));
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

    const [previous] = await db.select({ storageKey: matchzyDemos.storage_key })
      .from(matchzyDemos)
      .where(and(eq(matchzyDemos.matchid, input.matchId), eq(matchzyDemos.mapnumber, input.mapNumber)))
      .limit(1);

    await rename(temporaryPath, finalPath);
    const sha256 = hash.digest('hex');
    try {
      await db.insert(matchzyDemos).values({
        matchid: input.matchId,
        mapnumber: input.mapNumber,
        roundnumber: input.roundNumber || 0,
        file_name: input.fileName,
        storage_key: storageKey,
        file_size: fileSize,
        sha256,
      }).onDuplicateKeyUpdate({ set: {
        roundnumber: input.roundNumber || 0,
        file_name: input.fileName,
        storage_key: storageKey,
        file_size: fileSize,
        sha256,
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
    return { fileSize, sha256, storageKey };
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}
