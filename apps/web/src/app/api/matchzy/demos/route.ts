import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { and, db, eq, matchzyDemos } from '@xom/db';
import { MAX_DEMO_BYTES, getDemoStorageRoot, resolveDemoStoragePath } from '@/lib/matchDemos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

class DemoTooLargeError extends Error {}
class InvalidDemoError extends Error {}

function hasValidUploadToken(authorization: string | null) {
  const expected = process.env.MATCHZY_UPLOAD_TOKEN;
  const supplied = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function parseIntegerHeader(value: string | null, minimum: number, maximum: number) {
  if (!value || !/^-?\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

function sanitizeDemoFileName(value: string | null) {
  if (!value) return null;
  const baseName = path.basename(value).replace(/[^a-zA-Z0-9._-]+/g, '_');
  if (!baseName || !baseName.toLowerCase().endsWith('.dem')) return null;
  return `${baseName.slice(0, -4).slice(0, 251)}.dem`;
}

export async function POST(request: Request) {
  if (!hasValidUploadToken(request.headers.get('authorization'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fileName = sanitizeDemoFileName(request.headers.get('MatchZy-FileName'));
  const matchId = parseIntegerHeader(request.headers.get('MatchZy-MatchId'), 1, 2_147_483_647);
  const mapNumber = parseIntegerHeader(request.headers.get('MatchZy-MapNumber'), 0, 127);
  const roundNumber = parseIntegerHeader(request.headers.get('MatchZy-RoundNumber') || '0', 0, 2_147_483_647);
  const contentLength = Number(request.headers.get('content-length') || '0');

  if (!fileName || matchId === null || mapNumber === null || roundNumber === null) {
    return Response.json({ error: 'Invalid MatchZy demo headers' }, { status: 400 });
  }
  if (!request.body) {
    return Response.json({ error: 'Demo body is required' }, { status: 400 });
  }
  if (Number.isFinite(contentLength) && contentLength > MAX_DEMO_BYTES) {
    return Response.json({ error: 'Demo exceeds the 2 GiB upload limit' }, { status: 413 });
  }

  const storageRoot = getDemoStorageRoot();
  const matchDirectory = path.join(storageRoot, String(matchId));
  const storageKey = path.posix.join(String(matchId), `map-${mapNumber}-${randomUUID()}.dem`);
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
        callback(new DemoTooLargeError('Demo exceeds the upload limit'));
        return;
      }

      if (signature.length < 8) {
        signature = Buffer.concat([signature, chunk.subarray(0, 8 - signature.length)]);
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(request.body as never),
      meter,
      createWriteStream(temporaryPath, { flags: 'wx', mode: 0o640 }),
    );

    if (fileSize === 0 || signature.toString('ascii') !== 'PBDEMS2\0') {
      throw new InvalidDemoError('Body is not a CS2 demo');
    }

    const [previous] = await db
      .select({ storageKey: matchzyDemos.storage_key })
      .from(matchzyDemos)
      .where(and(
        eq(matchzyDemos.matchid, matchId),
        eq(matchzyDemos.mapnumber, mapNumber),
      ))
      .limit(1);

    await rename(temporaryPath, finalPath);
    const sha256 = hash.digest('hex');

    try {
      await db.insert(matchzyDemos).values({
        matchid: matchId,
        mapnumber: mapNumber,
        roundnumber: roundNumber,
        file_name: fileName,
        storage_key: storageKey,
        file_size: fileSize,
        sha256,
      }).onDuplicateKeyUpdate({
        set: {
          roundnumber: roundNumber,
          file_name: fileName,
          storage_key: storageKey,
          file_size: fileSize,
          sha256,
          uploaded_at: new Date(),
        },
      });
    } catch (error) {
      await rm(finalPath, { force: true });
      throw error;
    }

    if (previous?.storageKey && previous.storageKey !== storageKey) {
      try {
        await rm(resolveDemoStoragePath(previous.storageKey), { force: true });
      } catch (error) {
        console.error('Failed to remove superseded MatchZy demo:', error);
      }
    }

    return Response.json({ matchId, mapNumber, fileName, fileSize }, { status: 201 });
  } catch (error) {
    await rm(temporaryPath, { force: true });
    if (error instanceof DemoTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }
    if (error instanceof InvalidDemoError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to store MatchZy demo:', error);
    return Response.json({ error: 'Failed to store demo' }, { status: 500 });
  }
}
