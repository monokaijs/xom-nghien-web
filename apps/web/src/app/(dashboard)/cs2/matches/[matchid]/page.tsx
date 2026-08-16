import { notFound } from 'next/navigation';
import {
  db,
  matchDemoEvents,
  matchDemoRounds,
  matchzyDemos,
  matchzyStatsMaps,
  matchzyStatsMatches,
  matchzyStatsPlayers,
  sql,
  userInfo,
  xnRatingLedger,
  xnRatings,
} from '@xom/db';
import { buildPlayerAnalytics, type RawPlayerAnalysisEvent } from '@/lib/cs2/playerAnalytics';
import { MatchDetailView, type MatchDetailData } from './MatchDetailView';

export const dynamic = 'force-dynamic';

async function getMatchData(rawMatchId: string): Promise<MatchDetailData | null> {
  if (!/^\d+$/.test(rawMatchId)) return null;
  const matchId = Number(rawMatchId);
  if (!Number.isSafeInteger(matchId) || matchId <= 0) return null;

  const [matchResult, mapsResult, playersResult, demosResult, roundsResult, eventsResult] = await Promise.all([
    db.execute(sql`
      SELECT * FROM ${matchzyStatsMatches}
      WHERE matchid = ${matchId} LIMIT 1
    `),
    db.execute(sql`
      SELECT * FROM ${matchzyStatsMaps}
      WHERE matchid = ${matchId} ORDER BY mapnumber ASC
    `),
    db.execute(sql`
      SELECT p.*, m.mapname, u.avatar, u.avatarmedium,
             xr.rating AS xn_rating, xl.rating_delta, xl.rating_after
      FROM ${matchzyStatsPlayers} p
      JOIN ${matchzyStatsMaps} m
        ON p.matchid = m.matchid AND p.mapnumber = m.mapnumber
      LEFT JOIN ${userInfo} u ON u.steamid64 = CAST(p.steamid64 AS CHAR)
      LEFT JOIN ${xnRatings} xr ON xr.steamid64 = CAST(p.steamid64 AS CHAR)
      LEFT JOIN ${xnRatingLedger} xl
        ON xl.matchid = p.matchid AND xl.steamid64 = CAST(p.steamid64 AS CHAR)
      WHERE p.matchid = ${matchId}
      ORDER BY p.mapnumber ASC, p.damage DESC
    `),
    db.execute(sql`
      SELECT id, matchid, mapnumber, file_name, file_size, sha256, uploaded_at,
             parse_status, parser_version, parsed_at, parse_error
      FROM ${matchzyDemos}
      WHERE matchid = ${matchId} ORDER BY mapnumber ASC
    `),
    db.execute(sql`
      SELECT d.mapnumber, r.*
      FROM ${matchDemoRounds} r
      JOIN ${matchzyDemos} d ON d.id = r.demo_id
      WHERE d.matchid = ${matchId} AND d.parse_status = 'complete'
      ORDER BY d.mapnumber, r.round_number
    `),
    db.execute(sql`
      SELECT d.mapnumber, e.id, e.round_number, e.tick, e.event_type,
             e.actor_steamid64, e.target_steamid64, e.weapon, e.value, e.payload
      FROM ${matchDemoEvents} e
      JOIN ${matchzyDemos} d ON d.id = e.demo_id
      WHERE d.matchid = ${matchId} AND d.parse_status = 'complete'
      ORDER BY d.mapnumber, e.round_number, e.tick
    `),
  ]);

  const match = (matchResult[0] as unknown as MatchDetailData['match'][])[0];
  if (!match) return null;
  const rawEvents = eventsResult[0] as unknown as RawPlayerAnalysisEvent[];
  const events = rawEvents.map(({ payload: _payload, ...event }) => event);

  return {
    match,
    maps: mapsResult[0] as unknown as MatchDetailData['maps'],
    players: playersResult[0] as unknown as MatchDetailData['players'],
    demos: demosResult[0] as unknown as MatchDetailData['demos'],
    rounds: roundsResult[0] as unknown as MatchDetailData['rounds'],
    events,
    playerAnalytics: buildPlayerAnalytics(rawEvents),
  };
}

export default async function Cs2MatchDetailPage({
  params,
}: {
  params: Promise<{ matchid: string }>;
}) {
  const { matchid } = await params;
  const data = await getMatchData(matchid);
  if (!data) notFound();
  return <MatchDetailView data={data} />;
}
