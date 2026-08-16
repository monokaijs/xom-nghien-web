import {
  and,
  db,
  discordActivityEvents,
  discordVoiceState,
  eq,
  pool,
  sql,
  userInfo,
  userPoints,
  type DiscordVoiceState,
} from '@xom/db';
import { calculateVoiceAwards } from './scoring.js';

export interface ActivityInput {
  guildId: string;
  discordUserId: string;
  channelId: string;
  activityType: 'message' | 'voice';
  sourceKey: string;
  occurredAt: Date;
  durationSeconds: number;
  points: number;
}

function affectedRows(result: unknown): number {
  if (Array.isArray(result)) return Number((result[0] as { affectedRows?: number })?.affectedRows || 0);
  return Number((result as { affectedRows?: number })?.affectedRows || 0);
}

async function recordWithTransaction(tx: any, input: ActivityInput): Promise<boolean> {
  const [linkedUser] = await tx
    .select({ userId: userInfo.steamid64 })
    .from(userInfo)
    .where(eq(userInfo.discord_id, input.discordUserId))
    .limit(1);
  const creditedAt = linkedUser ? new Date() : null;
  const result = await tx
    .insert(discordActivityEvents)
    .ignore()
    .values({ ...input, creditedUserId: linkedUser?.userId || null, creditedAt });

  if (affectedRows(result) !== 1) return false;

  if (linkedUser) {
    await tx
      .insert(userPoints)
      .values({ userId: linkedUser.userId, points: input.points })
      .onDuplicateKeyUpdate({ set: { points: sql`${userPoints.points} + ${input.points}` } });
  }
  return true;
}

export async function recordActivity(input: ActivityInput): Promise<boolean> {
  return db.transaction((tx) => recordWithTransaction(tx, input));
}

export async function settleVoiceUser(
  guildId: string,
  discordUserId: string,
  observedAt: Date,
): Promise<DiscordVoiceState | null> {
  return db.transaction(async (tx) => {
    const [state] = await tx
      .select()
      .from(discordVoiceState)
      .where(and(
        eq(discordVoiceState.guildId, guildId),
        eq(discordVoiceState.discordUserId, discordUserId),
      ))
      .limit(1);
    if (!state) return null;

    if (!state.eligibleSince) {
      await tx.update(discordVoiceState)
        .set({ lastObservedAt: observedAt })
        .where(and(
          eq(discordVoiceState.guildId, guildId),
          eq(discordVoiceState.discordUserId, discordUserId),
        ));
      return { ...state, lastObservedAt: observedAt };
    }

    const calculation = calculateVoiceAwards({
      discordUserId,
      eligibleSince: state.eligibleSince,
      observedAt,
      remainderMs: state.remainderMs,
    });
    for (const award of calculation.awards) {
      await recordWithTransaction(tx, {
        guildId,
        discordUserId,
        channelId: state.channelId || 'unknown',
        activityType: 'voice',
        sourceKey: award.sourceKey,
        occurredAt: award.occurredAt,
        durationSeconds: 60,
        points: 1,
      });
    }

    await tx.update(discordVoiceState)
      .set({
        eligibleSince: null,
        remainderMs: calculation.remainderMs,
        lastObservedAt: observedAt,
      })
      .where(and(
        eq(discordVoiceState.guildId, guildId),
        eq(discordVoiceState.discordUserId, discordUserId),
      ));

    return {
      ...state,
      eligibleSince: null,
      remainderMs: calculation.remainderMs,
      lastObservedAt: observedAt,
    };
  });
}

export async function pingDatabase(): Promise<void> {
  await pool.query('SELECT 1');
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
