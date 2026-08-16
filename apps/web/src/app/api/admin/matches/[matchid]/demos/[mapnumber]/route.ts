import { rm } from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { and, db, eq, matchzyDemos, matchzyStatsMaps } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import {
  DemoTooLargeError,
  DEMO_SIZE_LIMIT_MESSAGE,
  InvalidDemoChunkError,
  InvalidDemoError,
  MAX_DEMO_BYTES,
  appendMatchDemoChunk,
  parseDemoChunkRange,
  resolveDemoStoragePath,
  sanitizeDemoFileName,
  storeMatchDemo,
} from '@/lib/matchDemos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function identifiers(context: { params: Promise<{ matchid: string; mapnumber: string }> }) {
  return context.params.then(({ matchid, mapnumber }) => ({ matchId: Number(matchid), mapNumber: Number(mapnumber) }));
}

function validIdentifiers(matchId: number, mapNumber: number) {
  return Number.isSafeInteger(matchId) && matchId > 0 && Number.isSafeInteger(mapNumber) && mapNumber >= 0 && mapNumber <= 127;
}

export const POST = requireAdmin(async (request: NextRequest, _user, context) => {
  const { matchId, mapNumber } = await identifiers(context);
  if (!validIdentifiers(matchId, mapNumber)) return NextResponse.json({ error: 'Invalid demo identifier' }, { status: 400 });
  const encodedFileName = request.headers.get('x-demo-file-name');
  let decodedFileName: string | null = null;
  try {
    decodedFileName = encodedFileName ? decodeURIComponent(encodedFileName) : null;
  } catch {
    return NextResponse.json({ error: 'Invalid demo file name' }, { status: 400 });
  }
  const fileName = sanitizeDemoFileName(decodedFileName);
  if (!fileName || !request.body) return NextResponse.json({ error: 'A valid .dem file is required' }, { status: 400 });
  const contentLength = Number(request.headers.get('content-length') || '0');
  const uploadId = request.headers.get('x-demo-upload-id');
  const chunkRange = uploadId ? parseDemoChunkRange(request.headers.get('content-range')) : null;
  if (uploadId && !chunkRange) return NextResponse.json({ error: 'Invalid demo chunk range' }, { status: 400 });
  if (!uploadId && Number.isFinite(contentLength) && contentLength > MAX_DEMO_BYTES) {
    return NextResponse.json({ error: DEMO_SIZE_LIMIT_MESSAGE }, { status: 413 });
  }

  const [map, existing] = await Promise.all([
    db.select({ matchid: matchzyStatsMaps.matchid }).from(matchzyStatsMaps)
      .where(and(eq(matchzyStatsMaps.matchid, matchId), eq(matchzyStatsMaps.mapnumber, mapNumber))).limit(1),
    db.select({ id: matchzyDemos.id }).from(matchzyDemos)
      .where(and(eq(matchzyDemos.matchid, matchId), eq(matchzyDemos.mapnumber, mapNumber))).limit(1),
  ]);
  if (!map[0]) return NextResponse.json({ error: 'Match map not found' }, { status: 404 });
  if (existing[0]) return NextResponse.json({ error: 'This map already has a demo' }, { status: 409 });

  try {
    if (uploadId && chunkRange) {
      const result = await appendMatchDemoChunk({
        body: request.body,
        uploadId,
        range: chunkRange,
        fileName,
        matchId,
        mapNumber,
      });
      return NextResponse.json(
        result.complete
          ? { demo: { fileName, fileSize: result.fileSize } }
          : { receivedBytes: result.receivedBytes },
        { status: result.complete ? 201 : 202 },
      );
    }
    const stored = await storeMatchDemo({ body: request.body, fileName, matchId, mapNumber });
    return NextResponse.json({ demo: { fileName, fileSize: stored.fileSize } }, { status: 201 });
  } catch (error) {
    if (error instanceof DemoTooLargeError) return NextResponse.json({ error: error.message }, { status: 413 });
    if (error instanceof InvalidDemoChunkError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof InvalidDemoError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Failed to upload admin match demo:', error);
    return NextResponse.json({ error: 'Failed to store demo' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (_request: NextRequest, _user, context) => {
  const { matchId, mapNumber } = await identifiers(context);
  if (!validIdentifiers(matchId, mapNumber)) return NextResponse.json({ error: 'Invalid demo identifier' }, { status: 400 });

  const [[map], [demo]] = await Promise.all([
    db.select({ matchid: matchzyStatsMaps.matchid }).from(matchzyStatsMaps)
      .where(and(eq(matchzyStatsMaps.matchid, matchId), eq(matchzyStatsMaps.mapnumber, mapNumber))).limit(1),
    db.select().from(matchzyDemos)
      .where(and(eq(matchzyDemos.matchid, matchId), eq(matchzyDemos.mapnumber, mapNumber))).limit(1),
  ]);
  if (!map) return NextResponse.json({ error: 'Match map not found' }, { status: 404 });
  if (!demo) return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
  if (demo.parse_status !== 'complete') {
    return NextResponse.json({ error: 'Demo cannot be deleted until processing is complete' }, { status: 409 });
  }

  try {
    await rm(resolveDemoStoragePath(demo.storage_key), { force: true });
  } catch (error) {
    console.error('Failed to remove processed demo file:', error);
    return NextResponse.json({ error: 'Demo file could not be removed' }, { status: 500 });
  }
  await db.delete(matchzyDemos).where(eq(matchzyDemos.id, demo.id));
  return NextResponse.json({ success: true });
});
