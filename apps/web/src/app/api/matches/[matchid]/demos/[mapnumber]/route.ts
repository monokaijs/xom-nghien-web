import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { and, db, eq, matchzyDemos } from '@xom/db';
import { resolveDemoStoragePath } from '@/lib/matchDemos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function attachmentHeader(fileName: string) {
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchid: string; mapnumber: string }> },
) {
  const { matchid, mapnumber } = await params;
  if (!/^\d+$/.test(matchid) || !/^\d+$/.test(mapnumber)) {
    return Response.json({ error: 'Invalid demo identifier' }, { status: 400 });
  }

  const matchId = Number(matchid);
  const mapNumber = Number(mapnumber);
  const [demo] = await db
    .select()
    .from(matchzyDemos)
    .where(and(
      eq(matchzyDemos.matchid, matchId),
      eq(matchzyDemos.mapnumber, mapNumber),
    ))
    .limit(1);

  if (!demo) {
    return Response.json({ error: 'Demo not found' }, { status: 404 });
  }

  try {
    const demoPath = resolveDemoStoragePath(demo.storage_key);
    const file = await stat(demoPath);
    const stream = createReadStream(demoPath);

    return new Response(Readable.toWeb(stream) as never, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(file.size),
        'Content-Disposition': attachmentHeader(demo.file_name),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Failed to read MatchZy demo:', error);
    return Response.json({ error: 'Demo file is unavailable' }, { status: 404 });
  }
}
