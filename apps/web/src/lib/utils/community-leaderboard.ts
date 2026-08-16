import { and, asc, db, desc, discordActivityEvents, eq, gte, lt, sql, userInfo, userPoints } from '@xom/db';
import type { CommunityLeaderboardPlayer } from '@/types/community-leaderboard';
import { getLeaderboardWindow, type CommunityLeaderboardPeriod } from './community-leaderboard-period';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

export async function getCommunityLeaderboard(
  limit = DEFAULT_LIMIT,
  period: CommunityLeaderboardPeriod = 'all',
  now = new Date(),
): Promise<CommunityLeaderboardPlayer[]> {
  const points = sql<number>`COALESCE(${userPoints.points}, 0)`;
  const avatar = sql<string | null>`COALESCE(
    ${userInfo.avatarfull},
    ${userInfo.avatarmedium},
    ${userInfo.avatar}
  )`;

  if (period !== 'all') {
    const window = getLeaderboardWindow(period, now);
    const periodPoints = sql<number>`SUM(${discordActivityEvents.points})`;
    const rows = await db
      .select({ name: userInfo.name, avatar, points: periodPoints })
      .from(discordActivityEvents)
      .innerJoin(userInfo, eq(userInfo.steamid64, discordActivityEvents.creditedUserId))
      .where(and(
        eq(userInfo.banned, 0),
        gte(discordActivityEvents.occurredAt, window.startsAt!),
        lt(discordActivityEvents.occurredAt, window.endsAt!),
      ))
      .groupBy(userInfo.steamid64, userInfo.name, userInfo.avatarfull, userInfo.avatarmedium, userInfo.avatar)
      .orderBy(desc(periodPoints), asc(userInfo.name), asc(userInfo.steamid64))
      .limit(normalizeLimit(limit));

    return rows.map((player) => ({ ...player, points: Number(player.points) || 0 }));
  }

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
