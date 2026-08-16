import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  and,
  db,
  discordActivityEvents,
  discordLinkTokens,
  eq,
  gt,
  isNull,
  sql,
  userInfo,
  userPoints,
  type UserInfo,
} from '@xom/db';
import { getAuthUser } from '@/lib/auth';

class LinkError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function affectedRows(result: unknown): number {
  if (Array.isArray(result)) return Number((result[0] as { affectedRows?: number })?.affectedRows || 0);
  return Number((result as { affectedRows?: number })?.affectedRows || 0);
}

function isPristineDiscordPlaceholder(user: UserInfo, discordUserId: string): boolean {
  return user.steamid64 === `discord_${discordUserId}`
    && user.discord_id === discordUserId
    && !user.google_id
    && !user.github_oauth_id
    && !user.facebook
    && !user.spotify
    && !user.twitter
    && !user.instagram
    && !user.github
    && user.role === 'user'
    && user.banned === 0;
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Bạn cần đăng nhập trước.' }, { status: 401 });
  if (authUser.banned) return NextResponse.json({ error: 'Tài khoản đã bị khóa.' }, { status: 403 });

  try {
    const body = await request.json() as { token?: unknown };
    if (typeof body.token !== 'string' || body.token.length < 32 || body.token.length > 128) {
      throw new LinkError('Liên kết không hợp lệ.', 400);
    }
    const tokenHash = createHash('sha256').update(body.token).digest('hex');
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      const [linkToken] = await tx.select().from(discordLinkTokens)
        .where(and(
          eq(discordLinkTokens.tokenHash, tokenHash),
          isNull(discordLinkTokens.usedAt),
          gt(discordLinkTokens.expiresAt, now),
        ))
        .limit(1);
      if (!linkToken) throw new LinkError('Liên kết đã hết hạn hoặc đã được sử dụng.', 410);

      const claimResult = await tx.update(discordLinkTokens)
        .set({ usedAt: now })
        .where(and(
          eq(discordLinkTokens.tokenHash, tokenHash),
          isNull(discordLinkTokens.usedAt),
          gt(discordLinkTokens.expiresAt, now),
        ));
      if (affectedRows(claimResult) !== 1) {
        throw new LinkError('Liên kết đã được sử dụng.', 409);
      }

      const [target] = await tx.select().from(userInfo)
        .where(eq(userInfo.steamid64, authUser.steamId))
        .limit(1);
      if (!target) throw new LinkError('Không tìm thấy tài khoản.', 404);
      if (target.discord_id && target.discord_id !== linkToken.discordUserId) {
        throw new LinkError('Tài khoản này đã kết nối với một Discord khác.', 409);
      }

      const [existingOwner] = await tx.select().from(userInfo)
        .where(eq(userInfo.discord_id, linkToken.discordUserId))
        .limit(1);
      let mergedPlaceholder = false;

      if (existingOwner && existingOwner.steamid64 !== target.steamid64) {
        if (!isPristineDiscordPlaceholder(existingOwner, linkToken.discordUserId)) {
          throw new LinkError('Discord này đã kết nối với một tài khoản khác.', 409);
        }

        const [sourcePoints] = await tx.select({ points: userPoints.points })
          .from(userPoints)
          .where(eq(userPoints.userId, existingOwner.steamid64))
          .limit(1);
        await tx.update(discordActivityEvents)
          .set({ creditedUserId: target.steamid64 })
          .where(eq(discordActivityEvents.creditedUserId, existingOwner.steamid64));
        if (sourcePoints?.points) {
          await tx.insert(userPoints)
            .values({ userId: target.steamid64, points: sourcePoints.points })
            .onDuplicateKeyUpdate({ set: { points: sql`${userPoints.points} + ${sourcePoints.points}` } });
        }
        await tx.delete(userInfo).where(eq(userInfo.steamid64, existingOwner.steamid64));
        mergedPlaceholder = true;
      }

      if (!target.discord_id) {
        const attachResult = await tx.update(userInfo)
          .set({ discord_id: linkToken.discordUserId })
          .where(and(
            eq(userInfo.steamid64, target.steamid64),
            isNull(userInfo.discord_id),
          ));
        if (affectedRows(attachResult) !== 1) {
          throw new LinkError('Tài khoản vừa được kết nối ở nơi khác. Vui lòng thử lại.', 409);
        }
      }

      const [uncredited] = await tx.select({ total: sql<string>`COALESCE(SUM(${discordActivityEvents.points}), 0)` })
        .from(discordActivityEvents)
        .where(and(
          eq(discordActivityEvents.guildId, linkToken.guildId),
          eq(discordActivityEvents.discordUserId, linkToken.discordUserId),
          isNull(discordActivityEvents.creditedUserId),
        ));
      const pointsToCredit = Number(uncredited?.total || 0);
      if (pointsToCredit > 0) {
        await tx.update(discordActivityEvents)
          .set({ creditedUserId: target.steamid64, creditedAt: now })
          .where(and(
            eq(discordActivityEvents.guildId, linkToken.guildId),
            eq(discordActivityEvents.discordUserId, linkToken.discordUserId),
            isNull(discordActivityEvents.creditedUserId),
          ));
        await tx.insert(userPoints)
          .values({ userId: target.steamid64, points: pointsToCredit })
          .onDuplicateKeyUpdate({ set: { points: sql`${userPoints.points} + ${pointsToCredit}` } });
      }

      return {
        discordDisplayName: linkToken.displayName,
        creditedPoints: pointsToCredit,
        mergedPlaceholder,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof LinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error confirming Discord link:', error);
    return NextResponse.json({ error: 'Không thể kết nối Discord lúc này.' }, { status: 500 });
  }
}
