import { NextRequest, NextResponse } from 'next/server';
import { db, desc, inArray, matchzyDemos, matchzyStatsMaps, matchzyStatsMatches, sql } from '@xom/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = requireAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 100);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const [matches, countResult] = await Promise.all([
    db.select().from(matchzyStatsMatches).orderBy(desc(matchzyStatsMatches.start_time)).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)` }).from(matchzyStatsMatches),
  ]);
  const matchIds = matches.map((match) => match.matchid);
  const [maps, demos] = matchIds.length ? await Promise.all([
    db.select().from(matchzyStatsMaps).where(inArray(matchzyStatsMaps.matchid, matchIds)),
    db.select({
      matchid: matchzyDemos.matchid,
      mapnumber: matchzyDemos.mapnumber,
      fileName: matchzyDemos.file_name,
      fileSize: matchzyDemos.file_size,
      uploadedAt: matchzyDemos.uploaded_at,
      parseStatus: matchzyDemos.parse_status,
      parseError: matchzyDemos.parse_error,
    }).from(matchzyDemos).where(inArray(matchzyDemos.matchid, matchIds)),
  ]) : [[], []];

  const demosByMap = new Map(demos.map((demo) => [`${demo.matchid}:${demo.mapnumber}`, demo]));
  return NextResponse.json({
    matches: matches.map((match) => ({
      ...match,
      maps: maps.filter((map) => map.matchid === match.matchid).map((map) => ({
        ...map,
        demo: demosByMap.get(`${map.matchid}:${map.mapnumber}`) || null,
      })),
    })),
    total: Number(countResult[0]?.total || 0),
    limit,
    offset,
  });
});
