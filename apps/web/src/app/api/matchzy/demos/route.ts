import { timingSafeEqual } from 'node:crypto';
import { MAX_DEMO_BYTES, DemoTooLargeError, InvalidDemoError, sanitizeDemoFileName, storeMatchDemo } from '@/lib/matchDemos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  if (!hasValidUploadToken(request.headers.get('authorization'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = process.env.MATCHZY_DATABASE_PUBLIC_HOST;
  if (!host) {
    return Response.json({ error: 'Public MatchZy database host is not configured' }, { status: 503 });
  }

  return Response.json({ host, port: 27044 });
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

  try {
    const { fileSize } = await storeMatchDemo({ body: request.body, fileName, matchId, mapNumber, roundNumber });
    return Response.json({ matchId, mapNumber, fileName, fileSize, parseStatus: 'queued' }, { status: 201 });
  } catch (error) {
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
