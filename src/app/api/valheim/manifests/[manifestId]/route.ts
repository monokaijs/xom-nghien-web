import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { valheimManifests } from '@/lib/db/schema';

function tokenMatches(provided: string, expected: string): boolean {
  const left = Buffer.from(provided, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ manifestId: string }> },
) {
  const { manifestId } = await segmentData.params;
  const rows = await db.select().from(valheimManifests)
    .where(eq(valheimManifests.manifest_id, manifestId)).limit(1);
  const record = rows[0];
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!record || !tokenMatches(token, record.access_token))
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
  if (!record.published_manifest || !record.server_revision)
    return NextResponse.json({ error: 'Manifest has not been published' }, { status: 404 });

  const etag = `"${record.server_revision}"`;
  if (request.headers.get('if-none-match') === etag)
    return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'private, no-cache' } });

  return new NextResponse(record.published_manifest, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-cache',
      ETag: etag,
    },
  });
}
