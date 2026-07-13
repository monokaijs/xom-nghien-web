import { asc, db, desc, eq, sql, userInfo, userPoints } from '@xom/db';
import type { CommunityLeaderboardPlayer } from '@/types/community-leaderboard';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

export async function getCommunityLeaderboard(limit = DEFAULT_LIMIT): Promise<CommunityLeaderboardPlayer[]> {
  const points = sql<number>`COALESCE(${userPoints.points}, 0)`;
  const avatar = sql<string | null>`COALESCE(
    ${userInfo.avatarfull},
    ${userInfo.avatarmedium},
    ${userInfo.avatar}
  )`;

  const rows = await db
    .select({
      name: userInfo.name,
      avatar,
      points,
    })
    .from(userInfo)
    .leftJoin(userPoints, eq(userPoints.userId, userInfo.steamid64))
    .where(eq(userInfo.banned, 0))
    .orderBy(desc(points), asc(userInfo.name), asc(userInfo.steamid64))
    .limit(normalizeLimit(limit));

  return rows.map((player) => ({
    ...player,
    points: Number(player.points) || 0,
  }));
}
